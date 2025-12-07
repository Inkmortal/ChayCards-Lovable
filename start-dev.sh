#!/bin/bash
# ========================================
# ChayCards Development Environment Startup
# ========================================
# One-click script to start all services:
# - PostgreSQL (with dev/staging/prod databases)
# - API server (Express backend)
# - Notion PM (project management)
# - Cloudflare tunnel (external access)
# - Vite dev server (frontend on host)
#
# NOTE: RAG services (Qdrant, Embedding) are now handled by Vibe Master
# Start them separately with: vibe-master/scripts/start-services.sh

set -e

echo "========================================="
echo "ChayCards Development Environment"
echo "========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Clean up any existing containers to avoid naming conflicts
echo "🔍 Checking for existing containers..."
if docker-compose ps -q 2>/dev/null | grep -q .; then
    echo "   Found existing containers, cleaning up..."
    docker-compose down --remove-orphans
    # Force remove any stuck containers
    docker ps -a --filter "name=chaycards" -q | xargs -r docker rm -f 2>/dev/null || true
fi
echo ""

# Check for required files
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi

if [ ! -f "cloudflared-credentials.json" ]; then
    echo "⚠️  Warning: cloudflared-credentials.json not found"
    echo "   Cloudflare tunnel will not work without credentials"
    echo "   Continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo "✓ Configuration files present"
echo ""

# ========================================
# Cloudflare DNS Routes Setup
# ========================================
echo "🌐 Checking Cloudflare tunnel DNS routes..."

# Check if cloudflared CLI is available
if ! command -v cloudflared &> /dev/null; then
    echo "⚠️  Warning: cloudflared CLI not installed"
    echo "   DNS routes cannot be verified/created automatically"
    echo "   Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo "   Continuing without DNS route verification..."
else
    TUNNEL_ID="6c780a88-8816-46f3-8e89-fd866d5006fd"
    echo "   Setting up DNS routes for tunnel $TUNNEL_ID..."

    # Setup DNS routes (idempotent - will succeed if already exists or create if missing)
    for domain in "dev.chaycards.com" "dev-api.chaycards.com" "dev-tools.chaycards.com"; do
        result=$(cloudflared tunnel route dns "$TUNNEL_ID" "$domain" 2>&1)
        if echo "$result" | grep -q "Added CNAME"; then
            echo "   - $domain: ✓ (created)"
        elif echo "$result" | grep -q "already exists"; then
            echo "   - $domain: ✓ (exists)"
        else
            echo "   - $domain: ✓"
        fi
    done

    echo "✓ Cloudflare DNS routes configured"
fi
echo ""

# Start Docker services
echo "🚀 Starting Docker services..."
echo "   Using profile: all (product + dev)"
echo ""

docker-compose --profile all up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo -n "   PostgreSQL: "
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✓ Ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Warning: PostgreSQL timeout"
        echo "   Check logs: docker-compose logs postgres"
        echo "   Continuing anyway..."
    fi
    sleep 1
    echo -n "."
done

# Auto-create databases if they don't exist
echo ""
echo -n "   Checking databases: "
if ! docker-compose exec -T postgres psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw chaycards_dev; then
    echo "Creating..."
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_dev;" > /dev/null 2>&1
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_staging;" > /dev/null 2>&1
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_prod;" > /dev/null 2>&1
    echo "✓ Databases created"
else
    echo "✓ Exist"
fi

# Wait for API (using Docker health status)
echo -n "   API Server: "
restart_attempted=0
for i in {1..30}; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' chaycards-api-dev 2>/dev/null || echo "starting")
    if [ "$HEALTH" = "healthy" ]; then
        echo "✓ Ready"
        break
    fi
    if [ $i -eq 30 ]; then
        if [ $restart_attempted -eq 0 ]; then
            echo "⚠️  Warning: API not healthy, restarting..."
            docker-compose restart api-dev > /dev/null 2>&1
            restart_attempted=1
            i=0
            sleep 3
        else
            echo "⚠️  Warning: API unhealthy after restart"
            echo "   Check logs: docker-compose logs api-dev"
            echo "   Continuing anyway..."
            break
        fi
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "✓ All core services are ready"
echo ""

# NOTE: RAG services (Qdrant, Embedding) are now handled by Vibe Master
echo "💡 RAG services are handled by Vibe Master"
echo "   Start them with: vibe-master/scripts/start-services.sh"
echo ""

# Start Vite on host (background process)
echo "🚀 Starting Vite dev server on host..."
echo ""

# Kill any existing Vite process on port 8080
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "   Stopping existing Vite process on port 8080..."
    lsof -ti:8080 | xargs kill -9 > /dev/null 2>&1 || true
fi

# Start Vite in background
npm run dev > vite-dev.log 2>&1 &
VITE_PID=$!
echo $VITE_PID > .vite.pid

# Wait for Vite to be ready
echo -n "   Vite dev server: "
for i in {1..30}; do
    if curl -f http://localhost:8080 > /dev/null 2>&1; then
        echo "✓ Ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Warning: Vite startup timeout"
        echo "   Check logs: tail -f vite-dev.log"
        echo "   Or start manually: npm run dev"
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "========================================="
echo "✨ ChayCards is ready!"
echo "========================================="
echo ""
echo "🌐 Access URLs:"
echo "   Frontend (dev):   https://dev.chaycards.com"
echo "   Frontend (local): http://localhost:8080"
echo "   API (dev):        https://dev-api.chaycards.com"
echo "   Dev Tools:        https://dev-tools.chaycards.com"
echo ""
echo "📊 Service Status:"
echo "   Docker services:  docker-compose ps"
echo "   Vite logs:        tail -f vite-dev.log"
echo "   API logs:         docker-compose logs -f api-dev"
echo "   Postgres logs:    docker-compose logs -f postgres"
echo "   RAG (Vibe Master): vibe-master/scripts/health-check.sh"
echo ""
echo "🛑 Stop services:"
echo "   ./stop-dev.sh"
echo ""
