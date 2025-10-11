@echo off
REM ChayCards Development Servers Shutdown
REM Stops all running servers in WSL
REM Usage: Double-click this file from Windows

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Development Servers Shutdown      ║
echo ╚═══════════════════════════════════════════════╝
echo.

set WSL_PROJECT_PATH=/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable

echo 🛑 Stopping tmux sessions...
wsl -e bash -c "tmux kill-session -t chaycards-servers 2>/dev/null || true"
wsl -e bash -c "tmux kill-session -t chaycards-servers-tunnel 2>/dev/null || true"

echo 🛑 Stopping Notion PM Server...
wsl -e bash -c "pkill -f 'tsx scripts/notion-pm-server.ts' 2>/dev/null || true"

echo 🛑 Stopping PostgreSQL...
wsl -e bash -c "cd %WSL_PROJECT_PATH%/server && docker-compose down"

echo 🛑 Stopping any Vite processes (if running)...
wsl -e bash -c "pkill -f 'vite' 2>/dev/null || true"

echo 🛑 Stopping Cloudflare tunnel (if running)...
cmd /c "taskkill /F /IM cloudflared.exe 2>nul || true"

echo.
echo ✅ All servers stopped
echo.
pause
