#!/bin/bash
# ChayCards Development Servers
# Starts ALL required services for development
# Ctrl+C or closing window stops all servers automatically
#
# Services started:
#   - PostgreSQL (port 5433)
#   - Backend Express API (port 7243)
#   - Notion PM Server (port 3001)
#   - Cloudflare Tunnel (api.chaycards.com + dev.chaycards.com)
#   - RAG Embedding Server (port 8765) - Auto-setup on first run

set -e

PROJECT_DIR="/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable"
SESSION_NAME="chaycards-servers"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Installing..."
    sudo apt-get update && sudo apt-get install -y tmux
fi

# Check if cloudflared is available
if ! cmd.exe /c "where cloudflared" > /dev/null 2>&1; then
    echo "⚠️  Warning: cloudflared not found on Windows"
    echo "   Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    echo ""
    echo "   Cloudflare Tunnel is required for development (api.chaycards.com)"
    echo "   The app won't work without it!"
    echo ""
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "🚀 Starting ChayCards development servers..."
echo ""
echo "Services:"
echo "  ✅ PostgreSQL (port 5433)"
echo "  ✅ Backend Express API (port 7243)"
echo "  ✅ Notion PM Server (port 3001)"
echo "  ✅ Cloudflare Tunnel (api.chaycards.com + dev.chaycards.com)"
echo "  ✅ RAG Embedding Server (port 8765)"
echo ""
echo "Press Ctrl+C or close window to stop all servers"
echo ""
sleep 2

# Create new tmux session with 6 panes
tmux new-session -s "$SESSION_NAME" -d

# Fixed 6-pane layout: PostgreSQL | Backend API | Notion PM | Tunnel | RAG | Control
tmux split-window -h -t "$SESSION_NAME:0"
tmux split-window -v -t "$SESSION_NAME:0.0"
tmux split-window -v -t "$SESSION_NAME:0.2"
tmux split-window -v -t "$SESSION_NAME:0.3"
tmux split-window -v -t "$SESSION_NAME:0.4"

PANE_POSTGRES=0
PANE_BACKEND=1
PANE_NOTION=2
PANE_TUNNEL=3
PANE_RAG=4
PANE_CONTROL=5

# ═══════════════════════════════════════════════════════════
# PANE: PostgreSQL
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "cd $PROJECT_DIR/server" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo '║           PostgreSQL Database                 ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo '🐘 Starting PostgreSQL on port 5433...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo '   Healthcheck: pg_isready every 5s'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_POSTGRES" "docker-compose up" C-m

# ═══════════════════════════════════════════════════════════
# PANE: Backend Express API
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '║         Backend Express API                   ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '⏳ Waiting for PostgreSQL health check...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo ''" C-m

# Wait for PostgreSQL to be healthy (not just running)
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "until docker exec chaycards-postgres pg_isready -U postgres > /dev/null 2>&1; do echo -n '.'; sleep 1; done" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '✅ PostgreSQL is ready!'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '🚀 Starting Backend Express API on port 7243...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '   Connecting to: postgresql://postgres@localhost:5433/chaycards'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo '   Exposed via: https://api.chaycards.com'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_BACKEND" "npm run server" C-m

# ═══════════════════════════════════════════════════════════
# PANE: Notion PM Server
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '║         Notion PM Sync Server                 ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '⏳ Waiting for PostgreSQL...'" C-m

# Wait for PostgreSQL
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "until docker exec chaycards-postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '🔄 Starting Notion PM Server on port 3001...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo '   Exposed via: https://dev.chaycards.com'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_NOTION" "npm run notion-pm:server" C-m

# ═══════════════════════════════════════════════════════════
# PANE: Cloudflare Tunnel
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '╔═══════════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '║          Cloudflare Tunnel                    ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '╚═══════════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '⏳ Waiting for backend services...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "sleep 15" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '🌐 Starting Cloudflare Tunnel...'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '   Public URLs:'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '   • https://api.chaycards.com (Backend API)'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo '   • https://dev.chaycards.com (Notion PM)'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_TUNNEL" "cmd.exe /c cloudflared tunnel run chaycards-api" C-m

# ═══════════════════════════════════════════════════════════
# PANE: RAG Embedding Server
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "echo '🤖 RAG Embedding Server'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "echo '   Auto-setup will run on first start (~30s one-time)'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "sleep 3" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_RAG" "./memory-bank/scripts/auto-start-rag.sh" C-m

# ═══════════════════════════════════════════════════════════
# PANE: Control & Status
# ═══════════════════════════════════════════════════════════
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "cd $PROJECT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "cat << 'EOF'" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "╔═══════════════════════════════════════════════╗" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "║       ChayCards Development Servers           ║" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "╚═══════════════════════════════════════════════╝" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "📊 Service Status:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   ✅ PostgreSQL:        localhost:5433" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   ✅ Backend API:       localhost:7243" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   ✅ Notion PM Server:  localhost:3001" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   ✅ Cloudflare Tunnel: https://api.chaycards.com" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "                         https://dev.chaycards.com" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   ✅ RAG Embedding:     localhost:8765" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "🎯 Tmux Commands:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   Ctrl+B then:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • ←/→/↑/↓    Navigate panes" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • [          Scroll mode (q to exit)" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • z          Zoom current pane" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • d          Detach (servers keep running)" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "🛑 Stop All Servers:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • Close this window (auto-cleanup)" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • Or Ctrl+C in each pane" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "📝 Next Steps:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   1. Wait ~15s for all services to start" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   2. Run 'npm run dev' (separate terminal)" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   3. Run start-electron-windows.bat (for UI)" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "💡 Frontend URLs:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • Web: http://localhost:8080" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   • API: https://api.chaycards.com" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "💡 Notion Webhook:" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "   https://dev.chaycards.com/api/notion-pm/sync" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "" C-m
tmux send-keys -t "$SESSION_NAME:0.$PANE_CONTROL" "EOF" C-m

# Set pane titles
tmux select-pane -t "$SESSION_NAME:0.$PANE_POSTGRES" -T "PostgreSQL"
tmux select-pane -t "$SESSION_NAME:0.$PANE_BACKEND" -T "Backend API"
tmux select-pane -t "$SESSION_NAME:0.$PANE_NOTION" -T "Notion PM"
tmux select-pane -t "$SESSION_NAME:0.$PANE_TUNNEL" -T "Cloudflare"
tmux select-pane -t "$SESSION_NAME:0.$PANE_RAG" -T "RAG"
tmux select-pane -t "$SESSION_NAME:0.$PANE_CONTROL" -T "Control"

# Enable pane titles display
tmux set -g pane-border-status top
tmux set -g pane-border-format " #{pane_title} "

# Select the PostgreSQL pane to start
tmux select-pane -t "$SESSION_NAME:0.$PANE_POSTGRES"

# Attach to the session
tmux attach-session -t "$SESSION_NAME"

# ═══════════════════════════════════════════════════════════
# CLEANUP (runs when session ends)
# ═══════════════════════════════════════════════════════════
echo ""
echo "🧹 Cleaning up..."

# Stop PostgreSQL
cd "$PROJECT_DIR/server"
docker-compose down 2>/dev/null || true

# Stop Backend API
pkill -f "node server/index.js" 2>/dev/null || true

# Stop Notion PM Server
pkill -f "tsx scripts/notion-pm-server.ts" 2>/dev/null || true

# Stop Cloudflare Tunnel
cmd.exe /c "taskkill /F /IM cloudflared.exe 2>nul" || true

# Stop RAG Embedding Server
pkill -f "embedding-server.py" 2>/dev/null || true

# Stop Qdrant container
docker-compose -f docker-compose.qdrant.yml down 2>/dev/null || true

echo "✅ All servers stopped"
