# Active Context

## Current Work Focus

We are building the foundation architecture for ChayCards with a focus on:
1. ~~Setting up dual-platform support (Electron + Web)~~ ✅ Complete
2. ~~Multi-platform architecture analysis~~ ✅ Complete
3. ~~Capacitor mobile integration~~ ✅ Complete
4. ~~Plugin system infrastructure + User Experience~~ ✅ **COMPLETE**
   - ~~Minimal PluginManager implementation~~ ✅ Complete
   - ~~Theme system as first plugin~~ ✅ Complete (7 themes implemented)
   - ~~Smart platform-aware user flow~~ ✅ Complete
   - ~~Enhanced component system with Duolingo aesthetic~~ ✅ Complete
5. ~~**Electron SQLite Development Setup**~~ ✅ **COMPLETE** (September 30, 2025)
   - ~~Windows one-click launcher with auto-rebuild~~ ✅ Complete
   - ~~SQLite local storage working in Electron~~ ✅ Complete
   - ~~Plugin storage initialization and lifecycle~~ ✅ Complete
   - ~~First-time user flow (setup screen)~~ ✅ Complete
6. Game plugin design and architecture - **NEXT PRIORITY**
7. Building the frontend with plugin architecture

**Current Status**: Electron desktop app fully functional with SQLite persistence and proper user flow routing

- **Implementation Strategy**: "Vertical Slice First" - build minimal working system end-to-end
- **First Plugin**: Theme system (core-theme) with 7 theme variants ✅ Complete
- **Storage**: SQLite working in Electron with automatic better-sqlite3 rebuild ✅ Complete
- **User Flow**: Smart routing based on platform and setup completion ✅ Complete
- **Visual Design**: Duolingo-inspired aesthetic (rounded, chunky buttons, clean typography)
- **Deployment Strategy**: Local-first for desktop, cloud-first for web, future mobile support

## Recent Changes

### Backend API Server and Login Issue Resolution (October 2, 2025)
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

### Authentication Flow and Public Page Optimization (October 2, 2025)
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

### Cloud Storage Infrastructure Setup Complete (October 1, 2025)
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

### Storage Architecture Refactor Complete (October 1, 2025)
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

### Electron SQLite Setup Complete (September 30, 2025)
- **Windows Development Launcher**: Created one-click `start-electron-windows.bat`
  - Auto-detects if better-sqlite3 needs rebuilding for Electron's Node.js version
  - Activates conda environment to access Python for node-gyp compilation
  - Creates `.electron-rebuilt` marker file to skip rebuild on subsequent runs
  - Validates Vite dev server is running before launching
- **SQLite Storage Working**: Full IPC communication established
  - Database initialized at `%APPDATA%\chaycards\storage.db`
  - All CRUD operations (get/set/delete/list/clear/has) working via IPC
  - Storage adapter properly integrated with PluginManager
  - Data persists between application sessions
- **Plugin Loading Order Fixed**: Storage initialization happens at correct lifecycle point
  - core-settings plugin loads first
  - initializeStorage() called after core-settings but before other plugins
  - Prevents race conditions where plugins try to use storage before it's ready
- **Better-sqlite3 Compilation**: Resolved Node.js version mismatch
  - WSL's better-sqlite3 compiled for regular Node.js (v127)
  - Electron uses embedded Node.js (v139)
  - electron-rebuild recompiles native modules for Electron's version
  - Automated in batch script with conda Python activation

### Electron + WSL Development Setup Fixed (October 2, 2025)
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

### User Flow Routing Fixed (September 30, 2025)
- **Platform-Specific First Launch**:
  - Electron first-time users: Redirected to `/setup` to choose data model (local/sync/cloud)
  - Web first-time users: Stay on landing page to see features
  - Returning users (both platforms): Go straight to `/app` workspace
- **Setup State Persistence**: Using localStorage for setup completion tracking
  - `chaycards-setup-complete`: Boolean flag
  - `chaycards-user-choice`: Selected data model option
- **Development Mode Detection**: `import.meta.env.DEV` properly separates dev/production
  - Dev panel only visible in development (Lovable testing)
  - Production builds automatically hide dev features

### Plugin System Implementation Complete (September 29, 2025)
- **Core Plugin System**: Successfully implemented complete plugin infrastructure
  - PluginManager singleton with Vite glob imports for automatic plugin discovery
  - EventBus for plugin communication and theme change notifications
  - Pre-React plugin loading in main.tsx to ensure themes apply before component render
- **Theme System Plugin**: Built robust theme system as first plugin validation
  - 7 theme variants: Catppuccin (Latte/Frappé), Dracula, Tokyo Night, Gruvbox, Nord, Rose Pine
  - CSS custom properties system with localStorage persistence
  - Theme selector dropdown integrated into homepage header
  - Event-driven theme changes with real-time updates
  - **Universal Semantic Variables**: Standardized theme variables across all themes
    - 24 semantic variables (background, foreground, primary, secondary, tertiary, states, etc.)
    - Authentic colors from official theme specifications (Catppuccin.com, Dracula, etc.)
    - Plugin-extensible architecture for custom variables
- **Smart Platform Routing**: Enhanced homepage with intelligent user flow
  - Platform detection (Electron vs Web) for deployment-specific routing
  - Desktop: Local/Sync/Cloud storage options in setup page
  - Web: Cloud-first flow with download option for desktop apps
  - LocalStorage setup state persistence for returning users
- **Duolingo-Inspired Design**: Complete visual overhaul with chunky, rounded aesthetic
  - 3D shadow system (--shadow-3d, --shadow-3d-chunky, --shadow-3d-thick)
  - Hover animations with translate-y effects for interactive feedback
  - Colorful feature highlights and gradient buttons
  - Clean typography with generous spacing and text shadows

## Next Steps

### Immediate (High Priority)
1. **Core App Implementation**
   - AppShell with plugin regions
   - Main app routes (/app, /documents, /tasks)
   - Plugin-driven navigation system
2. **Storage Backend Selection**
   - Implement setup page logic to save user's data model choice
   - Initialize appropriate storage adapter based on choice
   - PostgreSQL setup for cloud/sync options
3. **Game Plugin Architecture**
   - Design game client interface
   - Task-to-game-time mechanics
   - Godot server integration planning

### Short Term
1. **Core UI Plugin**
   - Build upon theme system foundation
   - Enhanced component library with theme integration
   - Plugin-registered shadcn components
2. **Demo Plugin Enhancement**
   - Expand demo plugin to showcase storage persistence
   - Add more interactive examples
   - Document plugin development patterns
3. **PostgreSQL Cloud Backend**
   - Set up PostgreSQL database for web/sync modes
   - Create API layer for cloud storage
   - Implement sync logic between local and cloud

### Medium Term
1. Build core.documents plugin
2. Create core.tasks plugin (integrate with game)
3. Implement core.knowledge plugin
4. Backend API structure
5. Plugin marketplace
6. Testing infrastructure

## Active Decisions and Considerations

### Technical Choices
- **Desktop**: Electron (proven, AI-friendly, rich UI support for game)
- **Mobile**: Capacitor (same codebase as web/desktop)
- **Web**: Direct React deployment (existing)
- **Game Server**: Godot headless (single project, HTTP/WebSocket)
- **Package Manager**: npm (not Bun) for consistency
- **Module System**: ES modules for app code, CommonJS for Electron main
- **State Management**: TBD - considering Zustand or Context API
- **Backend**: Express.js shared between local and cloud
- **Storage**: SQLite (local) / PostgreSQL (cloud) with same interface
- **Native Modules**: electron-rebuild for compiling to Electron's Node.js version

### Architecture Patterns
- **Plugin System**: Simple registry-based, like game mods
- **Component Namespacing**: `plugin-id/ComponentName` prevents collisions
- **Dynamic Resolution**: Components resolved at runtime from registry
- **Platform Detection**: Runtime detection, not build-time
- **Frontend-First**: Build UI with mocks, add backend later
- **Smart User Flow**: Platform-aware routing (local-first desktop, cloud-first web)
- **Theme-as-Plugin**: Theme system implemented as first plugin to validate architecture
- **Storage Adapter Pattern**: Same interface for SQLite/PostgreSQL/cloud backends

## Important Patterns and Preferences

### Code Organization
- Platform-specific code isolated in adapters
- Shared business logic in `src/shared/`
- Plugin code completely self-contained
- Clear separation between renderer and main process
- Python backends managed as plugin services

### Electron Development Workflow
- **Dual Environment**: WSL for development (Vite), Windows for Electron testing
- **Node Modules**: WSL modules for web dev, Windows modules copied for Electron
- **Better-sqlite3**: Must be rebuilt for Electron's Node.js version
- **One-Click Testing**: `start-electron-windows.bat` handles all setup automatically
- **Storage Location**: `%APPDATA%\chaycards\storage.db` persists between sessions

### Development Workflow
- Test in both Electron and Web regularly
- Use TypeScript for type safety
- Keep dependencies minimal
- Document architectural decisions
- SQLite for Electron, PostgreSQL for web/cloud

## Learnings and Project Insights

1. **Backend Server Windows Requirement**: Backend API server must run on Windows (not WSL) for Cloudflare tunnel compatibility
2. **WSL vs Windows Network Isolation**: Windows localhost and WSL localhost are different network namespaces - tunnel on Windows cannot reach WSL services
3. **Login JSON Parse Errors**: "JSON.parse: unexpected character" errors often mean server not running - tunnel returns HTML 404 instead of expected JSON response
4. **Multi-Server Development**: Complex projects may need multiple servers (backend API, dev server, PM sync) running simultaneously across environments
5. **Lovable Compatibility**: Must keep gptengineer.js script and lovable-tagger
6. **WSL vs Windows**: Node modules installed in one environment won't work in the other
7. **Native Modules**: better-sqlite3 must be compiled for Electron's specific Node.js version
8. **Python for node-gyp**: Requires Python in PATH; conda activation solves this in batch scripts
9. **One-Click Setup**: Batch script can detect missing setup and auto-rebuild on first run
10. **Storage Lifecycle**: Must initialize storage AFTER core-settings but BEFORE other plugins
11. **User Flow**: Platform detection enables different first-run experiences (setup vs landing)
12. **Development vs Production**: `import.meta.env.DEV` cleanly separates dev/prod features
13. **ES Modules**: Package.json "type": "module" affects all .js files
14. **Plugin Architecture**: Simple is better - like game mods, not enterprise
15. **Theme System**: CSS variable-based theming works excellently with plugin architecture
16. **Component Sharing**: Optional core.ui plugin provides consistency without forcing it
17. **Storage Keys**: Each plugin should own its own storage namespace (e.g., `plugin-id:key-name`)
18. **localStorage vs StorageAdapter**: Only use StorageAdapter - localStorage should be avoided except for pre-storage-init fallbacks
19. **Setup Persistence**: Check actual storage data, not just in-memory flags, to handle localStorage clearing
20. **Electron Title Bar**: Frameless windows (`frame: false`) require custom drag regions (`-webkit-app-region: drag`)
21. **Scrollbar Hierarchy**: Use `h-full overflow-y-auto` on pages, not `min-h-screen`, to prevent double scrollbars
22. **Theme Persistence**: Theme service should manage its own storage key, not rely on settings service
23. **Cloudflare Tunnel**: Provides production-ready HTTPS without certificates, bypasses firewalls, enables local-to-cloud flow
24. **CORS Callbacks**: In Express CORS configuration, use `callback(null, false)` to reject origins, NOT `callback(new Error(...))`
25. **Hardcoded Production URLs**: Simplifies deployment - same code works in dev/preview/production when using production infrastructure
26. **Uncommon Ports**: Using port 7243 instead of common ports (3000, 8000) adds basic security through obscurity
27. **WSL + Windows Shared node_modules**: Single node_modules works for both environments - WSL reads source files, Windows uses native binaries
28. **npm Install Location Matters**: ALWAYS run `npm install` from Windows (not WSL) to ensure Electron gets Windows-compiled native modules
29. **Electron ABI Versioning**: electron-rebuild MUST be passed explicit `--version` flag in dual environments to avoid auto-detection failures
30. **Database Manual Management**: For schema changes, manually recreate databases via bash/sqlite3 commands instead of hardcoding migrations
31. **Public Page Plugin Isolation**: Plugins should NOT load on public pages (/, /login, /register, /setup) to prevent auth errors
32. **Auth Guard Placement**: Check authentication in AppShell BEFORE loading plugins, not after - prevents double redirects
33. **Theme Universal Access**: Theme must work on ALL pages, so use localStorage for public pages and dual storage for app pages
34. **Plugin Loading Timing**: Never load plugins in main.tsx for /app routes - let AppShell handle auth check first, then load plugins
