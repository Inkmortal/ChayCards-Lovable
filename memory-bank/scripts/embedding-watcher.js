/**
 * Embedding Watcher - Background daemon
 * Watches memory-bank/patterns/ and memory-bank/docs/ for changes
 * Automatically re-embeds modified files
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { embed } from './embedding-client.js';
import { upsertDocument, deleteByPath } from './qdrant-client.js';

const MEMORY_BANK_ROOT = path.resolve('memory-bank');
const PATTERNS_DIR = path.join(MEMORY_BANK_ROOT, 'patterns');
const DOCS_DIR = path.join(MEMORY_BANK_ROOT, 'docs');

// Files to skip
const SKIP_FILES = [
  'activeContext.md',
  'progress.md',
  'coreInstructions.md',
  'README.md'
];

// Debounce timer for file changes
const DEBOUNCE_MS = 1000;
const pendingChanges = new Map();

/**
 * Parse pattern metadata from markdown
 */
function parseMetadata(content, filePath) {
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
 * Process and re-embed a single file
 */
async function processFile(filePath) {
  const basename = path.basename(filePath);
  if (SKIP_FILES.includes(basename)) {
    return;
  }

  const relativePath = path.relative(MEMORY_BANK_ROOT, filePath);

  try {
    // Check if file was deleted
    if (!fs.existsSync(filePath)) {
      console.log(`🗑️  Deleted: ${relativePath}`);
      await deleteByPath(relativePath);
      console.log(`   ✓ Removed from Qdrant`);
      return;
    }

    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = parseMetadata(content, filePath);

    // Determine type from directory
    const type = filePath.includes('/patterns/') ? 'pattern' : 'documentation';

    console.log(`🔄 ${relativePath}`);

    // Generate embedding
    const vector = await embed(content);

    // Upsert to Qdrant
    await upsertDocument({
      vector,
      payload: {
        path: relativePath,
        text: content,
        title: metadata.title,
        category: metadata.category,
        type: metadata.type || type,
        triggers: metadata.triggers,
        word_count: content.split(/\s+/).length
      }
    });

    console.log(`   ✓ Embedded (${metadata.category}/${metadata.type})`);

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
 * Start watching directories
 */
function startWatcher() {
  console.log('👁️  Embedding Watcher Started\n');
  console.log('Watching directories:');
  console.log(`  ${PATTERNS_DIR}`);
  console.log(`  ${DOCS_DIR}`);
  console.log();
  console.log('Press Ctrl+C to stop\n');

  const watcher = chokidar.watch([PATTERNS_DIR, DOCS_DIR], {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      if (path.extname(filePath) === '.md') {
        console.log(`📄 New file detected`);
        scheduleProcess(filePath);
      }
    })
    .on('change', filePath => {
      if (path.extname(filePath) === '.md') {
        scheduleProcess(filePath);
      }
    })
    .on('unlink', filePath => {
      if (path.extname(filePath) === '.md') {
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
if (import.meta.url === `file://${process.argv[1]}`) {
  startWatcher();
}

export { startWatcher };
