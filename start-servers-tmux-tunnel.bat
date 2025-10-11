@echo off
REM ChayCards Servers + Cloudflare Tunnel (tmux layout)
REM Shows all server logs in split panes - Ctrl+C to stop all
REM Usage: Double-click this file from Windows

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ChayCards Servers + Tunnel (tmux view)      ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Starting servers in tmux layout with Cloudflare Tunnel...
echo.

REM Launch tmux session in WSL
wsl -e bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && chmod +x scripts/start-servers-tmux-tunnel.sh && ./scripts/start-servers-tmux-tunnel.sh"

echo.
echo Tmux session ended.
pause
