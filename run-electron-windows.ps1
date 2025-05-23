# PowerShell script for running Electron on Windows
# This connects to the WSL Vite dev server

param(
    [string]$VitePort = "5173"
)

Write-Host "ChayCards Electron Launcher for Windows" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if Vite is running in WSL
Write-Host "Checking if Vite dev server is running in WSL..." -ForegroundColor Yellow
$viteCheck = wsl -e bash -c "curl -s http://localhost:$VitePort > /dev/null && echo 'running' || echo 'not running'"

if ($viteCheck -eq "not running") {
    Write-Host "Vite dev server is not running in WSL!" -ForegroundColor Red
    Write-Host "Please run 'npm run dev' in WSL first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening new WSL terminal to start Vite..." -ForegroundColor Green
    Start-Process wt -ArgumentList "wsl -d Ubuntu -e bash -c 'cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Loveable && npm run dev'"
    
    Write-Host "Waiting for Vite to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Run Electron using Windows node_modules
Write-Host "Starting Electron..." -ForegroundColor Green
$env:ELECTRON_DEV_URL = "http://localhost:$VitePort"

# Use Windows-specific node_modules if they exist
if (Test-Path "node_modules_win") {
    $env:NODE_PATH = Join-Path $PWD "node_modules_win"
    & "node_modules_win\.bin\electron.cmd" .
} else {
    Write-Host "Windows node_modules not found. Please run setup-windows.bat first!" -ForegroundColor Red
    pause
    exit 1
}