# Documents Plugin - Developer Guide

## Overview

The **Documents plugin** is the universal container system for ChayCards. It provides:
- **Hierarchical file organization** with folders, tags, and search
- **Plugin extensibility** via FileHandler registration pattern
- **Tab-based workspace** for multi-document workflows
- **Dual access pattern** - documents open embedded OR standalone

**Key Principle**: Documents is infrastructure, not content. Plugins own their document types and provide viewers/editors.

---

## Architecture

### Component Hierarchy

```
FileBrowser (root component)
├── FolderTree (sidebar)
│   ├── react-arborist tree
│   ├── Drag-drop support
│   └── Context menus (right-click, three-dot)
│
├── TabBar
│   ├── Tab list (scrollable)
│   ├── Active tab highlight
│   └── Close buttons
│
└── TabContent (active tab's content)
    ├── GridView (if type === 'grid')
    │   ├── Header (breadcrumbs, buttons)
    │   ├── FolderCards (with drag-drop)
    │   └── FileCards (with context menus)
    └── DocumentView (if type === 'document')
        └── <Route path={handler.getViewerRoute(fileId)} />
```

### Service Layer

```
DocumentsService (singleton)
├── File Operations
│   ├── uploadFile(file, options)
│   ├── updateFile(fileId, options)
│   ├── deleteFile(fileId)
│   └── listFiles(options)
│
├── Folder Operations
│   ├── createFolder(options)
│   ├── updateFolder(folderId, options)
│   ├── deleteFolder(folderId)
│   └── getFolderTree()
│
├── FileHandler Registry
│   ├── registerFileHandler(handler)
│   ├── unregisterFileHandler(handlerId)
│   └── getHandlerForFile(file)
│
└── Observer Pattern
    ├── onFileChange(listener)
    ├── onFolderChange(listener)
    └── onFileHandlerRegistered(listener)
```

### React Hooks

```typescript
// File hooks
useFiles()                      // All files
useFilesInFolder(folderId)      // Files in specific folder
useFile(fileId)                 // Single file

// Folder hooks
useFolders()                    // All folders
useChildFolders(parentId)       // Subfolders
useFolderPath(folderId)         // Breadcrumb path
useFolderTree()                 // Hierarchical tree

// Handler hooks
useFileHandlers()               // All registered handlers
useHandlerForFile(file)         // Handler for specific file

// UI state hooks
useSortBy(items, field, order)  // Client-side sorting
useDocumentStatistics()         // File/folder counts
```

---

## Tab System Architecture

### Why Tabs?

Tabs enable **multi-document workflows** where users can:
- Keep multiple files open simultaneously
- Switch between documents without losing context
- Compare documents side-by-side (future: split view)
- Restore workspace state after app restart

**Persistence Strategy**: localStorage (NOT URL parameters)

**Why localStorage**:
- ✅ Clean URLs - no `?tab=0&view=doc123&tab=1&view=grid` mess
- ✅ State persists across browser refresh and app restart
- ✅ Industry standard - VS Code, Notion, Figma all use this approach
- ❌ URL params rejected - messy, not how professional tools work

### Tab Types

#### Grid Tabs
Show folder contents (files + subfolders) in grid/list view.

```typescript
{
  id: 'abc123',
  type: 'grid',
  title: 'Projects',                // Folder name or "All Files"
  breadcrumb: [                     // Navigation path
    { id: null, name: 'All Files' },
    { id: 'folder-123', name: 'Projects' }
  ],
  closeable: false                  // First grid tab cannot be closed
}
```

**Special rules**:
- Always have at least ONE grid tab (enforced)
- First grid tab is NOT closeable (permanent workspace)
- Can navigate to different folders within same tab
- Create additional grid tabs for multi-folder workflows

#### Document Tabs
Show plugin-provided viewer/editor for specific files.

```typescript
{
  id: 'def456',
  type: 'document',
  title: 'Study Spanish',            // File display name
  fileId: 'file-789',                // StoredFile.id
  handler: flashcardHandler,         // Registered FileHandler
  pluginRoute: '/app/flashcards/deck/file-789',  // Plugin viewer route
  breadcrumb: [                      // Where file lives
    { id: null, name: 'All Files' },
    { id: 'folder-abc', name: 'Languages' }
  ],
  closeable: true,                   // Can be closed
  isDirty: false                     // Has unsaved changes?
}
```

**Special rules**:
- Always closeable (can close document tabs)
- Check `isDirty` before closing (prompt user if unsaved)
- Switch to existing tab if file already open (don't duplicate)

### Tab State Management

**localStorage key**: `chaycards:documents:tabs`

**State structure**:
```typescript
interface TabState {
  tabs: DocumentTab[];      // Ordered array of tabs
  activeTabId: string;      // Which tab is visible
}
```

**Save triggers**:
- Add tab
- Remove tab
- Switch tab
- Update tab (rename, mark dirty)

**Restore on mount**:
1. Read from localStorage
2. Validate tabs (verify file IDs still exist)
3. Remove invalid tabs
4. Ensure at least one grid tab
5. Fallback to default if corrupted

---

## Plugin Integration Guide

### For Plugin Developers

To make your document type work with the Documents tab system:

#### Step 1: Register FileHandler (That's All!)

```typescript
// In your plugin's onLoad() hook
const documentsService = manager.getService('core-documents/documentsService');

documentsService.registerFileHandler({
  id: 'flashcard-deck-handler',
  pluginId: 'core-flashcards',
  name: 'Flashcard Deck',
  extensions: ['.deck'],
  mimeTypes: ['application/x-chaycards-deck'],
  icon: { type: 'emoji', emoji: '🎴' },

  // REQUIRED: Your viewer component (Documents renders it in tabs)
  viewerComponent: 'core-flashcards/DeckView',

  // Optional components
  editorComponent: 'core-flashcards/DeckView',  // Same component for now
  settingsComponent: 'core-flashcards/DeckSettings',  // Settings modal

  priority: 100,  // Higher = preferred if multiple handlers match
  canHandle: (file) => {
    // Optional custom validation
    return file.metadata?.deckFormat === 'v2';
  }
});
```

**That's it!** Documents automatically handles:
- ✅ Tab rendering (no routing - stays at /app/documents)
- ✅ Component resolution via PluginManager
- ✅ DocumentViewerContext injection
- ✅ Per-tab navigation history

#### Step 2: Create Simple Viewer Component

**No wrapper components needed!** Just render your viewer:

```typescript
export const DeckView: React.FC<{ fileId: string }> = ({ fileId }) => {
  const { deck, cards } = useDeckData(fileId);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs have breadcrumbs with back/forward automatically */}
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">{deck.name}</h1>
        <p className="text-muted-foreground">{cards.length} cards</p>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <CardStudyInterface cards={cards} />
      </main>
    </div>
  );
};
```

**Documents provides automatically**:
- Tab bar with close buttons
- Breadcrumbs with per-tab history (back/forward arrows)
- Tab controls (close, dirty indicator)
- Context injection for advanced features

#### Step 3 (Optional): Use Context for Advanced Features

Context is **completely optional**. Use only if you need:
- In-tab navigation (navigate to related files in same tab)
- Dirty state tracking
- Custom tab behavior

```typescript
import { useDocumentViewer } from '@/plugins/core-documents/hooks/useDocumentViewer';

export const DeckView: React.FC<{ fileId: string }> = ({ fileId }) => {
  const viewerContext = useDocumentViewer();  // Hook provided by Documents
  const { deck, cards, hasUnsavedChanges } = useDeckData(fileId);

  // Optional: Mark unsaved changes (shows dot in tab)
  useEffect(() => {
    viewerContext?.setTabDirty?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, viewerContext]);

  // Optional: Navigate to related deck in same tab
  const openRelatedDeck = async (relatedId: string) => {
    if (viewerContext?.navigateInTab) {
      await viewerContext.navigateInTab(relatedId);
    }
  };

  return <div>...</div>;
};
```

**Most plugins don't need this!** Basic viewers work without any context usage.

---

## Context Menus

Users can open files from **4 different locations**:

### 1. Tree Right-Click Menu
```typescript
// FolderTree.tsx
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
  <ContextMenuItem onClick={() => handleRename(file)}>
    Rename
  </ContextMenuItem>
  <ContextMenuItem onClick={() => handleDelete(file)}>
    Delete
  </ContextMenuItem>
</ContextMenu>
```

### 2. Tree Three-Dot Menu
```typescript
// FolderTree.tsx TreeNodeRenderer
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
  {/* Same items as right-click menu */}
</DropdownMenu>
```

### 3. Grid Right-Click Menu
```typescript
// FileBrowser.tsx FileCard
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
  {/* Same items as tree menu */}
</ContextMenu>
```

### 4. Grid Three-Dot Menu
```typescript
// FileBrowser.tsx FileCard
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
  {/* Same items as right-click menu */}
</DropdownMenu>
```

**Consistent UX principle**: All 4 locations offer same actions using same handler functions.

---

## Drag-and-Drop System

### Three Drag-Drop Scenarios

#### 1. Tree-to-Tree (react-arborist native)
- Drag folders within tree to reorder or reparent
- Handled entirely by react-arborist
- No custom code needed

#### 2. Tree-to-Grid (cross-library)
- Drag folders/files from tree into grid folder cards
- Uses `useDrag` (react-dnd) on TreeNodeRenderer
- Uses `useDrop` on FolderCard

#### 3. Grid-to-Grid (react-dnd)
- Drag folders/files within grid view
- Reorder or change parent
- Uses `useDrag` and `useDrop` on both FolderCard and FileCard

### Critical Pattern: Source Tagging

```typescript
// When dragging from tree
const [{ isDragging }, drag] = useDrag({
  type: 'FOLDER',
  item: { id: folder.id, source: 'tree' },  // TAG the source
  // ...
});

// When dropping in grid
const [{ isOver }, drop] = useDrop({
  accept: 'FOLDER',
  drop: (item: { id: string; source: string }) => {
    if (item.source === 'tree') {
      // Handle tree-to-grid drop
      handleTreeToGridDrop(item.id, targetFolderId);
    } else {
      // Handle grid-to-grid drop
      handleGridToGridDrop(item.id, targetFolderId);
    }
  }
});
```

**Why source tagging**: Prevents duplicate handling when same item could trigger multiple drop handlers.

---

## Common Patterns

### Opening Files

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
    setActiveTabId(existingTab.id);  // Switch to existing
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

  // 4. Add and activate
  setTabs([...tabs, newTab]);
  setActiveTabId(newTab.id);
  saveTabState();
};
```

### Closing Tabs

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

### Marking Tabs Dirty

```typescript
// In plugin viewer component
const handleEdit = () => {
  const viewerContext = useContext(DocumentViewerContext);

  // Mark tab dirty (shows unsaved indicator)
  viewerContext.setTabDirty?.(true);

  // ... handle edit
};

const handleSave = async () => {
  const viewerContext = useContext(DocumentViewerContext);

  await saveDeckChanges();

  // Mark tab clean
  viewerContext.setTabDirty?.(false);
};
```

---

## File Storage Pattern

Files stored using **Files as Entity Properties** pattern:

### Upload File
```typescript
const uploadFile = async (file: File, options: SaveDocumentOptions) => {
  // 1. Read file content
  const arrayBuffer = await file.arrayBuffer();
  const content = new Uint8Array(arrayBuffer);

  // 2. Create metadata entry
  const storedFile: StoredFile = {
    id: generateId(),
    filename: file.name,
    extension: getExtension(file.name),
    mimeType: file.type,
    size: file.size,
    fileStorageKey: `documents:files:${fileId}`,
    folderId: options.folderId ?? null,
    order: await getNextOrderValue(options.folderId),
    tags: options.tags ?? [],
    metadata: options.metadata ?? {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    accessedAt: Date.now()
  };

  // 3. Store metadata + file content in single operation
  await storage.set(
    `documents:metadata:${storedFile.id}`,
    storedFile,
    { content }  // File stored as property
  );

  return storedFile;
};
```

### Read File
```typescript
const getFileContent = async (fileId: string): Promise<Uint8Array | null> => {
  const result = await storage.get(`documents:metadata:${fileId}`);
  if (!result) return null;

  return result.files.content;  // Extract file from properties
};
```

**Benefits**:
- ✅ CASCADE DELETE - deleting metadata automatically deletes file
- ✅ Atomic operations - metadata + file in single transaction
- ✅ User scoping automatic - composite keys prevent cross-user access

---

## Testing Checklist

### Plugin Integration
- [ ] FileHandler registered with `getViewerRoute()`
- [ ] Viewer component detects embedded vs standalone
- [ ] Standalone route provides DocumentViewerContext
- [ ] Links open in tabs when embedded
- [ ] Close button works in embedded mode
- [ ] Back button works in standalone mode

### Tab Operations
- [ ] Open file from tree right-click
- [ ] Open file from tree three-dot menu
- [ ] Open file from grid right-click
- [ ] Open file from grid three-dot menu
- [ ] Switch to existing tab if file already open
- [ ] Close tab shows confirmation if dirty
- [ ] Cannot close last grid tab
- [ ] Tabs persist after browser refresh

### Drag-Drop
- [ ] Drag folders within tree
- [ ] Drag folders from tree to grid
- [ ] Drag folders within grid
- [ ] Drop INTO folder (blue ring indicator)
- [ ] Drop BEFORE/AFTER folder (insertion line)
- [ ] Breadcrumb acts as drop target

---

## Common Pitfalls

### ❌ Don't: Hard-code viewer routes
```typescript
// BAD - embedded assumption
<a href="/app/documents/view/file-123">Open</a>
```

### ✅ Do: Use context-aware navigation
```typescript
// GOOD - adapts to context
const handleOpen = () => {
  if (viewerContext.isEmbedded) {
    viewerContext.openInNewTab?.(`/app/my-plugin/view/${fileId}`);
  } else {
    router.push(`/app/my-plugin/view/${fileId}`);
  }
};
```

### ❌ Don't: Assume Documents UI is present
```typescript
// BAD - breadcrumbs may not exist
<div className="breadcrumbs">{/* Only in embedded mode */}</div>
```

### ✅ Do: Adapt UI based on context
```typescript
// GOOD - provide breadcrumbs in standalone
{!viewerContext.isEmbedded && (
  <div className="breadcrumbs">{/* Show in standalone */}</div>
)}
```

### ❌ Don't: Ignore isDirty state
```typescript
// BAD - lose unsaved changes
viewerContext.closeTab?.();
```

### ✅ Do: Prompt before closing dirty tabs
```typescript
// GOOD - check state
if (isDirty) {
  const confirmed = confirm('Unsaved changes. Close anyway?');
  if (!confirmed) return;
}
viewerContext.closeTab?.();
```

---

## Future Enhancements

### Phase 2+
- **Tab reordering**: Drag tabs to reorder
- **Tab pinning**: Pin tabs so they can't be closed
- **Tab groups**: Group related tabs with separator
- **Split view**: Show two tabs side-by-side
- **Tab history**: Recently closed tabs
- **Keyboard shortcuts**: Cmd+T new tab, Cmd+W close, Cmd+1-9 switch

### Advanced Features
- **Quick switcher**: Cmd+P to search and jump to files
- **Tab overflow menu**: Show hidden tabs in dropdown
- **Tab tooltips**: Show file path on hover
- **Tab icons**: Show handler icon in tab
- **Custom tab colors**: Color-code tabs by project

---

## Summary

The Documents tab system provides:
1. **Multi-document workflows** - keep multiple files open
2. **Plugin extensibility** - register handlers for custom document types
3. **Dual access pattern** - viewers work embedded OR standalone
4. **Context awareness** - plugins adapt UX based on embedding
5. **State persistence** - tabs restore after app restart

**Key integration point**: `getViewerRoute()` in FileHandler registration.

**Key detection**: `DocumentViewerContext.isEmbedded` in viewer components.

Follow this guide and your document types will seamlessly integrate with the Documents workspace.
