#!/bin/bash
# ChayCards Development Environment - Stop Script (Linux/Mac/WSL)
# Stops all Docker services and kills orphaned processes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
REMOVE_VOLUMES=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --volumes|-v)
      REMOVE_VOLUMES=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./stop-dev.sh [OPTIONS]"
      echo ""
      echo "Stop all ChayCards development services and processes"
      echo ""
      echo "Options:"
      echo "  --volumes, -v    Remove Docker volumes (wipes all data)"
      echo "  --help, -h       Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./stop-dev.sh              Stop services, keep data"
      echo "  ./stop-dev.sh --volumes    Stop services and wipe data"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "========================================"
echo "ChayCards - Stop Development Services"
echo "========================================"
echo ""

# Stop Vite if PID file exists
if [ -f ".vite.pid" ]; then
    VITE_PID=$(cat .vite.pid)
    if ps -p $VITE_PID > /dev/null 2>&1; then
        echo "Stopping Vite process (PID: $VITE_PID)..."
        kill $VITE_PID 2>/dev/null || true
    fi
    rm -f .vite.pid
fi

# Stop Embedding Watcher if PID file exists
if [ -f ".embedding-watcher.pid" ]; then
    WATCHER_PID=$(cat .embedding-watcher.pid)
    if ps -p $WATCHER_PID > /dev/null 2>&1; then
        echo "Stopping Embedding Watcher (PID: $WATCHER_PID)..."
        kill $WATCHER_PID 2>/dev/null || true
    fi
    rm -f .embedding-watcher.pid
fi

echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${BLUE}[1/4] Stopping Docker containers...${NC}"
echo ""

if [ "$REMOVE_VOLUMES" = true ]; then
    echo "Stopping containers and removing volumes..."
    docker-compose down --volumes
else
    docker-compose down
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Docker containers stopped${NC}"
else
    echo -e "${YELLOW}[WARNING] Docker Compose encountered an error${NC}"
fi
echo ""

echo -e "${BLUE}[2/4] Killing orphaned processes on ports...${NC}"
echo ""

# Function to kill process on a specific port
kill_port() {
    local PORT=$1
    local SERVICE=$2

    PID=$(lsof -ti:$PORT 2>/dev/null)

    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null
        echo -e "${GREEN}[OK] Killed $SERVICE (port $PORT, PID $PID)${NC}"
    else
        echo -e "${YELLOW}[SKIP] No process on port $PORT ($SERVICE)${NC}"
    fi
}

# Kill processes on specific ports (only host-exposed services)
kill_port 8080 "Vite Dev Server"

# Note: Docker services don't expose ports to host anymore,
# so we don't need to kill them individually

echo ""
echo -e "${BLUE}[3/4] Killing Electron processes...${NC}"
echo ""

if pgrep -f electron > /dev/null; then
    pkill -9 -f electron
    echo -e "${GREEN}[OK] Killed Electron processes${NC}"
else
    echo -e "${YELLOW}[SKIP] No Electron processes running${NC}"
fi

echo ""
echo -e "${BLUE}[4/4] Cleanup complete${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}All services stopped successfully!${NC}"
echo "========================================"
echo ""

if [ "$REMOVE_VOLUMES" = true ]; then
    echo -e "${YELLOW}[NOTE] Docker volumes have been removed${NC}"
    echo "       All database data has been wiped"
    echo ""
fi
