#!/usr/bin/env python3
"""
Embedding Server - GPU-accelerated semantic embeddings
Runs on 4090 GPU with BAAI/bge-large-en-v1.5
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Union
import uvicorn
import torch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = 'BAAI/bge-large-en-v1.5'
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
PORT = 8765

# Initialize FastAPI
app = FastAPI(title="ChayCards Embedding Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model = None

class EmbedRequest(BaseModel):
    text: str

class EmbedBatchRequest(BaseModel):
    texts: List[str]

class EmbedResponse(BaseModel):
    embedding: List[float]
    dimension: int

class EmbedBatchResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    count: int

@app.on_event("startup")
async def load_model():
    """Load model on startup"""
    global model
    logger.info(f"Loading model {MODEL_NAME} on device: {DEVICE}")

    model = SentenceTransformer(MODEL_NAME, device=DEVICE)

    # Warm up with test embedding
    _ = model.encode(["test"], convert_to_numpy=True)

    logger.info(f"✓ Model loaded successfully on {DEVICE}")
    if DEVICE == 'cuda':
        logger.info(f"  GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "device": DEVICE,
        "dimension": 1024
    }

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """
    Generate embedding for a single text

    Returns:
        - embedding: 1024-dimensional vector
        - dimension: Vector dimension (1024)
    """
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")

        # Generate embedding
        embedding = model.encode(
            [request.text],
            convert_to_numpy=True,
            normalize_embeddings=True  # Normalize for cosine similarity
        )[0]

        return EmbedResponse(
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )

    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed-batch", response_model=EmbedBatchResponse)
async def embed_batch(request: EmbedBatchRequest):
    """
    Generate embeddings for multiple texts (batch processing)
    More efficient than calling /embed multiple times

    Returns:
        - embeddings: List of 1024-dimensional vectors
        - dimension: Vector dimension (1024)
        - count: Number of embeddings generated
    """
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")

        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        # Generate embeddings in batch
        embeddings = model.encode(
            request.texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=32  # Process in batches of 32
        )

        return EmbedBatchResponse(
            embeddings=[emb.tolist() for emb in embeddings],
            dimension=len(embeddings[0]),
            count=len(embeddings)
        )

    except Exception as e:
        logger.error(f"Batch embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info(f"Starting embedding server on port {PORT}...")
    logger.info(f"Device: {DEVICE}")

    if DEVICE == 'cpu':
        logger.warning("⚠️  CUDA not available - running on CPU (slow!)")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )
