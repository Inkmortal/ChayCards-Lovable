#!/bin/bash
set -e

echo "🚀 ChayCards RAG Infrastructure Setup"
echo "======================================"
echo ""

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not found"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found"
    exit 1
fi

echo "✓ Prerequisites OK"
echo ""

# Step 2: Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install chokidar glob

echo ""

# Step 3: Set up Qdrant
echo "🗄️  Setting up Qdrant vector database..."
chmod +x memory-bank/scripts/setup-qdrant.sh
./memory-bank/scripts/setup-qdrant.sh

echo ""

# Step 4: Set up embedding server
echo "🔮 Setting up embedding server (4090 GPU)..."
chmod +x memory-bank/scripts/setup-embedding-server.sh
chmod +x memory-bank/scripts/start-embedding-server.sh
./memory-bank/scripts/setup-embedding-server.sh

echo ""

# Step 5: Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x memory-bank/scripts/embed-patterns.js
chmod +x memory-bank/scripts/embedding-watcher.js
chmod +x memory-bank/scripts/llm-compressor.js

echo ""

# Step 6: Instructions
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Start the embedding server (in a separate terminal):"
echo "   ./memory-bank/scripts/start-embedding-server.sh"
echo ""
echo "2. Embed existing patterns:"
echo "   node memory-bank/scripts/embed-patterns.js"
echo ""
echo "3. (Optional) Start the auto-watcher daemon:"
echo "   node memory-bank/scripts/embedding-watcher.js"
echo ""
echo "4. Verify hook is active:"
echo "   ls -la .claude/hooks/user-prompt-submit.js"
echo ""
echo "5. Test the full pipeline:"
echo "   node memory-bank/scripts/llm-compressor.js test"
echo ""
echo "🎯 The RAG system will now inject pattern reminders on every user prompt!"
