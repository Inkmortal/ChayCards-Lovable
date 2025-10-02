#!/usr/bin/env node
/**
 * Notion PM Sync Server
 *
 * Express server that syncs Notion project management task progress.
 * Designed to be accessed via Cloudflare Tunnel at:
 * https://dev.chaycards.com/api/notion-pm/sync
 *
 * Usage:
 *   npm run notion-pm:server
 */

import express from 'express';
import { syncNotionPM } from './lib/sync-notion-pm';

const PORT = process.env.NOTION_PM_PORT || 3001;
const API_KEY = process.env.NOTION_PM_API_KEY || 'dev-secret-key-change-in-production';

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * API Key Authentication Middleware
 */
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const providedKey = req.headers['x-api-key'] || req.query.apiKey;

  if (providedKey !== API_KEY) {
    console.warn('❌ Unauthorized request - invalid API key');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid API key',
    });
  }

  next();
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notion-pm-sync',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Sync endpoint - triggers Notion PM progress sync
 *
 * Supports two modes:
 * 1. Full sync: No pageId provided, syncs all tasks
 * 2. Single page: pageId provided (from Notion button), syncs only that page
 */
app.post('/api/notion-pm/sync', requireApiKey, async (req, res) => {
  // Extract page ID from Notion button webhook payload or query param
  // Notion button sends page data nested in req.body.data
  const pageId = req.body?.data?.id || req.body?.pageId || req.query?.pageId;

  if (pageId) {
    console.log(`\n🚀 Sync request received from Notion for page: ${pageId}`);
  } else {
    console.log('\n🚀 Sync request received from Notion (full sync)');
  }

  try {
    const result = await syncNotionPM(pageId);

    res.json({
      success: result.success,
      message: result.success
        ? pageId
          ? `Synced task successfully`
          : `Synced ${result.updated} tasks successfully`
        : 'Sync completed with errors',
      data: {
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        duration: result.duration,
        mode: pageId ? 'single-page' : 'full-sync',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET variant for easy browser testing
 */
app.get('/api/notion-pm/sync', requireApiKey, async (req, res) => {
  const pageId = req.query?.pageId as string | undefined;

  if (pageId) {
    console.log(`\n🚀 Sync request received (GET) for page: ${pageId}`);
  } else {
    console.log('\n🚀 Sync request received (GET) - full sync');
  }

  try {
    const result = await syncNotionPM(pageId);

    res.json({
      success: result.success,
      message: result.success
        ? pageId
          ? `Synced task successfully`
          : `Synced ${result.updated} tasks successfully`
        : 'Sync completed with errors',
      data: {
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        duration: result.duration,
        mode: pageId ? 'single-page' : 'full-sync',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Notion PM Sync Server Running            ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log('\n📍 Endpoints:');
  console.log(`   GET  /health`);
  console.log(`   POST /api/notion-pm/sync (requires API key)`);
  console.log(`   GET  /api/notion-pm/sync (requires API key)`);
  console.log('\n💡 Expose via Cloudflare Tunnel:');
  console.log(`   cloudflared tunnel run chaycards-api\n`);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});
