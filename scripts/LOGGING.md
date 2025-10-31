# Docker Logging Guide

This guide explains how to view and manage Docker container logs for ChayCards.

## Quick Commands

```bash
npm run logs             # Interactive log viewer menu
npm run logs:errors      # Show only errors from all services
npm run logs:tail        # Last 100 lines from all services
npm run docker:ui        # Lazydocker TUI (recommended!)
```

## Option 1: Lazydocker (Recommended) 🚀

**Lazydocker** is a terminal UI for Docker that makes log viewing easy and interactive.

### Installation

**Windows (via Scoop):**
```bash
scoop install lazydocker
```

**Mac:**
```bash
brew install lazydocker
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash
```

### Usage

```bash
npm run docker:ui
# OR
lazydocker
```

**Features:**
- ✅ Real-time container stats (CPU, memory, network)
- ✅ View logs with one click (press `l`)
- ✅ Restart containers (press `r`)
- ✅ Stop/start containers (press `s`)
- ✅ Mouse support and keyboard shortcuts
- ✅ Color-coded output
- ✅ Filter logs by service
- ✅ Follow logs in real-time

**Navigation:**
- Arrow keys: Move between containers
- `l`: View logs
- `r`: Restart container
- `s`: Stop/start container
- `d`: Remove container
- `q`: Quit

## Option 2: Interactive Menu

Use the built-in interactive menu for quick log access:

```bash
# Linux/Mac/WSL
bash scripts/view-logs.sh

# Windows
scripts\view-logs.bat

# Or via npm
npm run logs
```

**Menu Options:**
1. View all logs (follow live)
2. View all logs (last 100 lines)
3. API logs (port 3101)
4. PostgreSQL logs (port 5433)
5. Qdrant logs (ports 6333-6334)
6. Embedding server logs (port 8765)
7. Notion PM logs (port 3001)
8. Cloudflare tunnel logs
9. Errors only (all services)
10. Warnings and errors only

## Option 3: Individual Service Logs

View logs for a specific service:

```bash
npm run docker:logs:api          # Express API
npm run docker:logs:postgres     # PostgreSQL
npm run docker:logs:qdrant       # Vector database
npm run docker:logs:embedding    # Embedding server
npm run docker:logs:notion       # Notion PM sync
npm run docker:logs:cloudflared  # Cloudflare tunnel
```

## Option 4: Command Line

### View All Logs
```bash
docker-compose logs                # All logs (snapshot)
docker-compose logs -f             # Follow all logs (live)
docker-compose logs --tail=100     # Last 100 lines
docker-compose logs --timestamps   # Include timestamps
```

### View Specific Service
```bash
docker logs chaycards-api              # API logs (snapshot)
docker logs -f chaycards-api           # Follow API logs (live)
docker logs --tail=50 chaycards-api    # Last 50 lines
```

### Filter Logs
```bash
# Errors only
docker-compose logs 2>&1 | grep -i error

# Warnings and errors
docker-compose logs 2>&1 | grep -i -E 'error|warn'

# Specific pattern
docker-compose logs 2>&1 | grep "CORS"
```

## Log Files and Rotation

Docker containers are configured with automatic log rotation:

- **Max size per file:** 10MB
- **Max files kept:** 3 files
- **Total max size:** 30MB per container

Logs are stored at:
- **Linux/Mac:** `/var/lib/docker/containers/<container-id>/<container-id>-json.log`
- **Windows:** `C:\ProgramData\Docker\containers\<container-id>\<container-id>-json.log`

## Troubleshooting

### No Logs Showing

Check if containers are running:
```bash
docker ps
```

If no containers are listed, start them:
```bash
npm run docker:up
# or
./start-dev.sh
```

### Too Many Logs

Filter by error level:
```bash
npm run logs:errors        # Errors only
npm run logs:tail          # Recent logs only
```

Or use lazydocker to view logs interactively with filtering.

### Container Keeps Restarting

Check logs for errors:
```bash
docker logs chaycards-api --tail=50
```

Look for error messages like:
- `Error: Cannot connect to database`
- `Fatal: Port already in use`
- `ECONNREFUSED`

### Logs Not Updating

Restart the container:
```bash
docker restart chaycards-api
```

## Best Practices

1. **Use Lazydocker** for daily development - it's the easiest way to monitor all services
2. **Check errors first** - Use `npm run logs:errors` when something breaks
3. **Follow specific services** - Don't watch all logs at once, focus on what you're debugging
4. **Use timestamps** - Add `--timestamps` flag when investigating timing issues
5. **Limit output** - Use `--tail=N` to avoid overwhelming output

## Service-Specific Tips

### API Server (port 3101)
Look for:
- CORS errors
- Database connection issues
- JWT authentication failures
- Route errors

```bash
npm run docker:logs:api
```

### PostgreSQL (port 5433)
Look for:
- Connection pool exhaustion
- Slow query warnings
- Deadlock errors

```bash
npm run docker:logs:postgres
```

### Embedding Server (port 8765)
Look for:
- GPU/CPU initialization messages
- Model loading errors
- Timeout errors

```bash
npm run docker:logs:embedding
```

### Cloudflare Tunnel
Look for:
- Tunnel connection status
- DNS resolution errors
- Certificate issues

```bash
npm run docker:logs:cloudflared
```

## Quick Reference Card

| Task | Command |
|------|---------|
| Interactive viewer | `npm run logs` |
| TUI (recommended) | `npm run docker:ui` |
| Errors only | `npm run logs:errors` |
| Recent logs | `npm run logs:tail` |
| API logs | `npm run docker:logs:api` |
| All logs (live) | `docker-compose logs -f` |
| Specific service | `docker logs -f <container-name>` |
| Last N lines | `docker logs --tail=N <container-name>` |
