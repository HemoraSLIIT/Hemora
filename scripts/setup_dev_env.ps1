# Development Setup Script for Windows
# Run this script to set up the Hemora development environment

Write-Host "🚀 Setting up Hemora development environment..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.9+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Create virtual environment
if (!(Test-Path "venv")) {
    Write-Host "🔄 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
Write-Host "🔄 Installing Python dependencies..." -ForegroundColor Yellow
& "venv\Scripts\pip.exe" install --upgrade pip
& "venv\Scripts\pip.exe" install -r requirements.txt

# Create .env file if it doesn't exist
if (!(Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
}

# Create necessary directories
$directories = @(
    "data\raw\sickle_cell",
    "data\raw\malaria",
    "data\raw\normal", 
    "data\raw\other_diseases",
    "logs",
    "tmp"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Created directory: $dir" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Hemora development environment setup completed!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update the .env file with your configuration"
Write-Host "2. Set up PostgreSQL database"
Write-Host "3. Activate virtual environment: venv\Scripts\activate"
Write-Host "4. Run Django setup: cd backend && python manage.py migrate"
Write-Host "5. Run React setup: cd frontend && npm install"