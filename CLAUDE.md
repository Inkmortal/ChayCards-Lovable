# CLAUDE.md

## Project: ChayCards

ChayCards is an all-in-one digital workspace combining document management, task tracking, and knowledge retention. Built as an Electron application using React, TypeScript, and TailwindCSS.

### Core Systems
- **Plugin System**: Modular, plugin-driven architecture with dynamic loading
- **Document Management**: File-based storage with version history
- **Knowledge Management**: AI-powered analysis with spaced repetition learning
- **Event System**: Local event bus for plugin communication
- **Storage**: SQLite metadata + file system operations

### Key Commands
- `npm run dev` - Start web dev server (WSL)
- `npm run dev:electron` - Start Electron with dev server (WSL)
- `npm run electron:win` - Run Electron from Windows
- `npm run lint` - Run ESLint
- `npm run build` - Build for production

### Development Environment

**Dual Environment Setup (WSL + Windows)**:
- **WSL**: Claude operates here, running Vite dev server (port 8080)
- **Windows**: Electron runs natively for proper UI rendering
- **Why?**: Node modules compiled for Linux won't work on Windows and vice versa

**Quick Start:**
1. From WSL: `npm run dev`
2. From Windows: Double-click `start-electron-windows.bat` (auto-installs deps first run)

### Project Structure
- `/src` - React application source
- `/electron` - Electron main and preload scripts
- `/memory-bank` - Project documentation (RAG embedded)
- `/node_modules` - WSL/Linux dependencies
- `/node_modules_win` - Windows dependencies (git-ignored)

### Critical Standards

**Platform Detection**:
Always use `src/utils/platform.ts` for platform detection. NEVER check `window.electronAPI` directly.

```typescript
// ✅ CORRECT
import { isElectron, isWeb, isCapacitor } from '@/utils/platform';

if (isElectron()) {
  await window.electronAPI.storage.get(key);
}

// ❌ WRONG
if (window.electronAPI !== undefined) {  // DON'T DO THIS
  //...
}
```

**Git Commit Policy**:
- NO "Generated with Claude Code" footer
- NO "Co-Authored-By: Claude" footer
- Keep commit messages clean and professional

### Memory Bank & RAG

The `memory-bank/` directory contains project documentation organized for RAG retrieval:
- `core/` - Project brief
- `tools/` - MCP guides, agent instructions
- `patterns/` - Code patterns (React, Storage, Plugins, Architecture)
- `docs/` - Feature specs, architecture, setup guides
- `product-management/` - Bug tracking, feature planning

**RAG Hook**: Your prompts are enhanced with relevant context from memory-bank via:
1. Embedding generation (GPU: BAAI/bge-large-en-v1.5)
2. Vector search (Qdrant: top 20 similar docs)
3. LLM compression (Mac Mini Qwen 70B: 300-800 tokens)
4. Contextual injection (only relevant patterns)

This means: Don't include everything in every prompt. The RAG system retrieves what's relevant.

### Agent Usage

See `@memory-bank/coreInstructions.md` for agent orchestration guidelines.

**Key principle**: Main Claude orchestrates, agents complete focused tasks.

**When to use agents**:
- Before coding: `context-researcher` (understand patterns)
- After coding: `code-reviewer` (catch mistakes)
- Before committing: `security-reviewer` + `git-workflow-manager`
- For bugs: `root-cause-debugger`
- After refactoring: `code-cleanup-refactor`

**Never restart Vite** - User handles server restarts. Always use `frontend-qa-tester` agent for UI testing.
