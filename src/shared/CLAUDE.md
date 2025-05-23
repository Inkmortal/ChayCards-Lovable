# Shared Directory

## Purpose
This directory contains code that is shared across ALL parts of the application - renderer, main process, server, and plugins. This is the heart of our "write once, run everywhere" strategy.

## Structure
- `adapters/` - Platform-specific implementations
- `storage/` - Storage implementations (Local/Cloud)
- `services/` - Business logic services
- `types/` - TypeScript type definitions
- `lib/` - Utility functions
- `plugin-system/` - Plugin infrastructure
- `operations/` - Operation pattern implementations
- `events/` - Event bus system

## Key Patterns

### Platform Adapters
```typescript
// One interface, multiple implementations
interface PlatformAdapter {
  showNotification(title: string, body: string): void
  openExternal(url: string): void
}

// Runtime selection
const adapter = isElectron ? ElectronAdapter : WebAdapter
```

### Storage Abstraction
```typescript
// Same interface for all storage types
interface IStorage {
  get<T>(collection: string, id: string): Promise<T>
  set<T>(collection: string, data: T): Promise<void>
}

// LocalStorage uses SQLite
// CloudStorage uses PostgreSQL
// But consumers don't care!
```

### Operation Pattern
Every data mutation follows this pattern:
```typescript
class CreateDocumentOperation implements Operation<Document> {
  async validate() { /* ... */ }
  async detectConflicts() { /* ... */ }
  async execute() { /* ... */ }
  async rollback() { /* ... */ }
}
```

## Important Notes

### No Platform-Specific Code
- This directory must work in Node.js AND browser
- No direct file system access
- No Electron-specific APIs
- No browser-only APIs

### Type Safety
- Define all shared types here
- Use generics for flexibility
- Export everything through index files

### Plugin System
- Plugin interfaces defined here
- Plugin loader implementation
- Event bus for communication
- Permission system

## Common Tasks

### Adding a Service
1. Create in `services/`
2. Use dependency injection
3. Keep platform-agnostic
4. Add tests

### Adding Types
1. Create in `types/`
2. Use interfaces over types when possible
3. Document with JSDoc
4. Export from index

### Creating an Operation
1. Extend base Operation class
2. Implement all phases
3. Handle errors gracefully
4. Emit appropriate events

## Architecture Rules

### Dependencies
- Shared code can only depend on other shared code
- No circular dependencies
- Use interfaces for loose coupling

### Testing
- Unit test everything here
- Mock platform-specific parts
- Test both environments

### Events
- Use event bus for loose coupling
- Document event types
- Version events for compatibility