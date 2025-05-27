# Active Context

## Current Work Focus

We are building the foundation architecture for ChayCards with a focus on:
1. ~~Setting up dual-platform support (Electron + Web)~~ ✅ Complete
2. Creating the plugin system infrastructure - **IN PROGRESS**
   - AppShell implementation - **NEXT TASK**
   - PluginRegistry and PluginManager
   - Theme system as a plugin
3. Building the frontend with plugin architecture

## Recent Changes

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
1. **AppShell Implementation** (NEXT TASK)
   - Create minimal layout with regions
   - Add region component support
   - Test with existing PluginHost
2. **PluginRegistry and PluginManager**
   - Dependency resolution
   - Component/service storage
3. **Theme System Plugin**
   - Base theme with CSS variables
   - Theme provider wrapper
   - Support for theme enhancement
4. **Core UI Plugin**
   - Depends on theme system
   - Shared shadcn components

### Short Term
1. Build core.documents plugin
2. Create core.tasks plugin
3. Implement core.knowledge plugin
4. Test plugin enhancement patterns

### Medium Term
1. Backend API structure
2. Storage adapters
3. Plugin marketplace
4. Testing infrastructure

## Active Decisions and Considerations

### Technical Choices
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

## Important Patterns and Preferences

### Code Organization
- Platform-specific code isolated in adapters
- Shared business logic in `src/shared/`
- Plugin code completely self-contained
- Clear separation between renderer and main process

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