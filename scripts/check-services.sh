#!/bin/bash
# Health check script for all ChayCards Docker services
# Works on Linux, Mac, WSL

set -e

echo "╔════════════════════════════════════════╗"
echo "║   ChayCards Services Health Check      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
  local name=$1
  local check_cmd=$2

  if eval "$check_cmd" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name"
    return 0
  else
    echo -e "  ${RED}✗${NC} $name"
    return 1
  fi
}

echo "PRODUCT SERVERS:"
check_service "PostgreSQL (5433)" "docker exec chaycards-postgres pg_isready -q"
check_service "Express API (3101)" "curl -sf http://localhost:3101/api/health"

echo ""
echo "DEVELOPMENT SERVERS (Vibe Coding):"
check_service "Qdrant (6333-6334)" "curl -sf http://localhost:6333/health"
check_service "Embedding Server (8765)" "curl -sf http://localhost:8765/health"
check_service "Notion PM (3001)" "curl -sf http://localhost:3001/health"

echo ""
echo "EXTERNAL SERVICES:"
if curl -sf http://192.168.1.58:1243/v1/models > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} LLM Compressor (Mac Mini)"
else
  echo -e "  ${YELLOW}⚠${NC} LLM Compressor (external - may be offline)"
fi

echo ""
echo "Done!"
