#!/usr/bin/env python3
"""
BrainID Neural Authentication System
Startup Script

This script initializes and starts the complete brain authentication system.
"""

import os
import sys
import subprocess
import logging
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('brain_auth.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def print_banner():
    """Print the BrainID banner"""
    banner = """
    ████████████████████████████████████████████████████████████████████████████████
    ██                                                                            ██
    ██    ████████  ████████   ████████   ████ ████████  ████ ████████          ██
    ██    ████████  ████████   ████████   ████ ████████  ████ ████████          ██
    ██    ████████  ████████   ████████   ████ ████████  ████ ████████          ██
    ██    ████████  ████████   ████████   ████ ████████  ████ ████████          ██
    ██                                                                            ██
    ██             🧠 BrainID - Neural Authentication System 🧠                   ██
    ██                                                                            ██
    ██    • Real-time EEG data acquisition from ESP32                            ██
    ██    • 8-channel frequency band analysis (Delta, Theta, Alpha, Beta, Gamma) ██
    ██    • FFT processing for 40 frequency bands                                ██
    ██    • 2KB biometric key generation with 15% tolerance                      ██
    ██    • Beautiful web interface with real-time visualization                 ██
    ██                                                                            ██
    ████████████████████████████████████████████████████████████████████████████████
    """
    print(banner)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8+ is required. Current version: %s", sys.version)
        return False
    logger.info("Python version: %s ✓", sys.version.split()[0])
    return True

def check_dependencies():
    """Check if all required dependencies are installed"""
    # Map pip package names to Python import names
    required_packages = {
        'flask': 'flask',
        'flask-socketio': 'flask_socketio',
        'numpy': 'numpy',
        'scipy': 'scipy',
        'websocket-client': 'websocket',
        'scikit-learn': 'sklearn',
        'matplotlib': 'matplotlib',
        'pandas': 'pandas',
        'cryptography': 'cryptography'
    }
    
    missing_packages = []
    
    for pip_name, import_name in required_packages.items():
        try:
            __import__(import_name)
            logger.info("✓ %s installed", pip_name)
        except ImportError:
            missing_packages.append(pip_name)
            logger.warning("✗ %s NOT installed", pip_name)
    
    if missing_packages:
        logger.error("Missing packages: %s", ', '.join(missing_packages))
        logger.info("Install them with: pip install %s", ' '.join(missing_packages))
        return False
    
    return True

def install_dependencies():
    """Install required dependencies"""
    requirements_file = Path(__file__).parent / 'requirements.txt'
    
    if not requirements_file.exists():
        logger.error("requirements.txt not found!")
        return False
    
    try:
        logger.info("Installing dependencies from requirements.txt...")
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
        ], check=True)
        logger.info("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error("Failed to install dependencies: %s", e)
        return False

def check_esp32_connection():
    """Check if ESP32 connection parameters are available"""
    logger.info("ESP32 connection will be configured through the web interface")
    logger.info("Make sure your ESP32 is:")
    logger.info("  1. Connected to the same WiFi network")
    logger.info("  2. Running the EEG acquisition firmware")
    logger.info("  3. Displaying its IP address in the serial monitor")
    return True

def start_brain_auth_server():
    """Start the brain authentication server"""
    try:
        logger.info("Starting BrainID Neural Authentication System...")
        logger.info("Server will be available at: http://localhost:5000")
        logger.info("Press Ctrl+C to stop the server")
        
        # Import and run the server
        from brain_auth_server import app, socketio
        
        # Run the server
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error("Server error: %s", e)
        return False
    
    return True

def main():
    """Main startup function"""
    print_banner()
    
    logger.info("Initializing BrainID Neural Authentication System...")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        logger.info("Attempting to install missing dependencies...")
        if not install_dependencies():
            logger.error("Failed to install dependencies. Please install manually.")
            sys.exit(1)
        
        # Re-check dependencies after installation
        if not check_dependencies():
            logger.error("Some dependencies are still missing after installation.")
            sys.exit(1)
    
    # Check ESP32 connection info
    check_esp32_connection()
    
    # Start the server
    logger.info("=" * 80)
    logger.info("🚀 STARTING BRAIN AUTHENTICATION SYSTEM 🚀")
    logger.info("=" * 80)
    
    try:
        start_brain_auth_server()
    except Exception as e:
        logger.error("Failed to start server: %s", e)
        sys.exit(1)

if __name__ == "__main__":
    main() 