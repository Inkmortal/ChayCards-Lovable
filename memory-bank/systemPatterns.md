# System Patterns

## System Architecture

### Overall Structure
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│              (React + TypeScript)                │
├─────────────────────────────────────────────────┤
│                Platform Adapter                  │
│         (ElectronAdapter / WebAdapter)           │
├─────────────────────────────────────────────────┤
│                 Express API                      │
│              (Shared Backend Code)               │
├─────────────────────────────────────────────────┤
│              Storage Abstraction                 │
│        (LocalStorage / CloudStorage)             │
└─────────────────────────────────────────────────┘
```

### Plugin Architecture
```
┌─────────────────────────────────────┐
│          Plugin Host                 │
│    (Loads and manages plugins)       │
├─────────────────────────────────────┤
│          Event Bus                   │
│   (Inter-plugin communication)       │
├─────────────────────────────────────┤
│      Plugin API Surface              │
│   (What plugins can access)          │
├─────────────────────────────────────┤
│         Plugin Sandbox               │
│    (Isolated execution context)      │
└─────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Dual Platform Support
- **Decision**: Single codebase for Electron and Web
- **Implementation**: Platform adapters + runtime detection
- **Benefits**: 95% code reuse, consistent behavior

### 2. Plugin System Design
- **Decision**: Everything is a plugin (documents, tasks, knowledge)
- **Implementation**: Event-driven communication, sandboxed execution
- **Benefits**: Extensible, maintainable, community-friendly

### 3. Storage Architecture
- **Decision**: Abstract storage interface
- **Implementation**: Same API for local (SQLite) and cloud (PostgreSQL)
- **Benefits**: Platform flexibility, easy testing

### 4. Backend Sharing
- **Decision**: Same Express server runs locally and in cloud
- **Implementation**: Storage adapter injection
- **Benefits**: Consistent API, reduced complexity

## Design Patterns in Use

### Operation Pattern
```typescript
interface Operation<T> {
  validate(): Promise<ValidationResult>
  detectConflicts(): Promise<ConflictResult>
  execute(): Promise<T>
  rollback?(): Promise<void>
}
```
Every data mutation follows this pattern for consistency and error handling.

### Storage Adapter Pattern
```typescript
interface IStorage {
  get<T>(collection: string, id: string): Promise<T>
  set<T>(collection: string, data: T): Promise<void>
  query<T>(collection: string, filter: any): Promise<T[]>
}
```
Allows swapping storage backends without changing application code.

### Event-Driven Plugin Communication
```typescript
// Plugin A emits
eventBus.emit('document:created', { id, title })

// Plugin B listens
eventBus.on('document:created', (data) => {
  // React to document creation
})
```

### Platform Service Pattern
```typescript
const platform = new PlatformService()
const adapter = platform.getAdapter()
// Same API regardless of platform
adapter.showNotification(title, body)
```

## Component Relationships

### Core Dependencies
```
PlatformService → PlatformAdapter → (ElectronAdapter | WebAdapter)
                                   ↓
Express Server → IStorage → (LocalStorage | CloudStorage)
                           ↓
Plugin System → EventBus → Plugins
```

### Data Flow
1. User Action → React Component
2. Component → Platform Service
3. Platform Service → Express API (local or remote)
4. Express API → Storage Adapter
5. Storage Adapter → Database/FileSystem
6. Response flows back up the chain

## Critical Implementation Paths

### Plugin Loading Sequence
1. Read plugin manifest
2. Validate permissions
3. Create sandboxed context
4. Load plugin bundle
5. Initialize plugin with API
6. Register event listeners
7. Add to plugin registry

### Storage Operation Flow
1. Receive request at API endpoint
2. Validate request data
3. Check user permissions
4. Create operation instance
5. Run validation phase
6. Check for conflicts
7. Execute operation
8. Emit success events
9. Return response

### Platform Detection
```typescript
// At startup
const isElectron = window.electronAPI !== undefined
const adapter = isElectron 
  ? new ElectronAdapter() 
  : new WebAdapter()
```

## Security Considerations

### Plugin Sandboxing
- Plugins run in isolated contexts
- Limited API surface exposure
- Permission-based access control
- No direct file system access

### Data Security
- Local: Encrypted SQLite database
- Cloud: TLS + encryption at rest
- API: JWT authentication
- Plugins: Signed bundles only