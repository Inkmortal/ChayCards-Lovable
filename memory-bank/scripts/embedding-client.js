/**
 * Embedding Client - Connect to GPU embedding server
 * Generates 1024-dim vectors using BAAI/bge-large-en-v1.5
 */

import fetch from 'node-fetch';

const EMBEDDING_SERVER_URL = 'http://localhost:8765';

/**
 * Check if embedding server is healthy
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${EMBEDDING_SERVER_URL}/health`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Embedding server not available: ${error.message}`);
  }
}

/**
 * Generate embedding for single text
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 1024-dimensional embedding vector
 */
export async function embed(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  try {
    const response = await fetch(`${EMBEDDING_SERVER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Embedding server not running. Start it with: ./scripts/start-embedding-server.sh');
    }
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 * More efficient than calling embed() multiple times
 *
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of 1024-dimensional embedding vectors
 */
export async function embedBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array of strings');
  }

  try {
    const response = await fetch(`${EMBEDDING_SERVER_URL}/embed-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.embeddings;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Embedding server not running. Start it with: ./scripts/start-embedding-server.sh');
    }
    throw error;
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'health':
        const health = await checkHealth();
        console.log('✓ Embedding server is healthy');
        console.log(`  Model: ${health.model}`);
        console.log(`  Device: ${health.device}`);
        console.log(`  Dimension: ${health.dimension}`);
        break;

      case 'test':
        console.log('Testing single embedding...');
        const vector = await embed('This is a test sentence');
        console.log(`✓ Generated ${vector.length}-dimensional vector`);
        console.log(`  First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

        console.log('\nTesting batch embedding...');
        const vectors = await embedBatch([
          'First test sentence',
          'Second test sentence',
          'Third test sentence'
        ]);
        console.log(`✓ Generated ${vectors.length} vectors of ${vectors[0].length} dimensions`);
        break;

      default:
        console.log('Usage: node embedding-client.js [health|test]');
        console.log('  health - Check server health');
        console.log('  test   - Test embedding generation');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
