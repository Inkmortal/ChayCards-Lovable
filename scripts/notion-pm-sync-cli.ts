#!/usr/bin/env node
/**
 * Notion PM Sync CLI
 *
 * Command-line tool for syncing Notion project management progress.
 *
 * Usage:
 *   npm run notion-pm:sync              # Run once
 *   npm run notion-pm:sync -- --watch   # Run continuously
 *   npm run notion-pm:sync -- --watch --interval 120  # Custom interval (seconds)
 */

import { syncNotionPM } from './lib/sync-notion-pm';

interface Args {
  watch: boolean;
  interval: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch') || args.includes('-w');

  const intervalIndex = args.indexOf('--interval');
  const interval = intervalIndex !== -1 && args[intervalIndex + 1]
    ? parseInt(args[intervalIndex + 1], 10)
    : 60; // Default 60 seconds

  return { watch, interval };
}

/**
 * Run sync in watch mode
 */
async function watchMode(interval: number): Promise<void> {
  console.log(`\n👀 Watch mode enabled - syncing every ${interval} seconds`);
  console.log('Press Ctrl+C to stop\n');

  // Run immediately
  await syncNotionPM();

  // Then run on interval
  setInterval(async () => {
    await syncNotionPM();
  }, interval * 1000);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { watch, interval } = parseArgs();

  if (watch) {
    await watchMode(interval);
  } else {
    const result = await syncNotionPM();
    process.exit(result.success ? 0 : 1);
  }
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
