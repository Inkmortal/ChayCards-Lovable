# Plugin System Architecture

## Overview

ChayCards uses a simple, powerful plugin system inspired by game modding communities. Plugins can extend, modify, or completely replace any part of the application - UI components, services, data models, and routes.

## Core Principles

1. **Everything is Public** - All components, services, and routes are accessible
2. **Everything is Replaceable** - Any plugin can override any component
3. **Simple Over Safe** - Developer freedom over protection
4. **Community Compatibility** - Let users figure out what works together

## Plugin Structure

```typescript
interface Plugin {
  id: string;              // Unique identifier (e.g., 'core.documents')
  name: string;            // Display name
  version: string;         // Semantic version
  description?: string;    // What this plugin does
  author?: string;         // Plugin author
  
  // Dependencies
  requires?: string[];     // Array of plugin IDs this depends on
  
  // What this plugin provides
  components?: Record<string, React.ComponentType>;
  routes?: Route[];
  services?: Record<string, any>;
  
  // Storage schemas
  schemas?: Record<string, SchemaDefinition>;
  migrations?: Migration[];
  
  // Backend configuration (optional)
  backend?: {
    python?: {
      entry: string;        // 'backend/main.py'
      requirements: string; // 'backend/requirements.txt'
    };
  };
  
  // Lifecycle hooks
  onLoad?: (manager: PluginManager) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}
```

## Plugin System Architecture

The plugin system is managed by a single PluginManager that handles everything:

```typescript
class PluginManager {
  private static instance: PluginManager;
  
  // Storage - just Maps, no separate Registry needed
  private components = new Map<string, React.ComponentType>();
  private services = new Map<string, any>();
  private routes = new Map<string, Route>();
  
  // Plugin management
  private loadedPlugins = new Map<string, Plugin>();
  private eventBus = new EventBus();
  
  // UI management
  private navigationItems: NavigationItem[] = [];
  private regions = new Map<string, RegionComponent[]>();
  
  // Singleton access
  static getInstance(): PluginManager {
    if (!this.instance) this.instance = new PluginManager();
    return this.instance;
  }
  
  // Component management
  getComponent(name: string): React.ComponentType | undefined {
    return this.components.get(name);
  }
  
  setComponent(name: string, component: React.ComponentType): void {
    this.components.set(name, component);
    this.eventBus.emit('component:registered', { name });
  }
  
  // Service management
  getService(name: string): any {
    return this.services.get(name);
  }
  
  setService(name: string, service: any): void {
    this.services.set(name, service);
  }
  
  // Route management
  addRoute(route: Route): void {
    this.routes.set(route.path, route);
  }
  
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }
  
  // Navigation management
  addNavigationItem(item: NavigationItem): void {
    this.navigationItems.push(item);
    this.sortNavigationItems();
  }
  
  getNavigationItems(): NavigationItem[] {
    return [...this.navigationItems];
  }
  
  // Region management for AppShell
  addToRegion(region: string, component: RegionComponent): void {
    if (!this.regions.has(region)) {
      this.regions.set(region, []);
    }
    this.regions.get(region)!.push(component);
    this.sortRegionComponents(region);
  }
  
  getRegionComponents(region: string): RegionComponent[] {
    return this.regions.get(region) || [];
  }
  
  // Event bus access
  getEventBus(): EventBus {
    return this.eventBus;
  }
  
  // Plugin loading with dependency resolution
  async loadPlugin(plugin: Plugin): Promise<void> {
    // Complex loading logic here
  }
  
  private sortNavigationItems(): void {
    this.navigationItems.sort((a, b) => (a.order || 50) - (b.order || 50));
  }
  
  private sortRegionComponents(region: string): void {
    const components = this.regions.get(region);
    if (components) {
      components.sort((a, b) => (a.order || 50) - (b.order || 50));
    }
  }
}
```

**PluginManager handles everything:**
- Storage (components, services, routes)
- Plugin loading and dependencies
- Navigation and region management
- Event bus for communication
- Sorting and filtering
- Namespacing

## Core Services

The plugin system provides these built-in services that all plugins can use:

### StorageService

Provides persistent storage that works in both local and cloud modes:

```typescript
interface StorageService {
  // Basic operations
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  
  // Batch operations
  list(pattern: string): Promise<any[]>;  // e.g., 'theme/custom/*'
  clear(pattern: string): Promise<void>;
  
  // Transactions (for complex updates)
  transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>;
}
```

Access via: `manager.getService('core/storageService')`

### EventBus

Built into PluginManager for cross-plugin communication:

```typescript
interface EventBus {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  once(event: string, handler: (data: any) => void): void;
}
```

Access via: `manager.getEventBus()`, then use `eventBus.emit()`, `eventBus.on()`, etc.

## Plugin Loading

Plugins are loaded in dependency order by the PluginManager:

```typescript
function loadPlugins(plugins: Plugin[]): void {
  const manager = PluginManager.getInstance();
  const loaded = new Set<string>();
  
  function load(plugin: Plugin) {
    if (loaded.has(plugin.id)) return;
    
    // Load dependencies first
    plugin.requires?.forEach(depId => {
      const dep = plugins.find(p => p.id === depId);
      if (dep) load(dep);
    });
    
    // Register components with namespace
    Object.entries(plugin.components || {}).forEach(([name, component]) => {
      const namespacedName = `${plugin.id}/${name}`;
      manager.setComponent(namespacedName, component);
    });
    
    // Register services with namespace
    Object.entries(plugin.services || {}).forEach(([name, service]) => {
      const namespacedName = `${plugin.id}/${name}`;
      manager.setService(namespacedName, service);
    });
    
    // Register routes and navigation
    plugin.routes?.forEach(route => {
      manager.addRoute(route);
      if (route.showInNav) {
        manager.addNavigationItem({
          path: route.path,
          label: route.label,
          icon: route.icon,
          order: route.order || 50
        });
      }
    });
    
    // Call plugin's onLoad hook with manager
    plugin.onLoad?.(manager);
    
    loaded.add(plugin.id);
  }
  
  plugins.forEach(load);
}
```

## Dynamic Plugin Loading

### How Plugins Are Actually Imported

The above `loadPlugins` function shows the logic, but here's how plugins are dynamically imported:

```typescript
// In development, use Vite's glob imports
const pluginModules = import.meta.glob('/src/plugins/*/index.ts');

async function loadPluginModule(pluginId: string): Promise<Plugin> {
  const modulePath = `/src/plugins/${pluginId}/index.ts`;
  
  if (!pluginModules[modulePath]) {
    throw new Error(`Plugin not found: ${pluginId}`);
  }
  
  // Dynamic import - creates separate chunk
  const module = await pluginModules[modulePath]();
  
  // Plugin should export default
  if (!module.default) {
    throw new Error(`Plugin ${pluginId} has no default export`);
  }
  
  return module.default;
}

// Complete loading process
async function loadAllPlugins(): Promise<void> {
  const manager = PluginManager.getInstance();
  
  // 1. Discover available plugins (could read manifest.json files)
  const pluginIds = Object.keys(pluginModules)
    .map(path => path.split('/')[3]); // Extract plugin ID from path
  
  // 2. Load plugin modules
  const plugins: Plugin[] = [];
  for (const id of pluginIds) {
    try {
      const plugin = await loadPluginModule(id);
      plugins.push(plugin);
    } catch (error) {
      console.error(`Failed to load plugin ${id}:`, error);
    }
  }
  
  // 3. Load in dependency order
  loadPlugins(plugins);
}
```

**Why this approach?**
- **Code Splitting**: Each plugin is a separate chunk
- **Lazy Loading**: Plugins load only when needed
- **Type Safety**: TypeScript understands dynamic imports
- **HMR Support**: Hot reload works in development
- **Tree Shaking**: Unused plugin code isn't bundled

### Per-User Plugin Loading (Multi-Tenant Scalability)

The dynamic import architecture solves the critical multi-tenant problem: **How do different users get different plugins from the same deployment?**

**Build Process:**
```bash
npm run build
→ Creates ONE build for all users:
   assets/
   ├── index-abc123.js           (core app ~5MB)
   ├── core-theme-def456.js      (plugin chunk ~500KB)
   ├── core-documents-ghi789.js  (plugin chunk ~800KB)
   ├── core-tasks-jkl012.js      (plugin chunk ~600KB)
   ├── ai-assistant-mno345.js    (plugin chunk ~1.2MB)
   └── ... (100+ plugin chunks)
```

**Per-User Loading:**
```typescript
// Client initialization - only loads user's enabled plugins
async function initUserSession(userId: string) {
  // 1. Server returns which plugins THIS user has enabled
  const { enabledPlugins } = await fetch(`/api/users/${userId}/plugins`)
    .then(r => r.json());
  // Response: { enabledPlugins: ['core-theme', 'core-documents'] }

  // 2. Load ONLY those plugin chunks (not all 100+)
  const manager = PluginManager.getInstance();
  for (const pluginId of enabledPlugins) {
    // Downloads core-theme-def456.js and core-documents-ghi789.js
    // Other plugin chunks (tasks, ai-assistant, etc.) are NEVER downloaded
    await loadPluginModule(pluginId);
  }

  // 3. Render app with user's specific plugin set
  renderApp();
}
```

**Scalability Benefits:**
- ✅ **No per-user builds** - One build serves all users
- ✅ **Minimal storage** - ~50MB total for entire app (all plugins)
- ✅ **Bandwidth efficient** - Users download only what they need
- ✅ **Plugin overrides work** - Load order determines which plugin wins

**Example:**

| User | Enabled Plugins | Downloads |
|------|----------------|-----------|
| User A | `['core-theme', 'core-documents']` | Core (5MB) + 2 chunks (1.3MB) = **6.3MB** |
| User B | `['core-theme', 'core-tasks', 'ai-assistant']` | Core (5MB) + 3 chunks (2.3MB) = **7.3MB** |
| User C | All 100 plugins | Core (5MB) + 100 chunks (45MB) = **50MB** |

**Same build, different downloads.** No expensive per-user bundle storage.

**Plugin Override Example:**

User wants custom theme selector from third-party plugin instead of core-theme's version:

```typescript
// Server returns plugins in specific load order
{
  enabledPlugins: [
    'core-theme',        // Loads first (base implementation)
    'theme-pack-pro'     // Loads second (overwrites ThemeSelector)
  ]
}

// Result: User sees ThemeSelector from theme-pack-pro
// because it was loaded after core-theme and replaced it in registry
```

**Backend Implementation:**

```typescript
// Database schema
users_plugins {
  userId: string,
  pluginId: string,
  enabled: boolean,
  loadOrder: number  // Controls override priority
}

// API endpoint
app.get('/api/users/:userId/plugins', async (req, res) => {
  const plugins = await db.query(`
    SELECT pluginId
    FROM users_plugins
    WHERE userId = $1 AND enabled = true
    ORDER BY loadOrder ASC
  `, [req.params.userId]);

  res.json({
    enabledPlugins: plugins.map(p => p.pluginId)
  });
});
```

**Local (Electron) vs Cloud (Web):**

| Aspect | Electron | Web |
|--------|----------|-----|
| Plugin source | Local filesystem (`~/.chaycards/plugins/`) | CDN chunks |
| User preferences | SQLite database | PostgreSQL database |
| Loading mechanism | `import.meta.glob()` same code | `import.meta.glob()` same code |
| Per-user isolation | One user per install | Database-driven filtering |

**Same plugin system, same code, works in both environments.**

## Extension Patterns

### 1. Component Wrapping

Enhance existing components by wrapping them:

```typescript
const EnhancedDocumentsPlugin: Plugin = {
  id: 'enhanced-documents',
  requires: ['core.documents'],
  
  onLoad: (manager) => {
    // Get the original component
    const OriginalDocumentCard = manager.getComponent('core.documents/DocumentCard');
    
    // Create enhanced version
    const EnhancedDocumentCard = (props) => (
      <div className="enhanced-wrapper">
        <AITagBar documentId={props.doc.id} />
        <OriginalDocumentCard {...props} />
        <AnalyticsBar stats={getStats(props.doc.id)} />
      </div>
    );
    
    // Replace in registry
    manager.setComponent('core.documents/DocumentCard', EnhancedDocumentCard);
  }
};
```

### 2. Service Extension

Extend functionality by wrapping services:

```typescript
const AnalyticsPlugin: Plugin = {
  id: 'analytics',
  requires: ['core.documents'],
  
  onLoad: (manager) => {
    const docService = manager.getService('core.documents/documentService');
    const originalSave = docService.save;
    
    // Wrap save method to add analytics
    docService.save = async (doc) => {
      const result = await originalSave(doc);
      trackEvent('document.saved', { 
        id: doc.id, 
        wordCount: doc.content.length 
      });
      return result;
    };
  }
};
```

### 3. Complete Replacement

Replace entire components with new implementations:

```typescript
const KanbanDocumentsPlugin: Plugin = {
  id: 'kanban-documents',
  requires: ['core.documents'],
  
  components: {
    'DocumentList': KanbanDocumentView  // Completely new component
  }
};
```

### 4. Data Model Extension

Add new fields to existing data models:

```typescript
const DocumentMetadataPlugin: Plugin = {
  id: 'document-metadata',
  requires: ['core.documents'],
  
  onLoad: (manager) => {
    const docService = manager.getService('core.documents/documentService');
    const originalCreate = docService.create;
    
    docService.create = async (doc) => {
      const enhanced = {
        ...doc,
        metadata: {
          wordCount: countWords(doc.content),
          readingTime: calculateReadingTime(doc.content),
          language: detectLanguage(doc.content),
          sentiment: analyzeSentiment(doc.content)
        }
      };
      return originalCreate(enhanced);
    };
  }
};
```

## Plugin Communication Patterns

Plugins communicate through well-defined patterns that maintain loose coupling while enabling rich interactions.

### Communication Methods

#### 1. Event Bus (Asynchronous, Decoupled)
Best for: Notifications, state changes, user actions

```typescript
// Publishing plugin
const eventBus = manager.getEventBus();
eventBus.emit('core.documents:created', { 
  id: doc.id, 
  title: doc.title,
  tags: doc.tags 
});

// Subscribing plugin
const eventBus = manager.getEventBus();
eventBus.on('core.documents:created', (data) => {
  // React to new document
  if (data.tags.includes('important')) {
    this.addToKnowledgeBase(data);
  }
});
```

#### 2. Service Calls (Synchronous, Direct)
Best for: Data queries, computations, immediate results

```typescript
// Service provider
plugin.services = {
  DocumentService: {
    async search(query: string): Promise<Document[]> {
      return this.searchIndex.find(query);
    },
    getById(id: string): Document | null {
      return this.documents.get(id);
    }
  }
};

// Service consumer
const docService = manager.getService('core.documents/documentService');
const results = await docService.search('project notes');
```

#### 3. Shared State (Through Services)
Best for: Global settings, user preferences, app state

```typescript
// Theme plugin provides state service
plugin.services = {
  ThemeState: {
    current: 'light',
    available: ['light', 'dark', 'pink'],
    setTheme(theme: string) {
      this.current = theme;
      const eventBus = manager.getEventBus();
      eventBus.emit('core.theme:changed', { theme });
    }
  }
};

// Other plugins react to theme
const themeState = manager.getService('core.theme/themeState');
const isDark = themeState.current === 'dark';
```

#### 4. Component Enhancement (Visual Integration)
Best for: UI composition, adding features to existing components

```typescript
// Base plugin provides extension points
<PluginHost region="document-toolbar" context={{ docId }} />

// Enhancement plugin registers components
manager.addToRegion('document-toolbar', {
  id: 'share-button',
  component: 'share-plugin/ShareButton',
  order: 10
});
```

### Decision Guide: Which Pattern to Use?

```
┌─ Need immediate response? ─┐
│                             │
├─ YES ─→ Service Call        │
│                             │
└─ NO ──┬─ UI Integration? ───┤
        │                     │
        ├─ YES → Component    │
        │        Enhancement  │
        │                     │
        └─ NO ─┬─ Multiple    │
               │  Listeners?   │
               │              │
               ├─ YES → Event │
               │        Bus   │
               │              │
               └─ NO → Shared │
                      State   │
```

### Communication Best Practices

#### DO:
- Use namespaced event names: `plugin-id:event-name`
- Document your public APIs in plugin README
- Version your service interfaces
- Handle missing services gracefully
- Emit events after state changes, not before
- Include enough data in events to be useful

#### DON'T:
- Don't assume plugins are loaded (check first)
- Don't emit events in tight loops
- Don't expose internal state directly
- Don't make synchronous calls in event handlers
- Don't create circular dependencies

### Example: Multi-Plugin Workflow

Here's how plugins might collaborate on a "Smart Tag" feature:

```typescript
// 1. Document plugin emits creation event
const eventBus = manager.getEventBus();
eventBus.emit('core.documents:created', {
  id: 'doc-123',
  content: 'Meeting notes about Q4 planning'
});

// 2. AI plugin listens and suggests tags
const eventBus = manager.getEventBus();
eventBus.on('core.documents:created', async (doc) => {
  const tags = await this.suggestTags(doc.content);
  eventBus.emit('ai-enhance:tags-suggested', { 
    docId: doc.id, 
    tags 
  });
});

// 3. Task plugin extracts action items
const eventBus = manager.getEventBus();
eventBus.on('core.documents:created', async (doc) => {
  const tasks = await this.extractTasks(doc.content);
  tasks.forEach(task => {
    eventBus.emit('core.tasks:created', { 
      task,
      source: `doc:${doc.id}` 
    });
  });
});

// 4. Knowledge plugin indexes for search
const eventBus = manager.getEventBus();
eventBus.on('core.documents:created', (doc) => {
  this.indexDocument(doc);
});

// 5. UI plugin shows notifications
const eventBus = manager.getEventBus();
eventBus.on('ai-enhance:tags-suggested', (data) => {
  this.showNotification(`Suggested tags: ${data.tags.join(', ')}`);
});
```

### Performance Considerations

1. **Event Bus**: Very fast for publishing, slight overhead for many listeners
2. **Service Calls**: Direct function calls, minimal overhead
3. **Component Enhancement**: React reconciliation cost, optimize with memo
4. **Shared State**: Consider using signals/observables for reactive updates

### Testing Plugin Communication

```typescript
// Mock the plugin manager for tests
const mockEventBus = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn()
};

const mockManager = {
  getEventBus: jest.fn().mockReturnValue(mockEventBus),
  getService: jest.fn().mockReturnValue({
    search: jest.fn().mockResolvedValue([])
  })
};

// Test event emission
myPlugin.handleCreate(data);
expect(mockEventBus.emit).toHaveBeenCalledWith(
  'myplugin:created',
  expect.objectContaining({ id: data.id })
);

// Test service consumption
await myPlugin.searchDocuments('test');
expect(mockManager.getService).toHaveBeenCalledWith(
  'core.documents/DocumentService'
);
```

## Storage Patterns

### Unified Storage API

All storage operations go through the Express API, providing consistent patterns for both local and cloud deployments:

```typescript
// Plugin code is IDENTICAL for local and cloud
class MyPluginService {
  constructor(private storage: StorageAdapter) {}
  
  async savePreferences(prefs: any) {
    // Storage adapter handles user context automatically
    // Local: Stores in SQLite with single user
    // Cloud: Stores in PostgreSQL with user isolation
    await this.storage.set('preferences', prefs);
  }
  
  async getHistory() {
    // Same API, different implementation
    return await this.storage.get('history');
  }
}
```

### Storage Adapter Pattern

The storage adapter provides a consistent interface while handling platform differences:

```typescript
interface StorageAdapter {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  append<T>(key: string, item: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(pattern: string): Promise<string[]>;
}

// Implementation routes through Express API
class PluginStorageAdapter implements StorageAdapter {
  constructor(private pluginId: string, private http: HttpClient) {}
  
  async get<T>(key: string): Promise<T> {
    // Makes request to: /api/storage/{pluginId}/{key}
    const response = await this.http.get(`/api/storage/${this.pluginId}/${key}`);
    return response.data;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    await this.http.post(`/api/storage/${this.pluginId}/${key}`, value);
  }
}
```

### Each Plugin Owns Its Storage Namespace

Plugins store data in their own namespace, isolated from other plugins:

```typescript
export const AIEnhancePlugin: Plugin = {
  id: 'ai-enhance',
  requires: ['core.documents'],
  
  // Define own storage schema
  schemas: {
    'ai_document_metadata': {
      documentId: 'string',      // Reference to core.documents
      summary: 'text',
      tags: 'json',
      sentiment: 'string',
      readingTime: 'number',
      generatedAt: 'timestamp'
    }
  },
  
  services: {
    'aiService': new AIService()
  },
  
  onLoad: (manager) => {
    const docService = manager.getService('core.documents/documentService');
    const aiService = manager.getService('ai-enhance/aiService');
    
    // Enhance document retrieval with AI data
    const originalGet = docService.get;
    docService.get = async (id) => {
      const [doc, aiData] = await Promise.all([
        originalGet(id),
        aiService.getMetadata(id)
      ]);
      
      // Merge enhancement data
      return {
        ...doc,
        ai: aiData
      };
    };
    
    // Generate AI data on save
    const originalSave = docService.save;
    docService.save = async (doc) => {
      const result = await originalSave(doc);
      
      // Async generate AI metadata
      aiService.generateAndSaveMetadata(doc.id, doc.content)
        .catch(err => console.error('AI generation failed:', err));
      
      return result;
    };
  }
};
```

### Why Separate Storage?

1. **Schema Independence** - Core plugins can evolve without breaking enhancers
2. **Clean Uninstall** - Remove plugin = remove its tables
3. **Performance** - Load enhancement data only when needed
4. **Data Integrity** - Plugin failures don't corrupt core data
5. **Version Control** - Each plugin manages its own migrations

### Storage Patterns for Mini-Apps

For plugins that are complete applications:

```typescript
export const ProjectManagementPlugin: Plugin = {
  id: 'project-management',
  
  // Multiple related schemas
  schemas: {
    'projects': {
      id: 'uuid',
      name: 'string',
      description: 'text',
      status: 'string',
      createdAt: 'timestamp'
    },
    'project_tasks': {
      id: 'uuid',
      projectId: 'uuid',
      title: 'string',
      completed: 'boolean'
    },
    'project_members': {
      projectId: 'uuid',
      userId: 'string',
      role: 'string'
    }
  },
  
  // Only expose key components for enhancement
  components: {
    'ProjectList': ProjectList,        // Public
    'ProjectCard': ProjectCard,        // Public
    'ProjectDashboard': ProjectDashboard  // Public
    // Dozens of internal components NOT registered
  }
};
```

### Lazy Loading Enhancement Data

For performance, enhancement data should be loaded on demand:

```typescript
// In a wrapped component
const EnhancedDocumentCard = (props) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Only load AI data when expanded
  useEffect(() => {
    if (props.expanded && !aiData) {
      setLoading(true);
      aiService.getMetadata(props.doc.id)
        .then(setAiData)
        .finally(() => setLoading(false));
    }
  }, [props.expanded, props.doc.id]);
  
  return (
    <>
      <OriginalDocumentCard {...props} />
      {props.expanded && (
        <AIMetadataPanel data={aiData} loading={loading} />
      )}
    </>
  );
};
```

### Migration Support

Plugins handle their own schema migrations:

```typescript
export const AnalyticsPlugin: Plugin = {
  id: 'analytics',
  
  migrations: [
    {
      version: 1,
      up: async (db) => {
        await db.createTable('analytics_events', {
          id: 'uuid PRIMARY KEY',
          resourceType: 'VARCHAR(50)',
          resourceId: 'VARCHAR(255)',
          eventType: 'VARCHAR(50)',
          timestamp: 'TIMESTAMP'
        });
      }
    },
    {
      version: 2,
      up: async (db) => {
        await db.addColumn('analytics_events', 'metadata', 'JSON');
      }
    }
  ]
};
```

### Storage Key Naming Pattern

All plugins MUST follow the `plugin-id:key-name` naming pattern for storage keys:

```typescript
import { buildPluginStorageKey } from '@/shared/constants';

export class MyPluginService {
  private PLUGIN_ID = 'my-plugin';

  async saveData(storage: StorageAdapter, data: any) {
    // Use the helper function to build keys
    const key = buildPluginStorageKey(this.PLUGIN_ID, 'user-data');
    await storage.set(key, data);
    // Stored as: 'my-plugin:user-data'
  }

  async loadData(storage: StorageAdapter) {
    const key = buildPluginStorageKey(this.PLUGIN_ID, 'user-data');
    return await storage.get(key);
  }

  async getAllKeys(storage: StorageAdapter) {
    // Query all keys for this plugin
    const prefix = `${this.PLUGIN_ID}:`;
    return await storage.list(prefix);
    // Returns: ['my-plugin:user-data', 'my-plugin:settings', ...]
  }
}
```

**Core Plugin Constants** (for ChayCards core plugins only):

```typescript
import { STORAGE_KEYS } from '@/shared/constants';

// Core plugins use predefined constants
await storage.set(STORAGE_KEYS.CORE_SETTINGS, data);
await storage.set(STORAGE_KEYS.CORE_THEME, theme);
```

**Why This Pattern?**
1. ✅ Prevents key collisions between plugins
2. ✅ Enables plugin-scoped queries with `list(pluginId + ':')`
3. ✅ Makes storage keys self-documenting
4. ✅ Consistent across all plugins

### Best Practices for Plugin Storage

1. **Use the Storage Adapter** - Never access database directly
2. **Use buildPluginStorageKey()** - Always namespace keys with `plugin-id:key-name` pattern
3. **Handle Missing Data** - Core data might exist without enhancement data
4. **Async Enhancement** - Don't block core operations for enhancement features
5. **Let Platform Handle User Context** - Don't manage user IDs yourself
6. **Keep Keys Lowercase** - Use kebab-case for key names (e.g., `'user-settings'` not `'UserSettings'`)

## Backend Adapter Pattern

Plugins can include Python backends that are accessed through a unified API pattern:

### Backend Configuration

```typescript
export const AIAssistantPlugin: Plugin = {
  id: 'ai-assistant',
  
  // Declare backend requirements
  backend: {
    python: {
      entry: 'backend/main.py',
      requirements: 'backend/requirements.txt'
    }
  },
  
  services: {
    ai: class AIService {
      constructor(private adapters: PluginAdapters) {}
      
      async processQuery(text: string) {
        // Backend adapter handles all complexity
        return await this.adapters.backend.request('ai-assistant', {
          action: 'process',
          text: text
        });
      }
    }
  }
}
```

### Backend Adapter Interface

```typescript
interface BackendAdapter {
  // Send request to plugin's backend
  request(pluginId: string, data: any): Promise<any>;
  
  // Stream data from backend
  stream(pluginId: string, data: any): AsyncIterator<any>;
  
  // Check if backend is available
  isAvailable(pluginId: string): boolean;
}

// Plugin receives adapter through constructor
class PluginService {
  constructor(private adapters: PluginAdapters) {
    this.storage = adapters.storage;
    this.backend = adapters.backend;
  }
}
```

### How Backend Routing Works

1. **Build Time**: System auto-detects `backend/main.py` in plugins
2. **Local Deployment**: 
   - Python processes spawned and managed by Express
   - Requests routed through `/api/python/{pluginId}/*`
   - Reverse proxy handles routing to correct process
3. **Cloud Deployment**:
   - Python backends deployed as separate services
   - Service discovery uses pattern: `{pluginId}-backend`
   - Express routes requests to appropriate service

### Complete Plugin Example with Storage and Backend

```typescript
export const SmartNotesPlugin: Plugin = {
  id: 'smart-notes',
  
  backend: {
    python: {
      entry: 'backend/main.py',
      requirements: 'backend/requirements.txt'
    }
  },
  
  services: {
    notes: class NotesService {
      constructor(private adapters: PluginAdapters) {}
      
      async createNote(content: string) {
        // Save to storage
        const note = {
          id: generateId(),
          content,
          created: new Date()
        };
        await this.adapters.storage.set(`notes/${note.id}`, note);
        
        // Get AI summary from Python backend
        const summary = await this.adapters.backend.request('smart-notes', {
          action: 'summarize',
          content: content
        });
        
        // Save summary
        await this.adapters.storage.set(`summaries/${note.id}`, summary);
        
        return { note, summary };
      }
    }
  }
}
```

The beauty of this pattern is that plugin code remains identical whether running locally or in the cloud - the adapters handle all platform-specific implementation details.

## Core Plugins

ChayCards ships with these core plugins:

### 1. Documents Plugin (`core.documents`)
```typescript
{
  id: 'core.documents',
  components: {
    'DocumentList': DocumentList,
    'DocumentCard': DocumentCard,
    'DocumentEditor': DocumentEditor,
    'DocumentSearch': DocumentSearch
  },
  services: {
    'documentService': new DocumentService()
  },
  routes: [
    { 
      path: '/documents', 
      component: 'core.documents/DocumentList',
      label: 'Documents',
      icon: 'FileText',
      showInNav: true,
      order: 10
    },
    { 
      path: '/documents/:id', 
      component: 'core.documents/DocumentEditor',
      showInNav: false
    }
  ]
}
```

### 2. Tasks Plugin (`core.tasks`)
```typescript
{
  id: 'core.tasks',
  components: {
    'TaskList': TaskList,
    'TaskCard': TaskCard,
    'TaskBoard': TaskBoard
  },
  services: {
    'taskService': new TaskService()
  },
  routes: [
    { 
      path: '/tasks', 
      component: 'core.tasks/TaskBoard',
      label: 'Tasks',
      icon: 'CheckSquare',
      showInNav: true,
      order: 20
    }
  ]
}
```

### 3. Knowledge Plugin (`core.knowledge`)
```typescript
{
  id: 'core.knowledge',
  components: {
    'FlashcardView': FlashcardView,
    'KnowledgeGraph': KnowledgeGraph,
    'StudySession': StudySession
  },
  services: {
    'knowledgeService': new KnowledgeService()
  },
  routes: [
    { 
      path: '/flashcards', 
      component: 'core.knowledge/FlashcardView',
      label: 'Flashcards',
      icon: 'Brain',
      showInNav: true,
      order: 30
    },
    { 
      path: '/knowledge-graph', 
      component: 'core.knowledge/KnowledgeGraph',
      showInNav: false
    }
  ]
}
```

## Plugin Manifest

Each plugin should have a manifest file (`plugin.json`):

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Adds awesome features to ChayCards",
  "author": "Plugin Developer",
  "main": "index.js",
  "requires": {
    "core.documents": "^1.0.0",
    "core.tasks": "^1.0.0"
  },
  "python": {
    "entry": "backend/main.py",
    "requirements": "backend/requirements.txt"
  }
}
```

## Best Practices

1. **Namespace Components**: Use dotted names for sub-components
   ```typescript
   'DocumentList.Header', 'DocumentList.Item', 'DocumentList.Footer'
   ```

2. **Preserve Original Functionality**: When wrapping, call the original
   ```typescript
   const Original = manager.getComponent('core.documents/DocumentCard');
   return <div><Extra /><Original {...props} /></div>;
   ```

3. **Version Compatibility**: Specify compatible versions in manifest
   ```json
   "requires": {
     "core.documents": "^1.0.0"  // Works with 1.x.x
   }
   ```

4. **Export Types**: Help other developers extend your plugin
   ```typescript
   export interface DocumentCardProps {
     doc: Document;
     onEdit?: (id: string) => void;
   }
   ```

5. **Clean Unload**: Implement onUnload to clean up
   ```typescript
   onUnload: async () => {
     // Remove event listeners, restore originals, etc.
     // Stop Python processes if any
     await this.pythonService?.stop();
   }
   ```

6. **Python Process Management**: If using Python backend, manage lifecycle properly
   ```typescript
   onLoad: async (manager) => {
     const service = manager.getService('my-plugin/pythonService');
     await service.start();
   }
   ```

## Example: Building a Plugin

Here's a complete example of a plugin that adds AI features to documents:

```typescript
// ai-documents-plugin/index.ts
import { Plugin } from '@chaycards/plugin-sdk';
import { AITagBar } from './components/AITagBar';
import { AIService } from './services/AIService';

export const AIDocumentsPlugin: Plugin = {
  id: 'ai-documents',
  name: 'AI Document Enhancement',
  version: '1.0.0',
  requires: ['core.documents'],
  
  services: {
    'aiService': new AIService()
  },
  
  onLoad: (manager) => {
    // Enhance document cards
    const OriginalCard = manager.getComponent('core.documents/DocumentCard');
    const EnhancedCard = (props) => (
      <>
        <AITagBar documentId={props.doc.id} />
        <OriginalCard {...props} />
      </>
    );
    manager.setComponent('core.documents/DocumentCard', EnhancedCard);
    
    // Add AI analysis to document creation
    const docService = manager.getService('core.documents/documentService');
    const originalCreate = docService.create;
    
    docService.create = async (doc) => {
      const aiService = manager.getService('ai-documents/aiService');
      const enhanced = {
        ...doc,
        aiTags: await aiService.generateTags(doc.content),
        summary: await aiService.generateSummary(doc.content)
      };
      return originalCreate(enhanced);
    };
  }
};
```

## Python Backend Support

Plugins can include Python backends for compute-intensive tasks like AI/ML, data processing, or integrating Python-only libraries. See [Plugin Python Backend Documentation](./PLUGIN_PYTHON_BACKEND.md) for detailed implementation guide.

### Quick Example

```typescript
export const AIPlugin: Plugin = {
  id: 'ai-plugin',
  name: 'AI Assistant Plugin',
  
  python: {
    entry: 'backend/main.py',
    requirements: 'backend/requirements.txt'
  },
  
  services: {
    'assistantService': new AssistantService() // Manages Python process
  },
  
  onLoad: async (manager) => {
    const service = manager.getService('ai-plugin/assistantService');
    await service.startPythonBackend();
  },
  
  onUnload: async () => {
    const service = manager.getService('ai-plugin/assistantService');
    await service.stopPythonBackend();
  }
}
```

### Key Points
- Python runs as child processes managed by plugin services
- Python runtime is bundled with Electron app (no user installation needed)
- Same Python code works in both Electron and cloud deployments
- Each plugin manages its own Python lifecycle

## Plugin Management

Since everything is a plugin, even plugin management itself can be implemented as a plugin:

### Core Plugin Manager Plugin
A built-in plugin that provides:

```typescript
const PluginManagerPlugin: Plugin = {
  id: 'core.plugin-manager',
  name: 'Plugin Manager',
  
  routes: [{
    path: '/settings/plugins',
    component: 'core.plugin-manager/PluginSettings',
    label: 'Manage Plugins',
    icon: 'Settings',
    showInNav: true,
    order: 100
  }],
  
  onLoad: (manager) => {
    // Override navigation ordering
    const originalGetNav = manager.getNavigationItems.bind(manager);
    manager.getNavigationItems = () => {
      const items = originalGetNav();
      return sortByUserPreferences(items);
    };
    
    // Add plugin management UI to settings
    manager.addToRegion('settings', {
      id: 'plugin-list',
      component: 'core.plugin-manager/PluginList',
      order: 10
    });
  }
};
```

This plugin could provide:
- Drag-and-drop navigation reordering
- Enable/disable plugins
- Plugin load order configuration
- Per-plugin settings
- Plugin conflict detection

## FAQ

### Plugin Conflicts & Load Order

**Q: What if two plugins modify the same component?**
A: Last one loaded wins. Users can control load order in settings.

**Q: How do I debug plugin conflicts?**
A: Plugin DevTools will show what modified what, in what order.

**Q: Can plugins break the app?**
A: Yes, just like game mods. Users accept this when installing plugins.

### Distribution & Monetization

**Q: How do I distribute my plugin?**
A: Package as npm module or zip file. Will have marketplace later.

**Q: Can I charge for my plugin?**
A: Yes, plugins are your IP. Marketplace will support paid plugins.

**Q: Can plugins manage other plugins?**
A: Yes! Even plugin management is a plugin. Users can install alternative plugin managers.

### Python Backend

**Q: Can plugins include Python backends?**
A: Yes! Plugins can bundle Python code that runs as managed child processes. See the [Python Backend documentation](./PLUGIN_PYTHON_BACKEND.md).

**Q: How are Python dependencies handled?**
A: Python dependencies are installed during build and bundled with the Electron app. In cloud deployments, they use the server's Python environment.

**Q: Do users need Python installed?**
A: No, the Electron app bundles a Python runtime. Everything is included in the installer.

### Multi-Tenant Deployment & Scalability

**Q: In cloud hosting, do I need to build separate bundles for each user?**
A: No! One build serves all users. Vite's code-splitting creates separate chunks for each plugin. Users download only the chunks for plugins they've enabled. No per-user builds or storage duplication needed.

**Q: What if I have 10,000 users with different plugin combinations?**
A: Still one build. Example:
- Build output: 1 core bundle + 100 plugin chunks = ~50MB total
- User A enables 5 plugins → downloads core + 5 chunks (~8MB)
- User B enables 20 plugins → downloads core + 20 chunks (~15MB)
- Storage cost: $0.50/month for entire app on CDN
- Bandwidth: Pay only for what users actually download

**Q: How do I track which plugins each user has enabled?**
A: Database table:
```sql
CREATE TABLE users_plugins (
  user_id UUID,
  plugin_id VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  load_order INTEGER,  -- Controls override priority
  PRIMARY KEY (user_id, plugin_id)
);
```

**Q: How does the client know which plugins to load?**
A: API endpoint returns user's enabled plugins:
```typescript
GET /api/users/:userId/plugins
→ { enabledPlugins: ['core-theme', 'core-documents', 'ai-assistant'] }
```
Client loops through this list and dynamically imports only those chunks.

**Q: Can different users have different versions of the same plugin?**
A: Not from same deployment. All users get same plugin version per deployment. For different versions, users need separate deployments or you need plugin versioning system (each version = separate chunk).

**Q: How do plugin overrides work in multi-tenant?**
A: Load order from database determines priority. User's `load_order` column controls which plugin loads last (and thus overrides others). User A can have `['core-theme', 'theme-pro']` (pro wins), User B can have just `['core-theme']` (core wins).

**Q: Does this work the same in Electron and Web?**
A: Yes! Same code:
- **Electron**: Plugins load from local filesystem, user prefs in SQLite
- **Web**: Plugins load from CDN chunks, user prefs in PostgreSQL
- Same `import.meta.glob()`, same PluginManager, same dynamic imports

**Q: What about plugin security in cloud hosting?**
A: No sandboxing - game mod philosophy. Plugins run with full access. Security is review-based (marketplace moderation), not technical isolation. Users accept risk when installing plugins, same as Skyrim mods or VSCode extensions.

**Q: How do I handle plugin marketplace with thousands of plugins?**
A: Build process discovers plugins automatically:
```typescript
// Vite scans /src/plugins/* and creates chunks for ALL of them
const pluginModules = import.meta.glob('/src/plugins/*/index.ts');
// Each plugin becomes a chunk: plugin-name-hash123.js
```
Users can browse marketplace, enable plugins, and client downloads chunks on-demand. No rebuild needed when adding new plugins to marketplace - just deploy new plugin chunks to CDN.

**Q: What if a plugin is 50MB (huge ML model)?**
A: Still works - it's just a bigger chunk. User who enables it downloads 50MB. User who doesn't enable it downloads 0MB. That's the beauty of code-splitting.

**Q: Can I lazy-load parts of a plugin?**
A: Yes! Use dynamic imports inside the plugin:
```typescript
// Plugin loads fast, ML model loads only when needed
export const AIPlugin = {
  async processImage(img) {
    const { heavyMLModel } = await import('./ml-model.js'); // Separate chunk
    return heavyMLModel.process(img);
  }
}
```