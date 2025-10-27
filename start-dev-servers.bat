@echo off
REM ChayCards Development Servers
REM Starts ALL required services for development
REM Usage: Double-click this file or run from command line

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Development Servers               ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Starting all required services...
echo.
echo Services:
echo   ✅ PostgreSQL (port 5433)
echo   ✅ Backend Express API (port 7243)
echo   ✅ Notion PM Server (port 3001)
echo   ✅ Cloudflare Tunnel (api.chaycards.com + dev.chaycards.com)
echo.
echo 💡 Close the tmux window or press Ctrl+C to stop all servers
echo    (Auto-cleanup will run automatically)
echo.

REM Launch tmux session in WSL
wsl -e bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && chmod +x scripts/start-servers-tmux.sh && ./scripts/start-servers-tmux.sh"

echo.
echo Tmux session ended. All servers have been stopped.
pause
