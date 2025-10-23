# Progress

## What Works

### ✅ Foundation Setup
- Dual-platform support (Electron + Web)
- Basic routing with React Router
- Platform detection (shows "Running in Electron/Web mode")
- Development environment configured
- Hot reload working in both modes

### ✅ Project Structure
- Clean separation of concerns
- Shared code in `src/shared/`
- Renderer code in `src/renderer/`
- Platform adapters implemented
- All necessary directories created

### ✅ Build Configuration
- Vite configured for web development
- Electron configured with proper entry points
- TypeScript compilation working
- TailwindCSS styling functional
- Path aliases configured (`@/`)

### ✅ Plugin System Implementation (100% COMPLETE - October 6, 2025)
- PluginManager singleton with Vite glob imports for automatic plugin discovery (687 lines)
- Component/service namespacing (`plugin-id/ComponentName`)
- EventBus for plugin communication
- Component registry pattern established
- Game-mod inspired approach successfully implemented
- Region system (header, sidebar, main, footer)
- Auto-navigation generation from plugin routes
- Pre-React plugin loading in main.tsx ensures themes apply before render
- `publicSafe` metadata for anonymous user support
- User plugin preferences (enabled_plugins vs installed_plugins)
- HMR support for plugin development
- Dependency resolution with topological sort
- Lifecycle hooks: `onLoad` and `onPluginsReady`
- CLAUDE.md files created for AI guidance
- EVENT_BUS_ARCHITECTURE.md documented
- Python backend support added to plugin architecture
- Live2D AI Assistant plugin feasibility confirmed

### ✅ Theme System Plugin (COMPLETE - October 5, 2025)
- 7 theme variants implemented: Catppuccin (Latte/Frappé), Dracula, Tokyo Night, Gruvbox, Nord, Rose Pine
- CSS custom properties system with localStorage persistence
- Theme selector dropdown integrated into homepage header
- Event-driven theme changes with real-time updates
- ThemeService with theme change listeners and notifications
- **Pure Database Architecture (October 5, 2025)**:
  - Eliminated all in-memory caches (Map/Set) - prevents memory leaks
  - Single source of truth: `core-theme:all-themes` key in database
  - All operations async with Promise returns
  - React hooks handle async initialization (useState + useEffect)
  - Client-side filtering with useMemo for UI responsiveness
  - Source field (`'plugin' | 'custom'`) replaces ID prefix checking
  - Hot reload duplicate prevention via DB checks
  - Memory leak vulnerability eliminated

### ✅ Enhanced User Experience
- Smart platform-aware routing (Desktop vs Web)
- Setup page with deployment choice options
- Platform detection for intelligent user flow
- Duolingo-inspired design with 3D shadows and hover animations
- Enhanced homepage with colorful feature highlights
- Setup persistence using StorageAdapter (SQLite/PostgreSQL)
- Auto-redirects to first plugin route after login
- Custom Electron title bar with window controls
- Database admin tools with reset functionality
- Local profile management for Electron
- Auth guard in AppShell before plugin loading

### ✅ Core UI Plugin (100% COMPLETE - October 6, 2025)
- 32 shared components for plugin consistency
- Layout: Button, Card, PageHeader, SplitView, GridLayout
- Data: DataTable, List, MetricCard, Badge
- Forms: FormField, FormSection, Select, Switch, Checkbox, RadioGroup
- Feedback: LoadingSpinner, ErrorMessage, ProgressBar, Alert
- Overlays: Dialog, Tabs, Tooltip, Popover, DropdownMenu, Accordion
- All components use semantic theme variables
- Optional use (plugins can build their own UI)

### ✅ Development Tools Integration
- Notion MCP integrated for task tracking
- Puppeteer MCP integrated for frontend testing
- Documentation created for MCP usage

### ✅ Agent Orchestration System (COMPLETE - October 8, 2025)
- **Problem Solved**: Main Claude context bloat (50% context used before even starting work)
- **Context Efficiency**: 10x improvement (600 tokens vs 5000+ per task)
- **Core Achievement**: Main Claude as pure orchestrator, never implements code
- **Auto-Chaining Workflow**: Agents call next agents without Main Claude bottleneck
- **Permanent Reference**: `coreInstructions.md` with PRE-TASK CHECKLIST (never modified)
- **Implementation Components**:
  - Created dedicated `implementation` agent with full autonomy (informed by context-researcher)
  - Updated 10 agent prompts with auto-chaining responsibilities:
    - context-researcher → memory-bank-keeper (returns summary to Main Claude)
    - implementation → code-reviewer → test-runner-validator → memory-bank-keeper
    - root-cause-debugger → memory-bank-keeper (delegates fixes to implementation)
    - unit-test-generator → test-runner-validator → memory-bank-keeper
    - code-cleanup-refactor → code-reviewer → memory-bank-keeper
    - git-workflow-manager → backlog-manager → memory-bank-keeper
    - security-reviewer (decision point, no auto-chain)
    - memory-bank-keeper (terminal node of all chains)
  - memory-bank-keeper as central documentation hub (100x context reduction)
  - Compressed summaries (2-3 sentences) replace full agent outputs
  - Agent chain positions documented in each agent prompt
- **Key Pattern**: Agents document in activeContext.md, return compressed summaries to Main Claude
- **Zen MCP Positioning**: Fallback tool only, not part of standard workflows
- **Cost Impact**: Significant reduction in token usage per task
- **Documentation**:
  - `/memory-bank/coreInstructions.md` - Permanent agent orchestration rules
  - Updated all agent prompts in `.claude/agents/`
  - Updated `CLAUDE.md` with orchestration references
  - Updated `memory-bank-instructions.md` to include coreInstructions.md

### ✅ Cloud Storage Infrastructure (October 1, 2025)
- Cloudflare Tunnel setup complete (`chaycards-api` → `localhost:7243`)
- Express API server running on port 7243 with REST endpoints
- PostgreSQL database via Docker Compose (port 5433)
- PostgreSQLAdapter working with hardcoded production URL
- CORS configured for all frontend environments (Lovable, localhost, production)
- Production-ready HTTPS without certificate management
- Same URL works everywhere: `https://api.chaycards.com/api/storage`
- Comprehensive logging for debugging network issues

## What's Left to Build

### ✅ Backend Infrastructure (COMPLETE - October 1, 2025)
- [x] Express server setup (port 7243)
- [x] Storage interface definition (StorageAdapter pattern)
- [x] Local storage implementation (SQLite via better-sqlite3)
- [x] Cloud storage implementation (PostgreSQL via Cloudflare Tunnel)
- [x] API route structure (REST endpoints for storage CRUD)
- [x] IPC communication for Electron storage
- [x] Storage lifecycle management (init after core-settings)
- [x] CORS configuration for all environments
- [x] Production-ready infrastructure (Cloudflare Tunnel)

### ✅ Plugin System Implementation (COMPLETE - October 5, 2025)
- [x] PluginManager singleton with automatic plugin discovery
- [x] EventBus for plugin communication
- [x] Theme system as first plugin validation
- [x] Pre-React plugin loading and initialization
- [x] PluginHost component with dynamic resolution
- [x] Component namespacing system working
- [x] AppShell with plugin routes (auto-redirect to first plugin)
- [x] Plugin storage management (each plugin owns its namespace)
- [x] Pure database storage pattern established (no caches, async operations)
- [ ] usePlugin React hook - **READY TO IMPLEMENT**

### ✅ Built-in Plugins (COMPLETE - October 6, 2025)
- [x] core-settings plugin (manages storageMode, setupComplete, user profile)
- [x] core-theme plugin (theme system foundation)
- [x] core-ui plugin (32 shared components) - **COMPLETE**
- [x] demo-plugin (shows storage features, database admin tools)
- [x] theme-catppuccin (2 variants: Latte, Frappé)
- [x] theme-dracula (1 variant)
- [x] theme-gruvbox (1 variant)
- [x] theme-tokyonight (1 variant)
- [x] theme-chay (custom branded theme)

### ✅ Documents Plugin Phase 1 (COMPLETE - October 17, 2025)
- [x] Complete type definitions (StoredFile, Folder, FileHandler, operation types)
- [x] DocumentsService with dual-storage abstraction (772 lines)
- [x] Observer pattern implementation with state change listeners
- [x] React hooks library (useFiles, useFolders, useFolderTree, etc.)
- [x] FileHandler registry for plugin extensibility
- [x] Folder hierarchy with parent-child relationships
- [x] Initialization state tracking (prevents race conditions)
- [x] Folder name validation (filesystem safety, path traversal prevention)
- [x] Plugin manifest with onLoad lifecycle hook
- [x] Placeholder FileBrowser component
- [x] TypeScript compilation verified (zero errors)
- [x] **Folder Sidebar Tree - COMPLETE** (October 15-17, 2025)
  - React-arborist integration with drag & drop support
  - Virtual tree pattern with "__ALL_FILES__" synthetic root node
  - ID translation layer prevents virtual IDs from reaching database
  - V4 migration fixes historical data corruption (parentId = "__ALL_FILES__")
  - Data integrity: migrations over normalization fallbacks
  - Drag cursor positioning fixed (CSS padding conflict resolved)
  - Folder creation triggers automatic tree refetch
  - HSL color picker with Popover (matches theme plugin UX)
  - Theme-aware default folder colors (reads --primary CSS variable)
  - Folder alignment fixed (18px spacer matches chevron width)
  - Clean visual feedback during drag operations
  - Three-dot context menu (rename, delete, change color) - COMPLETE
  - **Known limitation**: No magnetic top/bottom dropping (future enhancement)

### ✅ File Storage Implementation - Phase 1 (COMPLETE - January 2025)
**Status**: Files as Entity Properties pattern fully implemented
**Backend Architecture**: 100% complete across both platforms

#### Core Storage System (7 files) - ALL COMPLETE
- [x] `electron/database.cjs` - `files` table with CASCADE DELETE foreign key
  - Composite PK: `(storage_key, field_name, user_id)`
  - FK to `storage(key, user_id)` ON DELETE CASCADE
  - SHA-256 hash column for content-based deduplication
- [x] `server/index.js` - `files` table + GET/PUT endpoints
  - BYTEA column for binary file data
  - Base64 encoding for JSON transport over REST
  - GET `/api/storage/:key` returns `{ value, files }`
  - PUT `/api/storage/:key` accepts `{ value, files }`
- [x] `electron/ipc/storageHandlers.cjs` - get/set handlers with file support
  - `storage:get` returns `{ data, files }` with file content from disk
  - `storage:set` implements SHA-256 deduplication to `{userData}/files/`
  - Files stored as `{hash}.bin` for deduplication
- [x] `electron/preload.cjs` - Updated set signature with files parameter
- [x] `src/shared/storage/StorageAdapter.ts` - Interface updated
  - `get<T>(key): Promise<{ data: T; files: Record<string, Uint8Array> } | null>`
  - `set<T>(key, value, files?: Record<string, Uint8Array | null>): Promise<void>`
- [x] `src/shared/storage/SQLiteAdapter.ts` - Implementation complete
  - Passes files parameter through to IPC
  - Returns structured result from IPC handler
- [x] `src/shared/storage/PostgreSQLAdapter.ts` - Implementation complete
  - Converts Uint8Array to base64 for transport
  - Converts base64 back to Uint8Array on retrieval

**Key Benefits**:
- ✅ No orphaned files (CASCADE DELETE enforced by database FK)
- ✅ Atomic operations (entity + files stored together)
- ✅ SHA-256 deduplication in Electron (content-based addressing)
- ✅ User scoping automatic via composite keys

### 🔴 Documents Plugin Phase 2 (IN PROGRESS - Nuclear Reset)
**Status**: Main view cleared after persistent drag-drop bugs - clean slate ready

**COMPLETE**:
- [x] Folder sidebar tree with full functionality (drag-drop, three-dot menus)
- [x] Folder operations from sidebar (delete, rename, change color)
- [x] Nuclear reset of main view (October 19, 2025) - removed ~200 lines of broken drag-drop code

**CURRENT STATE - Main View**:
- ✅ Empty placeholder showing file/folder counts
- ✅ Page header with Create Folder, Upload File buttons
- ✅ Breadcrumb navigation
- ✅ All dialogs still functional (create, rename, delete, color picker, conflict resolution)
- ✅ Helper functions intact (handleFolderMove, handleCreateFolder, isDescendant)
- ❌ NO drag-drop implementation (completely removed)
- ❌ NO folder cards rendering
- ❌ NO file cards rendering
- ❌ NO three-dot menus in main view

**WHY NUCLEAR RESET**:
- Original bug: Folders dimmed during drag, never recovered
- First fix: Discrete events pattern (onDragEnter/onDragLeave instead of onDragOver)
- Problem: Code was correct, Vite compiled successfully, but drag-drop still didn't work
- Hypothesis: Environmental issue (browser caching, hot reload) rather than code
- Decision: Start completely fresh with minimal implementation

**NEXT STEPS - Minimal Rebuild**:
1. [ ] Implement absolute simplest drag-drop (text/plain data transfer only)
2. [ ] Test in fresh browser session (clear all cache)
3. [ ] Add visual feedback only after basic drag works
4. [ ] Build up incrementally from working foundation

**INCOMPLETE - Main View Operations (0%)**:
- [ ] Three-dot context menu on folder cards in main view
- [ ] Drag-drop within main view (reorder folders/files)
- [ ] Drag-drop between tree ↔ main view ↔ folders
- [ ] File context menus in main view (rename, delete)
- [ ] Symmetric UX (everything in tree should work in main view)

**Acceptance Criteria** (unchanged):
- User can perform all folder operations from main view (not just sidebar)
- Drag folders from main view into sidebar tree
- Drag folders from tree into main view folders
- Three-dot menu on folder cards matches tree menu
- File cards have context menus for rename/delete

**Research Complete**:
- Discrete events pattern validated (web sources + Zen AI)
- Performance metrics: 2 re-renders vs 60/sec with onDragOver
- Pattern matches react-dnd/dnd-kit internals
- Ready to rebuild from scratch using validated approach

### 🔲 Feature Plugins (Ready to Implement)
- [ ] core.tasks plugin - **READY TO IMPLEMENT**
- [ ] core.knowledge plugin (flashcards) - **READY TO IMPLEMENT**
- [ ] game plugin (Godot integration) - **PLANNING REQUIRED**

### 🔲 Advanced Plugins (Future)
- [ ] ai-assistant plugin (Live2D, voice, Python backend)
- [ ] mcp-tools plugin (tool calling integration)
- [ ] code-sandbox plugin (Docker-based execution)

### 🔲 Core Features
- [ ] User authentication
- [ ] Data synchronization
- [ ] Settings management
- [ ] Theme system
- [ ] Keyboard shortcuts

### 🟢 Cloud Infrastructure (Partially Complete)
- [x] Cloudflare Tunnel setup (api.chaycards.com)
- [x] PostgreSQL database setup (Docker Compose, port 5433)
- [x] Express API server running (port 7243)
- [x] CORS configuration for all frontend environments
- [x] Production-ready HTTPS without certificates
- [ ] VPS/Railway deployment (when needed)
- [ ] CI/CD pipeline
- [ ] CDN for plugins

## Current Status

### Development Phase
We are in the **Feature Plugin Development** phase (October 6, 2025):
- ✅ Foundation infrastructure 100% complete
- ✅ Plugin system fully operational (687 lines, all features)
- ✅ Theme system complete (7 themes, pure DB architecture)
- ✅ Core UI plugin complete (32 components)
- ✅ Storage patterns established (pure DB, async, client filtering)
- ✅ Multi-tenant plugin filtering operational
- ✅ AppShell with regions fully functional
- ✅ Backend infrastructure production-ready
- ✅ **Documents Plugin Phase 1 complete** (service layer, hooks, types - 1,977 lines)
- 🎯 Documents Plugin Phase 2 next (UI components with Grid/List views)
- 🎯 Game plugin design phase (planning required)

### Active Tasks (Next Phase)
1. **Documents Plugin Phase 2** (High Priority - Ready to Implement)
   - FileBrowser UI with Grid/List toggle and drag-and-drop
   - FolderTree, FileCard, FileViewer components
   - Advanced search and filtering
   - Uses core-ui components for consistency
2. **Game Plugin Design & Architecture** (High Priority - Planning Required)
   - Design game client interface and plugin hooks
   - Task-to-game-time conversion mechanics
   - Godot server integration strategy
3. **Tasks Plugin** (High Priority - Ready to Implement)
   - Task management with game integration hooks
4. **Knowledge Plugin** (Medium Priority - Ready to Implement)
   - Flashcard generation and spaced repetition

### Technical Debt
- None yet (clean foundation)

### Blockers
- None currently

## Known Issues

### Critical Issues
1. **Authentication Token Not Persisting (October 8, 2025)**
   - **Symptom**: Users can register successfully but cannot access /app/* routes (except /app/demo)
   - **Behavior**: Immediate redirect to /login when navigating to /app/documents or other authenticated routes
   - **Impact**: Blocks testing of folder drag-and-drop implementation
   - **Likely Cause**: Auth token not being stored or retrieved correctly in web mode
   - **Status**: Needs investigation and fix before further UI testing

### Minor Issues
1. Vite sometimes needs restart when changing shared code
2. CRLF line ending warnings in git (Windows/WSL difference - cosmetic only)

### Resolved Issues
1. ✅ Fixed ES modules vs CommonJS conflict
2. ✅ Fixed WSL vs Windows node_modules issue
3. ✅ Removed Bun dependency confusion
4. ✅ Cleaned up Lovable boilerplate
5. ✅ Fixed setup persistence (now uses storage, not localStorage)
6. ✅ Fixed theme not saving (theme has its own storage key now)
7. ✅ Fixed double scrollbar issue (h-full overflow-y-auto)
8. ✅ Fixed F12 DevTools toggle (proper keyboard event handling)
9. ✅ Fixed blank page after login (auto-redirect to first plugin)
10. ✅ PostgreSQL cloud storage working via Cloudflare Tunnel (October 1, 2025)
11. ✅ Fixed plugins loading on public pages causing 401 errors (October 2, 2025)
12. ✅ Fixed double redirect when accessing /app without auth (October 2, 2025)
13. ✅ Fixed theme not working on public pages (dual storage strategy, October 2, 2025)
14. ✅ Fixed login JSON parse error - backend server must run on Windows for Cloudflare tunnel access (October 2, 2025)
15. ✅ Fixed theme system memory leaks - eliminated caches, implemented pure database storage (October 5, 2025)
16. ✅ Standardized Plugin Loading with publicSafe Metadata Flag (October 6, 2025)
17. ✅ Implemented per-user plugin filtering for multi-tenant deployment (October 6, 2025)
18. ✅ Phase 4: Interactive Components for core-ui Plugin complete (October 5, 2025)
19. ✅ Phase 5: Form & Feedback Components for core-ui Plugin complete (October 5, 2025)
20. ✅ Bug: Theme UI State Desync After Login fixed (October 4, 2025)
21. ✅ Refactor electron/main.cjs Module Structure complete (October 4, 2025)

## Evolution of Project Decisions

### Initial Approach (Rejected)
- Started with Lovable's task manager demo
- Too much unnecessary code
- Not architected for plugins

### Current Approach (Active)
- Clean foundation with planned architecture
- Everything as plugins from the start
- Shared backend between platforms
- Clear separation of concerns

### Key Learnings
1. **Platform differences matter early** - Set up dual support from start
2. **Plugin architecture needs planning** - Can't bolt it on later
3. **Simple beats complex** - Game mod approach over enterprise patterns
4. **Frontend-first works** - Build UI with mocks, add backend later
5. **Theme system is solid** - Original CSS variable approach is excellent
6. **Optional consistency** - core-ui provides shared components without forcing
7. **Everything is a plugin** - Even themes are plugins that can enhance each other
8. **AppShell stays minimal** - Just layout, no features or business logic
9. **Python backends are just services** - Plugins can spawn child processes without core changes
10. **Runtime > build-time** - Platform detection at runtime is cleaner than separate builds
11. **Cloudflare Tunnel for development** - Production URL works locally via tunnel, eliminates environment config
12. **Hardcoded production URLs simplify deployment** - Same code works everywhere (dev/preview/production)
13. **CORS callback patterns matter** - Use `callback(null, false)` to reject origins, not error throwing
14. **Backend server environment matters** - Backend API must run on Windows (not WSL) when using Windows-based Cloudflare tunnel
15. **Network namespace isolation** - WSL localhost ≠ Windows localhost - services in one can't reach the other
16. **JSON parse errors often mean server down** - When API returns HTML 404 instead of JSON, check if backend server is running
17. **Pure database storage prevents memory leaks** - Eliminate in-memory caches in singleton services (Map/Set persist between sessions)
18. **Single source of truth principle** - Database is always correct; read, modify, write back (no cache invalidation logic)
19. **Client-side filtering for performance** - Use useMemo in UI components instead of async service methods
20. **Async service pattern** - All storage operations should return Promise, use useState + useEffect in React hooks
21. **Hot reload duplicate prevention** - Check database for existing data before registering to prevent duplicates on HMR

## Next Milestones

### Milestone 1: Plugin Infrastructure (Current)
- [ ] AppShell with region support
- [ ] PluginRegistry and PluginManager
- [ ] Region component management
- [ ] Plugin dependency resolution
- [ ] usePlugin hook implemented

### Milestone 2: Theme System
- [ ] theme-system plugin with base variables
- [ ] ThemeProvider wrapper
- [ ] chay-themes plugin with pink aesthetic
- [ ] Theme persistence in localStorage

### Milestone 3: Core UI Plugin  
- [ ] Basic shared components (Card, List, etc.)
- [ ] PageHeader pattern
- [ ] EmptyState component
- [ ] Depends on theme system

### Milestone 3: Documents Plugin MVP
- [ ] Document list view (grid/list)
- [ ] Create/delete documents
- [ ] Basic markdown editor
- [ ] localStorage persistence

### Milestone 4: Plugin Enhancement Demo
- [ ] Second plugin enhancing documents
- [ ] Component wrapping working
- [ ] Navigation from multiple plugins
- [ ] Theme persistence