
const Database = require('better-sqlite3');
const path = require('path');
const fssync = require('fs');
const { dialog } = require('electron');

/**
 * DatabaseManager - Handles SQLite database initialization and migrations
 *
 * Responsibilities:
 * - Creates and initializes SQLite database at app startup
 * - Manages database schema (users, storage tables)
 * - Handles database migrations
 * - Provides database connection to IPC handlers
 */
class DatabaseManager {
  constructor(app) {
    this.app = app;
    this.db = null;
  }

  /**
   * Initialize database connection, create tables, and run migrations
   * @returns {Database} The initialized SQLite database instance
   */
  initialize() {
    try {
      const userDataPath = this.app.getPath('userData');
      const dbPath = path.join(userDataPath, 'storage.db');

      // Ensure directory exists
      if (!fssync.existsSync(userDataPath)) {
        fssync.mkdirSync(userDataPath, { recursive: true });
      }

      this.db = new Database(dbPath);

      this._createTables();
      this._runMigrations();

      console.log('✓ SQLite database initialized at:', dbPath);
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      dialog.showErrorBox('Database Error', 'Failed to initialize SQLite database: ' + error.message);
      throw error;
    }
  }

  /**
   * Get the database connection
   * @returns {Database} The SQLite database instance
   * @throws {Error} If database is not initialized
   */
  getConnection() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('✓ Database closed');
      this.db = null;
    }
  }

  /**
   * Create database tables if they don't exist
   * @private
   */
  _createTables() {
    // Initialize users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        profile_name TEXT NOT NULL UNIQUE,
        storage_mode TEXT NOT NULL DEFAULT 'local',
        has_password INTEGER DEFAULT 0,
        password_hash TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        last_used_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Initialize storage table (with user_id for local user scoping)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        user_id TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (key, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster user_id lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_storage_user_id ON storage(user_id)
    `);
  }

  /**
   * Run database migrations
   * @private
   */
  _runMigrations() {
    // Migration: Add storage_mode column if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN storage_mode TEXT`);
      // Backfill existing rows with default value
      this.db.exec(`UPDATE users SET storage_mode = 'local' WHERE storage_mode IS NULL`);
      console.log('✓ Migrated storage_mode column');
    } catch (e) {
      // Column already exists, ignore
      if (!e.message.includes('duplicate column name')) {
        console.warn('Migration warning (storage_mode):', e.message);
      }
    }

    // Migration: Add last_used_at column if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN last_used_at INTEGER`);
      // Backfill existing rows with current timestamp
      this.db.exec(`UPDATE users SET last_used_at = strftime('%s', 'now') WHERE last_used_at IS NULL`);
      console.log('✓ Migrated last_used_at column');
    } catch (e) {
      // Column already exists, ignore
      if (!e.message.includes('duplicate column name')) {
        console.warn('Migration warning (last_used_at):', e.message);
      }
    }

    // Migration: Add UNIQUE constraint to profile_name
    // SQLite doesn't support ADD CONSTRAINT, so we need to recreate the table if constraint is missing
    try {
      // Check if UNIQUE constraint exists
      const tableInfo = this.db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
      if (tableInfo && !tableInfo.sql.includes('UNIQUE')) {
        console.log('⚠ Adding UNIQUE constraint to profile_name - recreating users table');

        // Create new table with UNIQUE constraint
        this.db.exec(`
          CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            profile_name TEXT NOT NULL UNIQUE,
            storage_mode TEXT NOT NULL DEFAULT 'local',
            has_password INTEGER DEFAULT 0,
            password_hash TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            last_used_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        `);

        // Copy data from old table, removing duplicates (keep first occurrence)
        this.db.exec(`
          INSERT INTO users_new (id, profile_name, storage_mode, has_password, password_hash, created_at, last_used_at)
          SELECT id, profile_name, storage_mode, has_password, password_hash, created_at, last_used_at
          FROM users
          WHERE id IN (
            SELECT MIN(id) FROM users GROUP BY profile_name
          )
        `);

        // Drop old table and rename new one
        this.db.exec(`DROP TABLE users`);
        this.db.exec(`ALTER TABLE users_new RENAME TO users`);

        console.log('✓ UNIQUE constraint added to profile_name');
      }
    } catch (e) {
      console.warn('Migration warning (UNIQUE constraint):', e.message);
    }
  }
}

module.exports = DatabaseManager;
