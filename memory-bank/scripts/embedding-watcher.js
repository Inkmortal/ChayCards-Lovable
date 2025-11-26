/**
 * Embedding Watcher - Background daemon
 * Watches memory-bank/ and src/ for changes
 * Automatically re-embeds modified documentation AND source code files
 *
 * Watched directories:
 * - memory-bank/patterns/
 * - memory-bank/docs/
 * - memory-bank/tools/
 * - memory-bank/product-management/
 * - src/plugins/
 * - src/renderer/
 * - src/shared/
 * - src/utils/
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { embed } from './embedding-client.js';
import { upsertDocument, deleteByPath } from './qdrant-client.js';

const PROJECT_ROOT = path.resolve('.');
const MEMORY_BANK_ROOT = path.resolve('memory-bank');
const SRC_ROOT = path.resolve('src');

// Documentation directories to watch
const DOC_DIRS = [
  path.join(MEMORY_BANK_ROOT, 'patterns'),
  path.join(MEMORY_BANK_ROOT, 'docs'),
  path.join(MEMORY_BANK_ROOT, 'tools'),
  path.join(MEMORY_BANK_ROOT, 'product-management')
];

// Source code directories to watch
const CODE_DIRS = [
  path.join(SRC_ROOT, 'plugins'),
  path.join(SRC_ROOT, 'renderer'),
  path.join(SRC_ROOT, 'shared'),
  path.join(SRC_ROOT, 'utils')
];

// All directories to watch
const WATCH_DIRS = [...DOC_DIRS, ...CODE_DIRS].filter(dir => fs.existsSync(dir));

// Files to skip
const SKIP_FILES = [
  'activeContext.md',
  'progress.md',
  'coreInstructions.md',
  'README.md',
  'vite-env.d.ts'
];

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '__tests__',
  '__mocks__'
];

// Debounce timer for file changes
const DEBOUNCE_MS = 1000;
const pendingChanges = new Map();

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
  const basename = path.basename(filePath);

  // Skip specific files
  if (SKIP_FILES.some(skip => basename === skip || basename.endsWith(skip))) {
    return true;
  }

  // Skip files in certain directories
  if (SKIP_DIRS.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`))) {
    return true;
  }

  // Skip test files
  if (basename.includes('.test.') || basename.includes('.spec.')) {
    return true;
  }

  return false;
}

/**
 * Check if file is a source code file
 */
function isCodeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

/**
 * Check if file is a markdown file
 */
function isMarkdownFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.md';
}

/**
 * Parse metadata from markdown documentation
 */
function parseMarkdownMetadata(content, filePath) {
  const lines = content.split('\n');
  const metadata = {
    category: 'general',
    type: 'documentation',
    title: path.basename(filePath, '.md'),
    triggers: []
  };

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();

    if (line.startsWith('**Category:**')) {
      metadata.category = line.replace('**Category:**', '').trim().toLowerCase();
    } else if (line.startsWith('**Type:**')) {
      metadata.type = line.replace('**Type:**', '').trim().toLowerCase();
    } else if (line.startsWith('**Triggers:**')) {
      const triggers = line.replace('**Triggers:**', '').trim();
      metadata.triggers = triggers.split(',').map(t => t.trim()).filter(Boolean);
    } else if (line.startsWith('# ')) {
      metadata.title = line.replace('#', '').trim();
    }
  }

  return metadata;
}

/**
 * Extract metadata from TypeScript/JavaScript code files
 */
function extractCodeMetadata(content, filePath) {
  const metadata = {
    exports: [],
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    hooks: [],
    components: [],
    jsdoc: []
  };

  // Extract exports
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g);
  for (const match of exportMatches) {
    metadata.exports.push(match[1]);
  }

  // Extract function declarations
  const funcMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g);
  for (const match of funcMatches) {
    metadata.functions.push({ name: match[1], params: match[2].trim() });
  }

  // Extract arrow functions
  const arrowMatches = content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g);
  for (const match of arrowMatches) {
    const name = match[1];
    if (name.startsWith('use') && name[3] === name[3].toUpperCase()) {
      metadata.hooks.push(name);
    } else if (name[0] === name[0].toUpperCase() && /^[A-Z]/.test(name)) {
      metadata.components.push(name);
    } else {
      metadata.functions.push({ name, params: '' });
    }
  }

  // Extract classes
  const classMatches = content.matchAll(/(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g);
  for (const match of classMatches) {
    metadata.classes.push({ name: match[1], extends: match[2] || null });
  }

  // Extract interfaces
  const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)/g);
  for (const match of interfaceMatches) {
    metadata.interfaces.push(match[1]);
  }

  // Extract types
  const typeMatches = content.matchAll(/(?:export\s+)?type\s+(\w+)\s*=/g);
  for (const match of typeMatches) {
    metadata.types.push(match[1]);
  }

  // Extract JSDoc comments
  const jsdocMatches = content.matchAll(/\/\*\*[\s\S]*?\*\//g);
  for (const match of jsdocMatches) {
    const doc = match[0].slice(0, 500);
    if (doc.includes('@')) {
      metadata.jsdoc.push(doc);
    }
  }

  return metadata;
}

/**
 * Build embedding text for code files
 */
function buildCodeEmbeddingText(content, filePath, metadata) {
  const fileName = path.basename(filePath);
  const parts = [];

  parts.push(`File: ${fileName}`);
  parts.push(`Path: ${filePath}`);

  if (metadata.exports.length > 0) {
    parts.push(`Exports: ${metadata.exports.join(', ')}`);
  }
  if (metadata.components.length > 0) {
    parts.push(`React Components: ${metadata.components.join(', ')}`);
  }
  if (metadata.hooks.length > 0) {
    parts.push(`React Hooks: ${metadata.hooks.join(', ')}`);
  }
  if (metadata.classes.length > 0) {
    const classInfo = metadata.classes.map(c => c.extends ? `${c.name} extends ${c.extends}` : c.name).join(', ');
    parts.push(`Classes: ${classInfo}`);
  }
  if (metadata.interfaces.length > 0) {
    parts.push(`Interfaces: ${metadata.interfaces.join(', ')}`);
  }
  if (metadata.types.length > 0) {
    parts.push(`Types: ${metadata.types.join(', ')}`);
  }
  if (metadata.functions.length > 0) {
    const funcInfo = metadata.functions.slice(0, 10).map(f => f.params ? `${f.name}(${f.params})` : f.name).join(', ');
    parts.push(`Functions: ${funcInfo}`);
  }
  if (metadata.jsdoc.length > 0) {
    parts.push('\nDocumentation:');
    parts.push(metadata.jsdoc.slice(0, 3).join('\n'));
  }

  const codePreview = content.slice(0, 2000);
  parts.push('\nCode Preview:');
  parts.push(codePreview);

  return parts.join('\n');
}

/**
 * Process and re-embed a single file (markdown or source code)
 */
async function processFile(filePath) {
  // Check if should skip
  if (shouldSkipFile(filePath)) {
    return;
  }

  const relativePath = path.relative(PROJECT_ROOT, filePath);

  try {
    // Check if file was deleted
    if (!fs.existsSync(filePath)) {
      console.log(`🗑️  Deleted: ${relativePath}`);
      await deleteByPath(relativePath);
      console.log(`   ✓ Removed from Qdrant`);
      return;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    let payload;

    if (isMarkdownFile(filePath)) {
      // Process markdown documentation
      const metadata = parseMarkdownMetadata(content, filePath);
      const type = filePath.includes('/patterns/') ? 'pattern' : 'documentation';

      console.log(`🔄 [DOC] ${relativePath}`);

      const vector = await embed(content);

      payload = {
        path: relativePath,
        text: content,
        title: metadata.title,
        category: metadata.category,
        type: metadata.type || type,
        fileType: 'markdown',
        triggers: metadata.triggers,
        word_count: content.split(/\s+/).length,
        mtime: stats.mtimeMs
      };

      await upsertDocument({ vector, payload });
      console.log(`   ✓ Embedded (${metadata.category}/${metadata.type})`);

    } else if (isCodeFile(filePath)) {
      // Process source code
      const metadata = extractCodeMetadata(content, filePath);
      const embeddingText = buildCodeEmbeddingText(content, relativePath, metadata);

      // Determine category from path
      let category = 'source';
      if (relativePath.includes('plugins/')) {
        const pluginMatch = relativePath.match(/plugins[\\/]([^\\/]+)/);
        if (pluginMatch) {
          category = `plugin:${pluginMatch[1]}`;
        }
      } else if (relativePath.includes('renderer/')) {
        category = 'renderer';
      } else if (relativePath.includes('shared/')) {
        category = 'shared';
      } else if (relativePath.includes('utils/')) {
        category = 'utils';
      }

      console.log(`🔄 [CODE] ${relativePath}`);

      const vector = await embed(embeddingText);

      payload = {
        path: relativePath,
        text: embeddingText,
        fullContent: content,
        title: path.basename(filePath),
        category: category,
        type: 'source-code',
        fileType: path.extname(filePath).slice(1),
        exports: metadata.exports,
        components: metadata.components,
        hooks: metadata.hooks,
        classes: metadata.classes.map(c => c.name),
        interfaces: metadata.interfaces,
        types: metadata.types,
        functions: metadata.functions.map(f => f.name),
        word_count: content.split(/\s+/).length,
        mtime: stats.mtimeMs
      };

      await upsertDocument({ vector, payload });

      // Build a summary for logging
      const summary = [];
      if (metadata.components.length) summary.push(`${metadata.components.length} components`);
      if (metadata.hooks.length) summary.push(`${metadata.hooks.length} hooks`);
      if (metadata.exports.length) summary.push(`${metadata.exports.length} exports`);
      console.log(`   ✓ Embedded (${category}) ${summary.length ? `[${summary.join(', ')}]` : ''}`);
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Debounce file changes to avoid rapid re-processing
 */
function scheduleProcess(filePath) {
  // Clear existing timer
  if (pendingChanges.has(filePath)) {
    clearTimeout(pendingChanges.get(filePath));
  }

  // Schedule new processing
  const timer = setTimeout(() => {
    pendingChanges.delete(filePath);
    processFile(filePath);
  }, DEBOUNCE_MS);

  pendingChanges.set(filePath, timer);
}

/**
 * Check if file is a watched type
 */
function isWatchedFile(filePath) {
  return isMarkdownFile(filePath) || isCodeFile(filePath);
}

/**
 * Start watching directories
 */
function startWatcher() {
  console.log('👁️  Embedding Watcher Started\n');
  console.log('📂 Watching directories:');
  console.log('   Documentation:');
  DOC_DIRS.filter(d => fs.existsSync(d)).forEach(dir => {
    console.log(`     ${path.relative(PROJECT_ROOT, dir)}/`);
  });
  console.log('   Source Code:');
  CODE_DIRS.filter(d => fs.existsSync(d)).forEach(dir => {
    console.log(`     ${path.relative(PROJECT_ROOT, dir)}/`);
  });
  console.log();
  console.log('📝 Watching file types: .md, .ts, .tsx, .js, .jsx');
  console.log('⏱️  Debounce: 1000ms');
  console.log();
  console.log('Press Ctrl+C to stop\n');
  console.log('─'.repeat(50));
  console.log();

  const watcher = chokidar.watch(WATCH_DIRS, {
    ignored: [
      /(^|[\/\\])\../,           // Ignore dotfiles
      /node_modules/,
      /dist/,
      /coverage/,
      /__tests__/,
      /__mocks__/,
      /\.test\./,
      /\.spec\./
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      if (isWatchedFile(filePath) && !shouldSkipFile(filePath)) {
        const fileType = isCodeFile(filePath) ? 'CODE' : 'DOC';
        console.log(`📄 New ${fileType} file detected`);
        scheduleProcess(filePath);
      }
    })
    .on('change', filePath => {
      if (isWatchedFile(filePath) && !shouldSkipFile(filePath)) {
        scheduleProcess(filePath);
      }
    })
    .on('unlink', filePath => {
      if (isWatchedFile(filePath) && !shouldSkipFile(filePath)) {
        scheduleProcess(filePath);
      }
    })
    .on('error', error => {
      console.error('❌ Watcher error:', error);
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Run if called directly
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = resolve(process.argv[1]) === __filename;

if (isMainModule) {
  startWatcher();
}

export { startWatcher };
