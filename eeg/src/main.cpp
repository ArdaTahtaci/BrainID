#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>

// WiFi configuration
const char* ssid = "AndroidAPC118";
const char* password = "nulook222";

// Create ADS1115 instances
Adafruit_ADS1115 ads1; // Address 0x48 (GND)
Adafruit_ADS1115 ads2; // Address 0x49 (VCC)

// Web server and WebSocket
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Data storage for real-time streaming
float channelData[8];
unsigned long lastSampleTime = 0;
const unsigned long sampleInterval = 50; // 20Hz sampling (50ms intervals) - Good balance for brain analysis
unsigned long lastWebSocketSend = 0;

// EEG channel configuration
// Note: Gain constants are now defined in Adafruit_ADS1X15.h as adsGain_t enum

// Function declarations
void readAllChannels();
void sendDataToClients();
void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len);
String getHTMLPage();

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 EEG Data Acquisition System Starting...");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize ADS1115 modules
  if (!ads1.begin(0x48)) {
    Serial.println("Failed to initialize ADS1115 #1 (0x48)");
    while (1);
  }
  
  if (!ads2.begin(0x4B)) {
    Serial.println("Failed to initialize ADS1115 #2 (0x4B)");
    while (1);
  }
  
  // Set gain for EEG signals (high sensitivity)
  ads1.setGain(GAIN_SIXTEEN);  // 16x gain for microvolt signals
  ads2.setGain(GAIN_SIXTEEN);  // 16x gain for microvolt signals
  
  // Set data rate (samples per second)
  ads1.setDataRate(RATE_ADS1115_860SPS);  // 860 samples per second
  ads2.setDataRate(RATE_ADS1115_860SPS);  // 860 samples per second
  
  Serial.println("ADS1115 modules initialized successfully");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Setup WebSocket
  ws.onEvent(onWebSocketEvent);
  server.addHandler(&ws);
  
  // Serve static files
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/html", getHTMLPage());
  });
  
  server.begin();
  Serial.println("WebSocket server started");
  
  Serial.println("System ready - EEG data acquisition started");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Sample at specified interval
  if (currentTime - lastSampleTime >= sampleInterval) {
    lastSampleTime = currentTime;
    
    // Read all 8 channels
    readAllChannels();
    
    // Send data via WebSocket
    sendDataToClients();
    
    // Clean up WebSocket connections
    ws.cleanupClients();
  }
  
  // Small delay to prevent watchdog issues
  delay(1);
}

void readAllChannels() {
  // Read ADS1115 #1 (0x48) - Channels 0-3
  channelData[0] = ads1.computeVolts(ads1.readADC_SingleEnded(0)) * 1000000; // Convert to microvolts
  channelData[1] = ads1.computeVolts(ads1.readADC_SingleEnded(1)) * 1000000;
  channelData[2] = ads1.computeVolts(ads1.readADC_SingleEnded(2)) * 1000000;
  channelData[3] = ads1.computeVolts(ads1.readADC_SingleEnded(3)) * 1000000;
  
  // Read ADS1115 #2 (0x4B) - Channels 4-7
  channelData[4] = ads2.computeVolts(ads2.readADC_SingleEnded(0)) * 1000000; // Convert to microvolts
  channelData[5] = ads2.computeVolts(ads2.readADC_SingleEnded(1)) * 1000000;
  channelData[6] = ads2.computeVolts(ads2.readADC_SingleEnded(2)) * 1000000;
  channelData[7] = ads2.computeVolts(ads2.readADC_SingleEnded(3)) * 1000000;
  
  // Validate all channel data to prevent JSON parsing errors
  for (int i = 0; i < 8; i++) {
    if (isnan(channelData[i]) || isinf(channelData[i])) {
      channelData[i] = 0.0; // Replace invalid values with 0
    }
    // Clamp extreme values that might cause issues
    if (channelData[i] > 1000000) channelData[i] = 1000000;
    if (channelData[i] < -1000000) channelData[i] = -1000000;
  }
}

void sendDataToClients() {
  if (ws.count() > 0) {
    // Limit connections to prevent overflow
    if (ws.count() > 3) {
      Serial.println("Too many WebSocket connections - limiting to 3");
      ws.closeAll();
      return;
    }
    
    // Create JSON object with exact format Python backend expects
    DynamicJsonDocument doc(512);
    doc["timestamp"] = millis();
    JsonArray channels = doc.createNestedArray("channels");
    
    for (int i = 0; i < 8; i++) {
      JsonObject channel = channels.createNestedObject();
      channel["id"] = i;
      channel["value"] = channelData[i];  // Ensure this is always a valid number
      channel["ads"] = (i < 4) ? 1 : 2;   // Required by Python backend
      channel["pin"] = i % 4;             // Required by Python backend
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Debug: Print detailed info about what we're sending
    static unsigned long lastDebugPrint = 0;
    if (millis() - lastDebugPrint > 5000) { // Every 5 seconds
      Serial.println("=== DEBUG INFO ===");
      Serial.println("Channels being sent: " + String(channels.size()));
      for (int i = 0; i < 8; i++) {
        Serial.println("Channel " + String(i) + ": " + String(channelData[i]) + " µV");
      }
      Serial.println("JSON size: " + String(jsonString.length()) + " bytes");
      Serial.println("JSON being sent: " + jsonString);
      Serial.println("=================");
      lastDebugPrint = millis();
    }
    
    // Send to all connected clients
    ws.textAll(jsonString);
  }
}

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
      // Handle incoming data if needed
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

String getHTMLPage() {
  return R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>ESP32 EEG Data Acquisition</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .chart-container {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .chart-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #555;
        }
        .status {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status.connected {
            background-color: #d4edda;
            color: #155724;
        }
        .status.disconnected {
            background-color: #f8d7da;
            color: #721c24;
        }
        canvas {
            max-width: 100%;
            height: 200px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ESP32 EEG Data Acquisition System</h1>
        
        <div id="status" class="status disconnected">
            Disconnected - Trying to connect...
        </div>
        
        <div class="grid">
            <div class="chart-container">
                <div class="chart-title">Channel 0 (ADS1 - A0)</div>
                <canvas id="chart0"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 1 (ADS1 - A1)</div>
                <canvas id="chart1"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 2 (ADS1 - A2)</div>
                <canvas id="chart2"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 3 (ADS1 - A3)</div>
                <canvas id="chart3"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 4 (ADS2 - A0)</div>
                <canvas id="chart4"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 5 (ADS2 - A1)</div>
                <canvas id="chart5"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 6 (ADS2 - A2)</div>
                <canvas id="chart6"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Channel 7 (ADS2 - A3)</div>
                <canvas id="chart7"></canvas>
            </div>
        </div>
    </div>

    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://' + window.location.host + '/ws');
        const statusDiv = document.getElementById('status');
        
        // Chart configuration
        const maxDataPoints = 100;
        const charts = [];
        
        // Initialize charts
        for (let i = 0; i < 8; i++) {
            const ctx = document.getElementById(`chart${i}`).getContext('2d');
            charts[i] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: `Channel ${i}`,
                        data: [],
                        borderColor: `hsl(${i * 45}, 70%, 50%)`,
                        backgroundColor: `hsla(${i * 45}, 70%, 50%, 0.1)`,
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            display: false
                        },
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'µV'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 0
                    }
                }
            });
        }
        
        // WebSocket event handlers
        ws.onopen = function(event) {
            statusDiv.className = 'status connected';
            statusDiv.textContent = 'Connected - Receiving EEG data';
        };
        
        ws.onclose = function(event) {
            statusDiv.className = 'status disconnected';
            statusDiv.textContent = 'Disconnected - Trying to reconnect...';
            setTimeout(() => {
                location.reload();
            }, 3000);
        };
        
        ws.onerror = function(error) {
            statusDiv.className = 'status disconnected';
            statusDiv.textContent = 'Connection error';
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            const timestamp = Date.now();
            
            // Update each channel chart
            data.channels.forEach(channel => {
                const chart = charts[channel.id];
                const dataset = chart.data.datasets[0];
                
                // Add new data point
                dataset.data.push({
                    x: timestamp,
                    y: channel.value
                });
                
                // Remove old data points
                if (dataset.data.length > maxDataPoints) {
                    dataset.data.shift();
                }
                
                // Update chart
                chart.update('none');
            });
        };
    </script>
</body>
</html>
)rawliteral";
} 