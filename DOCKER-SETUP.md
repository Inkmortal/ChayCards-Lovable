# ChayCards Docker Setup

Unified Docker setup for all ChayCards backend services. Works on **Windows, Mac, and Linux**.

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Git (to clone the repo)

### 2. First-Time Setup

**Linux/Mac/WSL:**
```bash
./start-dev.sh
```

**Windows:**
```batch
start-dev.bat
```

This will:
- Copy `.env.example` to `.env` (edit with your API keys)
- Start all Docker services
- Show service URLs

### 3. Configure Environment

Edit `.env` and add your API keys:
```bash
# Required for Notion PM sync
NOTION_API_KEY=secret_xxxxxxxxxxxxx
```

### 4. Start Development

```bash
npm run dev              # Start Vite dev server (port 8080)
npm run check:services   # Verify all services are healthy
```

---

## Services

### Product Servers (Required for cloud mode)
- **PostgreSQL** (5433) - Cloud storage database
- **Express API** (3101) - REST API for auth & storage
- **Cloudflare Tunnel** - Exposes API to `api.chaycards.com`

### Development Servers (Required for vibe coding)
- **Qdrant** (6333-6334) - Vector database for RAG
- **Embedding Server** (8765) - Semantic embeddings (GPU/CPU)
- **Notion PM** (3001) - Task progress sync

---

## NPM Commands

### Docker Management
```bash
npm run docker:up            # Start all services
npm run docker:up:product    # Start only product servers
npm run docker:up:dev        # Start only dev servers
npm run docker:down          # Stop all services
npm run docker:restart       # Restart all services
npm run docker:rebuild       # Rebuild and restart
```

### Logs
```bash
npm run docker:ui            # Lazydocker TUI (recommended!)
npm run logs                 # Interactive log menu
npm run logs:errors          # Show only errors
npm run logs:tail            # Last 100 lines from all services
npm run docker:logs          # View all logs (follow live)
npm run docker:logs:api      # View Express API logs
npm run docker:logs:postgres # View PostgreSQL logs
npm run docker:logs:qdrant   # View Qdrant logs
npm run docker:logs:embedding # View embedding server logs
npm run docker:logs:notion   # View Notion PM logs
npm run docker:logs:cloudflared # View Cloudflare tunnel logs
```

**See [scripts/LOGGING.md](scripts/LOGGING.md) for detailed logging guide.**

### Health Checks
```bash
npm run check:services       # Check all service health
```

---

## Manual Docker Commands

### Start specific profiles
```bash
docker-compose --profile product up -d  # Product servers only
docker-compose --profile dev up -d      # Dev servers only
docker-compose --profile all up -d      # Everything
```

### View logs
```bash
docker logs -f chaycards-api        # Express API
docker logs -f chaycards-postgres   # PostgreSQL
docker logs -f chaycards-qdrant     # Qdrant
docker logs -f chaycards-embedding  # Embedding server
docker logs -f chaycards-notion-pm  # Notion PM
```

### Restart a service
```bash
docker restart chaycards-api
```

### Rebuild a service
```bash
docker-compose up -d --build api
```

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| PostgreSQL | `localhost:5433` | Cloud storage database |
| Express API | `http://localhost:3101` | REST API + health check |
| Qdrant | `http://localhost:6333` | Vector search |
| Embedding | `http://localhost:8765` | Semantic embeddings |
| Notion PM | `http://localhost:3001` | Task sync |
| Public API | `https://api.chaycards.com` | Cloudflare tunnel to API |

---

## Storage Modes

ChayCards supports three storage modes:

### Local Mode (Default)
- Uses SQLite embedded in Electron
- No servers required
- Perfect for offline use

### Cloud Mode
- Uses PostgreSQL + Express API
- Requires product servers running
- Data synced to cloud

### Sync Mode (Future)
- SQLite + periodic cloud backup
- Best of both worlds

**To use cloud mode:** Product servers must be running (`docker-compose --profile product up -d`)

---

## Troubleshooting

### "Docker is not running"
1. Start Docker Desktop
2. Wait for it to fully initialize
3. Run `docker info` to verify

### "Port already in use"
Check what's using the port:
```bash
# Linux/Mac/WSL
lsof -i :3101

# Windows (PowerShell)
netstat -ano | findstr :3101
```

Kill the process or change the port in `.env`

### "Cannot connect to database"
```bash
# Check if PostgreSQL is healthy
docker exec chaycards-postgres pg_isready

# View logs
docker logs chaycards-postgres
```

### Embedding server failing to start
The embedding server auto-detects GPU/CPU. If it fails:
1. Check logs: `docker logs chaycards-embedding`
2. GPU errors are normal if no NVIDIA GPU present
3. It will fall back to CPU (slower but works)

### Reset everything
```bash
docker-compose down -v      # Stop and remove volumes
rm -rf qdrant_storage/      # Clear vector database
docker-compose up -d --build # Rebuild and restart
```

---

## GPU Support (Optional)

To enable GPU acceleration for the embedding server:

1. Install [nvidia-docker](https://github.com/NVIDIA/nvidia-docker)
2. Uncomment GPU section in `docker-compose.yml`:
   ```yaml
   embedding:
     # ... other config ...
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```
3. Restart: `docker-compose up -d --build embedding`

---

## Cross-Platform Notes

### Windows
- Use `start-dev.bat` or PowerShell commands
- Docker Desktop must be running
- WSL2 backend recommended

### Mac
- Use `start-dev.sh` or npm commands
- Docker Desktop must be running
- ARM64 (M1/M2) fully supported

### Linux
- Use `start-dev.sh` or npm commands
- Docker Engine or Docker Desktop
- Native performance (fastest)

---

## What Gets Containerized?

**✅ In Docker:**
- PostgreSQL
- Express API
- Qdrant
- Embedding Server
- Notion PM Sync

**❌ Not in Docker:**
- SQLite (embedded in Electron)
- Vite dev server (needs file watching)
- Electron app (runs on host)
- LLM Compressor (external Mac Mini)

---

## Production Deployment

For production, update `.env`:
```bash
DATABASE_URL=postgresql://user:pass@prod-host:5432/chaycards
JWT_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://yourdomain.com
NOTION_API_KEY=<production-key>
```

Then deploy with:
```bash
docker-compose --profile all up -d --build
```

Consider using:
- Railway (PostgreSQL + Express API)
- Render (full stack)
- Fly.io (global deployment)

---

## Need Help?

1. Check service health: `npm run check:services`
2. View logs: `npm run docker:logs`
3. Reset everything: `docker-compose down -v && docker-compose up -d --build`
