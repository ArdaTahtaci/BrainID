# I2C Scanner Utility

This utility helps debug ADS1115 connection issues by scanning the I2C bus for connected devices.

## How to Use

### When to Use:
- ADS1115 modules not detected
- I2C connection problems
- Hardware troubleshooting

### Steps:

1. **Backup main firmware:**
   ```bash
   copy src\main.cpp src\main_eeg.cpp
   ```

2. **Copy scanner as main:**
   ```bash
   copy tools\i2c_scanner.cpp src\main.cpp
   ```

3. **Upload scanner:**
   ```bash
   pio run --target upload
   ```

4. **Check serial monitor:**
   ```bash
   pio device monitor
   ```

5. **Expected output:**
   ```
   I2C Scanner for ESP32 EEG System
   ================================
   Scanning...
   I2C device found at address 0x48 (ADS1115 #1 - ADDR to GND)
   I2C device found at address 0x49 (ADS1115 #2 - ADDR to VCC)
   ✓ Both ADS1115 modules detected!
   ```

6. **Restore main firmware:**
   ```bash
   copy src\main_eeg.cpp src\main.cpp
   del src\main_eeg.cpp
   pio run --target upload
   ```

## Troubleshooting

### No devices found:
- Check SDA (GPIO 21) and SCL (GPIO 22) connections
- Verify VCC and GND connections
- Ensure external power supply is connected
- Check ADDR pin connections (GND for 0x48, VCC for 0x49)

### Only one device found:
- Check second ADS1115 power connections
- Verify ADDR pin of second device is correctly connected
- Check I2C bus connections to second device

### Wrong addresses:
- 0x48: ADDR pin should be connected to GND
- 0x49: ADDR pin should be connected to VCC
- Other addresses: Check ADDR pin connection 