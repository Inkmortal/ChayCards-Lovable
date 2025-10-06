/**
 * ChayCards Storage API Server
 *
 * PostgreSQL-backed REST API for cloud storage
 * Provides key-value storage with JSONB support
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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

// CORS: Allow specific domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow Lovable domains
    if (origin.endsWith('.lovable.app') ||
        origin.endsWith('.lovable.dev') ||
        origin.endsWith('.lovableproject.com')) {
      return callback(null, true);
    }

    // Allow configured origins
    if (corsOrigins.includes(origin)) return callback(null, true);

    // Reject other origins (but don't throw error - just deny)
    console.warn('[CORS] Rejected origin:', origin);
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json());

// Initialize database tables
(async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Storage table (now with user_id foreign key)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (key, user_id)
      )
    `);

    // Create index for faster user_id lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_storage_user_id ON storage(user_id)
    `);

    console.log('✓ Database tables initialized (users, storage)');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  }
})();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // { id, username }
    next();
  });
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const storageResult = await pool.query('SELECT COUNT(*) as count FROM storage');

    res.json({
      status: 'ok',
      database: 'PostgreSQL',
      users: parseInt(userResult.rows[0].count),
      keys: parseInt(storageResult.rows[0].count),
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Trim whitespace and normalize username
    const trimmedUsername = username?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    // Validation
    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (trimmedPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if username exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [trimmedUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [trimmedUsername, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Trim whitespace and normalize username
    const trimmedUsername = username?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    // Validation
    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
      [trimmedUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(trimmedPassword, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get value by key (user-scoped)
app.get('/api/storage/:key', authenticateToken, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT value FROM storage WHERE key = $1 AND user_id = $2',
      [key, userId]
    );

    // pg library automatically converts JSONB to JavaScript object
    const value = result.rows[0]?.value || null;
    res.json({ value });
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set value for key (user-scoped)
app.put('/api/storage/:key', authenticateToken, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { value } = req.body;
    const userId = req.user.id;

    if (value === undefined) {
      return res.status(400).json({ error: 'Missing value in request body' });
    }

    // Convert value to JSONB format - pg library needs pre-stringified JSON for JSONB columns
    // Objects/arrays work automatically, but primitives (strings, numbers, booleans) need JSON.stringify
    const jsonbValue = JSON.stringify(value);

    await pool.query(
      `INSERT INTO storage (key, value, user_id, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key, user_id) DO UPDATE SET
         value = $2::jsonb,
         updated_at = NOW()`,
      [key, jsonbValue, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete value by key (user-scoped)
app.delete('/api/storage/:key', authenticateToken, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM storage WHERE key = $1 AND user_id = $2',
      [key, userId]
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

// List keys (with optional prefix filter) (user-scoped)
app.get('/api/storage', authenticateToken, async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    const pattern = prefix ? `${prefix}%` : '%';
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT key FROM storage WHERE key LIKE $1 AND user_id = $2 ORDER BY key',
      [pattern, userId]
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

// Clear all storage for user (user-scoped)
app.delete('/api/storage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query('DELETE FROM storage WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      cleared: result.rowCount
    });
  } catch (error) {
    console.error('CLEAR error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all users (for demo/admin purposes)
// NOTE: In production, this should be restricted to admin users only
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        username,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM storage WHERE user_id = users.id) as storage_key_count
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      profileName: user.username, // Map to match Electron API structure
      storageMode: 'cloud', // PostgreSQL users are always cloud
      hasPassword: true, // All PostgreSQL users have passwords
      createdAt: Math.floor(new Date(user.created_at).getTime() / 1000), // Convert to Unix timestamp
      lastUsedAt: Math.floor(new Date(user.updated_at).getTime() / 1000), // Use updated_at as proxy
      storageKeyCount: parseInt(user.storage_key_count)
    }));

    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
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
  GET    /api/users           - List all users (auth required)
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