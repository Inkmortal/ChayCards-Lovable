#!/bin/bash
set -e

echo "🚀 Setting up Qdrant vector database..."

# Start Qdrant container
echo "📦 Starting Qdrant container..."
docker-compose -f docker-compose.qdrant.yml up -d

# Wait for Qdrant to be ready
echo "⏳ Waiting for Qdrant to be ready..."
until curl -s http://localhost:6333/healthz > /dev/null; do
  sleep 1
done

echo "✅ Qdrant is ready!"

# Initialize collection via Node.js
echo "🔧 Initializing collection..."
node memory-bank/scripts/qdrant-client.js init

echo "✨ Qdrant setup complete!"
echo "📊 Dashboard: http://localhost:6333/dashboard"
