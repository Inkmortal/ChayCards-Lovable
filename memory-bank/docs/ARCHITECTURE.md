# ChayCards Architecture

## Directory Structure

```
ChayCards-Loveable/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js            # Entry point
│   │   ├── api/                # Local API implementation
│   │   └── services/           # Main process services
│   │
│   ├── renderer/               # Frontend (shared Electron + Web)
│   │   ├── components/         # UI components
│   │   ├── contexts/          # React contexts (theme, auth, etc)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # App layouts
│   │   ├── pages/             # Route pages
│   │   └── plugins/           # Plugin host components
│   │
│   ├── server/                 # Express backend (shared)
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, etc
│   │   └── app.ts             # Express app factory
│   │
│   ├── shared/                # Shared across all platforms
│   │   ├── operations/        # Operation pattern (CRUD)
│   │   ├── storage/           # Storage interfaces
│   │   ├── events/            # Event system
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utilities
│   │
│   ├── adapters/              # Platform adapters
│   └── services/              # Business logic services
│
├── plugins/                   # Built-in plugins
│   ├── documents/
│   ├── tasks/
│   └── knowledge/
│
├── cloud/                     # Cloud deployment
│   ├── Dockerfile
│   └── server.ts             # Cloud entry point
│
└── electron/                  # Electron specific
    ├── main.js               # Electron main
    └── preload.js            # Preload script
```

## Key Architectural Patterns

### 1. Operation System
Every data mutation goes through the operation pipeline:
- Validation
- Conflict Detection  
- Execution
- Optional Rollback

### 2. Storage Abstraction
```typescript
interface IStorage {
  // Same interface for local (SQLite) and cloud (PostgreSQL)
  get<T>(collection: string, id: string): Promise<T>
  save<T>(collection: string, data: T): Promise<void>
}
```

### 3. Event-Driven Plugin System
- Plugins communicate via events
- No direct dependencies between plugins
- Clean extension points

### 4. Platform Adapters
- Single codebase
- Platform-specific implementations injected at runtime
- Web and Electron share 95% of code

## Design Principles

1. **Offline First**: Local storage with sync capabilities
2. **Plugin Architecture**: Everything is a plugin
3. **Type Safety**: Full TypeScript coverage
4. **Event Driven**: Loose coupling via events
5. **Progressive Enhancement**: Works locally, enhanced with cloud