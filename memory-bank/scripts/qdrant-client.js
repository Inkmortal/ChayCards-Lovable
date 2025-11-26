/**
 * Qdrant Vector Database Client
 * Manages pattern and documentation storage/retrieval
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const QDRANT_URL = 'http://localhost:6333';
const COLLECTION_NAME = 'chaycards_patterns';
const VECTOR_SIZE = 1024; // BAAI/bge-large-en-v1.5 dimension
const TIMEOUT_MS = 300000; // 5 minutes

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs/1000}s`);
    }
    throw error;
  }
}

/**
 * Initialize collection with proper schema
 */
export async function initCollection() {
  // Check if collection exists
  const existsResponse = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);

  if (existsResponse.ok) {
    console.log(`✓ Collection '${COLLECTION_NAME}' already exists`);
    return;
  }

  // Create collection
  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine'
      },
      optimizers_config: {
        indexing_threshold: 10000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create collection: ${await response.text()}`);
  }

  console.log(`✓ Created collection '${COLLECTION_NAME}'`);
}

/**
 * Upsert document with embedding
 *
 * @param {Object} doc - Document to upsert
 * @param {string} doc.id - Unique document ID (auto-generated from path if not provided)
 * @param {number[]} doc.vector - 1024-dim embedding vector
 * @param {Object} doc.payload - Metadata and content
 * @param {string} doc.payload.path - File path (required)
 * @param {string} doc.payload.text - Full text content
 * @param {string} doc.payload.type - Document type (pattern, documentation, reminder, etc.)
 * @param {string} doc.payload.category - Category (storage, plugins, documents, etc.)
 * @param {string} doc.payload.title - Document title
 */
export async function upsertDocument(doc) {
  const id = doc.id || generateIdFromPath(doc.payload.path);

  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [{
        id,
        vector: doc.vector,
        payload: {
          ...doc.payload,
          updated_at: new Date().toISOString()
        }
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert document: ${await response.text()}`);
  }

  return id;
}

/**
 * Batch upsert documents
 */
export async function upsertDocuments(docs) {
  const points = docs.map(doc => ({
    id: doc.id || generateIdFromPath(doc.payload.path),
    vector: doc.vector,
    payload: {
      ...doc.payload,
      updated_at: new Date().toISOString()
    }
  }));

  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points })
  });

  if (!response.ok) {
    throw new Error(`Failed to batch upsert: ${await response.text()}`);
  }

  return points.map(p => p.id);
}

/**
 * Search for similar documents
 *
 * @param {number[]} vector - Query vector (1024-dim)
 * @param {number} limit - Number of results (default 30)
 * @param {Object} filter - Optional Qdrant filter
 * @returns {Promise<Array>} Similar documents with scores
 */
export async function search(vector, limit = 30, filter = null) {
  const body = {
    vector,
    limit,
    with_payload: true,
    with_vector: false
  };

  if (filter) {
    body.filter = filter;
  }

  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.result.map(r => ({
    id: r.id,
    score: r.score,
    ...r.payload
  }));
}

/**
 * Delete document by ID
 */
export async function deleteDocument(id) {
  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [id]
    })
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${await response.text()}`);
  }
}

/**
 * Delete documents by file path
 */
export async function deleteByPath(path) {
  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: {
        must: [{
          key: 'path',
          match: { value: path }
        }]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Delete by path failed: ${await response.text()}`);
  }
}

/**
 * Clear entire collection
 */
export async function clearCollection() {
  // Delete collection
  await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
    method: 'DELETE'
  });

  // Recreate collection
  await initCollection();

  console.log(`✓ Cleared collection '${COLLECTION_NAME}'`);
}

/**
 * Get collection stats
 */
export async function getStats() {
  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);

  if (!response.ok) {
    throw new Error(`Failed to get stats: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    vectors_count: data.result.vectors_count,
    points_count: data.result.points_count,
    status: data.result.status
  };
}

/**
 * Get all documents from collection
 * Uses scroll API to retrieve all points with their payloads
 */
export async function getAllDocuments() {
  const response = await fetchWithTimeout(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 10000,
      with_payload: true,
      with_vector: false
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get all documents: ${await response.text()}`);
  }

  const data = await response.json();
  return data.result.points.map(point => ({
    id: point.id,
    ...point.payload
  }));
}

/**
 * Generate deterministic ID from file path
 */
function generateIdFromPath(path) {
  return crypto.createHash('md5').update(path).digest('hex');
}

export { generateIdFromPath };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await initCollection();
      break;

    case 'stats':
      const stats = await getStats();
      console.log('📊 Collection Stats:');
      console.log(`  Points: ${stats.points_count}`);
      console.log(`  Vectors: ${stats.vectors_count}`);
      console.log(`  Status: ${stats.status}`);
      break;

    case 'clear':
      await clearCollection();
      break;

    default:
      console.log('Usage: node qdrant-client.js [init|stats|clear]');
  }
}
