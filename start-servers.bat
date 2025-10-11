@echo off
REM ChayCards Development Servers Launcher
REM Starts all necessary servers (except Vite) in WSL
REM Usage: Double-click this file from Windows

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Development Servers Launcher      ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Starting services in WSL...
echo.

REM Set project path in WSL format
set WSL_PROJECT_PATH=/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable

REM Check if Windows Terminal is available
where wt >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Windows Terminal not found. Please install Windows Terminal from the Microsoft Store.
    echo    Alternatively, run these commands manually in separate WSL terminals:
    echo.
    echo    1. cd %WSL_PROJECT_PATH%/server ^&^& docker-compose up
    echo    2. cd %WSL_PROJECT_PATH% ^&^& npm run notion-pm:server
    echo.
    pause
    exit /b 1
)

echo ✅ Launching services in Windows Terminal tabs...
echo.

REM Start all services in Windows Terminal with separate tabs
wt -w 0 ^
    --title "PostgreSQL" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH%/server && echo '🐘 Starting PostgreSQL...' && docker-compose up" ^; ^
    new-tab --title "Notion PM Server" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH% && echo '⏳ Waiting for PostgreSQL to be ready...' && sleep 10 && echo '🔄 Starting Notion PM Sync Server...' && npm run notion-pm:server" ^; ^
    new-tab --title "Control Panel" -d . wsl -e bash -c "cd %WSL_PROJECT_PATH% && echo '' && echo '╔═══════════════════════════════════════════════╗' && echo '║         ChayCards Servers Running             ║' && echo '╚═══════════════════════════════════════════════╝' && echo '' && echo '📊 Service Status:' && echo '   • PostgreSQL:        localhost:5433' && echo '   • Notion PM Server:  localhost:3001' && echo '' && echo '📝 Available Commands:' && echo '   npm run notion-pm:sync  - Manually sync Notion tasks' && echo '   npm run dev             - Start Vite dev server' && echo '   npm run electron:win    - Start Electron (Windows)' && echo '' && echo '🛑 To stop all servers: Close this window or press Ctrl+C in each tab' && echo '' && echo '🔍 Monitor other tabs for service logs' && echo '' && bash"

echo.
echo ✅ Services launched in Windows Terminal
echo.
echo 📋 Next steps:
echo    1. Wait ~10 seconds for PostgreSQL to be ready
echo    2. Check each tab for service status
echo    3. Run 'npm run dev' in a separate WSL terminal to start Vite
echo    4. Run start-electron-windows.bat to launch Electron UI
echo.
echo Press any key to close this launcher window...
pause >nul
