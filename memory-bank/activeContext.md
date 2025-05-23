# Active Context

## Current Work Focus

We are building the foundation architecture for ChayCards with a focus on:
1. Setting up dual-platform support (Electron + Web)
2. Creating the plugin system infrastructure
3. Implementing shared backend architecture

## Recent Changes

### Architecture Decisions (May 22, 2025)
- Moved from Lovable's task manager demo to clean ChayCards foundation
- Implemented Electron-first folder structure with shared code
- Set up platform detection (Electron vs Web)
- Created complete directory structure for future features

### Key Refactoring
- Removed Bun dependency, standardized on npm
- Cleaned up Lovable boilerplate code
- Moved shared code to `src/shared/` directory
- Fixed ES modules vs CommonJS issues for Electron

## Next Steps

### Immediate (High Priority)
1. Implement Express server that runs both locally and in cloud
2. Create storage abstraction layer (IStorage interface)
3. Build basic plugin loading system
4. Test cross-platform functionality

### Short Term
1. Implement first built-in plugin (documents)
2. Create plugin API surface
3. Set up inter-plugin communication
4. Build plugin permission system

### Medium Term
1. Cloud deployment setup
2. Plugin marketplace infrastructure
3. User authentication system
4. Data synchronization

## Active Decisions and Considerations

### Technical Choices
- **Package Manager**: npm (not Bun) for consistency
- **Module System**: ES modules for app code, CommonJS for Electron main
- **State Management**: TBD - considering Zustand or Context API
- **Backend**: Express.js shared between local and cloud
- **Storage**: SQLite (local) / PostgreSQL (cloud) with same interface

### Architecture Patterns
- **Operation System**: Validate → Conflict Detection → Execute pattern
- **Storage Abstraction**: Interface-based for platform flexibility
- **Plugin Communication**: Event-driven via EventBus
- **Platform Detection**: Runtime detection, not build-time

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
4. **Plugin Architecture**: Community plugins should be pre-compiled bundles, not source
5. **Storage Scaling**: Share plugin bundles via CDN, not duplicate per user