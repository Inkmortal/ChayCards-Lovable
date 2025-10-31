#!/bin/bash
# ChayCards Docker Log Viewer - Interactive Menu

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ChayCards Docker Logs${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1) View all logs (follow live)"
echo "2) View all logs (last 100 lines)"
echo "3) API logs (port 3101)"
echo "4) PostgreSQL logs (port 5433)"
echo "5) Qdrant logs (ports 6333-6334)"
echo "6) Embedding server logs (port 8765)"
echo "7) Notion PM logs (port 3001)"
echo "8) Cloudflare tunnel logs"
echo "9) Errors only (all services)"
echo "10) Warnings and errors only"
echo "0) Exit"
echo ""
read -p "Choose option: " choice

case $choice in
  1)
    echo -e "${GREEN}Following all logs... (Ctrl+C to exit)${NC}"
    docker-compose logs -f --timestamps
    ;;
  2)
    echo -e "${GREEN}Last 100 lines from all services:${NC}"
    docker-compose logs --tail=100 --timestamps
    ;;
  3)
    echo -e "${GREEN}Following API logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-api
    ;;
  4)
    echo -e "${GREEN}Following PostgreSQL logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-postgres
    ;;
  5)
    echo -e "${GREEN}Following Qdrant logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-qdrant
    ;;
  6)
    echo -e "${GREEN}Following Embedding server logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-embedding
    ;;
  7)
    echo -e "${GREEN}Following Notion PM logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-notion-pm
    ;;
  8)
    echo -e "${GREEN}Following Cloudflare tunnel logs... (Ctrl+C to exit)${NC}"
    docker logs -f chaycards-cloudflared
    ;;
  9)
    echo -e "${YELLOW}Errors from all services:${NC}"
    docker-compose logs 2>&1 | grep -i -E 'error|fail|fatal|exception' | tail -50
    ;;
  10)
    echo -e "${YELLOW}Warnings and errors from all services:${NC}"
    docker-compose logs 2>&1 | grep -i -E 'error|warn|fail|fatal|exception' | tail -50
    ;;
  0)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo -e "${YELLOW}Invalid option${NC}"
    exit 1
    ;;
esac
