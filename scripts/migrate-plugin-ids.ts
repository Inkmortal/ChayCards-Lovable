/**
 * Migration script: Update plugin IDs to author/plugin-name format
 *
 * This script migrates the plugin system to use the new naming format:
 * - Old: 'core-theme', 'theme-catppuccin'
 * - New: 'chaycards/core-theme', 'chaycards/theme-catppuccin'
 *
 * It also converts the old `requires` array to the new `dependencies.requires` format.
 */

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

// Plugin ID mapping: old → new
const ID_MAPPING: Record<string, string> = {
  'core-settings': 'chaycards/core-settings',
  'core-theme': 'chaycards/core-theme',
  'core-ui': 'chaycards/core-ui',
  'core-documents': 'chaycards/core-documents',
  'core-flashcards': 'chaycards/core-flashcards',
  'theme-catppuccin': 'chaycards/theme-catppuccin',
  'theme-dracula': 'chaycards/theme-dracula',
  'theme-gruvbox': 'chaycards/theme-gruvbox',
  'theme-tokyonight': 'chaycards/theme-tokyonight',
  'theme-chay': 'chaycards/theme-chay',
  'demo-plugin': 'chaycards/demo-plugin',
};

async function migratePluginFiles() {
  console.log('📝 Migrating plugin files...');

  const pluginDirs = await fs.readdir('src/plugins');
  let successCount = 0;
  let skipCount = 0;

  for (const dir of pluginDirs) {
    const indexPath = path.join('src/plugins', dir, 'index.ts');

    try {
      // Check if file exists
      await fs.access(indexPath);

      let content = await fs.readFile(indexPath, 'utf-8');
      let modified = false;

      // Update plugin ID
      for (const [oldId, newId] of Object.entries(ID_MAPPING)) {
        const idPattern = new RegExp(`id:\\s*['"]${oldId}['"]`, 'g');
        if (idPattern.test(content)) {
          content = content.replace(idPattern, `id: '${newId}'`);
          modified = true;
        }
      }

      // Convert requires array to dependencies.requires
      const requiresPattern = /requires:\s*\[(.*?)\]/gs;
      if (requiresPattern.test(content)) {
        content = content.replace(requiresPattern, (match, deps) => {
          const depArray = deps.match(/['"][^'"]+['"]/g) || [];

          if (depArray.length === 0) {
            return 'dependencies: {}';
          }

          const converted = depArray.map((dep: string) => {
            const cleanDep = dep.replace(/['"]/g, '');
            const newDep = ID_MAPPING[cleanDep] || cleanDep;
            return `      '${newDep}': '^1.0.0'`;
          }).join(',\n');

          return `dependencies: {\n    requires: {\n${converted}\n    }\n  }`;
        });
        modified = true;
      }

      // Add author field if missing
      if (!content.includes('author:') && !content.includes('author =')) {
        const versionPattern = /(version:\s*['"][^'"]+['"],?)/;
        if (versionPattern.test(content)) {
          content = content.replace(
            versionPattern,
            `$1\n  author: {\n    username: 'chaycards',\n    displayName: 'ChayCards Team'\n  },`
          );
          modified = true;
        }
      }

      if (modified) {
        await fs.writeFile(indexPath, content, 'utf-8');
        console.log(`  ✅ Migrated ${dir}/index.ts`);
        successCount++;
      } else {
        console.log(`  ⏭️  Skipped ${dir}/index.ts (already migrated)`);
        skipCount++;
      }
    } catch (error: any) {
      console.warn(`  ⚠️  Skipped ${dir}: ${error.message}`);
      skipCount++;
    }
  }

  console.log(`\n  Summary: ${successCount} migrated, ${skipCount} skipped\n`);
}

async function migrateConstants() {
  console.log('📝 Migrating constants.ts...');

  const constantsPath = 'src/shared/constants.ts';

  try {
    let content = await fs.readFile(constantsPath, 'utf-8');
    let modified = false;

    // Update CORE_PLUGINS array
    for (const [oldId, newId] of Object.entries(ID_MAPPING)) {
      const pattern = new RegExp(`['"]${oldId}['"]`, 'g');
      if (pattern.test(content)) {
        content = content.replace(pattern, `'${newId}'`);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(constantsPath, content, 'utf-8');
      console.log('  ✅ Migrated constants.ts\n');
    } else {
      console.log('  ⏭️  Skipped constants.ts (already migrated)\n');
    }
  } catch (error: any) {
    console.error(`  ❌ Failed to migrate constants.ts: ${error.message}\n`);
    throw error;
  }
}

async function migrateDatabase() {
  console.log('💾 Migrating database...');

  // PostgreSQL
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      database: process.env.DB_NAME || 'chaycards',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    // Build CASE statement for all mappings
    const caseStatements = Object.entries(ID_MAPPING)
      .map(([oldId, newId]) => `WHEN value::text = '"${oldId}"' THEN '"${newId}"'`)
      .join('\n            ');

    const result = await pool.query(`
      UPDATE users
      SET enabled_plugins = (
        SELECT jsonb_agg(
          CASE
            ${caseStatements}
            ELSE value
          END
        )
        FROM jsonb_array_elements(enabled_plugins)
      )
      WHERE enabled_plugins IS NOT NULL
    `);

    await pool.end();

    console.log(`  ✅ PostgreSQL: Migrated ${result.rowCount} user records`);
  } catch (error: any) {
    console.warn(`  ⚠️  PostgreSQL migration skipped: ${error.message}`);
    console.warn(`     This is OK if database doesn't exist yet or you're not using PostgreSQL`);
  }

  // SQLite (Electron)
  try {
    const Database = require('better-sqlite3');
    const appDataPath = process.env.APPDATA || process.env.HOME;
    const dbPath = path.join(appDataPath!, 'chaycards', 'data.db');

    // Check if SQLite database exists
    try {
      await fs.access(dbPath);
    } catch {
      console.log(`  ⏭️  SQLite: Database not found at ${dbPath} (skipped)\n`);
      return;
    }

    const db = new Database(dbPath);

    const users = db.prepare('SELECT id, enabled_plugins FROM users').all();
    let updatedCount = 0;

    for (const user of users) {
      if (user.enabled_plugins) {
        try {
          const plugins = JSON.parse(user.enabled_plugins);
          const migrated = plugins.map((id: string) => ID_MAPPING[id] || id);

          db.prepare('UPDATE users SET enabled_plugins = ? WHERE id = ?')
            .run(JSON.stringify(migrated), user.id);

          updatedCount++;
        } catch (error: any) {
          console.warn(`    ⚠️  Failed to migrate user ${user.id}: ${error.message}`);
        }
      }
    }

    db.close();
    console.log(`  ✅ SQLite: Migrated ${updatedCount} user records\n`);
  } catch (error: any) {
    console.warn(`  ⚠️  SQLite migration skipped: ${error.message}`);
    console.warn(`     This is OK if you're not using Electron or the database doesn't exist yet\n`);
  }
}

async function main() {
  console.log('🚀 Starting plugin ID migration...\n');
  console.log('This will migrate plugins from old format to new format:');
  console.log('  Old: core-theme → New: chaycards/core-theme\n');

  try {
    await migratePluginFiles();
    await migrateConstants();
    await migrateDatabase();

    console.log('✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Test: npm run dev');
    console.log('  3. Commit: git add -A && git commit -m "chore: migrate plugin IDs to author/plugin-name format"');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nRollback: git checkout -- .');
    process.exit(1);
  }
}

main();
