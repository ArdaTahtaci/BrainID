#ifndef EEG_CONFIG_H
#define EEG_CONFIG_H

// EEG Configuration Parameters
// Adjust these values based on your specific EEG setup and requirements

// Sampling Configuration
#define SAMPLE_RATE_HZ 100              // Target sampling rate (Hz)
#define SAMPLE_INTERVAL_MS 10           // Milliseconds between samples (1000/SAMPLE_RATE_HZ)
#define MAX_DATA_POINTS 500             // Maximum data points to store per channel

// ADS1115 Configuration
#define ADS1_ADDRESS 0x48               // First ADS1115 address (GND)
#define ADS2_ADDRESS 0x49               // Second ADS1115 address (VCC)

// Available gain settings for ADS1115
#define EEG_GAIN_SETTING GAIN_SIXTEEN   // Default gain setting for EEG (16x = ±256mV)
#define EEG_DATA_RATE RATE_ADS1115_860SPS // Data rate setting

// Signal Processing Parameters
#define ENABLE_FILTERING true           // Enable digital filtering
#define HIGHPASS_CUTOFF_HZ 0.5f        // High-pass filter cutoff frequency
#define LOWPASS_CUTOFF_HZ 50.0f        // Low-pass filter cutoff frequency  
#define NOTCH_FILTER_HZ 50.0f          // Notch filter for power line interference (50Hz EU / 60Hz US)

// Calibration Parameters
#define CALIBRATION_SAMPLES 1000        // Number of samples for baseline calibration
#define BASELINE_WINDOW_SEC 10          // Baseline calculation window (seconds)
#define AUTO_CALIBRATE true             // Enable automatic baseline calibration

// Channel Configuration
#define TOTAL_CHANNELS 8                // Total number of EEG channels
#define CHANNELS_PER_ADS 4              // Channels per ADS1115 module

// Data Validation
#define MAX_VOLTAGE_UV 200000           // Maximum expected voltage in microvolts
#define MIN_VOLTAGE_UV -200000          // Minimum expected voltage in microvolts

// WebSocket Configuration
#define WS_MAX_CLIENTS 4                // Maximum WebSocket clients
#define WS_BUFFER_SIZE 1024             // WebSocket buffer size

// Debug Configuration
#define DEBUG_SERIAL true               // Enable serial debug output
#define DEBUG_CHANNEL_VALUES false      // Print channel values to serial (can be noisy)
#define DEBUG_TIMING false              // Print timing information

// WiFi Configuration (modify in main.cpp)
#define WIFI_TIMEOUT_MS 10000           // WiFi connection timeout
#define WIFI_RETRY_INTERVAL_MS 1000     // Retry interval for WiFi connection

// EEG-specific constants
#define EEG_ALPHA_BAND_LOW 8.0f         // Alpha band lower frequency (Hz)
#define EEG_ALPHA_BAND_HIGH 12.0f       // Alpha band upper frequency (Hz)
#define EEG_BETA_BAND_LOW 12.0f         // Beta band lower frequency (Hz)
#define EEG_BETA_BAND_HIGH 30.0f        // Beta band upper frequency (Hz)
#define EEG_THETA_BAND_LOW 4.0f         // Theta band lower frequency (Hz)
#define EEG_THETA_BAND_HIGH 8.0f        // Theta band upper frequency (Hz)
#define EEG_DELTA_BAND_LOW 0.5f         // Delta band lower frequency (Hz)
#define EEG_DELTA_BAND_HIGH 4.0f        // Delta band upper frequency (Hz)

// Channel Labels (for reference)
static const char* CHANNEL_LABELS[TOTAL_CHANNELS] = {
    "Ch0_ADS1_A0",  // Channel 0 - ADS1115 #1, Pin A0
    "Ch1_ADS1_A1",  // Channel 1 - ADS1115 #1, Pin A1
    "Ch2_ADS1_A2",  // Channel 2 - ADS1115 #1, Pin A2
    "Ch3_ADS1_A3",  // Channel 3 - ADS1115 #1, Pin A3
    "Ch4_ADS2_A0",  // Channel 4 - ADS1115 #2, Pin A0
    "Ch5_ADS2_A1",  // Channel 5 - ADS1115 #2, Pin A1
    "Ch6_ADS2_A2",  // Channel 6 - ADS1115 #2, Pin A2
    "Ch7_ADS2_A3"   // Channel 7 - ADS1115 #2, Pin A3
};

// EEG Electrode Placement Guide (Standard 10-20 System)
// Modify these according to your electrode placement
static const char* ELECTRODE_POSITIONS[TOTAL_CHANNELS] = {
    "Fp1",  // Frontal Pole 1
    "Fp2",  // Frontal Pole 2
    "F3",   // Frontal 3
    "F4",   // Frontal 4
    "C3",   // Central 3
    "C4",   // Central 4
    "P3",   // Parietal 3
    "P4"    // Parietal 4
};

// Calibration structure
struct EEGCalibration {
    float baseline[TOTAL_CHANNELS];         // Baseline values for each channel
    float gain_correction[TOTAL_CHANNELS];  // Gain correction factors
    bool is_calibrated;                     // Calibration status
    unsigned long calibration_time;         // Timestamp of last calibration
};

// Data quality metrics
struct DataQuality {
    float impedance[TOTAL_CHANNELS];        // Electrode impedance (if measurable)
    float noise_level[TOTAL_CHANNELS];      // Noise level per channel
    float signal_quality[TOTAL_CHANNELS];   // Signal quality index (0-1)
    bool electrode_connected[TOTAL_CHANNELS]; // Electrode connection status
};

#endif // EEG_CONFIG_H 