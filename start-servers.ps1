# ChayCards Development Servers Launcher (PowerShell)
# Alternative to start-servers.bat for PowerShell users
# Usage: Right-click -> Run with PowerShell

$WSL_PROJECT_PATH = "/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ChayCards Development Servers Launcher      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for Windows Terminal
if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Windows Terminal not found" -ForegroundColor Red
    Write-Host "   Install from Microsoft Store: https://aka.ms/terminal" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Launching services in Windows Terminal..." -ForegroundColor Green
Write-Host ""

# Start all services
Start-Process wt -ArgumentList @(
    "-w", "0",
    "--title", "PostgreSQL",
    "-d", ".",
    "wsl", "-e", "bash", "-c",
    "cd $WSL_PROJECT_PATH/server && echo '🐘 Starting PostgreSQL...' && docker-compose up",
    ";",
    "new-tab",
    "--title", "Notion PM Server",
    "-d", ".",
    "wsl", "-e", "bash", "-c",
    "cd $WSL_PROJECT_PATH && echo '⏳ Waiting for PostgreSQL...' && sleep 10 && echo '🔄 Starting Notion PM Server...' && npm run notion-pm:server",
    ";",
    "new-tab",
    "--title", "Control Panel",
    "-d", ".",
    "wsl", "-e", "bash", "-c",
    "cd $WSL_PROJECT_PATH && echo '' && echo '╔═══════════════════════════════════════════════╗' && echo '║         ChayCards Servers Running             ║' && echo '╚═══════════════════════════════════════════════╝' && echo '' && echo '📊 Service Status:' && echo '   • PostgreSQL:        localhost:5433' && echo '   • Notion PM Server:  localhost:3001' && echo '' && echo '📝 Commands:' && echo '   npm run notion-pm:sync  - Sync Notion tasks' && echo '   npm run dev             - Start Vite' && echo '' && echo '🛑 Stop: Close this window' && echo '' && bash"
)

Write-Host "✅ Services launched in Windows Terminal" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Wait ~10 seconds for PostgreSQL"
Write-Host "   2. Check each tab for service status"
Write-Host "   3. Run 'npm run dev' in WSL for Vite"
Write-Host "   4. Run start-electron-windows.bat for UI"
Write-Host ""
Read-Host "Press Enter to close this window"
