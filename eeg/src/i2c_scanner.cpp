/*
 * I2C Scanner Utility for ESP32 EEG System
 * 
 * This utility scans the I2C bus for connected devices and reports their addresses.
 * Useful for debugging ADS1115 connections.
 * 
 * To use this scanner instead of the main EEG system:
 * 1. Rename main.cpp to main_eeg.cpp
 * 2. Rename this file to main.cpp
 * 3. Upload and check serial monitor
 * 4. Restore original names when done
 */

#include <Wire.h>

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("\nI2C Scanner for ESP32 EEG System");
  Serial.println("================================");
  
  // Initialize I2C with default pins
  Wire.begin();
  
  Serial.println("Scanning I2C bus...");
  Serial.println("Expected devices:");
  Serial.println("  - ADS1115 #1 at 0x48 (ADDR pin to GND)");
  Serial.println("  - ADS1115 #2 at 0x49 (ADDR pin to VCC)");
  Serial.println();
}

void loop() {
  byte error, address;
  int nDevices = 0;
  
  Serial.println("Scanning...");
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.print(address, HEX);
      
      // Identify known devices
      switch(address) {
        case 0x48:
          Serial.print(" (ADS1115 #1 - ADDR to GND)");
          break;
        case 0x49:
          Serial.print(" (ADS1115 #2 - ADDR to VCC)");
          break;
        default:
          Serial.print(" (Unknown device)");
      }
      Serial.println();
      nDevices++;
    }
    else if (error == 4) {
      Serial.print("Unknown error at address 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.println(address, HEX);
    }
  }
  
  if (nDevices == 0) {
    Serial.println("No I2C devices found");
    Serial.println("Check connections:");
    Serial.println("  - SDA to GPIO 21");
    Serial.println("  - SCL to GPIO 22");
    Serial.println("  - VCC to external power");
    Serial.println("  - GND to common ground");
  }
  else {
    Serial.print("Found ");
    Serial.print(nDevices);
    Serial.println(" device(s)");
    
    if (nDevices == 2) {
      Serial.println("✓ Both ADS1115 modules detected!");
    }
    else if (nDevices == 1) {
      Serial.println("⚠ Only one ADS1115 detected. Check second module.");
    }
  }
  
  Serial.println();
  delay(5000); // Wait 5 seconds before next scan
} 