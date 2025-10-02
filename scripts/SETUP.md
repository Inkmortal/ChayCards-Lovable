# Notion PM Sync - Complete Setup Guide

Automatically sync task progress from Notion checkboxes to progress bars in your ChayCards_Dev database.

## Quick Reference

```bash
# Start the sync server
npm run notion-pm:server

# Manual one-time sync
npm run notion-pm:sync

# Auto-sync every 60 seconds (background)
npm run notion-pm:sync -- --watch

# Cloudflare tunnel (already configured)
cloudflared tunnel run chaycards-api
```

---

## How It Works

1. **You add checkboxes** to task pages in Notion:
   ```markdown
   # Action Items
   - [ ] Task 1
   - [ ] Task 2
   - [x] Task 3 (completed)
   ```

2. **Click the sync button** (or run sync command)

3. **Progress auto-calculates**:
   - Start value = 1 (checked items)
   - End value = 3 (total items)
   - Progress = 33%

---

## Setup (One-Time)

### 1. Add Button to Notion Database

**Configure once - appears on all tasks automatically!**

1. Open **ChayCards_Dev** database in Notion
2. Click **"+ New Property"** (top right of any column)
3. Settings:
   - **Name**: `Sync Progress` (or `🔄 Sync`)
   - **Type**: `Button`
4. Button configuration:
   - **Action**: `Make a request`
   - **URL**: `https://dev.chaycards.com/api/notion-pm/sync`
   - **Method**: `POST`
   - **Headers**:
     - Name: `x-api-key`
     - Value: `dev-secret-key-change-in-production`
   - **☑️ Send page data**: ENABLE this checkbox

5. Click **"Done"**

### 2. Start Services

**Terminal 1 - Sync Server:**
```bash
npm run notion-pm:server
```

**Terminal 2 - Cloudflare Tunnel** (if not already running):
```bash
cloudflared tunnel run chaycards-api
```

---

## Usage

### Option 1: Notion Button (Recommended)
- Click "Sync Progress" button on any task
- **Per-page mode**: Only syncs the clicked task (fast, saves API calls)
- Progress updates immediately

### Option 2: Manual CLI
```bash
npm run notion-pm:sync
```
- Syncs ALL tasks at once
- Good for bulk updates

### Option 3: Auto-Sync Background
```bash
npm run notion-pm:sync -- --watch
```
- Runs continuously
- Syncs every 60 seconds (customizable with `--interval 120`)
- Only processes changed pages (cached)

---

## API Endpoints

### Full Sync (All Tasks)
```bash
curl -X POST \
  -H "x-api-key: dev-secret-key-change-in-production" \
  https://dev.chaycards.com/api/notion-pm/sync
```

### Single Page Sync
```bash
curl -X POST \
  -H "x-api-key: dev-secret-key-change-in-production" \
  https://dev.chaycards.com/api/notion-pm/sync?pageId=PAGE_ID_HERE
```

---

## Configuration

### Environment Variables

Create/update `.env`:

```env
# Notion PM Sync Configuration
NOTION_PM_API_KEY=your-secure-key-here
NOTION_PM_PORT=3001
```

**Generate secure API key:**
```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Don't forget to update the Notion button header with your new key!**

---

## Features

### Smart Caching
- Only syncs pages modified since last run
- Saves API calls (Notion limit: 3 req/sec)
- Cache stored in `.notion-pm-cache.json`

### Two Sync Modes

| Mode | Trigger | Syncs | Use Case |
|------|---------|-------|----------|
| **Per-page** | Button click | Only clicked task | Quick updates, saves API calls |
| **Full sync** | CLI/scheduled | All tasks | Bulk updates, initial sync |

### Rate Limiting
- 350ms delay between requests
- Stays under Notion's 3 req/sec limit
- Handles bursts gracefully

---

## Troubleshooting

### Button Returns 401 Unauthorized
```bash
# Check API key matches
cat .env | grep NOTION_PM_API_KEY

# Update Notion button header if key changed
```

### Server Won't Start
```bash
# Check port 3001 is available
netstat -ano | findstr :3001

# Kill process if needed
taskkill /F /PID <PID>

# Or use different port
NOTION_PM_PORT=3002 npm run notion-pm:server
```

### Progress Not Updating
1. Verify checkboxes exist in page content (not just properties)
2. Check server logs for errors
3. Clear cache: `rm .notion-pm-cache.json`
4. Run sync again

### Cloudflare Tunnel Issues
```bash
# Check tunnel is running
cloudflared tunnel list

# Restart tunnel
cloudflared tunnel run chaycards-api
```

---

## File Structure

```
scripts/
├── notion-pm-server.ts          # Express API server
├── notion-pm-sync-cli.ts         # CLI tool
├── lib/sync-notion-pm.ts         # Core sync logic
├── SETUP.md                      # This file
└── README.md                     # Detailed docs
```

## Cache File

`.notion-pm-cache.json` (auto-generated, git-ignored)
- Stores last-edited timestamps for each page
- Prevents re-syncing unchanged pages
- Delete to force full re-sync

---

## Daily Workflow

**Morning:**
```bash
npm run notion-pm:server
# Leave running in background
```

**Throughout Day:**
- Update checkboxes as you complete work
- Click "Sync Progress" button when you want to see updated dashboard
- Or let auto-sync handle it

**End of Day:**
- Leave server running or stop with Ctrl+C
- Cache persists between runs

---

## Security Notes

⚠️ **Change default API key before production!**

1. Generate secure key (see Configuration section)
2. Update `.env`
3. Update Notion button header
4. Restart server

The API key prevents unauthorized access to your sync endpoint.

---

## Next Steps

- [x] Services running
- [x] Button added to Notion
- [ ] Test with a sample task
- [ ] Update API key for security
- [ ] Set up auto-sync if desired

Need help? Check `scripts/README.md` for detailed documentation.
