# Fresh Clone Setup Guide

Quick reference for setting up ChayCards after cloning on a new machine.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd ChayCards-Lovable
npm install
```

### 2. Add Your Credentials

Create these files from their `.example` templates:

#### **Required:**
- `cloudflared-credentials.json` - Cloudflare tunnel for API access
- `.env` - Environment variables (see `.env.example`)
- `server/.env` - Server config (see `server/.env.example`)

#### **Optional (if using Notion PM sync):**
- `.notion-token` - Your Notion API key

### 3. Start Development

```bash
# Start all services (Docker)
./start-dev.sh         # WSL/Linux/Mac
# or
start-dev.bat          # Windows

# In separate terminal: Start Vite dev server
npm run dev

# Open app
http://localhost:8080
```

---

## 📋 Required Files Checklist

### Cloudflare Tunnel Credentials

**File:** `cloudflared-credentials.json`  
**Template:** `cloudflared-credentials.json.example`

```json
{
  "AccountTag": "your_account_tag_here",
  "TunnelSecret": "your_tunnel_secret_here",
  "TunnelID": "your_tunnel_id_here",
  "Endpoint": ""
}
```

**How to get:**
1. Login to Cloudflare Zero Trust dashboard
2. Navigate to Networks > Tunnels
3. Create tunnel or view existing tunnel credentials
4. Copy the credentials JSON

### Environment Variables

**File:** `.env` (root directory)

```env
# Supabase (if using cloud storage)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Notion (if using Notion PM sync)
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
```

**File:** `server/.env` (server directory)

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/chaycards

# API Config
PORT=3101
NODE_ENV=development

# Storage
STORAGE_PATH=./storage
```

---

## 🔧 Platform-Specific Setup

### Windows

1. **Install Dependencies:**
   - Docker Desktop
   - Node.js 18+ (LTS)
   - Git for Windows (includes Git Bash)

2. **Run from Windows:**
   ```cmd
   start-dev.bat
   ```

3. **Electron Development:**
   - WSL: `npm run dev` (Vite server)
   - Windows: `npm run electron:win` (Electron app)

### macOS

1. **Install Dependencies:**
   ```bash
   brew install docker node git
   ```

2. **Run:**
   ```bash
   ./start-dev.sh
   ```

### Linux / WSL

1. **Install Dependencies:**
   ```bash
   # Docker
   sudo apt-get update
   sudo apt-get install docker.io docker-compose

   # Node.js (via nvm recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Run:**
   ```bash
   ./start-dev.sh
   ```

---

## 🗂️ What Gets Preserved vs Ignored

### ✅ Committed (Shared Across Clones)

- Source code (`/src`, `/electron`, `/server`)
- Configuration templates (`*.example`)
- Scripts (`/scripts`)
- Documentation (`/memory-bank`, `*.md`)
- Package definitions (`package.json`, `package-lock.json`)
- Docker configs (`docker-compose.yml`, `Dockerfile`)
- VSCode shared settings (`.vscode/extensions.json`)

### ❌ Ignored (Machine-Specific)

- Credentials (`cloudflared-credentials.json`, `.env`, `*.pem`)
- Node modules (`node_modules/`, `node_modules_win/`)
- Build outputs (`dist/`, `out/`, `release/`)
- Database files (`*.db`, `postgres-data/`)
- Docker volumes (`qdrant-data/`, `docker-data/`)
- IDE workspace files (`*.code-workspace`, `.idea/workspace.xml`)
- OS files (`.DS_Store`, `Thumbs.db`, `desktop.ini`)
- Cache directories (`.cache/`, `.parcel-cache/`)
- User data (`/user-data/`, `*.user.json`)
- RAG embeddings (`qdrant_storage/`, `venv-embedding/`)

---

## 🧪 Verify Setup

```bash
# Check all services are healthy
npm run check:services

# Expected output:
# ✓ PostgreSQL (5433)
# ✓ Express API (3101)
# ✓ Qdrant (6333)
# ✓ Embedding (8765)
# ✓ Notion PM (3001)
# ✓ Cloudflare Tunnel (api.chaycards.com)
```

---

## 🐛 Troubleshooting

### "Cloudflare tunnel not connecting"

```bash
# Check credentials file exists
ls -la cloudflared-credentials.json

# Verify Docker service is running
docker ps | grep cloudflared

# Check tunnel logs
npm run docker:logs:cloudflared
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
PGPASSWORD=postgres psql -U postgres -h localhost -p 5433 -d chaycards -c "SELECT 1;"
```

### "Port already in use"

```bash
# Find what's using the port (example: 3101)
# Linux/Mac:
lsof -i :3101

# Windows:
netstat -ano | findstr :3101

# Kill the process or change port in server/.env
```

### "Docker services won't start"

```bash
# Stop everything
npm run stop

# Remove orphaned containers
docker-compose down --remove-orphans

# Start fresh
./start-dev.sh
```

---

## 📚 Next Steps

1. **Read the docs:**
   - [DOCKER-SETUP.md](DOCKER-SETUP.md) - Docker services guide
   - [scripts/LOGGING.md](scripts/LOGGING.md) - Log viewing guide
   - [CLAUDE.md](CLAUDE.md) - Project overview

2. **Install recommended tools:**
   - [Lazydocker](https://github.com/jesseduffield/lazydocker) - Docker TUI
   - [VS Code](https://code.visualstudio.com/) - Recommended editor

3. **Start coding:**
   ```bash
   npm run dev        # Start Vite
   npm run dev:electron  # Start Electron
   ```

---

## 💡 Pro Tips

- **Use Lazydocker:** `npm run docker:ui` for easy log viewing
- **Check logs often:** `npm run logs:errors` catches issues early
- **Keep credentials safe:** Never commit `cloudflared-credentials.json` or `.env`
- **Use templates:** Copy `.example` files when you need new configs
- **Platform scripts:** Use `start-dev.bat` on Windows, `start-dev.sh` on Unix
- **Dual environment:** WSL runs Vite, Windows runs Electron (best compatibility)

---

**Happy vibe coding! 🎉**
