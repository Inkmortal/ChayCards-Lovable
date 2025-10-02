/**
 * ChayCards Storage API Server
 *
 * PostgreSQL-backed REST API for cloud storage
 * Provides key-value storage with JSONB support
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:dev@localhost:5433/chaycards'
});

// Middleware
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:8080',    // Vite dev server
  'http://localhost:5173',    // Alternative dev port
  'https://chaycards.com',    // Production frontend
  'https://app.chaycards.com' // Production frontend (subdomain)
];

// Allow Lovable preview domains dynamically
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow Lovable preview domains (*.lovable.app)
    if (origin.endsWith('.lovable.app')) return callback(null, true);

    // Allow configured origins
    if (corsOrigins.includes(origin)) return callback(null, true);

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Initialize database table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Database table initialized');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  }
})();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM storage');
    const count = parseInt(result.rows[0].count);

    res.json({
      status: 'ok',
      database: 'PostgreSQL',
      keys: count,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get value by key
app.get('/api/storage/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const result = await pool.query(
      'SELECT value FROM storage WHERE key = $1',
      [key]
    );

    // pg library automatically converts JSONB to JavaScript object
    const value = result.rows[0]?.value || null;
    res.json({ value });
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set value for key
app.put('/api/storage/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Missing value in request body' });
    }

    // pg library automatically converts JavaScript object to JSONB
    await pool.query(
      `INSERT INTO storage (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = $2,
         updated_at = NOW()`,
      [key, value]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete value by key
app.delete('/api/storage/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const result = await pool.query(
      'DELETE FROM storage WHERE key = $1',
      [key]
    );

    res.json({
      success: true,
      deleted: result.rowCount > 0
    });
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List keys (with optional prefix filter)
app.get('/api/storage', async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    const pattern = prefix ? `${prefix}%` : '%';

    const result = await pool.query(
      'SELECT key FROM storage WHERE key LIKE $1 ORDER BY key',
      [pattern]
    );

    res.json({
      keys: result.rows.map(r => r.key),
      count: result.rows.length
    });
  } catch (error) {
    console.error('LIST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all storage
app.delete('/api/storage', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM storage');

    res.json({
      success: true,
      cleared: result.rowCount
    });
  } catch (error) {
    console.error('CLEAR error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 7243;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ChayCards Storage API Server         ║
╠════════════════════════════════════════╣
║  Status: Running                       ║
║  Port: ${PORT}                         ║
║  Database: PostgreSQL                  ║
╚════════════════════════════════════════╝

API Endpoints:
  GET    /api/health          - Health check
  GET    /api/storage/:key    - Get value
  PUT    /api/storage/:key    - Set value
  DELETE /api/storage/:key    - Delete value
  GET    /api/storage         - List keys (optional ?prefix=)
  DELETE /api/storage         - Clear all

Database Features:
  ✓ Native JSONB support
  ✓ Automatic type conversion
  ✓ Connection pooling
  ✓ PostgreSQL 15

Ready for requests!
  `);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);