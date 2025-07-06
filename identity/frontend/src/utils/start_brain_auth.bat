@echo off
echo ================================================================================
echo                 BrainID Neural Authentication System
echo ================================================================================
echo.
echo Starting BrainID Neural Authentication System...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pip is not available
    echo Please ensure pip is installed with Python
    pause
    exit /b 1
)

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found
    echo Please ensure you are in the brain_auth_backend directory
    pause
    exit /b 1
)

echo Installing/updating dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo ================================================================================
echo                        System Ready - Starting Server
echo ================================================================================
echo.
echo The BrainID web interface will be available at:
echo     http://localhost:5000
echo.
echo Instructions:
echo 1. Make sure your ESP32 is connected to WiFi and running EEG firmware
echo 2. Open your web browser to http://localhost:5000
echo 3. Enter your ESP32 IP address in the connection field
echo 4. Click Connect and wait for EEG data to stream
echo 5. Generate your unique brain key!
echo.
echo Press Ctrl+C to stop the server
echo.
echo ================================================================================

REM Start the Python server
python start_brain_auth.py

REM If we get here, the server has stopped
echo.
echo Server stopped.
pause 