@echo off
REM ChayCards Development Servers Launcher (with Cloudflare Tunnel)
REM Starts all necessary servers including Cloudflare tunnel for remote Notion webhook access
REM Usage: Double-click this file from Windows

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Servers + Cloudflare Tunnel       ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Starting services in WSL + Cloudflare Tunnel...
echo.

set WSL_PROJECT_PATH=/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable

REM Check if Windows Terminal is available
where wt >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Windows Terminal not found. Please install from Microsoft Store.
    pause
    exit /b 1
)

REM Check if cloudflared is installed
where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Cloudflared not found on Windows. Install from:
    echo    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo.
    echo 💡 Continuing without Cloudflare Tunnel...
    echo.
    set SKIP_TUNNEL=1
)

echo ✅ Launching services in Windows Terminal tabs...
echo.

if defined SKIP_TUNNEL (
    REM Start without tunnel
    wt -w 0 ^
        --title "PostgreSQL" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH%/server && echo '🐘 Starting PostgreSQL...' && docker-compose up" ^; ^
        new-tab --title "Notion PM Server" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH% && echo '⏳ Waiting for PostgreSQL...' && sleep 10 && echo '🔄 Starting Notion PM Server...' && npm run notion-pm:server" ^; ^
        new-tab --title "Control Panel" -d . cmd /k "echo ╔═══════════════════════════════════════════════╗ && echo ║         ChayCards Servers Running             ║ && echo ╚═══════════════════════════════════════════════╝ && echo. && echo 📊 Services: && echo    • PostgreSQL:       localhost:5433 && echo    • Notion PM Server: localhost:3001 && echo. && echo ⚠️  Cloudflare Tunnel: Not installed && echo. && echo 📝 Next steps: && echo    npm run dev              - Start Vite && echo    start-electron-windows   - Launch Electron && echo."
) else (
    REM Start with tunnel
    wt -w 0 ^
        --title "PostgreSQL" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH%/server && echo '🐘 Starting PostgreSQL...' && docker-compose up" ^; ^
        new-tab --title "Notion PM Server" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH% && echo '⏳ Waiting for PostgreSQL...' && sleep 10 && echo '🔄 Starting Notion PM Server...' && npm run notion-pm:server" ^; ^
        new-tab --title "Cloudflare Tunnel" -d . cmd /k "echo 🌐 Starting Cloudflare Tunnel... && timeout /t 15 /nobreak >nul && cloudflared tunnel run chaycards-api" ^; ^
        new-tab --title "Control Panel" -d . cmd /k "echo ╔═══════════════════════════════════════════════╗ && echo ║    ChayCards Servers + Tunnel Running         ║ && echo ╚═══════════════════════════════════════════════╝ && echo. && echo 📊 Services: && echo    • PostgreSQL:       localhost:5433 && echo    • Notion PM Server: localhost:3001 && echo    • Cloudflare Tunnel: https://dev.chaycards.com && echo. && echo 📝 Next steps: && echo    npm run dev              - Start Vite && echo    start-electron-windows   - Launch Electron && echo. && echo 💡 Notion webhook endpoint: && echo    https://dev.chaycards.com/api/notion-pm/sync && echo."
)

echo.
echo ✅ Services launched
echo.
pause >nul
