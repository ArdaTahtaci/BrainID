import asyncio
import json
import time
import hashlib
import base64
from collections import deque
from threading import Lock, Thread
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import websocket
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrainAuthProcessor:
    def __init__(self, sample_rate=20, buffer_duration=2.0):  # 20Hz for good analysis
        self.sample_rate = sample_rate
        self.buffer_duration = buffer_duration
        self.buffer_size = int(sample_rate * buffer_duration)  # 40 samples for 2 seconds at 20Hz
        self.num_channels = 8
        
        # Frequency bands (Hz)
        self.frequency_bands = {
            'delta': (0.5, 4.0),
            'theta': (4.0, 8.0),
            'alpha': (8.0, 12.0),
            'beta': (12.0, 30.0),
            'gamma': (30.0, 50.0)
        }
        
        # Data buffers for each channel
        self.data_buffers = [deque(maxlen=self.buffer_size) for _ in range(self.num_channels)]
        self.buffer_lock = Lock()
        
        # Authentication state
        self.is_processing = False
        self.last_key = None
        self.key_history = deque(maxlen=10)  # Store last 10 keys for comparison
        
        # Tolerance settings
        self.tolerance_percentage = 15.0
        
        logger.info(f"BrainAuth processor initialized: {self.buffer_size} samples, {self.num_channels} channels")

    def add_sample(self, channel_data):
        """Add a new sample to the buffers"""
        with self.buffer_lock:
            for i, value in enumerate(channel_data):
                if i < self.num_channels:
                    self.data_buffers[i].append(float(value))

    def get_buffer_status(self):
        """Check if buffers are full enough for processing"""
        with self.buffer_lock:
            return all(len(buffer) >= self.buffer_size for buffer in self.data_buffers)

    def extract_frequency_bands(self, data, sampling_rate):
        """Extract frequency bands from EEG data using bandpass filtering"""
        bands = {}
        
        for band_name, (low_freq, high_freq) in self.frequency_bands.items():
            # Design bandpass filter
            nyquist = sampling_rate / 2
            low = low_freq / nyquist
            high = high_freq / nyquist
            
            try:
                b, a = signal.butter(4, [low, high], btype='band')
                filtered_data = signal.filtfilt(b, a, data)
                bands[band_name] = filtered_data
            except Exception as e:
                logger.error(f"Error filtering band {band_name}: {e}")
                bands[band_name] = data  # Fallback to original data
                
        return bands

    def compute_fft_features(self, data):
        """Compute FFT features for frequency analysis"""
        # Compute FFT
        fft_values = fft(data)
        fft_freqs = fftfreq(len(data), 1/self.sample_rate)
        
        # Take magnitude of positive frequencies
        positive_freqs = fft_freqs[:len(fft_freqs)//2]
        fft_magnitude = np.abs(fft_values[:len(fft_values)//2])
        
        # Extract features
        features = {
            'mean_power': np.mean(fft_magnitude),
            'peak_freq': positive_freqs[np.argmax(fft_magnitude)],
            'peak_power': np.max(fft_magnitude),
            'power_ratio': np.sum(fft_magnitude[:10]) / np.sum(fft_magnitude),  # Low/total power
            'spectral_centroid': np.sum(positive_freqs * fft_magnitude) / np.sum(fft_magnitude),
            'spectral_rolloff': self.compute_spectral_rolloff(positive_freqs, fft_magnitude),
            'spectral_flux': np.sum(np.diff(fft_magnitude) ** 2)
        }
        
        return features

    def compute_spectral_rolloff(self, freqs, magnitude, rolloff_percent=0.85):
        """Compute spectral rolloff frequency"""
        total_power = np.sum(magnitude)
        cumulative_power = np.cumsum(magnitude)
        rolloff_idx = np.where(cumulative_power >= rolloff_percent * total_power)[0]
        
        if len(rolloff_idx) > 0:
            return freqs[rolloff_idx[0]]
        else:
            return freqs[-1]

    def generate_brain_key(self):
        """Generate a consistent 2KB biometric key from current EEG data"""
        if not self.get_buffer_status():
            return None, "Insufficient data for key generation"
        
        try:
            # Extract data from all buffers
            all_features = []
            
            with self.buffer_lock:
                for channel_idx in range(self.num_channels):
                    channel_data = np.array(list(self.data_buffers[channel_idx]))
                    
                    # Extract frequency bands
                    bands = self.extract_frequency_bands(channel_data, self.sample_rate)
                    
                    # Compute FFT features for each band
                    for band_name, band_data in bands.items():
                        features = self.compute_fft_features(band_data)
                        
                        # Normalize features for consistency
                        feature_vector = [
                            features['mean_power'],
                            features['peak_freq'],
                            features['peak_power'],
                            features['power_ratio'],
                            features['spectral_centroid'],
                            features['spectral_rolloff'],
                            features['spectral_flux']
                        ]
                        
                        all_features.extend(feature_vector)
            
            # Convert to numpy array and normalize
            feature_array = np.array(all_features)
            feature_array = self.normalize_features(feature_array)
            
            # Apply tolerance by quantizing features
            quantized_features = self.apply_tolerance(feature_array, self.tolerance_percentage)
            
            # Generate hash
            brain_key = self.create_hash_key(quantized_features)
            
            # Store in history
            self.key_history.append(brain_key)
            self.last_key = brain_key
            
            logger.info(f"Generated brain key: {brain_key[:32]}... (length: {len(brain_key)})")
            return brain_key, "Success"
            
        except Exception as e:
            logger.error(f"Error generating brain key: {e}")
            return None, f"Error: {str(e)}"

    def normalize_features(self, features):
        """Normalize features to ensure consistency"""
        # Remove any NaN or infinite values
        features = np.nan_to_num(features, nan=0.0, posinf=1e6, neginf=-1e6)
        
        # Z-score normalization
        mean = np.mean(features)
        std = np.std(features)
        if std > 0:
            features = (features - mean) / std
        
        return features

    def apply_tolerance(self, features, tolerance_percent):
        """Apply tolerance to features for consistent key generation"""
        # Quantize features to create tolerance
        scale_factor = 100.0 / tolerance_percent  # Higher values = less tolerance
        quantized = np.round(features * scale_factor) / scale_factor
        
        return quantized

    def create_hash_key(self, features):
        """Create a 2KB hash key from features"""
        # Convert features to bytes
        feature_bytes = features.tobytes()
        
        # Create multiple hash layers for 2KB output
        hash_layers = []
        
        # SHA-256 base hash
        hash_layers.append(hashlib.sha256(feature_bytes).digest())
        
        # MD5 hash
        hash_layers.append(hashlib.md5(feature_bytes).digest())
        
        # SHA-1 hash
        hash_layers.append(hashlib.sha1(feature_bytes).digest())
        
        # SHA-512 hash (truncated)
        hash_layers.append(hashlib.sha512(feature_bytes).digest()[:64])
        
        # BLAKE2b hash
        hash_layers.append(hashlib.blake2b(feature_bytes, digest_size=32).digest())
        
        # Additional entropy from features
        for i in range(0, len(features), 10):
            chunk = features[i:i+10]
            chunk_bytes = chunk.tobytes()
            hash_layers.append(hashlib.sha256(chunk_bytes).digest())
        
        # Combine all hashes
        combined_hash = b''.join(hash_layers)
        
        # Ensure exactly 2KB (2048 bytes)
        if len(combined_hash) > 2048:
            combined_hash = combined_hash[:2048]
        elif len(combined_hash) < 2048:
            # Pad with repeated hashing
            while len(combined_hash) < 2048:
                combined_hash += hashlib.sha256(combined_hash).digest()
            combined_hash = combined_hash[:2048]
        
        # Convert to base64 for transmission
        return base64.b64encode(combined_hash).decode('utf-8')

    def get_key_consistency(self):
        """Check consistency of recent keys"""
        if len(self.key_history) < 2:
            return 0.0
        
        # Compare recent keys
        recent_keys = list(self.key_history)[-5:]  # Last 5 keys
        consistency_count = 0
        total_comparisons = 0
        
        for i in range(len(recent_keys)):
            for j in range(i + 1, len(recent_keys)):
                total_comparisons += 1
                if recent_keys[i] == recent_keys[j]:
                    consistency_count += 1
        
        return (consistency_count / total_comparisons) * 100 if total_comparisons > 0 else 0.0

# Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = 'brain_auth_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global processor instance
processor = BrainAuthProcessor()

# ESP32 WebSocket client
class ESP32Client:
    def __init__(self, esp32_url):
        self.esp32_url = esp32_url
        self.ws = None
        self.connected = False
        
    def connect(self):
        """Connect to ESP32 WebSocket"""
        try:
            self.ws = websocket.WebSocketApp(
                self.esp32_url,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )
            
            # Start connection in a separate thread
            self.ws.run_forever()
            
        except Exception as e:
            logger.error(f"ESP32 connection error: {e}")
            
    def on_open(self, ws):
        self.connected = True
        logger.info("Connected to ESP32")
        socketio.emit('esp32_status', {'status': 'connected'})
        
    def on_message(self, ws, message):
        try:
            # Log the raw message for debugging
            logger.info(f"Raw message received: {message[:200]}...")  # First 200 chars
            
            data = json.loads(message)
            logger.info(f"Parsed JSON keys: {list(data.keys())}")
            
            if 'channels' in data:
                logger.info(f"=== DETAILED CHANNEL DEBUG ===")
                logger.info(f"Channels array length: {len(data['channels'])}")
                
                # Log ALL channels received
                for i, channel in enumerate(data['channels']):
                    logger.info(f"Channel {i}: {channel}")
                
                # Extract channel values with error handling
                channel_values = []
                for i, channel in enumerate(data['channels']):
                    if isinstance(channel, dict) and 'value' in channel:
                        try:
                            value = float(channel['value'])
                            channel_values.append(value)
                            logger.info(f"Successfully extracted channel {i}: {value}")
                        except (ValueError, TypeError) as e:
                            logger.error(f"Invalid value in channel {i}: {channel.get('value', 'MISSING')} - {e}")
                            channel_values.append(0.0)  # Default fallback
                    else:
                        logger.error(f"Channel {i} missing 'value' key or not dict: {channel}")
                        channel_values.append(0.0)  # Default fallback
                
                logger.info(f"Total channel values extracted: {len(channel_values)}")
                logger.info(f"Channel values: {channel_values}")
                logger.info(f"==============================")
                
                if len(channel_values) == 8:  # Only process if we have all 8 channels
                    # Add to processor
                    processor.add_sample(channel_values)
                    
                    # Emit to web clients
                    socketio.emit('eeg_data', {
                        'channels': channel_values,
                        'timestamp': data.get('timestamp', time.time()),
                        'buffer_ready': processor.get_buffer_status()
                    })
                    
                    # Log success occasionally
                    if hasattr(self, '_message_count'):
                        self._message_count += 1
                    else:
                        self._message_count = 1
                        
                    if self._message_count % 50 == 0:  # Every 50 messages
                        logger.info(f"Successfully processed {self._message_count} messages")
                else:
                    logger.error(f"❌ CHANNEL COUNT MISMATCH: Expected 8 channels, got {len(channel_values)}")
                    logger.error(f"❌ This means {8 - len(channel_values)} channels are missing!")
            else:
                logger.error(f"No 'channels' key in message. Available keys: {list(data.keys())}")
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e} - Raw message: {message[:100]}...")
        except Exception as e:
            logger.error(f"Error processing ESP32 message: {e}")
            logger.error(f"Message content: {message[:200]}...")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            
    def on_error(self, ws, error):
        logger.error(f"ESP32 WebSocket error: {error}")
        self.connected = False
        socketio.emit('esp32_status', {'status': 'error', 'message': str(error)})
        
    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False
        logger.info("ESP32 connection closed")
        socketio.emit('esp32_status', {'status': 'disconnected'})

# Global ESP32 client
esp32_client = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/connect_esp32', methods=['POST'])
def connect_esp32():
    global esp32_client
    
    data = request.json
    esp32_ip = data.get('esp32_ip', '192.168.1.100')
    esp32_url = f"ws://{esp32_ip}/ws"
    
    try:
        esp32_client = ESP32Client(esp32_url)
        
        # Start connection in background thread
        thread = Thread(target=esp32_client.connect)
        thread.daemon = True
        thread.start()
        
        return jsonify({'status': 'connecting', 'url': esp32_url})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/generate_key', methods=['POST'])
def generate_key():
    if not processor.get_buffer_status():
        return jsonify({
            'status': 'error',
            'message': 'Insufficient data. Need 2 seconds of EEG data.'
        })
    
    try:
        processor.is_processing = True
        brain_key, message = processor.generate_brain_key()
        
        if brain_key:
            consistency = processor.get_key_consistency()
            
            return jsonify({
                'status': 'success',
                'brain_key': brain_key,
                'key_length': len(brain_key),
                'consistency': consistency,
                'message': message,
                'timestamp': time.time()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': message
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        })
    finally:
        processor.is_processing = False

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'buffer_ready': processor.get_buffer_status(),
        'is_processing': processor.is_processing,
        'esp32_connected': esp32_client.connected if esp32_client else False,
        'key_history_count': len(processor.key_history),
        'last_key_preview': processor.last_key[:32] + '...' if processor.last_key else None
    })

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected to WebSocket')
    emit('status', {'message': 'Connected to BrainAuth server'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected from WebSocket')

if __name__ == '__main__':
    logger.info("Starting BrainAuth server...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True) 