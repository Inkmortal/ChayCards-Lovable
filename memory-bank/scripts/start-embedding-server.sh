#!/bin/bash
set -e

echo "🚀 Starting embedding server on port 8765..."

# Check if virtual environment exists
if [ ! -d "venv-embedding" ]; then
    echo "❌ Virtual environment not found. Run ./memory-bank/scripts/setup-embedding-server.sh first"
    exit 1
fi

# Activate virtual environment
source venv-embedding/bin/activate

# Start server
python3 memory-bank/scripts/embedding-server.py
