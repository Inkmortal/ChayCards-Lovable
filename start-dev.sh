#!/bin/bash
# Cross-platform startup script (Linux, Mac, WSL)
# Starts all ChayCards Docker services

set -e

echo "🚀 Starting ChayCards development environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
  echo "✓ Created .env file. Please edit it with your API keys."
  echo ""
fi

# Check for Cloudflare tunnel credentials
if [ ! -f cloudflared-credentials.json ]; then
  echo "⚠️  cloudflared-credentials.json not found"
  echo "   API will not be accessible at api.chaycards.com"
  echo "   Copy cloudflared-credentials.json.example and add your credentials"
  echo ""
fi

# Start all services
echo "Starting Docker services..."
docker-compose --profile all up -d

echo ""
echo "✨ All services started!"
echo ""
echo "📊 Service URLs:"
echo "  PostgreSQL:     localhost:5433"
echo "  Express API:    http://localhost:3101"
echo "  Qdrant:         http://localhost:6333"
echo "  Embedding:      http://localhost:8765"
echo "  Notion PM:      http://localhost:3001"
echo "  Public API:     https://api.chaycards.com (via Cloudflare tunnel)"
echo ""
echo "💡 Commands:"
echo "  npm run dev              # Start Vite dev server"
echo "  npm run check:services   # Health check all services"
echo "  npm run logs             # Interactive log viewer"
echo "  npm run docker:ui        # Lazydocker TUI (recommended)"
echo "  npm run stop             # Stop all services"
echo ""
