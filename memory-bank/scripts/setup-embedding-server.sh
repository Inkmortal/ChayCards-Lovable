#!/bin/bash
set -e

echo "🚀 Setting up embedding server (4090 GPU)..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi

# Check if CUDA is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "⚠️  CUDA/nvidia-smi not found - will run on CPU (slow!)"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv-embedding" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv-embedding
fi

# Activate virtual environment
source venv-embedding/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r memory-bank/scripts/requirements-embedding.txt

# Download model (will cache for future use)
echo "⬇️  Downloading BAAI/bge-large-en-v1.5 model..."
python3 << EOF
from sentence_transformers import SentenceTransformer
import torch

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Device: {device}")

if device == 'cuda':
    print(f"GPU: {torch.cuda.get_device_name(0)}")

print("Downloading model...")
model = SentenceTransformer('BAAI/bge-large-en-v1.5', device=device)
print("✓ Model downloaded and cached")
EOF

echo "✨ Embedding server setup complete!"
echo "📝 To start server: ./memory-bank/scripts/start-embedding-server.sh"
