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

echo 🛑 Stopping Backend API Server...
wsl -e bash -c "pkill -f 'node server/index.js' 2>/dev/null || true"

echo 🛑 Stopping Notion PM Server...
wsl -e bash -c "pkill -f 'tsx scripts/notion-pm-server.ts' 2>/dev/null || true"

echo 🛑 Stopping RAG Embedding Server...
wsl -e bash -c "pkill -f 'embedding-server.py' 2>/dev/null || true"

echo 🛑 Stopping PostgreSQL Database...
wsl -e bash -c "cd %WSL_PROJECT_PATH%/server && docker-compose down"

echo 🛑 Stopping Qdrant Vector Database...
wsl -e bash -c "cd %WSL_PROJECT_PATH% && docker-compose -f docker-compose.qdrant.yml down 2>/dev/null || true"

echo 🛑 Stopping any Vite dev server (if running)...
wsl -e bash -c "pkill -f 'vite' 2>/dev/null || true"

echo 🛑 Stopping Cloudflare Tunnel (if running)...
cmd /c "taskkill /F /IM cloudflared.exe 2>nul || true"

echo.
echo ✅ All servers stopped
echo.
echo 🔍 Verifying shutdown...
echo.

REM Check for any remaining ChayCards processes
echo Checking for remaining processes:
echo.

echo [Node/Backend API]
wsl -e bash -c "ps aux | grep -E 'node server/index\.js' | grep -v grep || echo '  ✓ None running'"

echo.
echo [Notion PM Server]
wsl -e bash -c "ps aux | grep -E 'tsx scripts/notion-pm-server' | grep -v grep || echo '  ✓ None running'"

echo.
echo [RAG Embedding]
wsl -e bash -c "ps aux | grep -E 'embedding-server\.py' | grep -v grep || echo '  ✓ None running'"

echo.
echo [Vite Dev Server]
wsl -e bash -c "ps aux | grep -E 'vite' | grep -v grep || echo '  ✓ None running'"

echo.
echo [Docker Containers]
wsl -e bash -c "docker ps --filter name=chaycards --format '  {{.Names}} ({{.Status}})' || echo '  ✓ None running'"

echo.
echo [Cloudflared on Windows]
cmd /c "tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /I "cloudflared.exe" >nul && echo   ⚠ Still running! || echo   ✓ None running"

echo.
echo ═══════════════════════════════════════════════════════════
echo If any processes are still running above, you may need to:
echo   • Close individual windows manually
echo   • Run this script again
echo   • Use Task Manager (Ctrl+Shift+Esc) for stuck processes
echo ═══════════════════════════════════════════════════════════
echo.
pause
