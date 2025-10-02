/**
 * Notion PM Progress Sync (Direct API)
 *
 * Syncs Notion project management task progress by counting checkboxes
 * in page content and updating Start/End value properties for progress calculation.
 *
 * Uses Notion SDK directly for standalone operation.
 */

import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_ID = '1fcbbd9b-1a29-8037-93a7-f8088c952035';
const DATA_SOURCE_ID = '1fcbbd9b-1a29-80d5-bc07-000be692a8ea';
const CACHE_FILE = path.join(__dirname, '../../.notion-pm-cache.json');

// Initialize Notion client
const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY environment variable is required');
}

const notion = new Client({ auth: NOTION_API_KEY });

interface PageUpdate {
  id: string;
  title: string;
  checked: number;
  total: number;
  lastEdited: string;
}

interface CacheData {
  lastSync: string;
  processedPages: Record<string, string>; // pageId -> lastEditedTime
}

interface SyncResult {
  success: boolean;
  updated: number;
  skipped: number;
  failed: number;
  duration: number;
  error?: string;
}

/**
 * Load cache to skip unchanged pages
 */
function loadCache(): CacheData {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.warn('Could not load cache:', error);
  }
  return { lastSync: new Date(0).toISOString(), processedPages: {} };
}

/**
 * Save cache for next run
 */
function saveCache(data: CacheData): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Could not save cache:', error);
  }
}

/**
 * Convert Notion rich text to plain text
 */
function richTextToPlain(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map((text) => text.plain_text || '').join('');
}

/**
 * Count checkboxes in Notion blocks
 */
function countCheckboxesInBlocks(blocks: any[]): { total: number; checked: number } {
  let total = 0;
  let checked = 0;

  for (const block of blocks) {
    if (block.type === 'to_do') {
      total++;
      if (block.to_do?.checked) {
        checked++;
      }
    }

    // Recursively count in child blocks
    if (block.has_children && block.children) {
      const childCount = countCheckboxesInBlocks(block.children);
      total += childCount.total;
      checked += childCount.checked;
    }
  }

  return { total, checked };
}

/**
 * Fetch all blocks (recursively) for a page
 */
async function fetchPageBlocks(pageId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100, // Fetch max blocks per request
    });

    // Batch process blocks with Promise.all for parallel child fetching
    const blockPromises = response.results.map(async (block: any) => {
      if (block.has_children) {
        block.children = await fetchPageBlocks(block.id);
      }
      return block;
    });

    const processedBlocks = await Promise.all(blockPromises);
    blocks.push(...processedBlocks);

    cursor = response.next_cursor;
  } while (cursor);

  return blocks;
}

/**
 * Fetch all tasks from database
 */
async function fetchTasks(cache: CacheData): Promise<PageUpdate[]> {
  console.log('📥 Fetching tasks from Notion PM database...');

  const updates: PageUpdate[] = [];
  let skipped = 0;
  let cursor: string | undefined;

  do {
    const response: any = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      start_cursor: cursor,
    });

    for (const page of response.results) {
      const pageId = page.id;
      const lastEditedTime = page.last_edited_time;
      const previousEditTime = cache.processedPages[pageId];

      // Extract title from properties
      const titleProp = page.properties['Project name'];
      const title = titleProp?.title ? richTextToPlain(titleProp.title) : 'Untitled';

      // Skip if unchanged since last sync
      if (lastEditedTime && previousEditTime && lastEditedTime === previousEditTime) {
        skipped++;
        continue;
      }

      try {
        // Fetch all blocks in the page
        const blocks = await fetchPageBlocks(pageId);

        // Count checkboxes
        const { total, checked } = countCheckboxesInBlocks(blocks);

        // If no checkboxes, set to 100% (1/1)
        // Otherwise use actual checkbox counts
        const finalTotal = total > 0 ? total : 1;
        const finalChecked = total > 0 ? checked : 1;

        updates.push({
          id: pageId,
          title,
          checked: finalChecked,
          total: finalTotal,
          lastEdited: lastEditedTime,
        });

        // Rate limit: 3 req/sec = 350ms between requests
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch (error) {
        console.warn(`Failed to fetch page "${title}":`, error);
      }
    }

    cursor = response.next_cursor;
  } while (cursor);

  console.log(`✅ Found ${updates.length} tasks to update (${skipped} unchanged)`);
  return updates;
}

/**
 * Update page progress values
 */
async function updatePage(update: PageUpdate): Promise<boolean> {
  try {
    await notion.pages.update({
      page_id: update.id,
      properties: {
        'Start value': { number: update.checked },
        'End value': { number: update.total },
      },
    });

    const percentage = update.total > 0 ? Math.round((update.checked / update.total) * 100) : 0;

    console.log(`  ✓ ${update.title}: ${update.checked}/${update.total} (${percentage}%)`);
    return true;
  } catch (error: any) {
    console.error(`  ✗ Failed to update "${update.title}":`, error.message);
    return false;
  }
}

/**
 * Sync a single page by ID
 */
async function syncSinglePage(pageId: string, cache: CacheData): Promise<PageUpdate | null> {
  console.log(`📄 Fetching page ${pageId}...`);

  try {
    // Fetch the specific page
    const page: any = await notion.pages.retrieve({ page_id: pageId });

    const titleProp = page.properties['Project name'];
    const title = titleProp?.title ? richTextToPlain(titleProp.title) : 'Untitled';
    const lastEditedTime = page.last_edited_time;

    // Fetch all blocks in the page
    const blocks = await fetchPageBlocks(pageId);

    // Count checkboxes
    const { total, checked } = countCheckboxesInBlocks(blocks);

    // If no checkboxes, set to 100% (1/1)
    // Otherwise use actual checkbox counts
    const finalTotal = total > 0 ? total : 1;
    const finalChecked = total > 0 ? checked : 1;

    return {
      id: pageId,
      title,
      checked: finalChecked,
      total: finalTotal,
      lastEdited: lastEditedTime,
    };
  } catch (error) {
    console.error(`Failed to fetch page ${pageId}:`, error);
    return null;
  }
}

/**
 * Main sync function
 *
 * @param pageId - Optional page ID to sync only that page (from Notion button)
 */
export async function syncNotionPM(pageId?: string): Promise<SyncResult> {
  console.log(pageId ? '\n🔄 Starting single page sync...\n' : '\n🔄 Starting full Notion PM sync...\n');
  const startTime = Date.now();

  try {
    // Load cache
    const cache = loadCache();

    // Fetch tasks needing updates
    let updates: PageUpdate[];

    if (pageId) {
      // Single page mode: sync only the specified page
      const update = await syncSinglePage(pageId, cache);
      updates = update ? [update] : [];
    } else {
      // Full sync mode: sync all tasks
      updates = await fetchTasks(cache);
    }

    if (updates.length === 0) {
      console.log('✨ No updates needed - all tasks are current!\n');
      return {
        success: true,
        updated: 0,
        skipped: Object.keys(cache.processedPages).length,
        failed: 0,
        duration: Date.now() - startTime,
      };
    }

    console.log(`\n📝 Updating ${updates.length} tasks...\n`);

    // Update pages with rate limiting
    let successful = 0;
    let failed = 0;
    const newCache: CacheData = {
      lastSync: new Date().toISOString(),
      processedPages: { ...cache.processedPages },
    };

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      // Rate limit: 3 req/sec (only for full sync with multiple pages)
      if (i > 0 && !pageId) {
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      const success = await updatePage(update);
      if (success) {
        successful++;
        newCache.processedPages[update.id] = update.lastEdited;
      } else {
        failed++;
      }
    }

    // Save cache
    saveCache(newCache);

    const duration = Date.now() - startTime;
    const elapsed = (duration / 1000).toFixed(1);

    console.log(`\n✅ Sync complete: ${successful} updated, ${failed} failed in ${elapsed}s\n`);

    return {
      success: failed === 0,
      updated: successful,
      skipped: Object.keys(cache.processedPages).length - updates.length,
      failed,
      duration,
    };
  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    return {
      success: false,
      updated: 0,
      skipped: 0,
      failed: 0,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}
