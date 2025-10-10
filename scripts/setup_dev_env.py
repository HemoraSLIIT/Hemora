#!/usr/bin/env python3
"""
Setup script for Hemora development environment
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return None


def setup_python_environment():
    """Set up Python virtual environment and install dependencies"""
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        run_command("python -m venv venv", "Creating virtual environment")
    
    # Activate virtual environment and install dependencies
    if sys.platform.startswith('win'):
        activate_script = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
    else:
        activate_script = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
    
    # Install dependencies
    run_command(f"{pip_command} install --upgrade pip", "Upgrading pip")
    run_command(f"{pip_command} install -r requirements.txt", "Installing Python dependencies")


def setup_directories():
    """Create necessary directories and files"""
    directories = [
        "data/raw/sickle_cell",
        "data/raw/malaria", 
        "data/raw/normal",
        "data/raw/other_diseases",
        "logs",
        "tmp"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {directory}")


def create_env_file():
    """Create .env file from .env.example if it doesn't exist"""
    if not Path(".env").exists() and Path(".env.example").exists():
        run_command("copy .env.example .env", "Creating .env file from template")
        print("⚠️  Please update the .env file with your actual configuration values")


def main():
    """Main setup function"""
    print("🚀 Setting up Hemora development environment...\n")
    
    # Check Python version
    if sys.version_info < (3, 9):
        print("❌ Python 3.9 or higher is required")
        sys.exit(1)
    
    # Setup steps
    setup_directories()
    create_env_file()
    setup_python_environment()
    
    print("\n✅ Hemora development environment setup completed!")
    print("\n📋 Next steps:")
    print("1. Update the .env file with your configuration")
    print("2. Set up PostgreSQL database")
    print("3. Run: cd backend && python manage.py migrate")
    print("4. Run: cd frontend && npm install")
    

if __name__ == "__main__":
    main()