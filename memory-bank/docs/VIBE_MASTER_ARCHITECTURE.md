# Vibe Master Architecture

## Overview

Vibe Master is a centralized infrastructure + template system for multi-project RAG-enhanced Claude Code development.

**Key Feature**: Central watcher automatically scans ALL registered projects - no manual `embed-patterns.js` runs needed!

## Directory Structure

```
vibe_master/
├── docker-compose.yml          # Shared infrastructure (Qdrant, Embedding, Watcher)
├── .env.example                 # Environment template
├── projects.json               # Registry of all project paths + configs
├── scripts/
│   ├── start-services.sh       # Start all services
│   ├── stop-services.sh        # Stop services
│   └── health-check.sh         # Verify services running
│
├── watcher/                     # Central file watcher service
│   ├── index.js                # Multi-project watcher daemon
│   ├── embedder.js             # Embedding logic
│   └── package.json            # Watcher dependencies
│
└── template/                    # COPY THIS TO NEW PROJECTS
    ├── .claude/
    │   └── hooks/
    │       └── user-prompt-submit.js   # RAG hook (disabled by default)
    │
    ├── memory-bank/
    │   ├── core/
    │   │   └── activeContext.md
    │   ├── patterns/
    │   └── docs/
    │
    ├── vibe.config.json                # Project RAG config
    └── VIBE_SETUP.md                   # Instructions for Claude
```

## Key Design Decisions

### 1. Central Watcher (Auto-Scanning)

**Problem**: Running `embed-patterns.js` manually for each project is tedious.

**Solution**: Central watcher daemon in vibe_master:

```
┌─────────────────────────────────────────────────────────────┐
│                    vibe_master/watcher                      │
│                                                             │
│  ┌─────────────┐    reads     ┌──────────────────┐         │
│  │ projects.json├────────────►│ Project Registry │         │
│  └─────────────┘              └────────┬─────────┘         │
│                                        │                    │
│         for each project:              ▼                    │
│    ┌───────────────────────────────────────────────┐       │
│    │  1. Read vibe.config.json from project path   │       │
│    │  2. Watch files matching embedding.paths      │       │
│    │  3. On change: embed → store in Qdrant        │       │
│    └───────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**projects.json** (in vibe_master root):
```json
{
  "projects": [
    {
      "name": "chaycards",
      "path": "/home/user/projects/chaycards",
      "enabled": true
    },
    {
      "name": "other-project",
      "path": "/home/user/projects/other",
      "enabled": true
    }
  ],
  "watchInterval": 60000,
  "debounceMs": 5000
}
```

**How it works**:
1. Watcher starts as Docker service (or systemd daemon)
2. Reads `projects.json` to get list of project paths
3. For each project, reads `vibe.config.json` for:
   - `enabled` flag (skip if false)
   - `embedding.paths` (glob patterns to watch)
   - `qdrant.collection` (where to store vectors)
4. Uses `chokidar` to watch all paths across all projects
5. On file change (debounced): re-embeds changed file → upserts to Qdrant
6. Periodic full scan (configurable) catches any missed changes

**Adding a new project**:
1. Copy template to new project
2. Edit `vibe.config.json` with project settings
3. Add project to `projects.json` in vibe_master (or use CLI: `vibe add /path/to/project`)
4. Watcher auto-discovers and starts scanning

### 2. Template Contains Everything Needed

The `template/` folder is **self-contained**. When copied to a new project:
- Hook is pre-configured but disabled
- Claude reads `VIBE_SETUP.md` to understand setup
- No manual scripts needed - watcher handles embedding

### 3. Hook Fallback Behavior

The hook gracefully handles unconfigured projects:

```javascript
// user-prompt-submit.js - Fallback logic
async function main() {
  // 1. Check if config exists
  const configPath = path.join(process.cwd(), 'vibe.config.json');
  if (!fs.existsSync(configPath)) {
    // Silent exit - no config, no RAG
    return { continueWithPrompt: true };
  }

  // 2. Check if enabled
  const config = JSON.parse(fs.readFileSync(configPath));
  if (!config.enabled) {
    // Silent exit - explicitly disabled
    return { continueWithPrompt: true };
  }

  // 3. Check if services are reachable
  try {
    await fetch(`${config.qdrant.url}/health`);
    await fetch(`${config.embedding.url}/health`);
  } catch {
    // Silent exit - services not running
    return { continueWithPrompt: true };
  }

  // 4. Proceed with RAG enhancement
  // ... rest of hook logic
}
```

### 5. Claude Can't Access External Paths

**Problem**: Claude operates within project directory, can't reach `vibe_master/`.

**Solution**: Template is fully self-contained. Everything Claude needs is INSIDE the project after copying the template.

Claude's responsibilities (all within project):
- Read `VIBE_SETUP.md` for instructions
- Edit `vibe.config.json` to configure project
- Tell user to register project in vibe_master

User's responsibilities (requires external access):
- Start services: `cd ~/vibe_master && docker-compose up -d`
- Copy template: `cp -r ~/vibe_master/template/* ./my-new-project/`
- Register project: `vibe add /path/to/project` (or edit projects.json)

### 6. Universal LLM Integration

Using OpenAI-compatible endpoint pattern (works with LM Studio, Ollama, LiteLLM, etc.):

```json
{
  "llm": {
    "baseUrl": "http://192.168.1.58:1234/v1",
    "model": "qwen3-70b",
    "apiKey": "not-needed"
  }
}
```

Any provider exposing `/v1/chat/completions` endpoint works automatically.

## vibe.config.json Specification

```json
{
  "$schema": "./vibe.schema.json",
  "enabled": false,
  "projectName": "my-project",

  "embedding": {
    "url": "http://localhost:8765",
    "model": "BAAI/bge-large-en-v1.5",
    "paths": [
      "memory-bank/**/*.md",
      "src/**/*.ts",
      "!node_modules/**"
    ],
    "chunkSize": 1500,
    "chunkOverlap": 200
  },

  "qdrant": {
    "url": "http://localhost:6333",
    "collection": "my-project-docs"
  },

  "llm": {
    "baseUrl": "http://192.168.1.58:1234/v1",
    "model": "qwen3-next-80b-a3b-instruct",
    "apiKey": "",
    "maxOutputTokens": 16384,
    "contextLength": 262144,
    "temperature": 0.7,
    "topP": 0.8,
    "topK": 20,
    "presencePenalty": 0.5,
    "useToolCalling": true,
    "streaming": false
  },

  "rag": {
    "topK": 20,
    "minScore": 0.5,
    "alwaysInclude": [
      "memory-bank/core/activeContext.md"
    ],
    "compressionTargetTokens": 800
  }
}
```

## Multi-Computer Setup

### First Computer (Infrastructure Host)

```bash
# 1. Clone vibe_master
git clone https://github.com/you/vibe_master.git ~/vibe_master

# 2. Configure environment
cp ~/vibe_master/.env.example ~/vibe_master/.env
# Edit .env: Set GPU device, ports, network interface

# 3. Start services
cd ~/vibe_master && docker-compose up -d

# Services now available at:
# - Qdrant: http://YOUR_IP:6333
# - Embedding: http://YOUR_IP:8765
# - LLM (if using LM Studio): http://YOUR_IP:1234
```

### Additional Computers (Clients)

```bash
# 1. Clone vibe_master (for template only)
git clone https://github.com/you/vibe_master.git ~/vibe_master

# 2. Copy template to new project
cp -r ~/vibe_master/template/* ./my-new-project/

# 3. Edit vibe.config.json - point to infrastructure host
{
  "embedding": { "url": "http://192.168.1.58:8765" },
  "qdrant": { "url": "http://192.168.1.58:6333" },
  "llm": { "baseUrl": "http://192.168.1.58:1234/v1" }
}

# 4. Ask Claude to complete setup
# Claude reads VIBE_SETUP.md and configures the project
```

## VIBE_SETUP.md (Claude's Instructions)

This file tells Claude how to configure a new project:

```markdown
# Vibe RAG Setup Instructions

## For Claude Code

When asked to "set up vibe" or "configure RAG" for this project:

### Step 1: Configure vibe.config.json

Edit `vibe.config.json` with project-specific settings:

1. Set `projectName` to a unique identifier (lowercase, hyphens ok)
2. Set `qdrant.collection` to `{projectName}-docs`
3. Configure `embedding.paths` for files to index:
   - Include documentation: `"memory-bank/**/*.md"`
   - Include source code: `"src/**/*.ts"`, `"src/**/*.tsx"`
   - Exclude dependencies: `"!node_modules/**"`
4. Ask user for server URLs if not on localhost

### Step 2: Create Initial Content

Create `memory-bank/core/activeContext.md`:

# Active Context

**Last Updated**: [DATE]

## Current Focus
[Project description]

## In Progress
None - new project

## Environment Notes
[Any setup notes]

### Step 3: Register Project (User Action)

Tell the user:
> "Please register this project in vibe_master by running:
> `vibe add /path/to/this/project`
> Or add it manually to `~/vibe_master/projects.json`"

The central watcher will automatically start scanning and embedding files.

### Step 4: Enable the Hook

Set `"enabled": true` in vibe.config.json

### Step 5: Verify

Ask user to test by sending a prompt. RAG context should appear.
```

## Service Health Checks

The hook verifies services before attempting RAG:

| Service | Health Endpoint | Timeout |
|---------|-----------------|---------|
| Qdrant | `GET /health` | 2s |
| Embedding | `GET /health` | 2s |
| LLM | `GET /v1/models` | 5s |

If any service is unreachable, hook silently passes through without RAG enhancement.