#!/usr/bin/env node

/**
 * Clear SQLite Database Script
 *
 * This script deletes the Electron SQLite database file.
 * Use this when you need to start fresh with an empty database.
 *
 * Usage:
 *   node scripts/clear-database.js
 *
 * IMPORTANT: Close Electron before running this script!
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine the database location based on OS and app name
function getDatabasePath() {
  const appName = 'chaycards'; // Must match package.json name
  const platform = os.platform();

  let userDataPath;

  if (platform === 'win32') {
    // Windows: C:\Users\USERNAME\AppData\Roaming\chaycards
    userDataPath = path.join(process.env.APPDATA || '', appName);
  } else if (platform === 'darwin') {
    // macOS: ~/Library/Application Support/chaycards
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', appName);
  } else {
    // Linux: ~/.config/chaycards
    userDataPath = path.join(os.homedir(), '.config', appName);
  }

  return path.join(userDataPath, 'storage.db');
}

function main() {
  const dbPath = getDatabasePath();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  ChayCards Database Clear Script');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Database location:', dbPath);
  console.log('');

  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.log('✓ Database file does not exist. Nothing to clear.');
    console.log('');
    return;
  }

  // Confirm before deleting
  console.log('⚠ WARNING: This will delete ALL local profiles and data!');
  console.log('');
  console.log('This action cannot be undone.');
  console.log('Make sure Electron is closed before proceeding.');
  console.log('');

  // Simple confirmation (no readline to avoid dependencies)
  console.log('To confirm deletion, set CONFIRM=yes environment variable:');
  console.log('  Windows: set CONFIRM=yes && node scripts/clear-database.js');
  console.log('  Linux/Mac: CONFIRM=yes node scripts/clear-database.js');
  console.log('');

  if (process.env.CONFIRM !== 'yes') {
    console.log('❌ Deletion cancelled. Set CONFIRM=yes to proceed.');
    console.log('');
    return;
  }

  try {
    // Delete the database file
    fs.unlinkSync(dbPath);
    console.log('✓ Database cleared successfully!');
    console.log('');
    console.log('Next time you start Electron:');
    console.log('  - A new database will be created');
    console.log('  - You will go through the setup flow again');
    console.log('  - All previous profiles and data will be gone');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to delete database:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('  - Electron app is still running (close it first)');
    console.log('  - Permission denied (try running as administrator)');
    console.log('  - File is locked by another process');
    console.log('');
    process.exit(1);
  }
}

main();
