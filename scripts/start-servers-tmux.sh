#!/bin/bash
# ChayCards Development Servers (tmux layout)
# Shows all server logs in split panes
# Ctrl+C or closing window stops all servers

set -e

PROJECT_DIR="/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable"
SESSION_NAME="chaycards-servers"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Installing..."
    sudo apt-get update && sudo apt-get install -y tmux
fi

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "🚀 Starting ChayCards servers in tmux..."
echo "   Press Ctrl+C or close window to stop all servers"
echo ""

# Create new tmux session with split panes
tmux new-session -s "$SESSION_NAME" -d

# Set up pane layout (horizontal split, then vertical split on bottom)
tmux split-window -h -t "$SESSION_NAME:0"
tmux split-window -v -t "$SESSION_NAME:0.0"

# Configure each pane
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

# Pane 2 (right): Status & Control
tmux send-keys -t "$SESSION_NAME:0.2" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "cat << 'EOF'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "╔═══════════════════════════════════════════════╗" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "║       ChayCards Servers Running               ║" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "╚═══════════════════════════════════════════════╝" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "📊 Service Status:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • PostgreSQL:        localhost:5433" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • Notion PM Server:  localhost:3001" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "🎯 Tmux Commands:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   Ctrl+B then:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • ←/→/↑/↓    Navigate panes" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • [          Scroll mode (q to exit)" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • z          Zoom current pane" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • d          Detach (servers keep running)" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "🛑 Stop Servers:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • Ctrl+C in each pane" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • Or close this window" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   • Or run: stop-servers.bat" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "📝 Next Steps:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   1. Wait ~10s for PostgreSQL" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   2. Run 'npm run dev' (separate terminal)" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "   3. Run start-electron-windows.bat" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "💡 Useful Commands:" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "EOF" C-m

# Set pane titles
tmux select-pane -t "$SESSION_NAME:0.0" -T "PostgreSQL"
tmux select-pane -t "$SESSION_NAME:0.1" -T "Notion PM"
tmux select-pane -t "$SESSION_NAME:0.2" -T "Control"

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
echo "✅ All servers stopped"
