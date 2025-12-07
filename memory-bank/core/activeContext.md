# Active Context

This file tracks the current session state for Claude Code. It provides continuity across context window resets.

**Last Updated**: 2024-12-03

## Current Focus

### Active Work
- Vibe Master architecture complete - multi-project RAG system

### Branch
`lovable/first-mock`

## Recently Completed

### Session 2024-12-03 (Vibe Master)
- [x] Created `vibe.config.json` - per-project RAG configuration
- [x] Created `VIBE_SETUP.md` - instructions for Claude to configure new projects
- [x] Updated hook to read from vibe.config.json with fallbacks
- [x] Researched Qwen3-Next-80B optimal settings (temp 0.7, top_p 0.8, 262K context)
- [x] Created `VIBE_MASTER_ARCHITECTURE.md` - full architecture documentation
- [x] Designed central watcher architecture (auto-scans all registered projects)
- [x] Created `memory-bank-update.cjs` hook - triggered by "update memory bank" keywords
- [x] Registered memory-bank-update hook in settings.json

### Key Architectural Decisions
- **Central Watcher**: Daemon in vibe_master monitors `projects.json`, auto-embeds files
- **Per-Project Config**: `vibe.config.json` with `enabled: false` default
- **Hook Fallbacks**: Silent exit when disabled or services unavailable
- **Memory Bank Update Hook**: Keyword-triggered, injects update instructions (no RAG)

### Previous Session
- [x] AI system review and optimization (84% score)
- [x] Semantic chunking improvements in embed-patterns.js

## In Progress

None - Vibe Master architecture complete

## Blockers

None currently.

## Technical Decisions Made

1. **RAG Hook Architecture**: Multi-turn tool-calling agent using Qwen 70B for curation
2. **Streaming Disabled for Tools**: Qwen3-thinking model doesn't emit proper `tool_calls` in streaming mode
3. **Memory-Bank Purpose**: Patterns/docs for RAG retrieval + session state for continuity

## Environment Notes

- **WSL**: Claude operates here, Vite dev server on port 8080
- **Windows**: Electron runs natively
- **Mac Mini**: Qwen 70B via LM Studio at 192.168.1.58:1243
- **GPU Server**: Embedding server (BGE-large-en-v1.5) at localhost:8765
- **Qdrant**: Vector DB at localhost:6333

## Next Session Priorities

1. Continue with pending feature work (check features.json)
2. Update this file before session ends
3. Keep activeContext.md lean per memory-bank-management.md pattern
