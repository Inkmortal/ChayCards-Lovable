
const { ipcMain } = require('electron');

/**
 * Register storage IPC handlers
 * Provides key-value storage with user scoping
 *
 * @param {Database} db - The initialized SQLite database connection
 */
function registerStorageHandlers(db) {
  // Storage IPC handlers (user-scoped)
  // Note: For local profiles, we get the current user from the users table
  ipcMain.handle('storage:get', (event, key) => {
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return null;
    }

    const row = db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);
    return row ? JSON.parse(row.value) : null;
  });

  ipcMain.handle('storage:set', (event, key, value) => {
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      throw new Error('No local user found');
    }

    const serialized = JSON.stringify(value);
    db.prepare(`
      INSERT INTO storage (key, value, user_id, updated_at)
      VALUES (?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(key, user_id) DO UPDATE SET
        value = excluded.value,
        updated_at = strftime('%s', 'now')
    `).run(key, serialized, currentUser.id);
    return true;
  });

  ipcMain.handle('storage:delete', (event, key) => {
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return false;
    }

    db.prepare('DELETE FROM storage WHERE key = ? AND user_id = ?').run(key, currentUser.id);
    return true;
  });

  ipcMain.handle('storage:list', (event, prefix) => {
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
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
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return 0;
    }

    const result = db.prepare('DELETE FROM storage WHERE user_id = ?').run(currentUser.id);
    return result.changes;
  });

  ipcMain.handle('storage:has', (event, key) => {
    // Get current user ID
    const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!currentUser) {
      console.error('No local user found for storage operation');
      return false;
    }

    const row = db.prepare('SELECT 1 FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);
    return !!row;
  });
}

module.exports = { registerStorageHandlers };
