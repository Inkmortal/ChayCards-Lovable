# Product Board Sync

Automatically sync task progress from Notion checkboxes to progress bars.

## Quick Start

### 1. Manual Sync (One-Time)
```bash
npm run product-board:sync
```

### 2. Watch Mode (Continuous Background Sync)
```bash
npm run product-board:sync -- --watch
npm run product-board:sync -- --watch --interval 120  # Every 2 minutes
```

### 3. Notion Button Integration (Recommended)

**Step 1: Start the Server**
```bash
npm run product-board:server
```

**Step 2: Expose via Cloudflare Tunnel**
```bash
npm run product-board:tunnel
```

**Step 3: Configure Cloudflare Tunnel (One-Time Setup)**

1. Install Cloudflare Tunnel (if not already installed):
   ```bash
   # Windows
   winget install --id Cloudflare.cloudflared

   # Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   ```

2. Login to Cloudflare:
   ```bash
   cloudflared tunnel login
   ```

3. Create a tunnel:
   ```bash
   cloudflared tunnel create chaycards-dev
   ```

4. Create configuration file `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: chaycards-dev
   credentials-file: /path/to/.cloudflared/<TUNNEL-ID>.json

   ingress:
     - hostname: dev.chaycards.com
       service: http://localhost:3001
     - service: http_status:404
   ```

5. Create DNS record:
   ```bash
   cloudflared tunnel route dns chaycards-dev dev.chaycards.com
   ```

6. Run tunnel:
   ```bash
   cloudflared tunnel run chaycards-dev
   ```

**Step 4: Add Button to Notion Database**

1. Open your ChayCards_Dev database in Notion
2. Add a new property:
   - Name: "Sync Progress"
   - Type: Button
3. Configure button:
   - **URL**: `https://dev.chaycards.com/api/product-board/sync`
   - **Method**: POST
   - **Headers**:
     - `x-api-key`: `your-api-key-from-env`

4. Click the button to trigger sync!

## How It Works

1. **Counts Checkboxes**: Scans page content for `- [ ]` and `- [x]` items
2. **Updates Properties**: Sets "Start value" (checked) and "End value" (total)
3. **Progress Formula**: Notion calculates progress as `Start value ÷ End value`
4. **Caching**: Only processes pages modified since last sync

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PRODUCT_BOARD_API_KEY=your-secure-random-key-here
PRODUCT_BOARD_PORT=3001
```

Generate a secure API key:
```bash
# Linux/macOS
openssl rand -hex 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Architecture

```
┌──────────────────┐
│  Notion Button   │
└────────┬─────────┘
         │ HTTPS (POST with API key)
         ▼
┌─────────────────────────────┐
│  Cloudflare Tunnel          │
│  dev.chaycards.com          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Express Server (localhost) │
│  Port 3001                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Sync Logic                 │
│  - Fetch pages via MCP      │
│  - Count checkboxes         │
│  - Update properties        │
│  - Cache results            │
└─────────────────────────────┘
```

## Files

- `product-board-server.ts` - Express server with API endpoint
- `sync-product-board-cli.ts` - CLI tool for manual/watch mode
- `lib/sync-product-board.ts` - Core sync logic
- `.product-board-cache.json` - Cached page edit times (auto-generated)

## Rate Limits

Notion API: 3 requests/second average (~2700 per 15 minutes)
- Script includes 350ms delays between requests
- Caching reduces API calls by skipping unchanged pages

## Troubleshooting

**Server won't start:**
- Check port 3001 is available: `netstat -ano | findstr :3001`
- Set different port: `PRODUCT_BOARD_PORT=3002 npm run product-board:server`

**Notion button fails:**
- Verify API key matches in `.env` and Notion button
- Check Cloudflare tunnel is running: `cloudflared tunnel list`
- Test endpoint: `curl -H "x-api-key: YOUR_KEY" https://dev.chaycards.com/api/product-board/sync`

**Sync not finding pages:**
- Verify database ID in `lib/sync-product-board.ts`
- Check Notion MCP connection: `claude mcp list`
- Ensure pages have checkboxes in content

**Changes not reflected:**
- Clear cache: `rm .product-board-cache.json`
- Check Notion Progress formula is correct: `Start value ÷ End value`
