
const { ipcMain } = require('electron');

/**
 * Register user management IPC handlers
 * Manages local user profiles and authentication
 *
 * @param {Database} db - The initialized SQLite database connection
 */
function registerUserHandlers(db) {
  ipcMain.handle('user:create', (event, userData) => {
    const { id, profileName, storageMode = 'local', hasPassword, passwordHash } = userData;
    db.prepare(`
      INSERT INTO users (id, profile_name, storage_mode, has_password, password_hash, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
    `).run(id, profileName, storageMode, hasPassword ? 1 : 0, passwordHash);
    return true;
  });

  ipcMain.handle('user:exists', (event, profileName) => {
    const row = db.prepare('SELECT id FROM users WHERE profile_name = ?').get(profileName);
    return !!row;
  });

  ipcMain.handle('user:get', (event, userId) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return row ? {
      id: row.id,
      profileName: row.profile_name,
      storageMode: row.storage_mode,
      hasPassword: row.has_password === 1,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at
    } : null;
  });

  ipcMain.handle('user:list', () => {
    const rows = db.prepare('SELECT * FROM users ORDER BY last_used_at DESC').all();
    return rows.map(row => ({
      id: row.id,
      profileName: row.profile_name,
      storageMode: row.storage_mode,
      hasPassword: row.has_password === 1,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at
    }));
  });

  ipcMain.handle('user:setActive', (event, userId) => {
    db.prepare(`
      UPDATE users SET last_used_at = strftime('%s', 'now') WHERE id = ?
    `).run(userId);
    return true;
  });

  ipcMain.handle('user:getCurrent', () => {
    // Get the first (and only) local user
    const row = db.prepare('SELECT * FROM users LIMIT 1').get();
    return row ? {
      id: row.id,
      profileName: row.profile_name,
      hasPassword: row.has_password === 1,
      createdAt: row.created_at
    } : null;
  });
}

module.exports = { registerUserHandlers };
