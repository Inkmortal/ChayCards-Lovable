# ChayCards Server Architecture

Complete documentation of all backend services and databases.

## Overview

ChayCards has **THREE categories of infrastructure**:

### 1. Local Storage (Electron-only, not a server)
- **Local SQLite** - `storage.db` in user data directory (better-sqlite3)
- Used for `local` and `sync` storage modes
- No server required, embedded in Electron

### 2. Product Servers (Required when using cloud mode)
- **PostgreSQL** (port 5433) - Cloud storage database
- **Express API** (port 3101) - REST API for cloud storage & auth

### 3. Development Servers (Required for Vibe Coding)
- **Qdrant** (ports 6333-6334) - Vector database for RAG
- **Embedding Server** (port 8765) - Semantic embeddings
- **LLM Compressor** (port 1243) - Mac Mini Qwen 70B
- **Notion PM Sync** (port 3001) - Task tracking integration

---

## STORAGE SYSTEMS

### Local SQLite (Electron)

**What it does:** Embedded database for local-only and sync modes.

**Technology:** better-sqlite3 (synchronous SQLite)

**Location:** `{userData}/storage.db`
- Windows: `%APPDATA%/ChayCards/storage.db`
- Mac: `~/Library/Application Support/ChayCards/storage.db`
- Linux: `~/.config/ChayCards/storage.db`

**Tables:**
```sql
-- Local user profiles
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  profile_name TEXT NOT NULL UNIQUE,
  storage_mode TEXT NOT NULL DEFAULT 'local',
  has_password INTEGER DEFAULT 0,
  password_hash TEXT,
  installed_plugins TEXT,  -- JSON array
  enabled_plugins TEXT,    -- JSON array
  created_at INTEGER,
  last_used_at INTEGER
);

-- Local storage (user-scoped)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value TEXT NOT NULL,        -- JSON string
  user_id TEXT NOT NULL,
  updated_at INTEGER,
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Binary files for entities
CREATE TABLE files (
  storage_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  file_data BLOB NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);
```

**Access:** Via Electron IPC (`window.electronAPI.storage.*`)

**Files:**
- [electron/database.cjs](../../electron/database.cjs) - Database manager
- [src/shared/storage/SQLiteAdapter.ts](../../src/shared/storage/SQLiteAdapter.ts) - Frontend adapter

**Storage Modes:**
- `local` - All data in SQLite only
- `sync` - SQLite + periodic cloud backup (future)
- `cloud` - Uses PostgreSQL server instead

---

## PRODUCT SERVERS

### PostgreSQL Database (Port 5433)

**What it does:** Cloud storage database (same schema as local SQLite).

**Technology:** PostgreSQL 15 with native JSONB support

**Tables:**
```sql
-- Cloud user accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt
  storage_mode VARCHAR(10) DEFAULT 'cloud',
  installed_plugins JSONB DEFAULT '[]'::jsonb,
  enabled_plugins JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cloud storage (user-scoped)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value JSONB NOT NULL,  -- Native JSONB (not TEXT)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (key, user_id)
);

-- Binary files
CREATE TABLE files (
  storage_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,  -- Binary data
  metadata JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);
```

**Key Differences from SQLite:**
- Uses UUID instead of TEXT for user IDs
- Native JSONB (not serialized strings)
- BYTEA for binary data (not BLOB)
- Timestamp types instead of INTEGER

**Environment:**
```bash
DATABASE_URL=postgresql://postgres:dev@localhost:5433/chaycards
```

**Health:**
```bash
docker exec chaycards-postgres pg_isready
```

**File:** [server/docker-compose.yml](../../server/docker-compose.yml)

---

### Express Storage API (Port 3101)

**What it does:** REST API for cloud storage, authentication, and file management.

**Technology:** Express.js + pg (PostgreSQL client)

**Key Endpoints:**

#### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/verify` - Verify JWT

#### Storage (JWT required)
- `GET /api/storage/:key` - Get value
- `PUT /api/storage/:key` - Set value (with optional files)
- `DELETE /api/storage/:key` - Delete value
- `GET /api/storage` - List keys (optional prefix filter)
- `DELETE /api/storage` - Clear all (danger!)

**Environment:**
```bash
DATABASE_URL=postgresql://postgres:dev@localhost:5433/chaycards
PORT=3101
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

**Health:**
```bash
curl http://localhost:3101/api/health
```

**File:** [server/index.js](../../server/index.js) (593 lines)

---

## DEVELOPMENT SERVERS

### Qdrant Vector Database (Ports 6333-6334)

**Category:** Development (RAG System)

**What it does:** Stores 1024-dim embeddings for semantic search of memory-bank docs.

**Collections:**
- `chaycards-memory-bank` - All memory-bank/*.md files

**Data:** `./qdrant_storage/` (git-ignored)

**Health:**
```bash
curl http://localhost:6333/health
```

**File:** [docker-compose.qdrant.yml](../../docker-compose.qdrant.yml)

---

### Embedding Server (Port 8765)

**Category:** Development (RAG System)

**What it does:** Generates 1024-dim embeddings using BAAI/bge-large-en-v1.5.

**Technology:** Python FastAPI + sentence-transformers

**Device:** CUDA (GPU) or CPU (auto-detected)

**Endpoints:**
- `GET /health`
- `POST /embed` - Single text → 1024 floats
- `POST /embed-batch` - Multiple texts (efficient)

**Health:**
```bash
curl http://localhost:8765/health
```

**Status:** ⚠️ **UNTESTED**

**File:** [memory-bank/scripts/embedding-server.py](../../memory-bank/scripts/embedding-server.py)

---

### LLM Compressor (Mac Mini:1243)

**Category:** Development (RAG System) - External

**What it does:** Compresses top 20 Qdrant results into 300-800 token reminders.

**Endpoint:** `http://192.168.1.58:1243/v1/chat/completions`

**Model:** Qwen 70B

**Purpose:** Prevents code duplication, calls out deprecated patterns

**File:** [memory-bank/scripts/llm-compressor.js](../../memory-bank/scripts/llm-compressor.js)

---

### Notion PM Sync (Port 3001)

**Category:** Development (Project Management)

**What it does:** Syncs YOUR task progress to Notion database.

**Technology:** Express.js + @notionhq/client

**Endpoints:**
- `GET /health`
- `POST /api/notion-pm/sync` - Full sync or single page

**Environment:**
```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_PM_PORT=3001
NOTION_PM_API_KEY=dev-secret-key-change-in-production
```

**Cloudflare Tunnel:**
```bash
cloudflared tunnel run chaycards-api
# → https://dev.chaycards.com/api/notion-pm/sync
```

**File:** [scripts/notion-pm-server.ts](../../scripts/notion-pm-server.ts)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│           ChayCards Electron App             │
│                                              │
│  ┌─────────────┐         ┌────────────────┐ │
│  │   Local     │         │  Cloud Mode    │ │
│  │   Mode      │         │  (needs API)   │ │
│  │             │         │                │ │
│  │  SQLite     │         │  PostgreSQL    │ │
│  │  Adapter    │         │  Adapter       │ │
│  └──────┬──────┘         └───────┬────────┘ │
│         │                        │          │
│         ▼                        ▼          │
│  ┌─────────────┐         ┌────────────────┐ │
│  │ Electron    │         │  Express API   │ │
│  │ IPC         │         │  http://3101   │ │
│  │ Handler     │         │                │ │
│  └──────┬──────┘         └───────┬────────┘ │
│         │                        │          │
│         ▼                        ▼          │
│  ┌─────────────┐         ┌────────────────┐ │
│  │ storage.db  │         │  PostgreSQL    │ │
│  │ (userData)  │         │  :5433         │ │
│  └─────────────┘         └────────────────┘ │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│         Claude Code RAG Pipeline             │
│                                              │
│  User Prompt                                 │
│       │                                      │
│       ▼                                      │
│  Embedding Server (8765)                     │
│       │                                      │
│       ▼                                      │
│  Qdrant (6333-6334)                          │
│       │                                      │
│       ▼                                      │
│  LLM Compressor (Mac:1243)                   │
│       │                                      │
│       ▼                                      │
│  Context Injection → Claude                  │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│         Project Management (Optional)        │
│                                              │
│  Notion PM Sync (3001)                       │
│       │                                      │
│       ▼                                      │
│  Notion Database (cloud)                     │
└──────────────────────────────────────────────┘
```

---

## Current Startup (Manual)

```bash
# Product Servers
docker-compose -f server/docker-compose.yml up -d  # PostgreSQL
cd server && node index.js                         # Express API

# Dev Servers
docker-compose -f docker-compose.qdrant.yml up -d  # Qdrant
python memory-bank/scripts/embedding-server.py     # Embedding
npm run notion-pm:server                           # Notion PM

# Frontend
npm run dev                                         # Vite
# (Electron separately on Windows)
```

**Problems:**
- ❌ 6 separate commands
- ❌ Can't view logs from Claude/WSL
- ❌ Not portable
- ❌ Mixing product + dev servers

---

## Proposed Docker Solution

```bash
# Start all services
docker-compose up -d

# Or use profiles
docker-compose --profile product up -d  # Just product servers
docker-compose --profile dev up -d       # Just dev servers

# View logs from WSL
docker logs -f chaycards-api
docker logs -f chaycards-embedding

# Restart
docker restart chaycards-api

# Stop all
docker-compose down
```

**Services to containerize:**
- PostgreSQL ✅ (done)
- Express API → Docker
- Qdrant ✅ (done)
- Embedding Server → Docker (CPU fallback)
- Notion PM → Docker

**Not containerized:**
- Local SQLite (embedded in Electron)
- Vite (needs file watching)
- Electron (host OS)
- LLM Compressor (external Mac)

---

## Environment Variables

```bash
# Product Servers
DATABASE_URL=postgresql://postgres:dev@localhost:5433/chaycards
PORT=3101
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:8080,http://localhost:5173

# Dev Servers
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_PM_PORT=3001
NOTION_PM_API_KEY=dev-secret-key-change-in-production
```

---

## Storage Mode Comparison

| Mode | Database | Requires Servers | Use Case |
|------|----------|------------------|----------|
| `local` | SQLite (Electron) | ❌ None | Offline, single-device |
| `sync` | SQLite + PostgreSQL | ✅ Express API | Multi-device (future) |
| `cloud` | PostgreSQL only | ✅ Express API | Always online |

---

## Testing Status

| Service | Type | Tested |
|---------|------|--------|
| Local SQLite | Storage | ✅ |
| PostgreSQL | Storage | ✅ |
| Express API | Product | ✅ |
| Qdrant | Dev | ✅ |
| Embedding | Dev | ⚠️ |
| LLM Compressor | Dev | ✅ |
| Notion PM | Dev | ✅ |