@echo off
REM ChayCards Development Servers - Windows Multi-Window Version
REM Starts each service in a separate command prompt window for easy monitoring
REM Usage: Double-click this file or run from command line

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Development Servers (Windows)     ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Starting all services in separate windows...
echo.
echo Services:
echo   ✅ PostgreSQL (port 5433)
echo   ✅ Backend Express API (port 7243)
echo   ✅ Notion PM Server (port 3001)
echo   ✅ Cloudflare Tunnel (api.chaycards.com + dev.chaycards.com)
echo   ✅ RAG Embedding Server (port 8765)
echo.
echo 💡 Each service runs in its own window
echo    Close individual windows to stop specific services
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared not found!
    echo    Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo.
    echo    Cloudflare Tunnel is required for development
    pause
    exit /b 1
)

REM Get project directory
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo.
echo 🚀 Launching services...
echo.

REM ═══════════════════════════════════════════════════════════
REM 1. PostgreSQL Docker Container
REM ═══════════════════════════════════════════════════════════
echo [1/5] Starting PostgreSQL...
start "ChayCards - PostgreSQL" cmd /k "cd /d "%PROJECT_DIR%\server" && echo ╔═══════════════════════════════════════════════╗ && echo ║           PostgreSQL Database                 ║ && echo ╚═══════════════════════════════════════════════╝ && echo. && echo 🐘 Starting PostgreSQL on port 5433... && echo    Healthcheck: pg_isready every 5s && echo. && docker-compose up"
timeout /t 3 /nobreak >nul

REM ═══════════════════════════════════════════════════════════
REM 2. Backend Express API
REM ═══════════════════════════════════════════════════════════
echo [2/5] Starting Backend API...
start "ChayCards - Backend API" wsl -e bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && clear && echo '╔═══════════════════════════════════════════════╗' && echo '║         Backend Express API                   ║' && echo '╚═══════════════════════════════════════════════╝' && echo '' && echo '⏳ Waiting for PostgreSQL health check...' && echo '' && until docker exec chaycards-postgres pg_isready -U postgres > /dev/null 2>&1; do echo -n '.'; sleep 1; done && echo '' && echo '✅ PostgreSQL is ready!' && echo '' && echo '🚀 Starting Backend Express API on port 7243...' && echo '   Connecting to: postgresql://postgres@localhost:5433/chaycards' && echo '   Exposed via: https://api.chaycards.com' && echo '' && npm run server; exec bash"
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════
REM 3. Notion PM Server
REM ═══════════════════════════════════════════════════════════
echo [3/5] Starting Notion PM Server...
start "ChayCards - Notion PM" wsl -e bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && clear && echo '╔═══════════════════════════════════════════════╗' && echo '║         Notion PM Sync Server                 ║' && echo '╚═══════════════════════════════════════════════╝' && echo '' && echo '⏳ Waiting for PostgreSQL...' && until docker exec chaycards-postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done && echo '' && echo '🔄 Starting Notion PM Server on port 3001...' && echo '   Exposed via: https://dev.chaycards.com' && echo '' && npm run notion-pm:server; exec bash"
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════
REM 4. Cloudflare Tunnel
REM ═══════════════════════════════════════════════════════════
echo [4/5] Starting Cloudflare Tunnel...
start "ChayCards - Cloudflare Tunnel" cmd /k "cd /d "%PROJECT_DIR%" && echo ╔═══════════════════════════════════════════════╗ && echo ║          Cloudflare Tunnel                    ║ && echo ╚═══════════════════════════════════════════════╝ && echo. && echo ⏳ Waiting for backend services... && timeout /t 15 /nobreak >nul && echo. && echo 🌐 Starting Cloudflare Tunnel... && echo    Public URLs: && echo    • https://api.chaycards.com (Backend API) && echo    • https://dev.chaycards.com (Notion PM) && echo. && cloudflared tunnel run chaycards-api"
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════
REM 5. RAG Embedding Server
REM ═══════════════════════════════════════════════════════════
echo [5/5] Starting RAG Embedding Server...
start "ChayCards - RAG Embedding" wsl -e bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && clear && echo '╔═══════════════════════════════════════════════╗' && echo '║       RAG Embedding Server                    ║' && echo '╚═══════════════════════════════════════════════╝' && echo '' && echo '🤖 Auto-setup will run on first start (~30s one-time)' && echo '' && sleep 3 && ./memory-bank/scripts/auto-start-rag.sh; exec bash"

echo.
echo ✅ All services launched!
echo.
echo ═══════════════════════════════════════════════════════════
echo 📊 Service Windows Opened:
echo    • PostgreSQL Database
echo    • Backend Express API
echo    • Notion PM Sync Server
echo    • Cloudflare Tunnel
echo    • RAG Embedding Server
echo ═══════════════════════════════════════════════════════════
echo.
echo 📝 Next Steps:
echo    1. Wait ~20s for all services to start
echo    2. Run 'npm run dev' in WSL (separate terminal)
echo    3. Run start-electron-windows.bat (for UI)
echo.
echo 💡 Service Endpoints:
echo    • PostgreSQL:        localhost:5433
echo    • Backend API:       localhost:7243
echo    • Notion PM Server:  localhost:3001
echo    • RAG Embedding:     localhost:8765
echo    • Public API:        https://api.chaycards.com
echo    • Public PM:         https://dev.chaycards.com
echo.
echo 🛑 To Stop Services:
echo    Close individual windows or press Ctrl+C in each
echo.
echo 💡 You can close this control window now
echo    (individual services will keep running)
echo.
pause
