
const { ipcMain } = require('electron');

// Default plugins for new users (sync with src/shared/constants.ts)
const DEFAULT_PLUGINS = [
  'core-settings',
  'core-theme',
  'core-ui',
  'core-documents',
  'theme-catppuccin',
  'theme-dracula',
  'theme-gruvbox',
  'theme-tokyonight',
  'theme-chay',
  'demo-plugin',
];

/**
 * Register user management IPC handlers
 * Manages local user profiles and authentication
 *
 * @param {Database} db - The initialized SQLite database connection
 */
function registerUserHandlers(db) {
  ipcMain.handle('user:create', (event, userData) => {
    const { id, profileName, storageMode = 'local', hasPassword, passwordHash } = userData;
    const defaultPluginsJson = JSON.stringify(DEFAULT_PLUGINS);

    db.prepare(`
      INSERT INTO users (id, profile_name, storage_mode, has_password, password_hash, installed_plugins, enabled_plugins, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
    `).run(id, profileName, storageMode, hasPassword ? 1 : 0, passwordHash, defaultPluginsJson, defaultPluginsJson);
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
      lastUsedAt: row.last_used_at,
      installedPlugins: row.installed_plugins ? JSON.parse(row.installed_plugins) : [],
      enabledPlugins: row.enabled_plugins ? JSON.parse(row.enabled_plugins) : []
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
      lastUsedAt: row.last_used_at,
      installedPlugins: row.installed_plugins ? JSON.parse(row.installed_plugins) : [],
      enabledPlugins: row.enabled_plugins ? JSON.parse(row.enabled_plugins) : []
    }));
  });

  ipcMain.handle('user:setActive', (event, userId) => {
    db.prepare(`
      UPDATE users SET last_used_at = strftime('%s', 'now') WHERE id = ?
    `).run(userId);
    return true;
  });

  ipcMain.handle('user:getCurrent', () => {
    // Get the most recently used user
    const row = db.prepare('SELECT * FROM users ORDER BY last_used_at DESC LIMIT 1').get();
    return row ? {
      id: row.id,
      profileName: row.profile_name,
      hasPassword: row.has_password === 1,
      createdAt: row.created_at,
      installedPlugins: row.installed_plugins ? JSON.parse(row.installed_plugins) : [],
      enabledPlugins: row.enabled_plugins ? JSON.parse(row.enabled_plugins) : []
    } : null;
  });

  /**
   * Get plugin preferences for a user
   * Returns installed and enabled plugins
   * Matches the PostgreSQL endpoint: /api/users/me/plugins
   */
  ipcMain.handle('user:getPluginPreferences', (event, userId) => {
    const row = db.prepare('SELECT installed_plugins, enabled_plugins FROM users WHERE id = ?').get(userId);

    if (!row) {
      return null;
    }

    // Parse JSON arrays, default to empty arrays if null
    const installedPlugins = row.installed_plugins ? JSON.parse(row.installed_plugins) : [];
    const enabledPlugins = row.enabled_plugins ? JSON.parse(row.enabled_plugins) : [];

    return {
      installedPlugins,
      enabledPlugins
    };
  });
}

module.exports = { registerUserHandlers };
