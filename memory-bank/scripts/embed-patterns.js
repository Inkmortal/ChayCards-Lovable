/**
 * Embed Patterns - Incremental embedding script
 * Scans memory-bank/ and src/ for documentation AND source code
 * Automatically detects changes using file modification times
 * Deletes embeddings for removed files
 *
 * Now includes:
 * - memory-bank/ markdown documentation
 * - src/ TypeScript/JavaScript source code with extracted metadata
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { embedBatch } from './embedding-client.js';
import { getAllDocuments, upsertDocuments, deleteDocument, getStats, generateIdFromPath } from './qdrant-client.js';

const PROJECT_ROOT = path.resolve('.');
const MEMORY_BANK_ROOT = path.resolve('memory-bank');
const SRC_ROOT = path.resolve('src');

// Documentation directories to embed
const DOC_DIRS = {
  patterns: path.join(MEMORY_BANK_ROOT, 'patterns'),
  docs: path.join(MEMORY_BANK_ROOT, 'docs'),
  tools: path.join(MEMORY_BANK_ROOT, 'tools'),
  'product-management': path.join(MEMORY_BANK_ROOT, 'product-management')
};

// Source code directories to embed
const CODE_DIRS = {
  plugins: path.join(SRC_ROOT, 'plugins'),
  renderer: path.join(SRC_ROOT, 'renderer'),
  shared: path.join(SRC_ROOT, 'shared'),
  utils: path.join(SRC_ROOT, 'utils')
};

// Files to skip
const SKIP_FILES = [
  'README.md',
  '_template.md',
  'vite-env.d.ts',
  '.d.ts'
];

// Directories to skip in code scanning
const SKIP_DIRS = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '__tests__',
  '__mocks__'
];

/**
 * Parse pattern metadata from markdown frontmatter
 */
function parseMarkdownMetadata(content, filePath) {
  const lines = content.split('\n');
  const metadata = {
    category: 'general',
    type: 'documentation',
    title: path.basename(filePath, '.md'),
    triggers: []
  };

  // Look for markdown headers with metadata
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
 * Extracts: exports, functions, classes, interfaces, JSDoc comments
 */
function extractCodeMetadata(content, filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  const metadata = {
    exports: [],
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    hooks: [],      // React hooks (useXxx)
    components: [], // React components (PascalCase functions returning JSX)
    jsdoc: []
  };

  // Extract exports (named and default)
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g);
  for (const match of exportMatches) {
    metadata.exports.push(match[1]);
  }

  // Extract function declarations with their signatures
  const funcMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g);
  for (const match of funcMatches) {
    metadata.functions.push({ name: match[1], params: match[2].trim() });
  }

  // Extract arrow functions assigned to const (common pattern)
  const arrowMatches = content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g);
  for (const match of arrowMatches) {
    const name = match[1];
    // Check if it's a React hook
    if (name.startsWith('use') && name[3] === name[3].toUpperCase()) {
      metadata.hooks.push(name);
    }
    // Check if it's a React component (PascalCase)
    else if (name[0] === name[0].toUpperCase() && /^[A-Z]/.test(name)) {
      metadata.components.push(name);
    }
    else {
      metadata.functions.push({ name, params: '' });
    }
  }

  // Extract class declarations
  const classMatches = content.matchAll(/(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g);
  for (const match of classMatches) {
    metadata.classes.push({ name: match[1], extends: match[2] || null });
  }

  // Extract interface declarations
  const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)/g);
  for (const match of interfaceMatches) {
    metadata.interfaces.push(match[1]);
  }

  // Extract type declarations
  const typeMatches = content.matchAll(/(?:export\s+)?type\s+(\w+)\s*=/g);
  for (const match of typeMatches) {
    metadata.types.push(match[1]);
  }

  // Extract JSDoc comments (first 500 chars of each)
  const jsdocMatches = content.matchAll(/\/\*\*[\s\S]*?\*\//g);
  for (const match of jsdocMatches) {
    const doc = match[0].slice(0, 500);
    if (doc.includes('@')) { // Only include JSDoc with tags
      metadata.jsdoc.push(doc);
    }
  }

  return metadata;
}

/**
 * Build a searchable text representation of a code file
 * This is what gets embedded - optimized for semantic search
 */
function buildCodeEmbeddingText(content, filePath, metadata) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  const parts = [];

  // File identity
  parts.push(`File: ${fileName}`);
  parts.push(`Path: ${filePath}`);

  // Exports summary (most important for avoiding duplication)
  if (metadata.exports.length > 0) {
    parts.push(`Exports: ${metadata.exports.join(', ')}`);
  }

  // React components
  if (metadata.components.length > 0) {
    parts.push(`React Components: ${metadata.components.join(', ')}`);
  }

  // React hooks
  if (metadata.hooks.length > 0) {
    parts.push(`React Hooks: ${metadata.hooks.join(', ')}`);
  }

  // Classes
  if (metadata.classes.length > 0) {
    const classInfo = metadata.classes.map(c =>
      c.extends ? `${c.name} extends ${c.extends}` : c.name
    ).join(', ');
    parts.push(`Classes: ${classInfo}`);
  }

  // Interfaces and Types
  if (metadata.interfaces.length > 0) {
    parts.push(`Interfaces: ${metadata.interfaces.join(', ')}`);
  }
  if (metadata.types.length > 0) {
    parts.push(`Types: ${metadata.types.join(', ')}`);
  }

  // Functions with signatures
  if (metadata.functions.length > 0) {
    const funcInfo = metadata.functions.slice(0, 10).map(f =>
      f.params ? `${f.name}(${f.params})` : f.name
    ).join(', ');
    parts.push(`Functions: ${funcInfo}`);
  }

  // JSDoc comments (valuable for understanding purpose)
  if (metadata.jsdoc.length > 0) {
    parts.push('\nDocumentation:');
    parts.push(metadata.jsdoc.slice(0, 3).join('\n'));
  }

  // Include first ~2000 chars of actual code for context
  // This helps with semantic matching on implementation details
  const codePreview = content.slice(0, 2000);
  parts.push('\nCode Preview:');
  parts.push(codePreview);

  return parts.join('\n');
}

/**
 * Read and process markdown file
 */
function processMarkdownFile(filePath, relativePath, type) {
  const content = fs.readFileSync(filePath, 'utf8');
  const metadata = parseMarkdownMetadata(content, filePath);
  const stats = fs.statSync(filePath);

  return {
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
}

/**
 * Read and process source code file
 */
function processCodeFile(filePath, relativePath, dirType) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const metadata = extractCodeMetadata(content, filePath);

  // Build the embedding text (what gets vectorized)
  const embeddingText = buildCodeEmbeddingText(content, relativePath, metadata);

  // Determine category from path
  let category = dirType;
  if (relativePath.includes('plugins/')) {
    const pluginMatch = relativePath.match(/plugins\/([^/]+)/);
    if (pluginMatch) {
      category = `plugin:${pluginMatch[1]}`;
    }
  }

  return {
    path: relativePath,
    text: embeddingText,  // Optimized for embedding
    fullContent: content, // Keep full content for reference
    title: path.basename(filePath),
    category: category,
    type: 'source-code',
    fileType: path.extname(filePath).slice(1), // 'ts', 'tsx', etc.
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
}

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
 * Discover all markdown documentation files
 */
async function discoverDocFiles() {
  const documents = [];

  for (const [dirType, dirPath] of Object.entries(DOC_DIRS)) {
    if (!fs.existsSync(dirPath)) continue;

    const files = await glob('**/*.md', {
      cwd: dirPath,
      absolute: true
    });

    for (const file of files) {
      if (shouldSkipFile(file)) continue;

      const relativePath = path.relative(PROJECT_ROOT, file);
      documents.push(processMarkdownFile(file, relativePath, dirType));
    }
  }

  return documents;
}

/**
 * Discover all source code files
 */
async function discoverCodeFiles() {
  const documents = [];

  for (const [dirType, dirPath] of Object.entries(CODE_DIRS)) {
    if (!fs.existsSync(dirPath)) continue;

    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: dirPath,
      absolute: true,
      ignore: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/__mocks__/**']
    });

    for (const file of files) {
      if (shouldSkipFile(file)) continue;

      const relativePath = path.relative(PROJECT_ROOT, file);
      try {
        documents.push(processCodeFile(file, relativePath, dirType));
      } catch (err) {
        console.warn(`  ⚠️  Failed to process ${relativePath}: ${err.message}`);
      }
    }
  }

  return documents;
}

/**
 * Discover all files (docs + code)
 */
async function discoverFiles() {
  console.log('  Scanning documentation files...');
  const docFiles = await discoverDocFiles();
  console.log(`    Found ${docFiles.length} documentation files`);

  console.log('  Scanning source code files...');
  const codeFiles = await discoverCodeFiles();
  console.log(`    Found ${codeFiles.length} source code files`);

  return [...docFiles, ...codeFiles];
}

/**
 * Main embedding process - Incremental
 */
async function main() {
  console.log('🚀 Starting incremental embedding (docs + source code)...\n');

  // Step 1: Discover files on disk
  console.log('📂 Discovering files...');
  const diskDocuments = await discoverFiles();

  if (diskDocuments.length === 0) {
    console.log('⚠️  No documents found to embed');
    return;
  }

  console.log(`✓ Found ${diskDocuments.length} documents on disk\n`);

  // Step 2: Get existing embeddings from Qdrant
  console.log('📦 Fetching existing embeddings...');
  const existingDocs = await getAllDocuments();
  console.log(`✓ Found ${existingDocs.length} existing embeddings\n`);

  // Create lookup maps
  const existingByPath = new Map(existingDocs.map(doc => [doc.path, doc]));
  const diskByPath = new Map(diskDocuments.map(doc => [doc.path, doc]));

  // Step 3: Determine what needs to be updated
  const toEmbed = [];    // New or modified files
  const toDelete = [];   // Removed files
  let unchanged = 0;

  // Check for new/modified files
  for (const diskDoc of diskDocuments) {
    const existing = existingByPath.get(diskDoc.path);

    if (!existing) {
      // New file
      toEmbed.push({ ...diskDoc, reason: 'new' });
    } else if (!existing.mtime || diskDoc.mtime > existing.mtime) {
      // Modified file (or missing mtime in old embedding)
      toEmbed.push({ ...diskDoc, reason: 'modified' });
    } else {
      // Unchanged
      unchanged++;
    }
  }

  // Check for deleted files
  for (const existingDoc of existingDocs) {
    if (!diskByPath.has(existingDoc.path)) {
      toDelete.push(existingDoc);
    }
  }

  // Show summary
  console.log('📊 Change detection:');
  console.log(`  New files:      ${toEmbed.filter(d => d.reason === 'new').length}`);
  console.log(`  Modified files: ${toEmbed.filter(d => d.reason === 'modified').length}`);
  console.log(`  Deleted files:  ${toDelete.length}`);
  console.log(`  Unchanged:      ${unchanged}`);
  console.log();

  // Step 4: Delete removed files
  if (toDelete.length > 0) {
    console.log('🗑️  Deleting removed files...');
    for (const doc of toDelete) {
      const id = generateIdFromPath(doc.path);
      await deleteDocument(id);
      console.log(`  ✓ ${doc.path}`);
    }
    console.log();
  }

  // Step 5: Embed new/modified files
  if (toEmbed.length > 0) {
    console.log('🔮 Generating embeddings...');
    const BATCH_SIZE = 32;
    const allEmbeddings = [];
    const successfulDocs = [];
    let failedCount = 0;

    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);
      const texts = batch.map(doc => doc.text);

      process.stdout.write(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toEmbed.length / BATCH_SIZE)}...`);

      try {
        const embeddings = await embedBatch(texts);
        allEmbeddings.push(...embeddings);
        successfulDocs.push(...batch);
        process.stdout.write(' ✓\n');
      } catch (error) {
        failedCount += batch.length;
        process.stdout.write(` ✗ (${error.message})\n`);
        console.log(`    Failed files: ${batch.map(d => d.path).join(', ')}`);
      }
    }

    if (failedCount > 0) {
      console.log(`\n⚠️  Failed to embed ${failedCount} documents`);
    }
    console.log(`✓ Generated ${allEmbeddings.length} embeddings\n`);

    // Step 6: Upsert to Qdrant
    console.log('💾 Storing in Qdrant...');

    const qdrantDocs = successfulDocs.map((doc, i) => ({
      vector: allEmbeddings[i],
      payload: doc
    }));

    if (qdrantDocs.length > 0) {
      await upsertDocuments(qdrantDocs);
      console.log('✓ Documents stored\n');
    } else {
      console.log('⚠️  No documents to store (all batches failed)\n');
    }
  } else {
    console.log('✓ No changes detected, skipping embedding\n');
  }

  // Step 7: Final stats
  console.log('📊 Final stats:');
  const stats = await getStats();
  console.log(`  Total points: ${stats.points_count}`);
  console.log(`  Total vectors: ${stats.vectors_count}`);
  console.log(`  Status: ${stats.status}`);

  console.log('\n✨ Incremental embedding complete!');
}

// Run if called directly (cross-platform compatible)
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
