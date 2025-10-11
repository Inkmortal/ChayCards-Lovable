# ChayCards Server Scripts

Quick reference for starting and managing development servers.

## 🚀 Quick Start

### Tmux Layout (Recommended - All logs visible)
**Double-click:** `start-servers-tmux.bat`

Shows all server logs in split panes (like tmux):
- PostgreSQL logs (top-left)
- Notion PM Server logs (bottom-left)
- Control panel (right)
- **Ctrl+C to stop everything!**

**See visual preview:** Check `TMUX-PREVIEW.md` for screenshots of the layout

### Tmux + Cloudflare Tunnel
**Double-click:** `start-servers-tmux-tunnel.bat`

Same as above plus Cloudflare Tunnel in 4th pane.

### Background Mode (Windows Terminal tabs)
**Double-click:** `start-servers.bat`

Starts in separate tabs:
- PostgreSQL (port 5433)
- Notion PM Server (port 3001)

### Background + Tunnel
**Double-click:** `start-servers-with-tunnel.bat`

Starts everything above plus:
- Cloudflare Tunnel (https://dev.chaycards.com)

### Stop All Servers
**Double-click:** `stop-servers.bat`

## 📋 What Each Script Does

### `start-servers-tmux.bat` (Recommended)
Opens a single WSL window with tmux split panes:
```
┌─────────────────────┬─────────────────────┐
│   PostgreSQL        │                     │
│   (Docker logs)     │   Control Panel     │
│                     │   (commands & tips) │
├─────────────────────┤                     │
│   Notion PM Server  │                     │
│   (Express logs)    │                     │
└─────────────────────┴─────────────────────┘
```

**Benefits:**
- See all logs at once
- Simple Ctrl+C to stop everything
- Navigate between panes with Ctrl+B then arrow keys
- Scroll logs with Ctrl+B then `[` (q to exit scroll mode)

### `start-servers-tmux-tunnel.bat`
Same as above but with 4 panes (adds Cloudflare Tunnel):
```
┌─────────────────┬─────────────────┐
│   PostgreSQL    │  Cloudflare     │
│                 │  Tunnel         │
├─────────────────┼─────────────────┤
│   Notion PM     │  Control        │
│   Server        │  Panel          │
└─────────────────┴─────────────────┘
```

### `start-servers.bat` (Background Mode)
Opens Windows Terminal with 3 tabs:
1. **PostgreSQL** - Database server (Docker container)
2. **Notion PM Server** - Webhook endpoint for Notion task sync
3. **Control Panel** - Command reference and status

### `start-servers-with-tunnel.bat`
Same as above, plus:
4. **Cloudflare Tunnel** - Exposes Notion PM Server to internet
   - Endpoint: `https://dev.chaycards.com/api/notion-pm/sync`

### `stop-servers.bat`
Cleanly shuts down:
- Notion PM Server process
- PostgreSQL Docker container
- Cloudflare Tunnel (if running)
- Any stray Vite processes

## 🔧 Manual Commands

If you prefer running servers manually in WSL:

```bash
# Terminal 1: PostgreSQL
cd server && docker-compose up

# Terminal 2: Notion PM Server (wait 10s for DB)
npm run notion-pm:server

# Terminal 3 (optional): Cloudflare Tunnel
cloudflared tunnel run chaycards-api

# Terminal 4: Vite (you start this manually)
npm run dev
```

## 🧪 Complete Testing Setup

For full development environment:

1. **Run:** `start-servers.bat` (or `-with-tunnel` variant)
2. **Wait:** 10-15 seconds for PostgreSQL to be ready
3. **In WSL terminal:** `npm run dev` (starts Vite on port 8080)
4. **Run:** `start-electron-windows.bat` (launches Electron UI)

Now you have:
- ✅ Web version at `http://localhost:8080`
- ✅ Electron desktop app running
- ✅ PostgreSQL database for web storage
- ✅ Notion sync server for task tracking

## 🐛 Troubleshooting

### "Windows Terminal not found"
Install from Microsoft Store: [Windows Terminal](https://aka.ms/terminal)

### PostgreSQL won't start
Check if port 5433 is already in use:
```bash
wsl -e bash -c "lsof -i :5433"
```

If another PostgreSQL is running:
```bash
wsl -e bash -c "sudo service postgresql stop"
```

### Notion PM Server fails to start
1. Check if PostgreSQL is running (wait 10+ seconds)
2. Verify environment variables in `.env`:
   - `NOTION_API_KEY`
   - `NOTION_PM_API_KEY` (optional, for webhook security)

### Cloudflare Tunnel not working
1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Login: `cloudflared tunnel login`
3. Verify tunnel exists: `cloudflared tunnel list`
4. If missing: Create tunnel following `.cloudflared/README.md`

## 💡 Tips

### Tmux Mode Tips

**Navigate panes:** `Ctrl+B` then arrow keys (←/→/↑/↓)

**Scroll logs:** `Ctrl+B` then `[` (use arrow keys to scroll, `q` to exit)

**Zoom a pane:** `Ctrl+B` then `z` (toggle fullscreen for current pane)

**Stop all servers:** Just press `Ctrl+C` in any pane, or close the window

**Detach session:** `Ctrl+B` then `d` (servers keep running in background)

**Reattach session:** Run `wsl -e tmux attach -t chaycards-servers`

### Background Mode Tips

**Keep it running:** Leave `start-servers.bat` window open during development. Each tab shows live logs.

**Quick restart:** Close Windows Terminal tabs, run `stop-servers.bat`, then `start-servers.bat` again.

**Monitor logs:** Switch between tabs in Windows Terminal to see what each service is doing.

**Notion sync testing:**
```bash
# Manual sync (in WSL)
npm run notion-pm:sync

# Or via API (in browser)
http://localhost:3001/api/notion-pm/sync?apiKey=dev-secret-key-change-in-production
```

## 📊 Port Reference

| Service            | Port | URL                          |
|--------------------|------|------------------------------|
| PostgreSQL         | 5433 | localhost:5433               |
| Notion PM Server   | 3001 | http://localhost:3001        |
| Vite Dev Server    | 8080 | http://localhost:8080        |
| Cloudflare Tunnel  | -    | https://dev.chaycards.com    |

## 🔐 Environment Variables

Required in `.env`:
```bash
# Notion API
NOTION_API_KEY=secret_xxxxx

# Notion PM Server (optional)
NOTION_PM_API_KEY=dev-secret-key-change-in-production
NOTION_PM_PORT=3001

# Database (for web version)
DATABASE_URL=postgresql://postgres:dev@localhost:5433/chaycards
```
