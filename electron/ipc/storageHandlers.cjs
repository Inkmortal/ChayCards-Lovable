const { ipcMain, app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Register storage IPC handlers
 * Provides key-value storage with user scoping
 * Now supports binary file storage as entity properties
 *
 * @param {Database} db - The initialized SQLite database connection
 */
function registerStorageHandlers(db) {
  // Storage IPC handlers (user-scoped)
  // Note: For local profiles, we get the current user from the users table
  ipcMain.handle('storage:get', (event, key) => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return null;
    }

    // Get data
    const row = db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);

    if (!row) return null;

    // Get attached files
    const fileRows = db.prepare(
      'SELECT field_name, hash FROM files WHERE storage_key = ? AND user_id = ?'
    ).all(key, currentUser.id);

    const files = {};
    const filesDir = path.join(app.getPath('userData'), 'files');

    for (const fileRow of fileRows) {
      const filePath = path.join(filesDir, fileRow.hash);
      try {
        if (fs.existsSync(filePath)) {
          files[fileRow.field_name] = fs.readFileSync(filePath);
        } else {
          console.error(`[storage:get] File not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`[storage:get] Failed to read file ${fileRow.hash}:`, err);
      }
    }

    return {
      data: JSON.parse(row.value),
      files
    };
  });

  ipcMain.handle('storage:set', (event, key, value, files) => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      throw new Error('No local user found');
    }

    // Store data
    const serialized = JSON.stringify(value);
    db.prepare(`
      INSERT INTO storage (key, value, user_id, updated_at)
      VALUES (?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(key, user_id) DO UPDATE SET
        value = excluded.value,
        updated_at = strftime('%s', 'now')
    `).run(key, serialized, currentUser.id);

    // Handle files if provided
    if (files && typeof files === 'object') {
      const filesDir = path.join(app.getPath('userData'), 'files');

      // Ensure files directory exists
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }

      // Process each file
      for (const [fieldName, fileData] of Object.entries(files)) {
        if (fileData === null) {
          // Delete file record
          db.prepare('DELETE FROM files WHERE storage_key = ? AND field_name = ? AND user_id = ?')
            .run(key, fieldName, currentUser.id);
        } else if (fileData instanceof Uint8Array || Buffer.isBuffer(fileData)) {
          // Calculate SHA-256 hash
          const hash = crypto.createHash('sha256').update(fileData).digest('hex');
          const filePath = path.join(filesDir, hash);

          // Write file to disk (deduplicated by hash)
          try {
            if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, fileData);
            }

            // Store file metadata
            db.prepare(`
              INSERT INTO files (storage_key, field_name, hash, user_id, updated_at)
              VALUES (?, ?, ?, ?, strftime('%s', 'now'))
              ON CONFLICT(storage_key, field_name, user_id) DO UPDATE SET
                hash = excluded.hash,
                updated_at = strftime('%s', 'now')
            `).run(key, fieldName, hash, currentUser.id);
          } catch (err) {
            console.error(`[storage:set] Failed to write file ${hash}:`, err);
            throw new Error(`Failed to store file: ${err.message}`);
          }
        }
      }
    }

    return true;
  });

  ipcMain.handle('storage:delete', (event, key) => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return false;
    }

    db.prepare('DELETE FROM storage WHERE key = ? AND user_id = ?').run(key, currentUser.id);
    return true;
  });

  ipcMain.handle('storage:list', (event, prefix) => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return [];
    }

    const rows = prefix
      ? db.prepare('SELECT key FROM storage WHERE key LIKE ? AND user_id = ?').all(`${prefix}%`, currentUser.id)
      : db.prepare('SELECT key FROM storage WHERE user_id = ?').all(currentUser.id);
    return rows.map(row => row.key);
  });

  ipcMain.handle('storage:clear', () => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return 0;
    }

    const result = db.prepare('DELETE FROM storage WHERE user_id = ?').run(currentUser.id);
    return result.changes;
  });

  ipcMain.handle('storage:has', (event, key) => {
    // Get current user ID (most recently used)
    const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return false;
    }

    const row = db.prepare('SELECT 1 FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);
    return !!row;
  });
}

module.exports = { registerStorageHandlers };
