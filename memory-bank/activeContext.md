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

1. **Lovable Compatibility**: Must keep gptengineer.js script and lovable-tagger
2. **WSL vs Windows**: Node modules installed in one environment won't work in the other
3. **Native Modules**: better-sqlite3 must be compiled for Electron's specific Node.js version
4. **Python for node-gyp**: Requires Python in PATH; conda activation solves this in batch scripts
5. **One-Click Setup**: Batch script can detect missing setup and auto-rebuild on first run
6. **Storage Lifecycle**: Must initialize storage AFTER core-settings but BEFORE other plugins
7. **User Flow**: Platform detection enables different first-run experiences (setup vs landing)
8. **Development vs Production**: `import.meta.env.DEV` cleanly separates dev/prod features
9. **ES Modules**: Package.json "type": "module" affects all .js files
10. **Plugin Architecture**: Simple is better - like game mods, not enterprise
11. **Theme System**: CSS variable-based theming works excellently with plugin architecture
12. **Component Sharing**: Optional core.ui plugin provides consistency without forcing it
