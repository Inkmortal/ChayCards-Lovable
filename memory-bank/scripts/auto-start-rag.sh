#!/bin/bash
# Auto-Start RAG Infrastructure
# Handles setup and startup automatically - idempotent and safe to run multiple times
# Part of ChayCards development server stack

set -e

# Auto-detect project directory (handles both /mnt/c and /c path styles)
if [ -d "/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable" ]; then
    PROJECT_DIR="/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable"
elif [ -d "/c/Users/danhc/Documents/Projects/ChayCards-Lovable" ]; then
    PROJECT_DIR="/c/Users/danhc/Documents/Projects/ChayCards-Lovable"
else
    # Fallback to current directory if neither path exists
    PROJECT_DIR="$(pwd)"
fi
cd "$PROJECT_DIR"

# Ensure Node.js is available (handles WSL launch from Windows)
if ! command -v node &> /dev/null; then
    # Try common Node.js installation paths
    if [ -f "/c/Program Files/nodejs/node" ]; then
        export PATH="/c/Program Files/nodejs:$PATH"
    elif [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    else
        echo "❌ ERROR: Node.js not found in PATH"
        echo "   Please ensure Node.js is installed and available"
        exit 1
    fi
fi

echo "╔═══════════════════════════════════════════════╗"
echo "║           RAG Embedding Server                ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════
# Step 1: Ensure Qdrant is running
# ═══════════════════════════════════════════════════════════
echo "📦 Checking Qdrant vector database..."
if ! docker ps | grep -q chaycards-qdrant; then
    echo "   Starting Qdrant container..."
    docker-compose -f docker-compose.qdrant.yml up -d

    # Wait for Qdrant to be ready
    echo "   Waiting for Qdrant to initialize..."
    until curl -s http://localhost:6333/healthz > /dev/null 2>&1; do
        sleep 1
    done
    echo "   ✅ Qdrant started"
else
    echo "   ✅ Qdrant already running"
fi

# ═══════════════════════════════════════════════════════════
# Step 2: Initialize Qdrant collection (if needed)
# ═══════════════════════════════════════════════════════════
echo ""
echo "🔧 Checking Qdrant collection..."

# Check if collection exists
COLLECTION_EXISTS=$(curl -s http://localhost:6333/collections/chaycards-patterns 2>/dev/null | grep -c "chaycards-patterns" || echo "0")

if [ "$COLLECTION_EXISTS" -eq "0" ]; then
    echo "   Creating collection..."
    node memory-bank/scripts/qdrant-client.js init
    echo "   ✅ Collection initialized"
else
    echo "   ✅ Collection already exists"
fi

# ═══════════════════════════════════════════════════════════
# Step 3: Setup Python environment (if needed)
# ═══════════════════════════════════════════════════════════
echo ""
echo "🐍 Checking Python environment..."

# Use python instead of python3 (handles conda/miniconda environments)
PYTHON_CMD="python"
if ! command -v python &> /dev/null; then
    PYTHON_CMD="python3"
fi

if [ ! -d "venv-embedding" ]; then
    echo "   Creating virtual environment..."
    $PYTHON_CMD -m venv venv-embedding

    # Handle both Unix (bin/) and Windows (Scripts/) venv layouts
    if [ -f "venv-embedding/Scripts/activate" ]; then
        source venv-embedding/Scripts/activate
    else
        source venv-embedding/bin/activate
    fi

    echo "   Installing dependencies..."
    pip install --quiet --upgrade pip
    pip install --quiet -r memory-bank/scripts/requirements-embedding.txt

    echo "   Downloading embedding model (one-time, ~500MB)..."
    $PYTHON_CMD << 'EOF'
from sentence_transformers import SentenceTransformer
import torch
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"   Device: {device}")
if device == 'cuda':
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
model = SentenceTransformer('BAAI/bge-large-en-v1.5', device=device)
print("   ✅ Model cached")
EOF
else
    echo "   ✅ Virtual environment exists"
fi

# ═══════════════════════════════════════════════════════════
# Step 4: Embed initial patterns (if needed)
# ═══════════════════════════════════════════════════════════
echo ""
echo "📚 Checking pattern embeddings..."

# Check if any documents are embedded
DOC_COUNT=$(curl -s http://localhost:6333/collections/chaycards-patterns 2>/dev/null | grep -o '"points_count":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$DOC_COUNT" -eq "0" ]; then
    echo "   Embedding patterns (one-time setup)..."
    echo "   This will take ~30 seconds..."

    # Activate venv and run embedding
    if [ -f "venv-embedding/Scripts/activate" ]; then
        source venv-embedding/Scripts/activate
    else
        source venv-embedding/bin/activate
    fi

    # Start embedding server in background temporarily
    $PYTHON_CMD memory-bank/scripts/embedding-server.py > /tmp/embedding-server.log 2>&1 &
    EMBED_SERVER_PID=$!

    # Wait for server to start
    sleep 3

    # Embed patterns
    node memory-bank/scripts/embed-patterns.js

    # Stop temporary server and wait for port to be released
    kill $EMBED_SERVER_PID 2>/dev/null || true
    sleep 1

    echo "   ✅ Patterns embedded (check stats for count)"
else
    echo "   ✅ Patterns already embedded ($DOC_COUNT documents)"
fi

# ═══════════════════════════════════════════════════════════
# Step 5: Start embedding server
# ═══════════════════════════════════════════════════════════
echo ""
echo "🚀 Starting embedding server on port 8765..."
echo "   Model: BAAI/bge-large-en-v1.5"
echo "   Endpoint: http://localhost:8765"
echo ""
echo "🎯 RAG system is ready!"
echo "   Pattern reminders will be injected on every Claude Code prompt"
echo ""

# Activate venv and start server (foreground)
if [ -f "venv-embedding/Scripts/activate" ]; then
    source venv-embedding/Scripts/activate
else
    source venv-embedding/bin/activate
fi
$PYTHON_CMD memory-bank/scripts/embedding-server.py
