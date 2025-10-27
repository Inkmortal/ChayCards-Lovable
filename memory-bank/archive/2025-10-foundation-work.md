# October 2025 Foundation Work Archive

This file contains historical entries from activeContext.md that document completed foundation infrastructure from October 1-10, 2025.

---

## Files as Entity Properties - Phase 1 Implementation Plan Created (October 7, 2025)
- **Complete Implementation Roadmap**: All 12 files requiring modification identified
  - **Core Storage System (7 files)**:
    1. `StorageAdapter.ts` - Interface signatures (`get` returns `{ data, files }`, `set` accepts optional `files`)
    2. `SQLiteAdapter.ts` - Implementation with new return format
    3. `PostgreSQLAdapter.ts` - Implementation with base64 encoding for JSON transport
    4. `electron/database.cjs` - Add `files` table with CASCADE DELETE foreign key
    5. `electron/ipc/storageHandlers.cjs` - Update get/set handlers with SHA-256 file deduplication
    6. `electron/preload.cjs` - Update set signature to pass files parameter
    7. `server/index.js` - Add `files` table + update GET/PUT endpoints for BYTEA storage
  - **Plugin Updates (5 files)** - All `storage.get()` calls must change to `result?.data` pattern:
    1. `DocumentsService.ts` - Migrate to Files as Properties API, remove `fileStorageKey` field
    2. `SettingsService.ts` - Update 1 `storage.get()` call
    3. `ThemeService.ts` - Update ~14 `storage.get()` calls
    4. `DemoDataService.ts` - Update 1 `storage.get()` call
    5. `DemoPage.tsx` - Update 1 `storage.get()` call
- **Breaking Change Strategy**: No backward compatibility
  - Clean slate approach - all existing data can be cleared
  - No migration code - fresh start with new API
  - All plugin code updated simultaneously
- **Implementation Order**:
  1. Database schemas (SQLite + PostgreSQL files tables)
  2. IPC handlers (Electron file storage with SHA-256 deduplication)
  3. Server endpoints (PostgreSQL BYTEA storage with base64 transport)
  4. Storage adapters (update get/set methods)
  5. Interface (make breaking change official)
  6. All plugin services (update storage.get() calls)
  7. Testing (both Electron and Cloud platforms)
- **Key Technical Decisions**:
  - **Electron**: Files stored in `{userData}/files/{sha256-hash}` with metadata in SQLite
  - **Cloud**: Files stored as BYTEA in PostgreSQL `files` table
  - **Transport**: Base64 encoding for JSON over HTTP/REST
  - **Deduplication**: SHA-256 content-based addressing (Electron only)
  - **Cascade Delete**: Database foreign key constraints enforce lifecycle
- **Testing Requirements**:
  - Upload document in Electron, verify hash-based file storage
  - Upload document in Cloud, verify BYTEA storage in PostgreSQL
  - Delete entity, verify CASCADE DELETE removes file rows
  - All plugins (Settings, Theme, Demo) load data correctly after migration
  - No `storage.get()` calls returning undefined

## Documents Plugin Phase 1 Implementation (October 6, 2025)
- **Complete Service Architecture**: Built DocumentsService with dual-storage abstraction
  - **File Management**: Full CRUD operations for files with File Storage + JSON Storage APIs
  - **Folder Hierarchy**: Tree structure with parent-child relationships
  - **FileHandler Registry**: Priority-based handler system for plugin extensibility
  - **Observer Pattern**: State change notifications with immediate state provision
  - **React Hooks**: Complete hook library for reactive state management
  - **Initialization State Tracking**: Prevents race conditions during plugin loading
  - **Folder Name Validation**: Comprehensive validation preventing unsafe characters, path traversal
  - **Type Safety**: Fixed PluginManager interface with getStorage() method
- **Files Created** (1,977 lines total):
  - `src/plugins/core-documents/types.ts` (271 lines) - Complete type definitions
  - `src/plugins/core-documents/services/DocumentsService.ts` (772 lines) - Core service with all fixes
  - `src/plugins/core-documents/hooks/useDocuments.ts` (225 lines) - React hooks with initialization checks
  - `src/plugins/core-documents/components/FileBrowser.tsx` (71 lines) - Placeholder component
  - `src/plugins/core-documents/index.ts` (138 lines) - Plugin manifest
- **Files Modified**:
  - `src/shared/plugin-system/types.ts` - Added getStorage() method to PluginManager interface
- **Key Patterns Established**:
  - **Dual-Storage Abstraction**: Single methods handle both File Storage and JSON Storage internally
  - **Stateful Observer + Custom Hook**: Service tracks listeners, hooks consume state reactively
  - **Service Layer**: Plugins call service methods, service manages both storage APIs
  - **FileHandler Extensibility**: Other plugins can register handlers for specific file types
  - **Windows-like Folder Validation**: Unique names per parent (case-insensitive), path safety
- **Code Review Fixes Applied**:
  - Added `initialized` flag with `isInitialized()` method to prevent race conditions
  - Added `validateFolderName()` with comprehensive safety checks
  - Updated hooks to check initialization state before returning service
  - Fixed TypeScript compilation (zero errors)
- **Ready for Phase 2**: UI components with Grid/List views, drag-and-drop, advanced search

## Plugin System Enhancements (October 6, 2025)
- **User Plugin Preferences**: Implemented per-user plugin filtering system
  - **enabled_plugins** vs **installed_plugins** distinction (commit eb295eb)
    - `installed_plugins` - Plugins discovered by system via glob import
    - `enabled_plugins` - Plugins user has explicitly enabled (stored in users table)
    - Core plugins ALWAYS enabled regardless of preferences
  - **Storage Mode Selection**: Users table now includes `storageMode` field
    - Each user can have different storage preference (local/cloud/sync)
    - Stored alongside plugin preferences in PostgreSQL/SQLite
  - **API Endpoint**: `GET /api/users/me/plugins` returns user's enabled plugins
  - **PluginManager Integration**: `getUserPluginPreferences()` filters by user choice
    - Queries database before loading plugins
    - Respects core plugin requirement (cannot be disabled)
    - Falls back to all-enabled if no preferences found
- **Files Changed**:
  - `src/shared/plugin-system/PluginManager.ts` - Added user preferences logic (lines 162-244)
  - `server/index.js` - Added `/api/users/me/plugins` endpoint
  - Database schema - Added `enabled_plugins` column to users table
- **Key Benefits**:
  - Multi-tenant plugin filtering (different users, different plugins)
  - Granular control over plugin ecosystem
  - Core system stability (core plugins always load)
  - Scalable for plugin marketplace

## Theme System Pure Database Refactor (October 5, 2025)
- **Architecture Change**: Eliminated all in-memory caches for pure database storage
  - **Removed**: `Map<string, Theme>` for themes registry (was memory leak vulnerability)
  - **Removed**: `Set<string>` for favorites cache (caused duplicate state)
  - **Added**: Single source of truth in database under `core-theme:all-themes` key
  - **Why**: Caches persist between sessions in singleton services, causing memory leaks and state inconsistencies
- **Pure Database Pattern**: All theme data stored and queried from database
  - `core-theme:all-themes` - Single array containing all themes (plugin + custom)
  - `core-theme:favorites` - Array of favorite theme IDs
  - `core-theme:current-theme` - Active theme ID (uses STORAGE_KEYS constant)
  - Every operation reads from DB, modifies in memory, writes back to DB
  - No persistent caches between operations (stateless service pattern)
- **Async Service Pattern**: All ThemeService methods now return Promise
  - `registerTheme(theme)` - Checks DB for duplicates before adding (prevents re-registration on hot reload)
  - `getAvailableThemes()` - Returns `Promise<Theme[]>` from DB query
  - `getThemeById(id)` - Returns `Promise<Theme | undefined>` from DB query
  - `getCustomThemes()` - Filters themes by `source: 'custom'` from DB
  - `toggleFavorite(id)` - Reads favorites from DB, toggles, writes back
- **React Async Integration**: Components handle async initialization properly
  - `useAvailableThemes()` hook: `useState([])` + `useEffect` with service subscription
  - `onThemeListChange()` callback immediately provides current state (solves late subscriber problem)
  - Client-side filtering for search/category (no async service calls in UI)
  - Theme previews update React state synchronously (applyTheme is sync)
- **Source Field Addition**: Theme interface now includes `source: 'plugin' | 'custom'`
  - Plugin themes: Registered by theme plugins during onLoad, source = 'plugin'
  - Custom themes: Created by user in theme builder, source = 'custom'
  - Replaces ID prefix checking (`theme.id.startsWith('custom-')`)
  - Enables reliable filtering: `themes.filter(t => t.source === 'custom')`
- **Client-Side Filtering Pattern**: UI components filter themes locally instead of service methods
  - `ThemeModal.tsx`: Filters `availableThemes` array by search query and category
  - `useMemo` for performance (only recomputes when themes/query/category change)
  - Eliminates async service calls in render cycle (faster, simpler)
  - Service provides raw data, UI handles presentation logic
- **Files Changed**:
  - `src/plugins/core-theme/services/ThemeService.ts` - Complete refactor to async DB operations
  - `src/plugins/core-theme/hooks/useThemes.ts` - Fixed async state initialization
  - `src/plugins/core-theme/components/ThemeModal.tsx` - Client-side filtering with useMemo
  - `src/plugins/theme-catppuccin/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-dracula/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-gruvbox/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-tokyonight/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/core-theme/index.ts` - Added async to onLoad for proper initialization
- **Key Benefits**:
  - Memory leak eliminated (no persistent caches in singleton)
  - Single source of truth (database only)
  - Consistent state across sessions
  - Duplicate prevention on hot reload
  - Simpler mental model (DB is always correct)
  - Client-side filtering for UI responsiveness

## Backend API Server and Login Issue Resolution (October 2, 2025)
- **Backend API Server Setup**: Added npm script to run Express server
  - Script: `npm run server` runs `cd server && node index.js`
  - Server must run on port 7243 (Windows, not WSL)
  - Provides REST API for authentication and storage operations
  - Uses PostgreSQL database for data persistence
- **Login Issue Root Cause Identified and Fixed**:
  - **Problem**: Login failing with "JSON.parse: unexpected character at line 1 column 1"
  - **Root Cause**: Backend API server on port 7243 was not running
  - **How it works**: Cloudflare tunnel at api.chaycards.com routes to localhost:7243
  - **Why it failed**: When server not running, tunnel returns HTML 404 page instead of JSON
  - **What broke**: Login.tsx expects JSON response with `token` field from `/api/auth/login`
  - **Solution**: Run `npm run server` (from Windows) before testing login/auth
- **WSL vs Windows Networking Discovery**: Critical infrastructure learning
  - Backend server MUST run on Windows (not WSL) for Cloudflare tunnel compatibility
  - **Why**: Cloudflare tunnel runs on Windows and points to Windows localhost:7243
  - **Key insight**: Windows localhost ≠ WSL localhost (different network namespaces)
  - **Tunnel config**: Routes api.chaycards.com → Windows localhost:7243
  - If server runs in WSL, Windows tunnel cannot reach it (different localhost)
- **Current Multi-Server Setup**:
  - Backend API: `npm run server` (port 7243, run from Windows for tunnel access)
  - Dev server: `npm run dev` (Vite on port 8080, can run in WSL)
  - Notion PM sync: `npm run notion-pm:server` (port 3001)
  - Cloudflare tunnel routes:
    - `api.chaycards.com` → Windows `localhost:7243` (backend API)
    - `dev.chaycards.com` → Windows `localhost:3001` (Notion PM sync)
- **Files Changed**:
  - `package.json` - Added "server": "cd server && node index.js" script (line 23)
  - No code changes needed - purely operational/infrastructure issue

## Authentication Flow and Public Page Optimization (October 2, 2025)
- **Fixed Public Page Plugin Loading**: Plugins no longer load on public pages
  - Public pages (/, /login, /register, /setup) skip plugin initialization entirely
  - main.tsx checks page type and only loads theme from localStorage on public pages
  - Eliminates unnecessary 401 errors from plugins trying to access storage without auth
  - AppShell handles plugin loading AFTER auth check passes
- **Centralized Auth Guard**: Single redirect point in AppShell
  - AppShell checks for auth_token before loading plugins
  - No token → redirect to /login (single, clean redirect)
  - Has token → load plugins and initialize storage
  - Eliminates double-redirect issue (plugins + AppShell both redirecting)
- **Theme System Improvements**: Dual storage strategy for universal theme support
  - Public pages: Theme loads from localStorage via publicThemeLoader.ts
  - App pages: Theme loads from user storage with localStorage sync
  - Priority: User storage > localStorage > default theme
  - Theme works on ALL pages without requiring authentication
- **Simplified Plugin Loading Flow**:
  1. Public pages → Load theme from localStorage, render app (no plugins)
  2. App pages → Load theme, render app, AppShell checks auth
  3. Auth pass → AppShell loads plugins and initializes storage
  4. Auth fail → AppShell redirects to /login
- **Files Modified**:
  - `src/main.tsx` - Added public page check, removed premature plugin loading for /app routes
  - `src/renderer/layouts/AppShell.tsx` - Added auth guard before plugin loading
  - `src/utils/publicThemeLoader.ts` - Created standalone theme loader for public pages
  - `src/plugins/core-theme/services/ThemeService.ts` - Implemented dual storage (localStorage + user storage)
  - `src/shared/plugin-system/PluginManager.ts` - Added public page checks (defense-in-depth, not actively used)
  - `src/shared/storage/PostgreSQLAdapter.ts` - Removed auth redirect logic (now in AppShell)

## Cloud Storage Infrastructure Setup Complete (October 1, 2025)
- **Cloudflare Tunnel for API Access**: Production-ready secure tunnel to local database
  - Tunnel name: `chaycards-api` (ID: `6c780a88-8816-46f3-8e89-fd866d5006fd`)
  - DNS: `api.chaycards.com` routes through Cloudflare to local machine
  - Config: Routes to `localhost:7243` (Express server)
  - Enables Lovable preview to access local PostgreSQL database
  - Future-proof: Same setup works for dev → staging → production deployment
- **Express API Server Running**: REST API on port 7243 (uncommon port for security)
  - PostgreSQL REST API with JSONB support
  - Comprehensive CORS configuration for all environments:
    - Lovable domains: `*.lovable.app`, `*.lovable.dev`, `*.lovableproject.com`
    - Production domains: `chaycards.com`, `app.chaycards.com`
    - Localhost: `http://localhost:8080` (dev server)
  - Fixed CORS callback bug: Changed from `callback(new Error(...))` (crashed requests) to `callback(null, false)` (proper rejection)
  - Comprehensive request/response logging for debugging
- **Storage Architecture Simplified**: One URL works everywhere
  - PostgreSQLAdapter hardcoded to `https://api.chaycards.com/api/storage`
  - No more .env file complexity or environment-specific URLs
  - Works identically in local dev, Lovable preview, and future production
  - Removed Vite proxy (no longer needed with Cloudflare Tunnel)
- **Architecture Flow**: `[Any Frontend] → https://api.chaycards.com/api/storage → [Cloudflare Tunnel] → [Local PC: Express:7243] → [PostgreSQL:5433]`
- **Key Learnings**:
  - CORS error handling: Must use `callback(null, false)` to reject, NOT throw errors or use `callback(new Error(...))`
  - Cloudflare Tunnel provides zero-config HTTPS and bypasses firewall issues
  - Hardcoding production URL in adapter enables same code everywhere (dev/preview/production)
  - Detailed logging in PostgreSQLAdapter crucial for debugging network issues
- **Files Modified**:
  - `server/index.js` - Port 7243, fixed CORS handling with proper callback
  - `src/shared/storage/PostgreSQLAdapter.ts` - Hardcoded `https://api.chaycards.com`, added comprehensive logging
  - `vite.config.ts` - Removed proxy configuration (no longer needed)
  - `.env` - Removed (no longer needed)

## Storage Architecture Refactor Complete (October 1, 2025)
- **Separated Theme from Core Settings**: Each plugin now manages its own storage
  - Core settings: `core-settings:app-settings` (storageMode, setupComplete, userId/email, updatedAt)
  - Theme preference: `core-theme:preference` (theme ID string)
  - No more localStorage coupling - everything uses StorageAdapter
- **Database Admin Tools**: Added comprehensive management UI in demo plugin
  - Database viewer showing all storage keys with type, JSON content, and byte size
  - "Reset Database" button to clear all data and restart setup flow
  - Real-time refresh to see storage changes
- **Smart Setup Detection**: Index.tsx checks both SettingsService AND actual storage
  - Handles case where localStorage cleared but SQLite still has data
  - Prevents accidental duplicate users on local storage
  - Auto-loads existing settings from storage on app start
- **Electron UI Polish**: Enhanced desktop experience
  - Custom frameless title bar with Discord/Slack-style window controls
  - TitleBar component with draggable region and minimize/maximize/close buttons
  - Fixed keyboard shortcuts (F12 for DevTools, Ctrl+/-/0 for zoom)
  - Fixed double scrollbar issue (changed min-h-screen to h-full overflow-y-auto)
  - Auto-redirects to first plugin route after login (no more blank page)
- **Storage Initialization Flow**: Proper async loading
  - SettingsService.setStorage() called after storage ready
  - ThemeService.initialize() loads theme from storage
  - Both services persist changes immediately to SQLite/PostgreSQL

## Electron + WSL Development Setup Fixed (October 2, 2025)
- **CRITICAL FIX: Single node_modules Strategy**: Resolved dual node_modules confusion
  - **Old broken approach**: Maintained separate `node_modules` (WSL/Linux) and `node_modules_win` (Windows) directories
  - **Problem**: Electron version mismatch between directories caused ABI incompatibility (v36.9.3 vs v38.2.0)
  - **Solution**: Use SINGLE `node_modules` with Windows-compiled packages
  - **How it works**:
    - Run `npm install` from **Windows Command Prompt** (NOT WSL)
    - Windows npm installs Windows-compiled native binaries (.node files) to `node_modules`
    - WSL Vite reads JavaScript/TypeScript source files (platform-agnostic)
    - Windows Electron uses Windows-compiled native modules
    - **NO CONFLICT**: They access different parts of node_modules (source vs binaries)
- **Batch Script Updates**: `start-electron-windows.bat` now properly configured
  - Shows Electron version on launch (debugging aid)
  - Deletes old build folder before rebuild (ensures clean compilation)
  - Explicitly passes `--version` flag to electron-rebuild (fixes ABI version detection)
  - Uses `node_modules\.bin\electron.cmd` (removed all node_modules_win references)
- **Database Schema Migration**: Auto-migration from old storage schema
  - Old schema: `storage (key, value)` without user scoping
  - New schema: `storage (key, value, user_id)` with foreign key to users table
  - Migration handled manually via bash commands to recreate database
  - Location: `%APPDATA%\chaycards\storage.db`
- **Key Breakthrough**: Understanding Electron ABI version requirements
  - Electron embeds specific Node.js version with specific ABI (Application Binary Interface)
  - Native modules MUST match this exact ABI version
  - electron-rebuild compiles modules for correct ABI, but must detect correct Electron version
  - Version mismatch (e.g., ABI 135 vs 139) causes "NODE_MODULE_VERSION" errors at runtime
