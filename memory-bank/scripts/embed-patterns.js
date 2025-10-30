/**
 * Embed Patterns - Manual embedding script
 * Re-embeds all patterns and docs from memory-bank/
 * Clears and rebuilds Qdrant collection
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { embedBatch } from './embedding-client.js';
import { clearCollection, upsertDocuments, getStats } from './qdrant-client.js';

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

  return {
    path: relativePath,
    text: content,
    title: metadata.title,
    category: metadata.category,
    type: metadata.type || type,
    triggers: metadata.triggers,
    word_count: content.split(/\s+/).length
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
 * Main embedding process
 */
async function main() {
  console.log('🚀 Starting pattern embedding process...\n');

  // Step 1: Discover files
  console.log('📂 Discovering patterns and docs...');
  const documents = await discoverFiles();

  if (documents.length === 0) {
    console.log('⚠️  No documents found to embed');
    return;
  }

  console.log(`✓ Found ${documents.length} documents\n`);

  // Show breakdown
  const byType = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {});

  console.log('Documents by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  // Step 2: Clear existing collection
  console.log('🗑️  Clearing existing embeddings...');
  await clearCollection();
  console.log('✓ Collection cleared\n');

  // Step 3: Generate embeddings in batches
  console.log('🔮 Generating embeddings...');
  const BATCH_SIZE = 32;
  const allEmbeddings = [];

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const texts = batch.map(doc => doc.text);

    process.stdout.write(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}...`);

    const embeddings = await embedBatch(texts);
    allEmbeddings.push(...embeddings);

    process.stdout.write(' ✓\n');
  }

  console.log(`✓ Generated ${allEmbeddings.length} embeddings\n`);

  // Step 4: Upsert to Qdrant
  console.log('💾 Storing in Qdrant...');

  const qdrantDocs = documents.map((doc, i) => ({
    vector: allEmbeddings[i],
    payload: doc
  }));

  await upsertDocuments(qdrantDocs);
  console.log('✓ Documents stored\n');

  // Step 5: Verify
  console.log('📊 Final stats:');
  const stats = await getStats();
  console.log(`  Total points: ${stats.points_count}`);
  console.log(`  Total vectors: ${stats.vectors_count}`);
  console.log(`  Status: ${stats.status}`);

  console.log('\n✨ Embedding process complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
