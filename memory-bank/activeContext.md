# Active Context

## Current Work Focus

We are building the foundation architecture for ChayCards with a focus on:
1. ~~Setting up dual-platform support (Electron + Web)~~ ✅ Complete
2. ~~Multi-platform architecture analysis~~ ✅ Complete
3. ~~Capacitor mobile integration~~ ✅ Complete
4. **Plugin system infrastructure + User Experience** - **CURRENT PRIORITY**
   - Minimal PluginManager implementation - **IMMEDIATE NEXT**
   - Theme system as first plugin - **IMMEDIATE NEXT**
   - Smart platform-aware user flow - **IMMEDIATE NEXT**
   - Enhanced component system with Duolingo aesthetic
5. Game plugin design and architecture - **HIGH PRIORITY**
6. Building the frontend with plugin architecture

**Current Status**: Moving from architecture documentation to implementation
- **Implementation Strategy**: "Vertical Slice First" - build minimal working system end-to-end
- **First Plugin**: Theme system (core.theme) to validate plugin architecture
- **User Experience Focus**: Platform-aware onboarding flow before main app features
- **Visual Design**: Duolingo-inspired aesthetic (rounded, chunky buttons, clean typography)
- **Deployment Strategy**: Local-first for desktop, cloud-first for web, future mobile support

## Recent Changes

### User Experience & Plugin System Strategy (September 26, 2025)
- **Major Shift**: From pure architecture to user-experience focused implementation
- **Platform-Aware User Flow**: Smart navigation based on deployment platform
  - Web: Cloud-first flow with download option for desktop apps
  - Desktop: Local-first flow with 3 options (Local/Sync/Cloud)
  - Mobile: Future cloud-only approach
- **Smart Routing**: Returning users skip setup, go directly to main app
- **Duolingo-Inspired Design**: Clean aesthetic with rounded, chunky buttons (not color copying)
- **Theme System as Plugin**: Validates plugin architecture while providing foundation
- **Existing Code Reuse**: Transform current home page rather than rebuild from scratch

### Multi-Platform Architecture Analysis (September 24, 2025)
- Comprehensive research of cross-platform deployment options
- **Key Decision**: Electron + Capacitor over Tauri based on:
  - AI assistance effectiveness (Claude/ChatGPT better with JS than Rust)
  - Community consensus: "stick with Electron for highest development speed"
  - Proven track record: 60% of cross-platform apps use Electron (2024 data)
  - Game plugin needs: Full Chromium for rich canvas/WebGL support
- **Mobile Strategy**: Add Capacitor as "Electron for mobile"
  - Same React codebase across web, desktop, mobile
  - 95% code reuse across all platforms
- **Game Server**: Godot headless server via HTTP/WebSocket
  - Single project approach (shared client/server code)
  - Headless mode: `--display-driver headless`
  - Local or cloud deployment options
- Created game plugin architecture foundation

### Live2D AI Assistant Plugin Analysis (January 7, 2025)
- Analyzed Open-LLM-VTuber implementation in depth
- Confirmed ChayCards plugin architecture can implement ALL VTuber features
- Added Python backend support to plugin system documentation
- Key findings:
  - Python backends run as plugin service child processes
  - ChayCards' runtime platform detection is superior to VTuber's build-time separation
  - Can go beyond VTuber with MCP tools, Docker sandboxing, multi-agent support
- Created comprehensive documentation:
  - `/memory-bank/docs/OPEN_LLM_VTUBER_IMPLEMENTATION.md` - Implementation reference
  - `/memory-bank/docs/PLUGIN_PYTHON_BACKEND.md` - Python backend guide
  - Updated `PLUGIN_SYSTEM.md` with Python support

### MCP Integration (May 26, 2025)
- Successfully integrated Notion MCP for persistent task tracking
- Database ID: `1fcbbd9b-1a29-8037-93a7-f8088c952035`
- Created documentation for Claude's MCP usage
- Tested Puppeteer MCP for frontend testing capabilities

### AppShell Architecture (May 26, 2025)
- Designed minimal AppShell that serves as stage for plugins
- Established region system (header, sidebar, main, footer)
- **KEY DECISION**: Theme system will be a plugin, not built into AppShell
- Created `/memory-bank/docs/APPSHELL_ARCHITECTURE.md`
- Updated `/src/renderer/layouts/CLAUDE.md` with implementation guide

### Plugin System Design (May 23, 2025)
- Analyzed original ChayCards codebase for reusable patterns
- Designed game-mod inspired plugin system (simple, powerful)
- Created comprehensive plugin documentation
- Established frontend architecture where EVERYTHING is a plugin

### Frontend Architecture Decisions
- **Plugin-First**: All features are plugins, including core functionality
- **Component Registry**: Dynamic component resolution with namespacing
- **No Direct Imports**: Plugins communicate through registry only
- **Optional Core UI**: Shared components available but not required
- **Simple Over Safe**: Like game mods - freedom over protection
- **Theme as Plugin**: Themes are plugins that can be enhanced by other plugins

### Documentation Created
- `/memory-bank/docs/PLUGIN_SYSTEM.md` - Complete plugin architecture
- `/memory-bank/docs/FRONTEND_ARCHITECTURE.md` - Frontend patterns
- `/memory-bank/docs/APPSHELL_ARCHITECTURE.md` - AppShell design
- `/notion.md` - Notion MCP usage guide
- `/puppeteer.md` - Puppeteer MCP testing guide
- CLAUDE.md files in key directories for AI guidance

## Next Steps

### Immediate (High Priority)
1. **Plugin System Foundation** - **CURRENT TASK**
   - Minimal PluginManager with Vite glob imports
   - EventBus for plugin communication
   - Theme system as first plugin (core.theme)
   - Pre-React plugin loading and initialization
2. **Platform-Aware User Experience**
   - Smart routing based on platform detection
   - Enhanced home page with deployment choice
   - Desktop: Local/Sync/Cloud options
   - Web: Cloud-first with download option
3. **Duolingo-Inspired Component Enhancement**
   - Enhance existing shadcn components with new aesthetic
   - Chunky, rounded buttons with 3D shadows
   - Clean typography and generous spacing
   - Theme integration from day one

### Short Term
1. **Core UI Plugin**
   - Build upon theme system foundation
   - Enhanced component library with theme integration
   - Plugin-registered shadcn components
2. **Main App Implementation**
   - AppShell with plugin regions
   - Plugin-driven navigation
   - Settings system for theme/deployment switching
3. **Game Plugin Implementation**
   - Build game client interface
   - Implement task-to-game-time mechanics
   - Create Godot server template

### Medium Term
1. Build core.documents plugin
2. Create core.tasks plugin (integrate with game)
3. Implement core.knowledge plugin
4. Backend API structure
5. Storage adapters
6. Plugin marketplace
7. Testing infrastructure

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

### Architecture Patterns
- **Plugin System**: Simple registry-based, like game mods
- **Component Namespacing**: `plugin-id/ComponentName` prevents collisions
- **Dynamic Resolution**: Components resolved at runtime from registry
- **Platform Detection**: Runtime detection, not build-time
- **Frontend-First**: Build UI with mocks, add backend later
- **Smart User Flow**: Platform-aware routing (local-first desktop, cloud-first web)
- **Theme-as-Plugin**: Theme system implemented as first plugin to validate architecture

## Important Patterns and Preferences

### Code Organization
- Platform-specific code isolated in adapters
- Shared business logic in `src/shared/`
- Plugin code completely self-contained
- Clear separation between renderer and main process
- Python backends managed as plugin services

### Plugin Backend Support
- Plugins can include Python backends for compute-intensive tasks
- Python runs as child processes managed by plugin services
- Python runtime bundled with Electron app (users don't need Python)
- Same Python code works in both Electron and cloud deployments
- Each plugin manages its own Python lifecycle

### Development Workflow
- Test in both Electron and Web regularly
- Use TypeScript for type safety
- Keep dependencies minimal
- Document architectural decisions

## Learnings and Project Insights

1. **Lovable Compatibility**: Must keep gptengineer.js script and lovable-tagger
2. **WSL vs Windows**: Node modules installed in one environment won't work in the other
3. **ES Modules**: Package.json "type": "module" affects all .js files
4. **Plugin Architecture**: Simple is better - like game mods, not enterprise
5. **Theme System**: Original project has excellent CSS variable-based theming
6. **Frontend Approach**: Everything is a plugin from the start, no migration needed
7. **Component Sharing**: Optional core.ui plugin provides consistency without forcing it
8. **Python Integration**: Plugins can have Python backends without changing core architecture
9. **Platform Detection**: Runtime detection (ChayCards) is superior to build-time separation (VTuber)
10. **Live2D Feasibility**: ChayCards can implement all VTuber features plus add MCP tools, sandboxing