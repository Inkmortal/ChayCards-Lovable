/**
 * Embed Patterns - Incremental embedding script
 * Scans memory-bank/ and only embeds new/modified files
 * Automatically detects changes using file modification times
 * Deletes embeddings for removed files
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { embedBatch } from './embedding-client.js';
import { getAllDocuments, upsertDocuments, deleteDocument, getStats, generateIdFromPath } from './qdrant-client.js';

const MEMORY_BANK_ROOT = path.resolve('memory-bank');

// Directories to embed
const EMBED_DIRS = {
  patterns: path.join(MEMORY_BANK_ROOT, 'patterns'),
  docs: path.join(MEMORY_BANK_ROOT, 'docs'),
  tools: path.join(MEMORY_BANK_ROOT, 'tools'),
  'product-management': path.join(MEMORY_BANK_ROOT, 'product-management')
};

// Files to skip (templates and meta-documentation)
const SKIP_FILES = [
  'README.md',
  '_template.md'
];

/**
 * Parse pattern metadata from markdown frontmatter
 */
function parseMetadata(content, filePath) {
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
 * Read and process markdown file
 */
function processFile(filePath, relativePath, type) {
  const content = fs.readFileSync(filePath, 'utf8');
  const metadata = parseMetadata(content, filePath);
  const stats = fs.statSync(filePath);

  return {
    path: relativePath,
    text: content,
    title: metadata.title,
    category: metadata.category,
    type: metadata.type || type,
    triggers: metadata.triggers,
    word_count: content.split(/\s+/).length,
    mtime: stats.mtimeMs  // File modification time for change detection
  };
}

/**
 * Discover all markdown files in embed directories
 */
async function discoverFiles() {
  const documents = [];

  // Iterate over all embed directories
  for (const [dirType, dirPath] of Object.entries(EMBED_DIRS)) {
    const files = await glob('**/*.md', {
      cwd: dirPath,
      absolute: true
    });

    for (const file of files) {
      const basename = path.basename(file);
      if (SKIP_FILES.includes(basename)) continue;

      const relativePath = path.relative(MEMORY_BANK_ROOT, file);
      documents.push(processFile(file, relativePath, dirType));
    }
  }

  return documents;
}

/**
 * Main embedding process - Incremental
 */
async function main() {
  console.log('🚀 Starting incremental pattern embedding...\n');

  // Step 1: Discover files on disk
  console.log('📂 Discovering patterns and docs...');
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
