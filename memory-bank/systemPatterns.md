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

### Agent Auto-Chaining Pattern (Claude Code Orchestration)
**Problem**: Main Claude's context fills up to 50% by understanding a problem before even starting work.

**Solution**: Auto-chaining agent workflows where agents call each other directly, not through Main Claude.

```mermaid
flowchart TD
    User[User Request] --> MainClaude[Main Claude]
    MainClaude -->|Delegates| Agent1[First Agent]
    Agent1 -->|Auto-calls| Agent2[Next Agent]
    Agent2 -->|Auto-calls| Agent3[Final Agent]
    Agent3 -->|Auto-calls| MBK[memory-bank-keeper]
    MBK -->|Returns Summary| Agent3
    Agent3 -->|Compressed Summary<br/>2-3 sentences| MainClaude
    MainClaude -->|Reports| User
```

**Key Principles**:
1. **Main Claude as Orchestrator**: Discusses with user, delegates to first agent, receives compressed summaries, reports to user
2. **Agents Auto-Chain**: Each agent knows its position and automatically calls the next agent
3. **memory-bank-keeper as Hub**: Terminal node of all chains, enables context sharing without Main Claude
4. **Compressed Summaries**: Agents return 2-3 sentence summaries to Main Claude, full details in activeContext.md
5. **Context Efficiency**: 10x improvement (600 tokens vs 5000+ per task)

**Implementation Workflow Example**:
```
User: "Implement file upload"
  ↓
Main Claude: Reads coreInstructions.md PRE-TASK CHECKLIST
  ↓
Main Claude: Delegates to context-researcher agent
  ↓
context-researcher: Researches existing patterns, file paths
  ↓ (auto-calls)
memory-bank-keeper: Documents research in activeContext.md
  ↓ (returns control)
context-researcher: Returns compressed summary to Main Claude
  → "Found uploadFile() pattern at DocumentsService.ts:342.
     Uses outdated API. Research documented."
  ↓
Main Claude: Gets user approval, delegates to implementation agent
  ↓
implementation: Reads research from activeContext.md, implements code
  ↓ (auto-calls)
code-reviewer: Reviews implementation
  ↓ (auto-calls)
test-runner-validator: Runs tests
  ↓ (auto-calls)
memory-bank-keeper: Documents results in activeContext.md
  ↓ (returns control through chain)
implementation: Returns compressed summary to Main Claude
  → "File upload implemented with validation.
     Tests passing. Ready for commit."
  ↓
Main Claude: Reports to user
```

**Agent Chain Positions**:
- **First Agents** (start chains): context-researcher, root-cause-debugger, security-reviewer
- **Middle Agents** (continue chains): implementation, code-reviewer, test-runner-validator, code-cleanup-refactor
- **Terminal Node** (ends all chains): memory-bank-keeper
- **Decision Points** (don't auto-chain): security-reviewer (Main Claude decides whether to proceed)

**Context Savings**:
- **Without orchestration**: Main Claude reads full outputs (~5000 tokens per task)
- **With orchestration**: Main Claude only reads summaries (~600 tokens per task)
- **Result**: 100x reduction in memory-bank-keeper enables agents to share context via activeContext.md

**Permanent Documentation**:
- `/memory-bank/coreInstructions.md` - PRE-TASK CHECKLIST, never modified during development
- `.claude/agents/*.md` - Each agent knows its chain position and next agent to call
- `memory-bank/activeContext.md` - Shared context repository ("Recent Changes" section)

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
- **Theme Preference**: `core-theme:preference` (deprecated) / `core-theme:current-theme` (current)
- **All Themes**: `core-theme:all-themes` (single source of truth for all themes)
- **Favorites**: `core-theme:favorites` (array of theme IDs)
- **Demo Data**: `demo-plugin:notes`

**Key Rules**:
1. Always prefix keys with `plugin-id:`
2. Never use localStorage directly (except pre-init fallback)
3. Storage initialized AFTER core-settings, BEFORE other plugins
4. Plugins receive storage via `manager.getStorage()`

### User Plugin Preferences Pattern
**Problem**: Multi-tenant deployment needs per-user plugin filtering.

**Solution**: Store enabled_plugins list in users table (PostgreSQL/SQLite).

```typescript
// Database schema
interface User {
  id: string;
  email: string;
  installed_plugins: string[]; // ALL plugins discovered by system
  enabled_plugins: string[];   // Plugins user has enabled
  storageMode: 'local' | 'cloud' | 'sync'; // Per-user storage choice
}

// PluginManager.ts (lines 162-244)
private async getUserPluginPreferences(discoveredPlugins: Plugin[]): Promise<UserPluginPreferences> {
  if (isWeb()) {
    // Web: Query PostgreSQL via API
    const response = await fetch(`/api/users/me/plugins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return { enabledPlugins: data.enabledPlugins || [] };
  } else {
    // Electron: Query SQLite (TODO: implement)
    // For now, return all plugins enabled
    return { enabledPlugins: discoveredPlugins.map(p => p.id) };
  }
}

// Filter plugins before loading
private filterByUserPreferences(plugins: Plugin[], preferences: UserPluginPreferences): Plugin[] {
  return plugins.filter(plugin => {
    // Core plugins ALWAYS load (cannot be disabled)
    if (isCorePlugin(plugin.id)) return true;

    // Optional plugins: check user preferences
    return preferences.enabledPlugins.includes(plugin.id);
  });
}
```

**Key Benefits**:
- Multi-tenant plugin filtering (different users see different plugins)
- Core plugins always enabled (system stability)
- User-specific storage mode (local/cloud choice per user)
- API endpoint: `GET /api/users/me/plugins` returns user's enabled plugins
- Falls back to all-enabled if no preferences found

**Storage Location**:
- **NOT in generic storage** (`storage` table) - that's for plugin data
- **IN users table** - user-specific configuration
- `enabled_plugins` column stores JSON array of plugin IDs

### publicSafe Metadata Pattern
**Problem**: Some plugins don't need user storage (themes, UI components) but should work for anonymous users.

**Solution**: Add `publicSafe: true` metadata to plugin manifest.

```typescript
// Plugin manifest
export const CoreUIPlugin: Plugin = {
  id: 'core-ui',
  name: 'Core UI Components',
  publicSafe: true,  // Can run without user storage
  requires: [],
  components: { ... }
};

// PluginManager.ts
async loadPublicSafePlugins(): Promise<void> {
  // Only load plugins with publicSafe: true
  const plugins = discoveredPlugins.filter(p => p.publicSafe);
  for (const plugin of plugins) {
    await this.loadPlugin(plugin);
  }
}
```

**Use Cases**:
- Theme plugins (work on public pages like landing, login, register)
- UI component libraries (no data persistence needed)
- Utility plugins (formatting, validation, etc.)

**Loading Strategy**:
- **Public pages** (/, /login, /register): Load only `publicSafe` plugins
- **App pages** (/app/*): Load ALL plugins (authenticated users)
- **Storage check**: `publicSafe` plugins get `null` from `manager.getStorage()`

**Example: Theme on Public Pages**
```typescript
// main.tsx (public page)
if (isPublicPage()) {
  await pluginManager.loadPublicSafePlugins(); // Only themes, no storage
  // Theme loads from localStorage, no database needed
}
```

**Key Benefits**:
- Anonymous users get themed UI on public pages
- No auth errors from storage attempts
- Clear plugin categorization (needs storage vs doesn't)
- Enables progressive enhancement

### Pure Database Storage Pattern (NO CACHES)
**Problem**: In-memory caches (Map, Set) in singleton services persist between sessions, causing:
- Memory leaks (cache never cleared)
- Duplicate data on hot reload
- State inconsistencies (cache vs DB mismatch)

**Solution**: Pure database storage with single source of truth
```typescript
// ❌ BAD: Persistent cache in singleton service
class ThemeService {
  private themes = new Map<string, Theme>(); // Memory leak!
  private favorites = new Set<string>(); // Duplicate state!

  async registerTheme(theme: Theme) {
    this.themes.set(theme.id, theme); // Only in memory
    // No DB write = data lost on refresh
  }

  getAvailableThemes(): Theme[] {
    return Array.from(this.themes.values()); // Stale cache
  }
}

// ✅ GOOD: Pure database storage (stateless service)
class ThemeService {
  // No caches! Only transient state (currentTheme for CSS application)
  private currentTheme: Theme = DEFAULT_THEME;
  private storage: StorageAdapter | null = null;

  async registerTheme(theme: Theme): Promise<void> {
    // Read from DB
    const existingThemes = await this.storage.get<Theme[]>('core-theme:all-themes') || [];

    // Check for duplicates (prevents hot reload issues)
    if (existingThemes.some(t => t.id === theme.id)) {
      return; // Already registered
    }

    // Modify in memory
    existingThemes.push(theme);

    // Write back to DB (single source of truth)
    await this.storage.set('core-theme:all-themes', existingThemes);
  }

  async getAvailableThemes(): Promise<Theme[]> {
    // Always read from DB (no cache)
    return await this.storage.get<Theme[]>('core-theme:all-themes') || [];
  }

  async toggleFavorite(themeId: string): Promise<void> {
    // Read from DB
    const favorites = await this.storage.get<string[]>('core-theme:favorites') || [];

    // Modify in memory
    const index = favorites.indexOf(themeId);
    if (index !== -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(themeId);
    }

    // Write back to DB
    await this.storage.set('core-theme:favorites', favorites);
  }
}
```

**Pattern Benefits**:
- No memory leaks (nothing persists between sessions except currentTheme for CSS)
- Single source of truth (DB is always correct)
- Hot reload safe (duplicate check prevents re-registration)
- Consistent state across sessions
- Simpler mental model (no cache invalidation logic)

**React Integration**:
```typescript
// Custom hook handles async initialization
export const useAvailableThemes = (): Theme[] => {
  const [themes, setThemes] = useState<Theme[]>([]); // Start empty

  useEffect(() => {
    // Subscription immediately provides current state (from DB query)
    const unsubscribe = themeService.onThemeListChange(setThemes);
    return unsubscribe;
  }, []);

  return themes;
};

// Service subscription provides immediate state
onThemeListChange(callback: (themes: Theme[]) => void): () => void {
  // Immediately call callback with current DB state
  this.getAvailableThemes().then(themes => callback(themes));

  // Then notify on future changes
  this.listeners.add(() => {
    this.getAvailableThemes().then(themes => callback(themes));
  });

  return () => this.listeners.delete(callback);
}
```

**Client-Side Filtering** (faster than async service calls):
```typescript
// UI component filters locally with useMemo
const filteredThemes = useMemo(() => {
  let themes = availableThemes; // From useAvailableThemes() hook

  // Apply category filter
  themes = themes.filter(t => t.category === categoryFilter);

  // Apply search filter
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    themes = themes.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  return themes;
}, [availableThemes, searchQuery, categoryFilter]);
```

**Key Principles**:
1. **Database is truth**: All persistent data in DB, not memory
2. **Read-Modify-Write**: Always read latest from DB before modifying
3. **Async everything**: All storage operations return Promise
4. **React hooks**: useState + useEffect for async initialization
5. **Client-side filtering**: Use useMemo in components, not async service methods
6. **Duplicate prevention**: Check DB before inserting (handles hot reload)

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

### Files as Entity Properties Pattern
**Problem**: Plugins need to store binary files (PDFs, images, attachments) but face two critical challenges:
1. **Orphaned Files**: Separate file APIs allow files to exist without parent entities, leaking storage
2. **User Security**: Files need automatic user scoping to prevent cross-user access

**Example of Orphan Problem (Old Dual API)**:
```typescript
// ❌ OLD DESIGN: Separate APIs create orphans
await storage.set('document:doc-123', { title: 'Report' });
await storage.setFile('file-xyz', pdfData);  // Separate storage

// Later: Delete document
await storage.delete('document:doc-123');
// BUG: file-xyz is orphaned! Storage leaked, no cleanup
```

**Solution**: Files stored AS PROPERTIES of entities with database CASCADE DELETE.

```typescript
// ✅ NEW DESIGN: Files as entity properties
interface StorageAdapter {
  // Unified interface - files attach to entities
  set(key: string, data: any, files?: Record<string, Uint8Array | null>): Promise<void>;
  get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null>;
  delete(key: string): Promise<void>;

  list(prefix?: string): Promise<string[]>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

**Usage Pattern**:
```typescript
// Store entity WITH files in single operation
await storage.set('documents:doc-123',
  { title: 'Q4 Report', tags: ['finance'] },
  { pdf: pdfData, thumbnail: thumbnailData }
);

// Retrieve entity with files
const result = await storage.get('documents:doc-123');
// Returns: { data: { title, tags }, files: { pdf: Uint8Array, thumbnail: Uint8Array } }

// Delete entity (files cascade automatically)
await storage.delete('documents:doc-123');
// ✅ Both PDF and thumbnail automatically deleted via CASCADE DELETE

// Update/replace files
await storage.set('documents:doc-123',
  { title: 'Updated Report' },
  { pdf: newPdfData, thumbnail: null }  // null = delete thumbnail
);
```

**Key Benefits**:
- ✅ **No orphaned files**: CASCADE DELETE enforced by database FK
- ✅ **Atomic operations**: Entity + files in single transaction
- ✅ **Simpler plugin code**: No manual file tracking or cleanup
- ✅ **User scoping automatic**: Composite keys prevent cross-user access
- ✅ **Arbitrary field names**: Plugins choose descriptive names (pdf, thumbnail, avatar)

**Database Schema (CASCADE DELETE)**:
```sql
-- SQLite (Electron)
CREATE TABLE files (
  storage_key TEXT NOT NULL,     -- FK to storage.key
  field_name TEXT NOT NULL,      -- Arbitrary: pdf, thumbnail, avatar
  hash TEXT NOT NULL,            -- SHA-256 for deduplication
  metadata JSONB,                -- {mimeType, fileName, size}
  user_id TEXT NOT NULL,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

-- PostgreSQL (Cloud)
CREATE TABLE files (
  storage_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,     -- Binary data inline
  metadata JSONB,
  user_id UUID NOT NULL,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);
```

### Platform-Specific File Storage Pattern
**Problem**: Different platforms have different storage capabilities and constraints.

**Solution**: Platform-specific implementations behind unified `set(key, data, files)` interface.

**Electron (SQLite + Filesystem)**:
```typescript
class SQLiteAdapter implements StorageAdapter {
  private filesDir: string; // {userData}/files/

  async set(key: string, data: any, files?: Record<string, Uint8Array | null>): Promise<void> {
    const userId = this.currentUserId;

    // Store JSON data
    await this.db.prepare(`
      INSERT INTO storage (key, value, user_id)
      VALUES (?, ?, ?)
      ON CONFLICT (key, user_id) DO UPDATE SET value = ?, updated_at = ?
    `).run(key, JSON.stringify(data), userId, JSON.stringify(data), Date.now());

    // Store files (if provided)
    if (files) {
      for (const [fieldName, fileData] of Object.entries(files)) {
        if (fileData === null) {
          // Delete file
          await this.db.prepare(
            'DELETE FROM files WHERE storage_key = ? AND field_name = ? AND user_id = ?'
          ).run(key, fieldName, userId);
        } else {
          // Content-based deduplication via SHA-256
          const hash = await this.sha256(fileData);
          const filePath = path.join(this.filesDir, `${hash}.bin`);

          // Write to disk (if not exists)
          if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, fileData);
          }

          // Store metadata in SQLite
          await this.db.prepare(`
            INSERT INTO files (storage_key, field_name, hash, metadata, user_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (storage_key, field_name, user_id)
            DO UPDATE SET hash = ?, updated_at = ?
          `).run(key, fieldName, hash, JSON.stringify({
            size: fileData.length,
            mimeType: this.guessMimeType(fieldName)
          }), userId, hash, Date.now());
        }
      }
    }
  }

  async get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null> {
    const userId = this.currentUserId;

    // Get JSON data
    const row = await this.db.prepare(
      'SELECT value FROM storage WHERE key = ? AND user_id = ?'
    ).get(key, userId);

    if (!row) return null;

    // Get files
    const fileRows = await this.db.prepare(
      'SELECT field_name, hash FROM files WHERE storage_key = ? AND user_id = ?'
    ).all(key, userId);

    const files: Record<string, Uint8Array> = {};
    for (const fileRow of fileRows) {
      const filePath = path.join(this.filesDir, `${fileRow.hash}.bin`);
      files[fileRow.field_name] = new Uint8Array(await fs.promises.readFile(filePath));
    }

    return { data: JSON.parse(row.value), files };
  }
}
```

**PostgreSQL (Cloud with BYTEA)**:
```typescript
class PostgreSQLAdapter implements StorageAdapter {
  async set(key: string, data: any, files?: Record<string, Uint8Array | null>): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ value: data, files })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === 'QUOTA_EXCEEDED') {
        throw new Error(`Storage quota exceeded. Upgrade plan for more storage.`);
      }
      throw new Error(error.message);
    }
  }

  async get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null> {
    const response = await fetch(`${this.apiUrl}/${key}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) return null;

    const { value, files } = await response.json();

    // Decode base64-encoded files from JSON response
    const decodedFiles: Record<string, Uint8Array> = {};
    for (const [fieldName, base64Data] of Object.entries(files)) {
      decodedFiles[fieldName] = base64ToUint8Array(base64Data as string);
    }

    return { data: value, files: decodedFiles };
  }
}
```

**Platform Differences**:
| Platform | Data Storage | File Storage | Size Limits | Deduplication |
|----------|--------------|--------------|-------------|---------------|
| Electron | SQLite table | `{userData}/files/` directory | None (disk space) | SHA-256 hash |
| PostgreSQL | JSONB column | BYTEA column | Payment plan quotas | Not enforced |
| S3 (Future) | JSONB column | S3 objects | Payment plan quotas | Not enforced |

### Payment Plan Quota Pattern
**Problem**: Cloud storage costs money - need to prevent abuse while allowing flexibility.

**Solution**: Server-side quota enforcement when storing entities with files.

```typescript
// Backend: PUT /api/storage/:key with quota enforcement
app.put('/api/storage/:key', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { value, files } = req.body;

  // Get user's payment plan
  const user = await pool.query('SELECT storage_mode FROM users WHERE id = $1', [userId]);
  const limits = PAYMENT_PLAN_LIMITS[user.storage_mode || 'cloud'];

  if (files) {
    // Calculate total size of files being uploaded
    let totalFileSize = 0;
    for (const [fieldName, fileData] of Object.entries(files)) {
      if (fileData && typeof fileData === 'string') {
        // Decode base64 to get actual size
        const buffer = Buffer.from(fileData, 'base64');
        totalFileSize += buffer.length;

        // Check single file size limit
        if (limits.maxFileSize && buffer.length > limits.maxFileSize) {
          return res.status(413).json({
            error: `File "${fieldName}" too large for your plan`,
            code: 'QUOTA_EXCEEDED',
            field: fieldName,
            currentSize: buffer.length,
            maxSize: limits.maxFileSize
          });
        }
      }
    }

    // Check total storage quota
    const currentUsage = await pool.query(
      'SELECT COALESCE(SUM(LENGTH(file_data)), 0) as total FROM files WHERE user_id = $1',
      [userId]
    );

    if (limits.maxTotalQuota && (currentUsage.rows[0].total + totalFileSize) > limits.maxTotalQuota) {
      return res.status(413).json({
        error: 'Storage quota exceeded',
        code: 'QUOTA_EXCEEDED',
        currentUsage: currentUsage.rows[0].total,
        additionalSize: totalFileSize,
        maxQuota: limits.maxTotalQuota
      });
    }
  }

  // Store entity with files (implementation continues...)
  // Files stored in BYTEA with CASCADE DELETE to parent entity
});
```

**Quota Tiers**:
```typescript
const PAYMENT_PLAN_LIMITS = {
  cloud: {
    maxFileSize: 10 * 1024 * 1024,        // 10 MB per file
    maxTotalQuota: 100 * 1024 * 1024      // 100 MB total storage
  },
  pro: {
    maxFileSize: 500 * 1024 * 1024,       // 500 MB per file
    maxTotalQuota: 10 * 1024 * 1024 * 1024  // 10 GB total storage
  },
  enterprise: {
    maxFileSize: null,   // Unlimited
    maxTotalQuota: null  // Unlimited
  },
  local: {
    maxFileSize: null,   // Unlimited (Electron)
    maxTotalQuota: null  // Unlimited (Electron)
  },
  sync: {
    maxFileSize: null,   // Unlimited (future)
    maxTotalQuota: null  // Unlimited (future)
  }
};
```

**Frontend Error Handling**:
```typescript
try {
  await storage.set('documents:doc-123',
    { title: 'Report' },
    { pdf: largePdfData }
  );
} catch (error) {
  if (error.code === 'QUOTA_EXCEEDED') {
    showUpgradeModal({
      message: error.error,
      currentUsage: error.currentUsage,
      maxQuota: error.maxQuota,
      field: error.field  // Which file exceeded limit
    });
  }
}
```

### Implemented File Storage Patterns (January 2025)

**Files as Entity Properties - PRODUCTION READY**:
- ✅ `electron/database.cjs` - `files` table with CASCADE DELETE FK
- ✅ `server/index.js` - `files` table with BYTEA storage
- ✅ `electron/ipc/storageHandlers.cjs` - SHA-256 deduplication implemented
- ✅ `src/shared/storage/StorageAdapter.ts` - Interface returns `{data, files}`
- ✅ `src/shared/storage/SQLiteAdapter.ts` - Full implementation
- ✅ `src/shared/storage/PostgreSQLAdapter.ts` - Base64 transport implemented

**Key Achievements**:
- **CASCADE DELETE**: Database foreign keys prevent orphaned files
- **SHA-256 Deduplication**: Electron stores files once, shares across entities
- **User Scoping**: Composite keys `(storage_key, field_name, user_id)` enforce isolation
- **Platform Flexibility**: Same API works for SQLite (disk) and PostgreSQL (BYTEA)

### Backend Flexibility Pattern (BYTEA → S3 Migration)
**Problem**: BYTEA storage in PostgreSQL has scaling limits and higher costs at scale.

**Solution**: Design backend to easily migrate from BYTEA to S3 without changing client code.

```typescript
// Phase 1: BYTEA storage (current)
CREATE TABLE files (
  storage_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,     -- Store inline initially
  metadata JSONB,
  user_id UUID NOT NULL,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

// Phase 3: S3 migration (future - add columns)
ALTER TABLE files ADD COLUMN s3_key TEXT;
ALTER TABLE files ADD COLUMN s3_bucket TEXT;
ALTER TABLE files ALTER COLUMN file_data DROP NOT NULL;  -- Make nullable

// Migration strategy (server-side only, client unchanged)
async function migrateFileToS3(storageKey: string, fieldName: string, userId: string): Promise<void> {
  const file = await pool.query(
    'SELECT file_data, metadata FROM files WHERE storage_key = $1 AND field_name = $2 AND user_id = $3',
    [storageKey, fieldName, userId]
  );

  if (!file.rows[0]) return;

  // Upload to S3
  const s3Key = `${userId}/${storageKey}/${fieldName}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: 'chaycards-files',
    Key: s3Key,
    Body: file.rows[0].file_data,
    ContentType: file.rows[0].metadata?.mimeType || 'application/octet-stream'
  }));

  // Update database: keep metadata, remove BYTEA data
  await pool.query(`
    UPDATE files
    SET s3_key = $1, s3_bucket = $2, file_data = NULL
    WHERE storage_key = $3 AND field_name = $4 AND user_id = $5
  `, [s3Key, 'chaycards-files', storageKey, fieldName, userId]);
}

// Updated GET endpoint (client code unchanged)
app.get('/api/storage/:key', authenticateToken, async (req, res) => {
  const key = decodeURIComponent(req.params.key);
  const userId = req.user.id;

  // Get entity data
  const entityResult = await pool.query(
    'SELECT value FROM storage WHERE key = $1 AND user_id = $2',
    [key, userId]
  );

  if (!entityResult.rows[0]) return res.json({ value: null });

  // Get files (check S3 vs BYTEA)
  const fileRows = await pool.query(
    'SELECT field_name, file_data, s3_key, s3_bucket FROM files WHERE storage_key = $1 AND user_id = $2',
    [key, userId]
  );

  const files: Record<string, string> = {};  // Base64-encoded for JSON response
  for (const row of fileRows.rows) {
    if (row.s3_key) {
      // Fetch from S3
      const s3Object = await s3Client.send(new GetObjectCommand({
        Bucket: row.s3_bucket,
        Key: row.s3_key
      }));
      const buffer = await streamToBuffer(s3Object.Body);
      files[row.field_name] = buffer.toString('base64');
    } else {
      // Fetch from BYTEA (legacy)
      files[row.field_name] = row.file_data.toString('base64');
    }
  }

  res.json({ value: entityResult.rows[0].value, files });
});
```

**Key Benefits**:
- ✅ **Client unchanged**: `storage.get()` API stays the same
- ✅ **Gradual migration**: Migrate files one at a time, user by user
- ✅ **Rollback safe**: Keep BYTEA data until S3 migration verified
- ✅ **Cost optimization**: S3-compatible storage cheaper at scale ($0.005/GB vs $0.023/GB)
- ✅ **Performance**: CDN integration for S3 (faster global downloads)
- ✅ **No breaking changes**: Files as Entity Properties design supports both backends

**S3-Compatible Services** (recommended order):
1. **CloudFlare R2** - Zero egress fees, S3-compatible API, global CDN
2. **Backblaze B2** - 1/4 the cost of AWS S3, generous free egress
3. **Wasabi** - Flat pricing, unlimited egress
4. **DigitalOcean Spaces** - Simple, predictable pricing
5. **AWS S3** - Most features, but expensive egress ($0.09/GB)

### Content-Based Deduplication Pattern
**Problem**: Users might upload the same file multiple times (e.g., company logo in multiple documents).

**Solution**: SHA-256 hash-based deduplication in Electron storage (automatic, transparent to plugins).

```typescript
class SQLiteAdapter {
  async set(key: string, data: any, files?: Record<string, Uint8Array | null>): Promise<void> {
    const userId = this.currentUserId;

    // Store JSON data (standard operation)
    await this.db.prepare(`
      INSERT INTO storage (key, value, user_id)
      VALUES (?, ?, ?)
      ON CONFLICT (key, user_id) DO UPDATE SET value = ?, updated_at = ?
    `).run(key, JSON.stringify(data), userId, JSON.stringify(data), Date.now());

    // Store files with deduplication
    if (files) {
      for (const [fieldName, fileData] of Object.entries(files)) {
        if (fileData === null) {
          // Delete file
          await this.db.prepare(
            'DELETE FROM files WHERE storage_key = ? AND field_name = ? AND user_id = ?'
          ).run(key, fieldName, userId);
        } else {
          // Calculate SHA-256 hash of file content
          const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
          const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          const filePath = path.join(this.filesDir, `${hash}.bin`);

          // Only write file if hash doesn't already exist (DEDUPLICATION)
          if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, fileData);
          }

          // Store mapping: (storage_key, field_name) → hash
          await this.db.prepare(`
            INSERT INTO files (storage_key, field_name, hash, metadata, user_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (storage_key, field_name, user_id)
            DO UPDATE SET hash = ?, updated_at = ?
          `).run(key, fieldName, hash, JSON.stringify({
            size: fileData.length,
            mimeType: this.guessMimeType(fieldName)
          }), userId, hash, Date.now());
        }
      }
    }
  }
}
```

**Example (Transparent Deduplication)**:
```typescript
const logoData = new Uint8Array([/* company logo */]);

// User 1 uploads logo to doc-1
await storage.set('documents:doc-1', { title: 'Report' }, { logo: logoData });
// File written to: {userData}/files/a3f8d9e2b1c4.bin

// User 1 uploads same logo to doc-2
await storage.set('documents:doc-2', { title: 'Proposal' }, { logo: logoData });
// ✅ File NOT written (same hash a3f8d9e2b1c4) - just metadata updated

// Result: 1 file on disk, 2 database entries pointing to same hash
```

**Benefits**:
- ✅ **Space saving**: Same file stored only once on disk (cross-document, cross-user)
- ✅ **Fast re-uploads**: Identical file just updates metadata, no disk I/O
- ✅ **Automatic cleanup**: Deleting entity cascades to files table, orphan detection easy
- ✅ **Transparent to plugins**: Plugins don't need to know about deduplication

**Schema**:
```sql
CREATE TABLE files (
  storage_key TEXT NOT NULL,     -- FK to storage.key (e.g., 'documents:doc-1')
  field_name TEXT NOT NULL,      -- File field (e.g., 'logo', 'pdf')
  hash TEXT NOT NULL,            -- SHA-256 hash (deduplication key)
  metadata JSONB,                -- {mimeType, size, fileName}
  user_id TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_files_hash ON files(hash);  -- Find all refs to same file
```

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

### Folder Drag-and-Drop with @dnd-kit Pattern
**Problem**: Users need to reorganize folder hierarchies with drag-and-drop, but implementing this requires careful state management and visual feedback.

**Solution**: Use @dnd-kit library with service-layer methods for folder operations.

```typescript
// Service Layer: Implement move and reorder operations
class DocumentsService {
  async moveFolder(folderId: string, newParentId: string | null): Promise<FolderOperationResult> {
    // 1. Validate circular reference
    if (await this.wouldCreateCircularReference(folderId, newParentId)) {
      return { success: false, error: 'Circular reference' };
    }

    // 2. Check name conflicts
    const folder = this.folders.get(folderId);
    const siblings = Array.from(this.folders.values())
      .filter(f => f.parentId === newParentId);

    if (siblings.some(s => s.name.toLowerCase() === folder.name.toLowerCase())) {
      return { success: false, error: 'Name conflict' };
    }

    // 3. Update folder
    folder.parentId = newParentId;
    folder.order = Math.max(...siblings.map(s => s.order || 0), -1) + 1;
    await this.saveFolder(folder);

    // 4. Emit event
    this.eventBus.emit('folder:moved', { folderId, newParentId });
    return { success: true };
  }

  async reorderFolders(parentId: string | null, folderIds: string[]): Promise<void> {
    // 1. Verify all folders have same parent
    const folders = folderIds.map(id => this.folders.get(id)!);
    if (!folders.every(f => f.parentId === parentId)) {
      throw new Error('All folders must have same parent');
    }

    // 2. Update order fields
    folders.forEach((folder, index) => {
      folder.order = index;
    });

    // 3. Batch save
    await Promise.all(folders.map(f => this.saveFolder(f)));

    // 4. Emit event
    this.eventBus.emit('folders:reordered', { parentId, folderIds });
  }
}

// Component: Use @dnd-kit with optimistic updates
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const FolderTree: React.FC<Props> = ({ folders, onMove, onReorder }) => {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Optimistic update
    const originalFolders = [...folders];
    const newFolders = reorderArray(folders, active.id, over.id);
    setFolders(newFolders);

    try {
      // Persist to backend
      await onReorder(newFolders.map(f => f.id));
    } catch (error) {
      // Revert on failure
      setFolders(originalFolders);
      toast.error('Failed to reorder folders');
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={folders} strategy={verticalListSortingStrategy}>
        {folders.map(folder => (
          <SortableItem key={folder.id} folder={folder} />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

**Key Benefits**:
- ✅ Visual feedback during drag (opacity, borders)
- ✅ Optimistic UI updates for snappy feel
- ✅ Service-layer validation (circular refs, name conflicts)
- ✅ Event system notifies observers
- ✅ Automatic order calculation
- ✅ Rollback on error

**Pattern Requirements**:
1. Folder interface must have `order?: number` field
2. Service layer handles validation and persistence
3. Component layer handles visual feedback and optimistic updates
4. Use @dnd-kit for accessibility and touch support
5. Emit events for state changes (observers can react)

### Async Service Methods in React Handlers Pattern
**Problem**: Service methods that access storage are async (return `Promise<T>`), but React event handlers are synchronous by default.

**Symptom**: Calling async service methods without `await` returns a Promise object instead of the actual data, causing runtime errors when trying to use the result.

```typescript
// ❌ WRONG: Synchronous handler calling async method
const handleThemeChange = () => {
  if (themeService) {
    const themes = themeService.getAvailableThemes(); // Returns Promise<Theme[]>, not Theme[]
    const currentIndex = themes.findIndex((t: any) => t.id === currentTheme?.id); // ERROR: Promise has no findIndex()
    // ...
  }
};

// ✅ CORRECT: Async handler with await
const handleThemeChange = async () => {
  if (themeService) {
    const themes = await themeService.getAvailableThemes(); // Returns Theme[]
    const currentIndex = themes.findIndex((t: any) => t.id === currentTheme?.id); // Works!
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    themeService.setTheme(nextTheme.id);
  }
};
```

**Key Rules**:
1. **Any service method that accesses storage is async** - it must return `Promise<T>`
2. **React event handlers CAN be async** - just add `async` keyword
3. **Always await async service calls** - or you'll receive a Promise instead of data
4. **Check service method signatures** - if it returns `Promise<T>`, you must await it

**Common Async Service Methods**:
- `getAvailableThemes()` → `Promise<Theme[]>` (reads from storage)
- `loadSettings()` → `Promise<Settings>` (reads from storage)
- `saveDocument()` → `Promise<void>` (writes to storage)
- `getDocuments()` → `Promise<Document[]>` (reads from storage)

**Pattern Benefits**:
- ✅ React handles async event handlers gracefully
- ✅ Clear error messages when forgetting await
- ✅ Consistent pattern across all storage-backed services
- ✅ No race conditions or timing issues

### React-Arborist Drag-and-Drop Pattern
**Critical Rule**: When using react-arborist (or any virtualized list with absolute positioning), use **only prop-based padding** (`paddingTop`/`paddingBottom`), never CSS padding classes (`p-*`, `py-*`).

**Why**: CSS padding breaks cursor position calculations because the cursor is absolutely positioned and doesn't inherit container padding. The library assumes props are the only spacing source.

**See**: `docs/DRAG_DROP_PATTERNS.md` for complete explanation with mathematical breakdown, real-world fix, and debug checklist.

### Nuclear Reset Pattern (Debugging Last Resort)
**Problem**: Code appears correct, compiles successfully, but drag-drop still doesn't work despite multiple fix attempts.

**Symptom**: Persistent bugs that survive correct code changes, suggesting environmental issues rather than code issues.

**Example** (FileBrowser.tsx main view, October 19, 2025):
1. Original bug: Folders dimmed during drag (opacity-50), never returned to normal
2. Research: Web sources + Zen AI confirmed discrete events pattern (onDragEnter/onDragLeave)
3. Implementation: Moved setState from onDragOver to onDragEnter/onDragLeave
4. Result: Code correct, Vite compiled, but drag-drop still didn't work
5. Decision: Nuclear reset - delete ALL drag-drop code (~200 lines)

**When to Use Nuclear Reset**:
- ✅ Multiple fix attempts using validated patterns have failed
- ✅ Code review confirms implementation is correct
- ✅ Vite/compiler shows no errors
- ✅ Feature still doesn't work as expected
- ✅ Suspect browser caching, hot reload issues, or stale state

**Nuclear Reset Process**:
```typescript
// BEFORE: Complex implementation with persistent bugs
const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

<div onDragStart={...} onDragEnter={...} onDragLeave={...} onDragOver={...} onDrop={...}>
  {/* 200+ lines of drag-drop logic */}
</div>

// AFTER: Absolute minimal placeholder
<div className="text-center py-12">
  <p className="text-muted-foreground text-lg font-medium">Main view cleared</p>
  <p className="text-sm text-muted-foreground mt-2">Ready for fresh drag-and-drop implementation</p>
  <div className="mt-6 text-xs text-muted-foreground/70">
    <p>Files: {filesInFolder.length}</p>
    <p>Folders: {childFolders.length}</p>
  </div>
</div>
```

**What to Preserve**:
- ✅ Keep helper functions (handleFolderMove, isDescendant, etc.)
- ✅ Keep dialogs (create, rename, delete, color picker)
- ✅ Keep page structure (header, breadcrumbs, navigation)
- ✅ Keep working components (FolderTree sidebar if it works)
- ❌ Delete ALL implementation code (state, handlers, JSX)

**Rebuild Strategy**:
1. **Start minimal**: Text/plain data transfer only, no visual feedback
2. **Test fresh**: Clear browser cache completely, fresh session
3. **Add incrementally**: Add one feature at a time, test after each
4. **Verify environment**: Ensure hot reload isn't causing stale state
5. **Document learnings**: Track what works vs what doesn't

**Benefits**:
- ✅ Eliminates all potential sources of bugs
- ✅ Provides clean environment to test environmental hypothesis
- ✅ Forces minimal implementation (often reveals overlooked issues)
- ✅ Psychological reset (breaks fixation on "fixing" broken code)

**When NOT to Use**:
- ❌ First or second bug encountered
- ❌ Error messages clearly point to specific issue
- ❌ Haven't tried validated patterns yet
- ❌ No research done on correct implementation

**Key Principle**: If code is correct but doesn't work, the problem is environmental. Nuclear reset creates a clean environment to test this hypothesis.

### Mutual Exclusion Guard Pattern (Multi-Drop Handler Prevention)
**Problem**: When multiple drop handlers can receive the same drop event, both execute simultaneously with different parameters, causing double backend calls and incorrect behavior.

**Example Scenario** (FileBrowser.tsx, October 26, 2025):
- Dragging folder from tree to main grid view
- Two possible drop handlers:
  1. FolderCard drop handler (drop INTO folder - makes child)
  2. Container drop handler (drop BEFORE/AFTER - makes sibling)
- Without guards: BOTH handlers execute, causing:
  - Two backend calls with conflicting parameters
  - Flashing behavior as folder moves twice
  - Wrong parent assignment

**Solution**: Add mutual exclusion guards based on UI state:
```typescript
// FolderCard Drop Handler (FileBrowser.tsx:279-284)
const handleDrop = async (item: DragItem, monitor: DropTargetMonitor) => {
  // Guard: Only execute when hover state indicates "drop INTO folder"
  if (dropIndicatorRef.current !== 'into') {
    return; // Exit early - not our drop zone
  }

  // Safe to execute - user hovered INTO this folder (blue ring visible)
  await handleFolderMove(item.id, {
    parentId: folder.id,
    index: 0
  });
};

// Container Drop Handler (FileBrowser.tsx:1733-1739)
const handleContainerDrop = async (item: DragItem) => {
  // Guard: Only execute when insertion indicator visible
  if (containerInsertionIndex === null) {
    return; // Exit early - not dropping between folders
  }

  // Safe to execute - user dropped between folders (insertion line visible)
  await handleFolderMove(item.id, {
    parentId: currentFolderId,
    index: containerInsertionIndex
  });
};
```

**Key Principles**:
1. **Single Source of Truth**: Use UI state (refs, state variables) to determine which handler should execute
2. **Early Exit**: Guard at the top of handler, return immediately if not applicable
3. **Visual Feedback Alignment**: Guard condition matches what user sees (blue ring = into, line = between)
4. **No Shared State**: Handlers don't communicate - they check independent UI state

**Guard Types**:
- **Ref-based**: `if (dropIndicatorRef.current !== 'into') return;`
- **State-based**: `if (containerInsertionIndex === null) return;`
- **Position-based**: `if (cursorPosition < 0.33 || cursorPosition > 0.66) return;`

**Benefits**:
- ✅ Prevents double execution
- ✅ Ensures correct handler executes for user intent
- ✅ No backend race conditions
- ✅ Visual feedback matches behavior

**When to Use**:
- Multiple drop handlers on same component hierarchy
- Overlapping drop zones (folder INTO vs BETWEEN)
- Complex drag-drop with multiple target types
- Any scenario where same drop event reaches multiple handlers

**Anti-Pattern** (Don't Do This):
```typescript
// ❌ BAD: Shared flag to prevent double execution
let dropHandled = false;

const handler1 = () => {
  if (dropHandled) return;
  dropHandled = true;
  // ...
};

const handler2 = () => {
  if (dropHandled) return;
  dropHandled = true;
  // ...
};
```
This creates race conditions and shared state. Use independent UI state guards instead.

**Key Principle**: Guard conditions should match visual feedback - if user sees the indicator, that handler should execute. If they don't see it, guard should return early.

## Documents Tab System Pattern

### Overview
The Documents plugin uses a tab-based workspace for viewing documents and folders. This pattern enables multi-document workflows where users can have multiple files open simultaneously, similar to VS Code or browser tabs.

**Key Architectural Decisions**:
1. **Tab-based rendering**: No URL routing - tabs render plugin viewers directly using component resolution
2. **localStorage persistence**: Tab state persists across sessions
3. **Per-tab history**: Each tab maintains its own navigation history with back/forward controls

**Why tab-based rendering (NOT routing)**:
- ✅ **Documents stays at `/app/documents`**: No navigation away from Documents plugin
- ✅ **Per-tab history**: Each tab has independent navigation stack with breadcrumb back/forward
- ✅ **Component-based**: Viewers render via PluginManager.getComponent(), not React Router
- ✅ **Simpler mental model**: Tabs are rendering containers, not URL state
- ❌ **URL routing rejected**: Would cause full page navigation, break tab isolation

### Core Concepts

#### 1. Tab Types
```typescript
interface DocumentTab {
  id: string;                    // Unique tab identifier
  type: 'grid' | 'document';     // Tab content type
  title: string;                 // Tab display text
  fileId?: string;               // For document tabs
  handler?: FileHandler;         // Plugin handler for this file
  breadcrumb: BreadcrumbItem[];  // Navigation context
  closeable: boolean;            // Can user close this tab?
  isDirty?: boolean;            // Has unsaved changes?
  history: TabHistoryEntry[];    // Navigation history stack
  historyIndex: number;          // Current position in history
}
```

**Tab type details**:
- **Grid tabs**: Show folder contents (files + subfolders), can navigate to different folders
- **Document tabs**: Show plugin-provided viewer/editor for specific files
- **Special tabs**: Grid tabs are NOT closeable (always have at least one), document tabs ARE closeable
- **Per-tab history**: Each tab maintains independent navigation history for back/forward controls

#### 2. FileHandler Registration
Plugins register FileHandlers to provide custom viewers for document types:

```typescript
interface FileHandler {
  id: string;
  pluginId: string;
  name: string;
  extensions: string[];           // e.g., ['.md', '.deck', '.canvas']
  mimeTypes: string[];
  icon: FileHandlerIcon;

  // Component references (namespaced: 'plugin-id/ComponentName')
  previewComponent?: string;      // For hover/quick peek
  viewerComponent?: string;       // Full-page viewer (REQUIRED for tabs)
  editorComponent?: string;       // Edit mode
  settingsComponent?: string;     // Optional settings modal

  // Priority for handler selection
  priority: number;
  canHandle?: (file: StoredFile) => boolean;
}
```

**Key requirement**: `viewerComponent` must be provided for files to open in tabs.

**Example registrations**:
```typescript
// Flashcard plugin
{
  id: 'flashcard-deck-handler',
  pluginId: 'core-flashcards',
  extensions: ['.deck'],
  viewerComponent: 'core-flashcards/DeckView',  // Documents renders this in tabs
  editorComponent: 'core-flashcards/DeckView',  // Same component for now
  settingsComponent: 'core-flashcards/DeckSettings',
  priority: 100
}

// Canvas plugin
{
  id: 'canvas-handler',
  pluginId: 'core-canvas',
  extensions: ['.canvas'],
  viewerComponent: 'core-canvas/CanvasEditor',
  priority: 100
}
```

#### 3. Tab Rendering Architecture (Zero Plugin Burden)

**Key Principle**: Plugins provide ONE viewer component. Documents handles tab rendering, context injection, and navigation chrome. No routing involved.

**Plugin Responsibility** (minimal):
```typescript
// Plugin ONLY provides viewer component
const deckHandler: FileHandler = {
  id: 'flashcard-deck-handler',
  viewerComponent: 'core-flashcards/DeckView',
  // That's it! No routes, no wrappers, no context detection
};

// Plugin viewer component (simple!)
export const DeckView: React.FC<{ fileId: string }> = ({ fileId }) => {
  // Just render the deck - Documents handles everything else
  return <div className="deck-viewer">...</div>;
};
```

**Documents Responsibility** (infrastructure):
1. **Component Resolution**: Uses PluginManager.getComponent() to resolve viewer
2. **Context Injection**: Provides DocumentViewerContext automatically to all viewers
3. **Tab Management**: Tracks tabs in localStorage, handles tab operations
4. **History Management**: Per-tab navigation history with back/forward controls

**How it works**:

```typescript
// FileBrowser renders the active tab's content
function FileBrowser() {
  const { tabs, activeTabId } = useDocumentTabs();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) return null;

  if (activeTab.type === 'grid') {
    // Grid tab - show file browser
    return <FileGrid folderId={activeTab.folderId} />;
  }

  if (activeTab.type === 'document') {
    // Document tab - render plugin viewer
    const manager = PluginManager.getInstance();
    const ViewerComponent = manager.getComponent(activeTab.handler.viewerComponent);

    return (
      <DocumentViewerContext.Provider value={{
        closeTab: () => tabs.closeTab(activeTab.id),
        setTabDirty: (isDirty) => tabs.setTabDirty(activeTab.id, isDirty),
        navigateInTab: (fileId) => tabs.navigateInTab(activeTab.id, fileId)
      }}>
        <ViewerComponent fileId={activeTab.fileId} />
      </DocumentViewerContext.Provider>
    );
  }
}
```

**Benefits**:
- ✅ Zero plugin burden - just provide viewer component
- ✅ No routing complexity - stays at /app/documents
- ✅ Per-tab history - breadcrumb back/forward
- ✅ Component-based - clean separation of concerns
- ✅ Context automatically injected - plugins optionally use it

#### 4. DocumentViewerContext (Optional for Plugins)

```typescript
interface DocumentViewerContext {
  closeTab?: () => void;                          // Close current tab
  setTabDirty?: (isDirty: boolean) => void;       // Mark tab dirty/clean
  navigateInTab?: (fileId: string) => Promise<void>;  // Navigate to another file in same tab
}
```

**Plugins CAN use context for advanced features** (optional):
```typescript
// Optional: Plugin can use context if needed
export const DeckView: React.FC<{ fileId: string }> = ({ fileId }) => {
  const viewerContext = useDocumentViewer();  // Hook provided by Documents

  // Optional: Navigate to related file in same tab
  const openRelatedDeck = async (relatedId: string) => {
    if (viewerContext?.navigateInTab) {
      await viewerContext.navigateInTab(relatedId);
    }
  };

  // Optional: Mark unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      viewerContext?.setTabDirty?.(true);
    }
  }, [hasUnsavedChanges, viewerContext]);

  return <div>...</div>;
};
```

**But context usage is OPTIONAL** - basic viewers work without it!

### localStorage Persistence Strategy

#### State Structure
```typescript
interface TabState {
  tabs: DocumentTab[];
  activeTabId: string;
}

// Stored at: localStorage['chaycards:documents:tabs']
```

**Why this structure**:
- Array of tabs maintains order
- activeTabId tracks which tab is visible
- Serializes cleanly to JSON
- Easy to restore on mount

#### Save Strategy
```typescript
// Save on every tab operation
const saveTabState = useCallback(() => {
  const state: TabState = {
    tabs: tabs,
    activeTabId: activeTabId
  };
  localStorage.setItem('chaycards:documents:tabs', JSON.stringify(state));
}, [tabs, activeTabId]);

// Triggered by:
// - Add tab
// - Remove tab
// - Switch tab
// - Update tab (rename, mark dirty)
```

#### Restore Strategy
```typescript
// On component mount
const restoreTabState = useCallback(() => {
  const stored = localStorage.getItem('chaycards:documents:tabs');
  if (!stored) {
    // First load - create default grid tab
    return [{
      id: generateId(),
      type: 'grid',
      title: 'All Files',
      breadcrumb: [{ id: null, name: 'All Files' }],
      closeable: false
    }];
  }

  try {
    const state: TabState = JSON.parse(stored);

    // Validate tabs (file IDs still exist?)
    const validTabs = await validateTabs(state.tabs);

    // Ensure at least one grid tab
    if (validTabs.length === 0) {
      return [createDefaultGridTab()];
    }

    return validTabs;
  } catch (error) {
    console.error('Failed to restore tabs:', error);
    return [createDefaultGridTab()];
  }
}, []);
```

**Validation checks**:
- Document tabs: Verify fileId still exists in DocumentsService
- Plugin routes: Verify handler is still registered
- Fallback: Remove invalid tabs, ensure at least one grid tab

### Tab Opening Mechanisms

Users can open tabs from **4 different locations**:

#### 1. Tree Right-Click Menu
```typescript
// FolderTree.tsx
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
</ContextMenu>
```

#### 2. Tree Three-Dot Menu
```typescript
// FolderTree.tsx TreeNodeRenderer
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
</DropdownMenu>
```

#### 3. Grid Right-Click Menu
```typescript
// FileBrowser.tsx FileCard
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
</ContextMenu>
```

#### 4. Grid Three-Dot Menu
```typescript
// FileBrowser.tsx FileCard
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
</DropdownMenu>
```

**Consistent UX**: All 4 locations use same `openFileInTab()` function:
```typescript
const openFileInTab = async (file: StoredFile) => {
  // 1. Find registered handler
  const handler = documentsService.getHandlerForFile(file);
  if (!handler) {
    toast.error(`No viewer registered for ${file.extension} files`);
    return;
  }

  // 2. Check if already open
  const existingTab = tabs.find(t => t.type === 'document' && t.fileId === file.id);
  if (existingTab) {
    setActiveTabId(existingTab.id);  // Switch to existing tab
    return;
  }

  // 3. Create new tab
  const newTab: DocumentTab = {
    id: generateId(),
    type: 'document',
    title: getFileDisplayName(file),
    fileId: file.id,
    handler: handler,
    pluginRoute: handler.getViewerRoute(file.id),
    breadcrumb: await getFolderPath(file.folderId),
    closeable: true,
    isDirty: false
  };

  // 4. Add to tabs and activate
  setTabs([...tabs, newTab]);
  setActiveTabId(newTab.id);
  saveTabState();
};
```

### Tab Lifecycle

#### Creation
```typescript
// Grid tab (folder view)
const createGridTab = (folderId: string | null) => ({
  id: generateId(),
  type: 'grid',
  title: folderId ? folder.name : 'All Files',
  breadcrumb: await getFolderPath(folderId),
  closeable: tabs.filter(t => t.type === 'grid').length > 0  // First grid tab not closeable
});

// Document tab (file viewer)
const createDocumentTab = (file: StoredFile, handler: FileHandler) => ({
  id: generateId(),
  type: 'document',
  title: getFileDisplayName(file),
  fileId: file.id,
  handler: handler,
  pluginRoute: handler.getViewerRoute(file.id),
  breadcrumb: await getFolderPath(file.folderId),
  closeable: true,
  isDirty: false
});
```

#### Closing
```typescript
const closeTab = (tabId: string) => {
  const tab = tabs.find(t => t.id === tabId);

  // Guard: Cannot close non-closeable tabs
  if (!tab?.closeable) return;

  // Guard: Check for unsaved changes
  if (tab.isDirty) {
    const confirmed = confirm(`"${tab.title}" has unsaved changes. Close anyway?`);
    if (!confirmed) return;
  }

  // Remove tab
  const newTabs = tabs.filter(t => t.id !== tabId);

  // Switch to adjacent tab if closing active
  if (activeTabId === tabId) {
    const closedIndex = tabs.findIndex(t => t.id === tabId);
    const newActiveTab = newTabs[closedIndex] || newTabs[closedIndex - 1] || newTabs[0];
    setActiveTabId(newActiveTab.id);
  }

  setTabs(newTabs);
  saveTabState();
};
```

#### Switching
```typescript
const switchTab = (tabId: string) => {
  setActiveTabId(tabId);
  saveTabState();

  // Update browser history (for back button)
  const tab = tabs.find(t => t.id === tabId);
  if (tab?.type === 'document' && tab.pluginRoute) {
    router.push(tab.pluginRoute, { replace: true });
  } else if (tab?.type === 'grid') {
    router.push('/app/documents', { replace: true });
  }
};
```

### TabBar UI Component

```typescript
interface TabBarProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder?: (startIndex: number, endIndex: number) => void;
}

// Key features:
// - Horizontal scrollable container
// - Close buttons (X) on closeable tabs
// - Active tab highlight
// - Drag-to-reorder (optional Phase 2)
// - Overflow handling (show scroll buttons when tabs overflow)
// - Keyboard shortcuts (Cmd+W to close, Cmd+Tab to switch)
```

### Integration with FileBrowser

**Before (Phase 1)**:
```
FileBrowser
├── FolderTree (sidebar)
├── Header (breadcrumbs, search, buttons)
└── Grid/List view (files + folders)
```

**After (Tab System)**:
```
FileBrowser
├── FolderTree (sidebar)
├── TabBar (tabs, overflow scroll)
└── TabContent (active tab's content)
    ├── GridView (if type === 'grid')
    │   ├── Header (breadcrumbs, search, buttons)
    │   └── Files + Folders
    └── DocumentView (if type === 'document')
        └── <Route path={tab.pluginRoute} />  {/* Plugin viewer */}
```

### Plugin Developer Guide

**How to make your plugin work with Documents tabs**:

1. **Register FileHandler with `getViewerRoute`**:
```typescript
documentsService.registerFileHandler({
  id: 'my-plugin-handler',
  pluginId: 'my-plugin',
  extensions: ['.myext'],
  getViewerRoute: (fileId) => `/app/my-plugin/view/${fileId}`,  // REQUIRED
  viewerComponent: 'my-plugin/MyViewer',
  // ... other fields
});
```

2. **Create viewer component that detects context**:
```typescript
const MyViewer: React.FC<{ fileId: string }> = ({ fileId }) => {
  const viewerContext = useContext(DocumentViewerContext);

  return (
    <div>
      {viewerContext.isEmbedded ? (
        // Embedded in Documents
        <button onClick={() => viewerContext.closeTab?.()}>Close</button>
      ) : (
        // Standalone
        <button onClick={() => router.push('/app/documents')}>Back to Documents</button>
      )}

      {/* Your viewer UI */}
    </div>
  );
};
```

3. **Provide standalone route**:
```typescript
// In plugin registration
routes: [
  {
    path: '/app/my-plugin/view/:fileId',
    component: 'my-plugin/MyViewerPage'  // Wraps MyViewer with DocumentViewerContext
  }
]
```

4. **Handle links to other files**:
```typescript
// If embedded, use Documents tab system
if (viewerContext.isEmbedded) {
  viewerContext.openInNewTab?.(`/app/my-plugin/view/${linkedFileId}`);
} else {
  // Standalone, use router
  router.push(`/app/my-plugin/view/${linkedFileId}`);
}
```

### Benefits of This Architecture

1. **User Experience**:
   - ✅ Multi-document workflows (have multiple files open)
   - ✅ State persistence (tabs restore on app restart)
   - ✅ Clean URLs (no messy parameters)
   - ✅ Familiar pattern (like VS Code, browser tabs)

2. **Plugin Integration**:
   - ✅ Plugins work embedded OR standalone
   - ✅ Simple integration (just implement FileHandler)
   - ✅ Context awareness (adapt UX to embedding)
   - ✅ No plugin changes needed for tab system

3. **Implementation**:
   - ✅ Centralized state (localStorage)
   - ✅ Validation on restore (handle missing files)
   - ✅ Minimal coupling (plugins don't know about tabs)
   - ✅ Future-proof (easy to add features like tab pinning)

### Future Enhancements (Phase 2+)

- **Tab reordering**: Drag tabs to reorder
- **Tab pinning**: Pin tabs so they can't be closed
- **Tab groups**: Group related tabs with visual separator
- **Split view**: Show two tabs side-by-side
- **Tab history**: Recently closed tabs
- **Keyboard shortcuts**: Cmd+T new tab, Cmd+W close tab, Cmd+1-9 switch to tab N