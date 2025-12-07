# Vibe RAG Setup Instructions

This file tells Claude how to configure RAG for a new project using the Vibe system.

## For Claude Code

When asked to "set up vibe", "configure RAG", or "initialize this project for vibe":

### Step 1: Configure vibe.config.json

Edit `vibe.config.json` with project-specific settings:

1. **Set `projectName`** - unique identifier (lowercase, hyphens ok)
2. **Set `qdrant.collection`** - use `{projectName}-docs` format
3. **Configure `embedding.paths`** - glob patterns for files to index:
   - Documentation: `"memory-bank/**/*.md"`
   - Source code: `"src/**/*.ts"`, `"src/**/*.tsx"`
   - Exclusions: `"!node_modules/**"`, `"!dist/**"`
4. **Ask user for server URLs** if not on localhost (check if they have a remote infrastructure host)

Example configuration:
```json
{
  "enabled": false,
  "projectName": "my-project",
  "embedding": {
    "url": "http://localhost:8765",
    "paths": ["memory-bank/**/*.md", "src/**/*.ts", "!node_modules/**"]
  },
  "qdrant": {
    "url": "http://localhost:6333",
    "collection": "my-project-docs"
  }
}
```

### Step 2: Create Initial Memory Bank

Create the memory-bank structure:

```
memory-bank/
├── core/
│   └── activeContext.md    # Session state (required)
├── patterns/               # Code patterns
├── docs/                   # Feature specs, architecture
└── scripts/                # Embedding scripts (from template)
```

Create `memory-bank/core/activeContext.md`:

```markdown
# Active Context

**Last Updated**: [TODAY'S DATE]

## Current Focus
[Brief project description]

## In Progress
None - new project

## Environment Notes
- [Any relevant setup notes]

## Next Steps
1. [First priority]
```

### Step 3: Register Project (User Action Required)

Tell the user:

> **Action Required**: Register this project with the central watcher.
>
> Run one of these commands:
> ```bash
> # Option 1: Use CLI (if available)
> vibe add /path/to/this/project
>
> # Option 2: Edit projects.json directly
> # Add to ~/vibe_master/projects.json:
> {
>   "name": "my-project",
>   "path": "/full/path/to/this/project",
>   "enabled": true
> }
> ```
>
> The central watcher will automatically start scanning and embedding files.

### Step 4: Enable the Hook

Once the user confirms registration, set `"enabled": true` in vibe.config.json.

### Step 5: Verify Setup

Ask the user to test by sending a prompt. If working correctly:
- Hook should show: `[RAG Hook] Config: vibe.config.json, Collection: my-project-docs`
- Context should be injected into prompts

## Troubleshooting

### Hook Not Running?
- Check `enabled: true` in vibe.config.json
- Verify services are running: `curl http://localhost:6333/health`

### No Context Injected?
- Check if files are embedded: `node memory-bank/scripts/qdrant-client.js stats`
- Verify collection name matches config
- Check `.claude/hooks/.hook-debug.log` for errors

### Services Unavailable?
- Start infrastructure: `cd ~/vibe_master && docker-compose up -d`
- For remote servers, update URLs in vibe.config.json

## Config Reference

| Field | Description | Default |
|-------|-------------|---------|
| `enabled` | Enable/disable RAG hook | `false` |
| `projectName` | Unique project identifier | required |
| `embedding.url` | Embedding server URL | `http://localhost:8765` |
| `embedding.paths` | Glob patterns for files to embed | `["memory-bank/**/*.md"]` |
| `qdrant.url` | Qdrant server URL | `http://localhost:6333` |
| `qdrant.collection` | Collection name for this project | `{projectName}-docs` |
| `rag.topK` | Number of documents to retrieve | `20` |
| `rag.minScore` | Minimum similarity score | `0.5` |
| `rag.alwaysInclude` | Files always injected | `["memory-bank/core/activeContext.md"]` |