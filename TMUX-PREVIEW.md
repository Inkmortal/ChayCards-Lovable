# Tmux Server Layout Preview

This shows what you'll see when running `start-servers-tmux.bat`.

## 3-Pane Layout (Basic)

```
┌────────────────────────────────────┬────────────────────────────────────┐
│ PostgreSQL                         │ Control                            │
│                                    │                                    │
│ 🐘 Starting PostgreSQL...          │ ╔═══════════════════════════════╗ │
│                                    │ ║  ChayCards Servers Running    ║ │
│ chaycards-postgres  | [OK]         │ ╚═══════════════════════════════╝ │
│ database system is ready to accept │                                    │
│ connections                        │ 📊 Service Status:                │
│                                    │   • PostgreSQL:       :5433       │
│ LOG:  autovacuum launcher started  │   • Notion PM Server: :3001       │
│                                    │                                    │
│                                    │ 🎯 Tmux Commands:                 │
│                                    │   Ctrl+B then:                    │
│                                    │   • ←/→/↑/↓  Navigate            │
├────────────────────────────────────┤   • [        Scroll mode         │
│ Notion PM                          │   • z        Zoom pane           │
│                                    │   • d        Detach              │
│ 🔄 Starting Notion PM Server...    │                                    │
│                                    │ 🛑 Stop Servers:                  │
│ ╔═══════════════════════════════╗  │   • Ctrl+C in any pane           │
│ ║ Notion PM Sync Server Running ║  │   • Or close this window         │
│ ╚═══════════════════════════════╝  │                                    │
│                                    │ 📝 Next Steps:                    │
│ 🚀 Server: http://localhost:3001   │   1. Wait ~10s for PostgreSQL    │
│ 🔑 API Key: dev-secret...          │   2. Run 'npm run dev'           │
│                                    │   3. Run start-electron-windows  │
│ 📍 Endpoints:                      │                                    │
│    GET  /health                    │                                    │
│    POST /api/notion-pm/sync        │                                    │
│                                    │                                    │
└────────────────────────────────────┴────────────────────────────────────┘
```

## 4-Pane Layout (With Cloudflare Tunnel)

```
┌─────────────────────────┬─────────────────────────┐
│ PostgreSQL              │ Cloudflare              │
│                         │                         │
│ 🐘 PostgreSQL logs      │ 🌐 Starting tunnel...   │
│                         │                         │
│ [docker container logs] │ Tunnel established      │
│                         │ https://dev.chaycards.. │
│                         │                         │
│                         │ [tunnel connection logs]│
│                         │                         │
├─────────────────────────┼─────────────────────────┤
│ Notion PM               │ Control                 │
│                         │                         │
│ 🔄 Express server logs  │ 📊 All services running │
│                         │                         │
│ [webhook requests]      │ [commands & tips]       │
│                         │                         │
│                         │                         │
│                         │                         │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

## Key Features

### Live Logs
- **See everything at once** - No switching tabs
- **Auto-scroll** - Logs update in real-time
- **Color-coded** - Easy to spot errors

### Easy Navigation
- `Ctrl+B` then `←/→/↑/↓` - Move between panes
- `Ctrl+B` then `[` - Enter scroll mode (arrow keys to scroll, `q` to exit)
- `Ctrl+B` then `z` - Zoom current pane to fullscreen

### Simple Control
- **Stop everything**: Just press `Ctrl+C` anywhere
- **Close window**: All servers stop automatically
- **Detach**: `Ctrl+B` then `d` (servers keep running, reattach later)

## Why Tmux?

**Better than separate tabs:**
- 👀 See all logs simultaneously
- 🎯 Single window to manage
- ⚡ Faster to monitor issues
- 🛑 One Ctrl+C stops everything

**Better than background processes:**
- 📊 Visual feedback of what's happening
- 🐛 Instantly see errors
- 📝 No checking multiple log files
- 🔍 Easy to scroll back through history

## Getting Started

1. **Double-click:** `start-servers-tmux.bat`
2. **Wait 10s** for PostgreSQL to initialize
3. **Watch the logs** - you'll see when services are ready
4. **Navigate** with `Ctrl+B` + arrows if needed
5. **Stop** with `Ctrl+C` when done

That's it! All your development servers in one clean, organized view.
