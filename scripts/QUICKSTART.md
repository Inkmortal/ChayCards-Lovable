# Product Board Sync - Quick Start

## ✅ Setup Complete!

The infrastructure is ready. Here's how to use it:

---

## 🚀 Start the Sync Server

**Terminal 1 - Start Express Server:**
```bash
npm run product-board:server
```

You should see:
```
╔════════════════════════════════════════════╗
║   Product Board Sync Server Running       ║
╚════════════════════════════════════════════╝

🚀 Server: http://localhost:3001
🔑 API Key: dev-secret...
```

**Terminal 2 - Start Cloudflare Tunnel:**
```bash
cloudflared tunnel run chaycards-api
```

You should see:
```
2025-10-02 ... INF Connection registered connIndex=0 ip=... location=...
```

---

## 🔘 Add Button to Notion

1. Go to your **ChayCards_Dev** database in Notion
2. Click "+ New Property" (or add column in table view)
3. Configure:
   - **Name**: `Sync Progress`
   - **Type**: `Button`
4. Button settings:
   - **Action**: `Make a request`
   - **URL**: `https://dev.chaycards.com/api/product-board/sync`
   - **Request type**: `POST`
   - **Headers**:
     - Header name: `x-api-key`
     - Header value: `dev-secret-key-change-in-production` *(use your actual key from .env)*

5. Click "Done"

---

## 🎯 Usage

### Option 1: Click Button in Notion
- Open any page in your ChayCards_Dev database
- Click the "Sync Progress" button
- Wait ~10 seconds
- Refresh page to see updated progress bars

### Option 2: Manual CLI
```bash
npm run product-board:sync
```

### Option 3: Auto-Sync (Background)
```bash
npm run product-board:sync -- --watch
```

---

## 🧪 Test It

1. **Create a test task** in Notion with this content:
   ```markdown
   # Action Items
   - [ ] First task
   - [ ] Second task
   - [ ] Third task
   ```

2. **Click "Sync Progress" button**

3. **Check the properties**:
   - Start value: `0`
   - End value: `3`
   - Progress: `0%`

4. **Check off one item**: `- [x] First task`

5. **Click "Sync Progress" again**

6. **Verify**:
   - Start value: `1`
   - End value: `3`
   - Progress: `33%`

---

## 🔒 Security (Important!)

**Change the default API key before going to production!**

1. Generate a secure key:
   ```powershell
   # PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

2. Update `.env`:
   ```env
   PRODUCT_BOARD_API_KEY=your-new-secure-key-here
   ```

3. Update Notion button header with new key

4. Restart the server

---

## 📊 What Gets Synced

- ✅ Checkbox items: `- [ ]` and `- [x]`
- ✅ Nested checkboxes (counted flat)
- ❌ Status property (not modified)
- ❌ Other page properties

**Progress calculation:**
```
Progress = Start value ÷ End value
Example: 2 checked out of 5 total = 40%
```

---

## 🐛 Troubleshooting

**Button returns error:**
```bash
# Test endpoint directly
curl -X POST -H "x-api-key: dev-secret-key-change-in-production" https://dev.chaycards.com/api/product-board/sync
```

**Server won't start:**
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /F /PID <PID>
```

**Progress not updating:**
1. Check server logs for errors
2. Verify page has checkboxes in content
3. Clear cache: `rm .product-board-cache.json`
4. Run sync again

---

## 📝 Daily Workflow

**Morning:**
```bash
# Start both services
npm run product-board:server
cloudflared tunnel run chaycards-api  # (in another terminal)
```

**Throughout Day:**
- Update checkboxes in Notion pages as you work
- Click "Sync Progress" button to update dashboard
- Or let auto-sync handle it: `npm run product-board:sync -- --watch`

**End of Day:**
- Servers can stay running or stop with Ctrl+C
- Cache persists between runs (faster next time)

---

Need help? Check `scripts/README.md` for detailed documentation.
