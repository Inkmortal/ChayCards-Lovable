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
│     SQLite (Electron) / PostgreSQL (Cloud)       │
│          StorageAdapter Interface                │
└─────────────────────────────────────────────────┘
```

### Plugin Architecture (Simplified)
```
┌─────────────────────────────────────┐
│          AppShell                    │
│    (Minimal layout with regions)     │
├─────────────────────────────────────┤
│        Plugin Manager                │
│  (Singleton, handles everything)     │
│  - Storage (components, services)    │
│  - Plugin loading & dependencies     │
│  - Navigation & regions              │
│  - Event bus                         │
├─────────────────────────────────────┤
│         Plugin Host                  │
│    (Dynamic component rendering)     │
└─────────────────────────────────────┘
```

### AppShell Architecture
```
AppShell (minimal stage)
├── Header Region
├── Sidebar Region (with navigation)
├── Main Region (routes)
└── Footer Region

Each region can host plugin components
Theme is provided by a plugin, not AppShell
```

## Key Technical Decisions

### 1. Dual Platform Support
- **Decision**: Single codebase for Electron and Web
- **Implementation**: Platform adapters + runtime detection
- **Benefits**: 95% code reuse, consistent behavior

### 2. Plugin System Design
- **Decision**: Everything is a plugin, game-mod style freedom
- **Implementation**: Simple registry-based, no sandboxing
- **Benefits**: Maximum flexibility, easy to understand, powerful

### 3. Storage Architecture
- **Decision**: Abstract storage interface
- **Implementation**: Same API for local (SQLite) and cloud (PostgreSQL)
- **Benefits**: Platform flexibility, easy testing

### 4. Backend Sharing
- **Decision**: Same Express server runs locally and in cloud
- **Implementation**: Storage adapter injection
- **Benefits**: Consistent API, reduced complexity

### 5. Theme System as Plugin
- **Decision**: Themes are plugins, not built into core
- **Implementation**: Theme plugin wraps AppShell, provides CSS variables
- **Benefits**: Themes can be enhanced by other plugins, fully replaceable
- **Pattern**: Base theme provides guaranteed variables, enhancement plugins add more

### 6. Development Mode Compatibility
- **Decision**: Dual experience based on environment detection
- **Implementation**: `import.meta.env.DEV` detection for development-specific features
- **Benefits**: Lovable prototyping access while preserving production UX
- **Pattern**: Non-intrusive development panel visible only in Vite dev mode

## Design Patterns in Use

### Plugin Manager Pattern
```typescript
class PluginManager {
  private components = new Map<string, React.ComponentType>()
  private services = new Map<string, any>()
  private eventBus = new EventBus()
  
  // Direct access to storage, plus business logic
  getComponent(name: string) { return this.components.get(name) }
  setComponent(name: string, component: React.ComponentType) { 
    this.components.set(name, component)
    this.eventBus.emit('component:registered', { name })
  }
}
```
Single manager handles storage, events, and logic.

### Component Namespacing
```typescript
// Components registered with plugin prefix
manager.setComponent('core.documents/DocumentCard', DocumentCard)
manager.setComponent('ai-enhance/DocumentCard', EnhancedCard)

// No collisions, clear ownership
```

### Plugin Enhancement Pattern
```typescript
// Get original, wrap it, replace it
const Original = manager.getComponent('core.documents/DocumentCard')
const Enhanced = (props) => (
  <>
    <AIFeatures {...props} />
    <Original {...props} />
  </>
)
manager.setComponent('core.documents/DocumentCard', Enhanced)
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
AppShell → PluginManager (singleton)
    ↓                   ↓
Provides regions    Stores components/services
    ↓                   ↓
    ↓              Manages navigation
    ↓                   ↓
    ↓              Provides EventBus
    ↓                   ↓
PluginHost ← Gets components from PluginManager

Theme Plugin → Wraps AppShell → Provides theme context
                             ↓
                    Other plugins access theme

PlatformService → PlatformAdapter → (ElectronAdapter | WebAdapter)
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
1. Import plugin modules
2. Sort by dependencies
3. For each plugin:
   - Register components with namespace
   - Register services with namespace
   - Register routes
   - Call onLoad(registry)
4. Build navigation from all plugins
5. Ready for rendering

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

### Plugin Trust Model
- No sandboxing - full trust like game mods
- Plugins can modify anything
- Users responsible for what they install
- Version compatibility in manifests

### Future Security (When Needed)
- Plugin signing for marketplace
- Basic permission declarations
- User consent for sensitive operations
- But start simple - no restrictions

## Storage Architecture

### Cloud Storage Flow (Production-Ready)
```
┌─────────────────────────────────────────────────┐
│         Any Frontend Environment                 │
│  (Local Dev / Lovable Preview / Production)     │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS Request
                 │ https://api.chaycards.com/api/storage
                 ▼
┌─────────────────────────────────────────────────┐
│           Cloudflare Tunnel                      │
│  - Zero-config HTTPS                             │
│  - Bypasses firewall/NAT                         │
│  - Production-ready security                     │
└────────────────┬────────────────────────────────┘
                 │
                 │ Tunneled to localhost:7243
                 ▼
┌─────────────────────────────────────────────────┐
│         Express API Server (Port 7243)           │
│  - REST API with JSONB support                   │
│  - CORS configured for all environments          │
│  - Comprehensive logging                         │
└────────────────┬────────────────────────────────┘
                 │
                 │ Storage Operations
                 ▼
┌─────────────────────────────────────────────────┐
│      PostgreSQL Database (Port 5433)             │
│  - JSONB storage with key-value interface        │
│  - Created by Docker Compose                     │
└─────────────────────────────────────────────────┘
```

**Key Benefits**:
- Same URL works everywhere: `https://api.chaycards.com/api/storage`
- No environment-specific configuration needed
- Lovable preview can access local database
- Ready for production deployment (just deploy Express to VPS/Railway)
- HTTPS without certificate management
- Firewall bypass without port forwarding

### StorageAdapter Pattern
```typescript
interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

### Storage Implementations
- **SQLiteAdapter**: Electron local storage via better-sqlite3
  - Database location: `%APPDATA%\chaycards\storage.db`
  - IPC communication for renderer process access
  - Synchronous better-sqlite3 wrapped in async interface
- **PostgreSQLAdapter**: Cloud storage via Cloudflare Tunnel ✅ **COMPLETE**
  - Hardcoded URL: `https://api.chaycards.com/api/storage`
  - Async by nature (fetch API)
  - Same interface as SQLite
  - Works in local dev, Lovable preview, and production
  - Comprehensive error logging for debugging
  - CORS configured for all frontend environments

### Plugin Storage Pattern
Each plugin owns its own storage namespace:
- **Core Settings**: `core-settings:app-settings`
- **Theme Preference**: `core-theme:preference`
- **Demo Data**: `demo-plugin:notes`

**Key Rules**:
1. Always prefix keys with `plugin-id:`
2. Never use localStorage directly (except pre-init fallback)
3. Storage initialized AFTER core-settings, BEFORE other plugins
4. Plugins receive storage via `manager.getStorage()`

### Storage Lifecycle
```
1. PluginManager starts
2. Load core-settings plugin (gets defaults)
3. Initialize storage with storageMode from settings
4. Call settingsService.setStorage(adapter)
5. Load remaining plugins (all get initialized storage)
```

### Backend API Server Requirements
**Critical Pattern: Windows-Only Backend for Cloudflare Tunnel**

When using Cloudflare tunnel on Windows, the backend API server MUST run on Windows:

```
┌─────────────────────────────────────────────────┐
│           Frontend (Any Environment)             │
│    (WSL Dev / Windows / Lovable Preview)        │
└────────────────┬────────────────────────────────┘
                 │ HTTPS Request
                 │ https://api.chaycards.com
                 ▼
┌─────────────────────────────────────────────────┐
│      Cloudflare Tunnel (Windows Process)         │
│  - Runs on Windows                               │
│  - Routes to Windows localhost:7243              │
└────────────────┬────────────────────────────────┘
                 │
                 │ MUST be Windows localhost
                 ▼
┌─────────────────────────────────────────────────┐
│   Backend API Server (Windows localhost:7243)    │
│  - npm run server (from Windows)                 │
│  - Express REST API                              │
│  - ❌ CANNOT run in WSL                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        PostgreSQL Database (Port 5433)           │
└─────────────────────────────────────────────────┘
```

**Why This Pattern?**
- Windows and WSL have **different network namespaces**
- Windows `localhost:7243` ≠ WSL `localhost:7243`
- Cloudflare tunnel runs on Windows and points to Windows localhost
- If backend runs in WSL, Windows tunnel cannot reach it
- Frontend in WSL CAN access Windows backend via tunnel (goes through internet)

**Commands:**
- ✅ Correct: Run `npm run server` from **Windows Command Prompt**
- ❌ Wrong: Run `npm run server` from **WSL terminal**

**Multi-Server Development Setup:**
```bash
# Windows Command Prompt:
npm run server              # Backend API (port 7243)
npm run notion-pm:server    # Notion PM sync (port 3001)

# WSL Terminal:
npm run dev                 # Vite dev server (port 8080)
```

**Debugging Login Issues:**
- Error: "JSON.parse: unexpected character at line 1 column 1"
- Cause: Backend server not running on Windows
- Result: Cloudflare tunnel returns HTML 404 instead of JSON
- Solution: Check backend server is running on Windows, not WSL

## Plugin Communication Patterns

### Synchronous Communication
- **Method**: Direct service calls through PluginManager
- **Use Case**: Immediate responses, API calls, data access
- **Example**: `manager.getService('documents/api').createDocument()`

### Asynchronous Communication
- **Method**: EventBus for decoupled messaging
- **Use Case**: Notifications, state changes, plugin coordination
- **Example**: `eventBus.emit('document:created', { id, title })`

### Component Enhancement
- **Method**: Region-based component registration
- **Pattern**: Get original component, wrap it, re-register
- **Benefit**: Clean enhancement without direct dependencies