# Active Context

This file tracks the current session state for Claude Code. It provides continuity across context window resets.

**Last Updated**: 2024-12-07

## Current Focus

### Active Work
- Vibe Master RAG system operational and tested

### Branch
`lovable/first-mock`

## Recently Completed

### Session 2024-12-07 (RAG Pipeline Fixes)
- [x] Fixed embedding API mismatch (`{ text }` → `{ inputs }` for TEI server)
- [x] Fixed transcript parsing (nested `{ type, message: { role, content } }` format)
- [x] Fixed volume mounts for Docker on Windows (`/c/Users:/c/Users:ro`)
- [x] Fixed Qdrant health check endpoint (`/health` → `/healthz`)
- [x] Implemented semantic chunking with 413 retry/split logic
- [x] Added conversation history support via `transcript_path`
- [x] Added `maxConversationMessages` config option (default 10)
- [x] Pass 3 messages to embedding, all 10 to LLM curation
- [x] Pushed updates to both Vibe Master and ChayCards repos

### Session 2024-12-03 (Vibe Master Architecture)
- [x] Created `vibe.config.json` - per-project RAG configuration
- [x] Created `VIBE_SETUP.md` - instructions for Claude to configure new projects
- [x] Created `VIBE_MASTER_ARCHITECTURE.md` - full architecture documentation
- [x] Designed central watcher architecture (auto-scans all registered projects)

## RAG Pipeline Status

| Component | Status | Details |
|-----------|--------|---------|
| Qdrant | Running | 593 points in `chaycards_patterns` |
| Embedding | Running | TEI with BGE-large-en-v1.5 |
| Watcher | Running | Monitoring 42 files |
| Conversation | Working | 10 messages from transcript |

## Technical Decisions Made

1. **Conversation History**: 10 messages loaded, 3 for embedding, all 10 for LLM curation
2. **TEI API**: Uses `{ inputs: "..." }` field, returns `[[...]]` array
3. **Transcript Format**: Nested `{ type, message: { role, content } }` structure
4. **Semantic Chunking**: Splits by headers → paragraphs → sentences with context headers

## Environment Notes

- **WSL**: Claude operates here, Vite dev server on port 8080
- **Windows**: Electron runs natively
- **Mac Mini**: Qwen 70B via LM Studio at 192.168.1.58:1243
- **GPU Server**: Embedding server (BGE-large-en-v1.5) at localhost:8765
- **Qdrant**: Vector DB at localhost:6333

## Next Session Priorities

1. Continue with pending feature work (check features.json)
2. Test RAG with more complex queries
3. Consider tuning chunk sizes or embedding parameters