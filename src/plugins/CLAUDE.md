# Plugins - AI Context

## What This Is
ALL features live here as plugins. Every feature = a plugin. No exceptions.

## Plugin Structure
```
plugin-name/
├── components/       # UI components
├── services/        # Business logic
├── hooks/          # Custom hooks
├── types.ts        # TypeScript types
└── index.ts        # Plugin definition
```

## Core Plugins (Built-in)
- `core-ui/` - Shared UI components (Card, PageHeader, etc.)
- `core-documents/` - Document management
- `core-tasks/` - Task management
- `core-knowledge/` - Flashcards & learning

## Plugin Definition Pattern

### Simple Plugin (90% of cases)
```typescript
// index.ts
export const MyPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  requires: ['core.ui'],  // Dependencies

  components: {
    'MyList': MyList,  // Registry name: 'my-plugin/MyList'
    'MyCard': MyCard   // Registry name: 'my-plugin/MyCard'
  },

  services: {
    'myService': new MyService()
  },

  routes: [{
    path: '/my-feature',
    component: 'my-plugin/MyList',  // Full namespaced name!
    label: 'My Feature',
    icon: 'Star',
    showInNav: true,
    order: 50
  }],

  onLoad: (manager) => {
    console.log('Plugin loaded!');
    // Components/services already registered, done!
  }
}
```

### Complex Plugin (Uses other plugins' registrations)
```typescript
export const ComplexPlugin: Plugin = {
  id: 'my-plugin',
  requires: ['core-settings'],  // Hard dependency

  services: {
    'myService': new MyService()
  },

  onLoad: async (manager) => {
    const myService = manager.getService('my-plugin/myService');
    const storage = manager.getStorage();

    // Load data (safe - just reading from storage)
    const savedData = await storage.get('my-plugin:data');
    myService.cachedData = savedData;

    // Register event listeners
    manager.getEventBus().on('data:changed', (data) => {
      myService.handleChange(data);
    });
  },

  onPluginsReady: async (manager) => {
    const myService = manager.getService('my-plugin/myService');

    // Apply data now - all plugins have registered their definitions
    await myService.applyData();
  }
}
```

## Using Other Plugins
```typescript
// Components are always namespaced as 'plugin-id/ComponentName'
const manager = PluginManager.getInstance();

// Get core UI components
const Card = manager.getComponent('core.ui/Card');
const PageHeader = manager.getComponent('core.ui/PageHeader');

// Get components from other plugins
const DocCard = manager.getComponent('core.documents/DocumentCard');

// Or use the usePlugin hook (wrapper around manager)
const { getComponent } = usePlugin();
const TaskList = getComponent('core.tasks/TaskList');
```

## Plugin Lifecycle (Avoiding Race Conditions)

### The Problem
If your plugin uses other plugins' registrations in `onLoad`, you'll hit race conditions:
```typescript
// ❌ BAD: Theme definitions might not be registered yet!
onLoad: async (manager) => {
  const savedTheme = await storage.get('theme');
  themeService.applyTheme(savedTheme);  // FAILS if theme not registered
}
```

### The Solution: Use `onPluginsReady` Hook
```typescript
// ✅ GOOD: Load data in onLoad, apply in onPluginsReady
onLoad: async (manager) => {
  const storage = manager.getStorage();
  const themeService = manager.getService('core-theme/themeService');

  // Load theme ID from storage (safe - just reading data)
  await themeService.initialize(storage);
},

onPluginsReady: async (manager) => {
  const themeService = manager.getService('core-theme/themeService');

  // Apply theme now - all theme plugins have registered their definitions
  await themeService.applyStoredTheme();
}
```

### Two Lifecycle Hooks
- **`onLoad`** - Register components/services, load data (90% of plugins)
- **`onPluginsReady`** - Use other plugins' registrations (10% of plugins)

### When to Use Each Hook
- **Provider plugins** (register definitions): Only need `onLoad`
- **Consumer plugins** (use others' definitions): Use both hooks

**Full documentation**: `/memory-bank/docs/PLUGIN_SYSTEM.md` (Plugin Lifecycle section)

## Critical Rules
1. **RECOMMENDED** use core.ui components for consistency (but not required)
2. **NEVER** import directly from other plugins
3. Components auto-namespaced: 'plugin-id/ComponentName'
4. Declare dependencies in 'requires' array
5. Services also namespaced: 'plugin-id/serviceName'
6. **Use `plugins:all-loaded` event** if consuming other plugins' registrations

## Communication Patterns: Which Should I Use?

**Quick Decision**: What are you doing with this data?

1. **Rendering in React** → Stateful Observer + Custom Hook
   ```typescript
   // Service
   onThemeChange(callback: (theme: Theme) => void): () => void {
     callback(this.currentTheme); // Immediate state
     this.listeners.add(callback);
     return () => this.listeners.delete(callback);
   }

   // Hook
   export const useCurrentTheme = () => {
     const [theme, setTheme] = useState(service.getCurrentTheme());
     useEffect(() => service.onThemeChange(setTheme), []);
     return theme;
   };
   ```

2. **Broadcasting event** → Event Bus
   ```typescript
   eventBus.emit('document:saved', { id, title });
   eventBus.on('document:saved', (data) => trackAnalytics(data));
   ```

3. **Getting return value** → Service Method
   ```typescript
   const theme = themeService.getThemeById(id);
   const results = await documentService.search(query);
   ```

**See full docs**: `/memory-bank/docs/PLUGIN_SYSTEM.md` (lines 521-967)

## Working with Files

### Current Pattern (Dual-Storage - Before Phase 1)

When your plugin needs to store binary files (PDFs, images, documents), use the pattern from Documents plugin:

```typescript
// Example: Storing a file with metadata
async function saveFile(file: File): Promise<{id: string, metadata: FileMetadata}> {
  const fileId = crypto.randomUUID();

  // 1. Create metadata object
  const metadata = {
    id: fileId,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    // Store the content key for later retrieval
    fileStorageKey: buildPluginStorageKey('my-plugin', `files/${fileId}`),
    createdAt: Date.now()
  };

  // 2. Save file content separately (binary data)
  const arrayBuffer = await file.arrayBuffer();
  await storage.set(metadata.fileStorageKey, new Uint8Array(arrayBuffer));

  // 3. Save metadata to index
  const allFiles = await storage.get<FileMetadata[]>('my-plugin:files') || [];
  allFiles.push(metadata);
  await storage.set('my-plugin:files', allFiles);

  return { id: fileId, metadata };
}

// Example: Retrieving file content
async function getFileContent(fileId: string): Promise<Uint8Array | null> {
  // 1. Get metadata to find storage key
  const allFiles = await storage.get<FileMetadata[]>('my-plugin:files') || [];
  const file = allFiles.find(f => f.id === fileId);

  if (!file) return null;

  // 2. Fetch content using storage key
  return await storage.get<Uint8Array>(file.fileStorageKey);
}

// Example: Deleting a file (MUST delete both metadata AND content)
async function deleteFile(fileId: string): Promise<void> {
  // 1. Find and remove from metadata index
  const allFiles = await storage.get<FileMetadata[]>('my-plugin:files') || [];
  const fileIndex = allFiles.findIndex(f => f.id === fileId);

  if (fileIndex === -1) return;

  const file = allFiles[fileIndex];

  // 2. Delete file content
  await storage.delete(file.fileStorageKey);

  // 3. Remove from metadata index
  allFiles.splice(fileIndex, 1);
  await storage.set('my-plugin:files', allFiles);
}
```

**Key Points**:
- Metadata (JSON) stored at: `my-plugin:files` → `FileMetadata[]`
- File content (binary) stored at: `my-plugin:files/{fileId}` → `Uint8Array`
- Use `fileStorageKey` field to link metadata to content
- **IMPORTANT**: Must manually delete both metadata AND content to avoid orphans

### Future Pattern (Files as Entity Properties - After Phase 1)

Once Phase 1 of FILE_STORAGE_SPEC.md is implemented, this becomes much simpler:

```typescript
// Future: Store file with metadata in single call
async function saveFile_Future(file: File): Promise<{id: string, metadata: any}> {
  const fileId = crypto.randomUUID();
  const metadata = {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    createdAt: Date.now()
  };

  const content = new Uint8Array(await file.arrayBuffer());

  // Single atomic operation - no manual linking!
  await storage.set(`my-plugin:file:${fileId}`,
    metadata,
    { content }  // Files as properties
  );

  return { id: fileId, metadata };
}

// Future: Retrieve returns both metadata and files
async function getFile_Future(fileId: string) {
  const result = await storage.get(`my-plugin:file:${fileId}`);
  // Returns: { data: metadata, files: { content: Uint8Array } }
  return result;
}

// Future: Delete automatically cascades to files
async function deleteFile_Future(fileId: string): Promise<void> {
  await storage.delete(`my-plugin:file:${fileId}`);
  // Done! File content automatically deleted (CASCADE DELETE)
}
```

**Benefits of Future API**:
- ✅ Single storage call (atomic)
- ✅ Automatic CASCADE DELETE (no orphaned files)
- ✅ No manual linking via `fileStorageKey`
- ✅ Simpler code, fewer bugs

**See**: `/memory-bank/docs/FILE_STORAGE_SPEC.md` for complete specification.

## Component Pattern
```typescript
// components/MyList.tsx
export const MyList = () => {
  const manager = PluginManager.getInstance();
  
  // Get UI components (always use full namespace)
  const PageHeader = manager.getComponent('core.ui/PageHeader');
  const Card = manager.getComponent('core.ui/Card');
  const EmptyState = manager.getComponent('core.ui/EmptyState');
  
  // Get own service (also namespaced)
  const myService = manager.getService('my-plugin/myService');
  
  return (
    <>
      <PageHeader title="My Feature" />
      {items.length === 0 ? (
        <EmptyState title="No items yet" />
      ) : (
        items.map(item => <Card key={item.id}>{item.name}</Card>)
      )}
    </>
  );
};
```

## Quick Start New Plugin
1. Create: `src/plugins/my-feature/`
2. Add index.ts with Plugin export
3. Import & use core.ui components
4. Register in main.tsx plugin loader
5. Plugin auto-provides navigation & routes