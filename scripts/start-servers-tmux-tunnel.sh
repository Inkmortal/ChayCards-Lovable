#!/bin/bash
# ChayCards Development Servers + Cloudflare Tunnel (tmux layout)
# Shows all server logs in split panes including tunnel
# Ctrl+C or closing window stops all servers

set -e

PROJECT_DIR="/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable"
SESSION_NAME="chaycards-servers-tunnel"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Installing..."
    sudo apt-get update && sudo apt-get install -y tmux
fi

# Check if cloudflared is installed (Windows)
if ! cmd.exe /c "where cloudflared" > /dev/null 2>&1; then
    echo "⚠️  Warning: cloudflared not found on Windows"
    echo "   Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    echo ""
    read -p "Continue without tunnel? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_TUNNEL=false
else
    USE_TUNNEL=true
fi

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "🚀 Starting ChayCards servers in tmux..."
echo "   Press Ctrl+C or close window to stop all servers"
echo ""

# Create new tmux session with split panes
tmux new-session -s "$SESSION_NAME" -d

if [ "$USE_TUNNEL" = true ]; then
    # 4-pane layout: PostgreSQL | Notion PM | Tunnel | Control
    tmux split-window -h -t "$SESSION_NAME:0"
    tmux split-window -v -t "$SESSION_NAME:0.0"
    tmux split-window -v -t "$SESSION_NAME:0.2"
else
    # 3-pane layout: PostgreSQL | Notion PM | Control
    tmux split-window -h -t "$SESSION_NAME:0"
    tmux split-window -v -t "$SESSION_NAME:0.0"
fi

# Pane 0 (top-left): PostgreSQL
tmux send-keys -t "$SESSION_NAME:0.0" "cd $PROJECT_DIR/server" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '║           PostgreSQL Database                 ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '🐘 Starting PostgreSQL on port 5433...'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "docker-compose up" C-m

# Pane 1 (bottom-left): Notion PM Server
tmux send-keys -t "$SESSION_NAME:0.1" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '║         Notion PM Sync Server                 ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '⏳ Waiting for PostgreSQL to be ready...'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "sleep 10" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '🔄 Starting Notion PM Server on port 3001...'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "npm run notion-pm:server" C-m

if [ "$USE_TUNNEL" = true ]; then
    # Pane 2 (top-right): Cloudflare Tunnel
    tmux send-keys -t "$SESSION_NAME:0.2" "cd $PROJECT_DIR" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "clear" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '╔═══════════════════════════════════════════════╗'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '║          Cloudflare Tunnel                    ║'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '╚═══════════════════════════════════════════════╝'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo ''" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '⏳ Waiting for Notion PM Server...'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "sleep 15" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo ''" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '🌐 Starting Cloudflare Tunnel...'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo '   Public URL: https://dev.chaycards.com'" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "echo ''" C-m
    tmux send-keys -t "$SESSION_NAME:0.2" "cmd.exe /c cloudflared tunnel run chaycards-api" C-m

    # Pane 3 (bottom-right): Status & Control
    CONTROL_PANE="$SESSION_NAME:0.3"
    TUNNEL_STATUS="   • Cloudflare Tunnel: https://dev.chaycards.com"
else
    # Pane 2 (right): Status & Control
    CONTROL_PANE="$SESSION_NAME:0.2"
    TUNNEL_STATUS="   • Cloudflare Tunnel: Not running"
fi

tmux send-keys -t "$CONTROL_PANE" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$CONTROL_PANE" "clear" C-m
tmux send-keys -t "$CONTROL_PANE" "cat << 'EOF'" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "╔═══════════════════════════════════════════════╗" C-m
tmux send-keys -t "$CONTROL_PANE" "║       ChayCards Servers Running               ║" C-m
tmux send-keys -t "$CONTROL_PANE" "╚═══════════════════════════════════════════════╝" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "📊 Service Status:" C-m
tmux send-keys -t "$CONTROL_PANE" "   • PostgreSQL:        localhost:5433" C-m
tmux send-keys -t "$CONTROL_PANE" "   • Notion PM Server:  localhost:3001" C-m
tmux send-keys -t "$CONTROL_PANE" "$TUNNEL_STATUS" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "🎯 Tmux Commands:" C-m
tmux send-keys -t "$CONTROL_PANE" "   Ctrl+B then:" C-m
tmux send-keys -t "$CONTROL_PANE" "   • ←/→/↑/↓    Navigate panes" C-m
tmux send-keys -t "$CONTROL_PANE" "   • [          Scroll mode (q to exit)" C-m
tmux send-keys -t "$CONTROL_PANE" "   • z          Zoom current pane" C-m
tmux send-keys -t "$CONTROL_PANE" "   • d          Detach (servers keep running)" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "🛑 Stop Servers:" C-m
tmux send-keys -t "$CONTROL_PANE" "   • Ctrl+C in each pane" C-m
tmux send-keys -t "$CONTROL_PANE" "   • Or close this window" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "📝 Next Steps:" C-m
tmux send-keys -t "$CONTROL_PANE" "   1. Wait ~10s for PostgreSQL" C-m
tmux send-keys -t "$CONTROL_PANE" "   2. Run 'npm run dev' (separate terminal)" C-m
tmux send-keys -t "$CONTROL_PANE" "   3. Run start-electron-windows.bat" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "💡 Notion Webhook:" C-m
tmux send-keys -t "$CONTROL_PANE" "   https://dev.chaycards.com/api/notion-pm/sync" C-m
tmux send-keys -t "$CONTROL_PANE" "" C-m
tmux send-keys -t "$CONTROL_PANE" "EOF" C-m

# Set pane titles
tmux select-pane -t "$SESSION_NAME:0.0" -T "PostgreSQL"
tmux select-pane -t "$SESSION_NAME:0.1" -T "Notion PM"
if [ "$USE_TUNNEL" = true ]; then
    tmux select-pane -t "$SESSION_NAME:0.2" -T "Cloudflare"
    tmux select-pane -t "$SESSION_NAME:0.3" -T "Control"
else
    tmux select-pane -t "$SESSION_NAME:0.2" -T "Control"
fi

# Enable pane titles display
tmux set -g pane-border-status top
tmux set -g pane-border-format " #{pane_title} "

# Select the PostgreSQL pane to start
tmux select-pane -t "$SESSION_NAME:0.0"

# Attach to the session
tmux attach-session -t "$SESSION_NAME"

# Cleanup when session ends
echo ""
echo "🧹 Cleaning up..."
cd "$PROJECT_DIR/server"
docker-compose down 2>/dev/null || true
pkill -f "tsx scripts/notion-pm-server.ts" 2>/dev/null || true
cmd.exe /c "taskkill /F /IM cloudflared.exe 2>nul" || true
echo "✅ All servers stopped"
