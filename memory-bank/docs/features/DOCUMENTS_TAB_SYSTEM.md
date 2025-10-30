# Documents Tab System Architecture

## Overview

The Documents plugin uses a **tab-based workspace** for viewing documents and folders, similar to VS Code, browser tabs, and Notion. This architecture enables multi-document workflows where users can keep multiple files open simultaneously.

**Status**: ✅ Architecture Complete, ⏳ Ready for Implementation
**Date**: October 27, 2025

---

## Core Design Decisions

### 1. localStorage over URL Parameters

**Decision**: Use localStorage for tab persistence instead of URL parameters.

**Why localStorage**:
- ✅ **Clean URLs** - No messy `?tab=0&view=doc123&tab=1&view=grid` in address bar
- ✅ **Persistent state** - Tabs restore after browser refresh or app restart
- ✅ **Industry standard** - VS Code, Notion, Figma all use similar approaches
- ✅ **Better UX** - URL represents location, not ephemeral UI state

**Why NOT URL params**:
- ❌ Messy, cluttered URLs
- ❌ Not how professional tools work
- ❌ Poor sharability (tabs are personal workspace state)

**localStorage Key**: `chaycards:documents:tabs`

### 2. Grid View Always in a Tab

**Decision**: The folder grid view is always contained within a tab, not a special case.

**Benefits**:
- Consistent UX pattern (everything is a tab)
- No special-case logic for "main view"
- Users understand the mental model immediately
- Easy to have multiple folder views open

**Special Rule**: Always have at least ONE grid tab (cannot close the last one).

### 3. File Tree Outside Tabs

**Decision**: The file/folder tree sidebar is OUTSIDE the tab system, always visible.

**Rationale**:
- Provides persistent navigation context
- Users can see folder structure regardless of active tab
- Consistent with VS Code, IDE patterns
- Enables drag-drop from tree to tabs

### 4. Context Menus in 4 Locations

**Decision**: Provide file/folder operations in ALL relevant UI locations.

**Four locations**:
1. **Tree right-click** - Context menu on tree nodes
2. **Tree three-dot menu** - Dropdown menu in tree
3. **Grid right-click** - Context menu on file/folder cards
4. **Grid three-dot menu** - Dropdown menu on cards

**Consistent UX**: Same operations available in all locations, same handler functions.

### 5. Dual Access Pattern

**Decision**: Plugin viewers work in TWO contexts - embedded in Documents OR standalone.

**Embedded in Documents**:
```
User opens file from Documents
→ FileBrowser renders TabBar
→ Tab contains plugin viewer
→ Plugin has access to DocumentViewerContext
```

**Standalone (direct navigation)**:
```
User navigates to /app/flashcards/deck/abc123
→ Plugin route renders viewer at top level
→ NO Documents UI (tree, breadcrumbs, tabs)
→ DocumentViewerContext indicates standalone mode
```

**Why this matters**: Plugins need to detect their context and adapt UX accordingly.

### 6. Per-Tab Navigation History

**Decision**: Each tab maintains its own browser-style back/forward history stack (not global).

**Benefits**:
- ✅ **Independent navigation** - Each tab has separate history
- ✅ **Restore scroll position** - Go back to exact position in document
- ✅ **Browser-familiar** - Works like Chrome/Firefox/Edge tabs
- ✅ **Intuitive UX** - Back button returns to previous view in THIS tab

**How it works**:
```
Tab history: [Grid (All Files)] → [Grid (Projects)] → [Deck.deck] → [Notes.md]
                                                                          ↑ You are here

Click back button → Shows Deck.deck (with saved scroll position)
Click back again → Shows Projects grid view
Click forward → Returns to Deck.deck
```

**Rules**:
- Opening file/folder adds entry to current tab's history
- Back button disabled when at start of history
- Forward button disabled when at end of history
- Navigating after going back erases "future" history (browser behavior)

See [Per-Tab History](#per-tab-navigation-history-1) section for implementation details.

---

## Tab Types

### Grid Tabs

Show folder contents (files + subfolders) in grid/list view.

```typescript
interface GridTab {
  id: string;                    // Unique identifier
  type: 'grid';
  title: string;                 // Folder name or "All Files"
  breadcrumb: BreadcrumbItem[];  // Navigation path
  closeable: boolean;            // First grid tab = false

  // Navigation history
  history: TabHistoryEntry[];    // Stack of visited locations
  historyIndex: number;          // Current position in stack (0-based)
}
```

**Rules**:
- Always have at least ONE grid tab
- First grid tab is NOT closeable
- Can navigate to different folders within same tab (adds to history)
- Can create additional grid tabs for multi-folder workflows

### Document Tabs

Show plugin-provided viewer/editor for specific files.

```typescript
interface DocumentTab {
  id: string;                    // Unique identifier
  type: 'document';
  title: string;                 // File display name
  fileId: string;                // StoredFile.id
  handler: FileHandler;          // Registered FileHandler
  pluginRoute: string;           // Plugin viewer route
  breadcrumb: BreadcrumbItem[];  // Where file lives
  closeable: boolean;            // Always true
  isDirty: boolean;              // Has unsaved changes?

  // Navigation history
  history: TabHistoryEntry[];    // Stack of visited locations
  historyIndex: number;          // Current position in stack (0-based)
}
```

**Rules**:
- Always closeable
- Check `isDirty` before closing (prompt user if unsaved)
- Switch to existing tab if file already open (don't duplicate)

### Tab History Entry

```typescript
interface TabHistoryEntry {
  type: 'grid' | 'document';
  timestamp: number;             // When entry was created

  // For grid entries (folder navigation)
  folderId?: string | null;      // Which folder was shown
  scrollPosition?: number;       // Grid scroll position

  // For document entries (file viewing)
  fileId?: string;               // Which file was open
  scrollPosition?: number;       // Document scroll position
  cursorPosition?: number;       // Text cursor position (for editors)
}
```

**History Behavior**:
- New tab starts with single entry (current view)
- Opening file/folder appends to history
- Back/forward navigation changes historyIndex (doesn't modify array)
- Navigating after going back truncates future entries (browser behavior)

---

## Tab State Management

### State Structure

```typescript
interface TabState {
  tabs: DocumentTab[];      // Ordered array of tabs
  activeTabId: string;      // Which tab is visible
}

// localStorage key: 'chaycards:documents:tabs'
```

### Save Strategy

```typescript
// Save on every tab operation
const saveTabState = useCallback(() => {
  const state: TabState = {
    tabs: tabs,
    activeTabId: activeTabId
  };
  localStorage.setItem('chaycards:documents:tabs', JSON.stringify(state));
}, [tabs, activeTabId]);
```

**Triggered by**:
- Add tab
- Remove tab
- Switch tab
- Update tab (rename, mark dirty)

### Restore Strategy

```typescript
// On component mount
const restoreTabState = useCallback(() => {
  const stored = localStorage.getItem('chaycards:documents:tabs');
  if (!stored) {
    // First load - create default grid tab
    return [createDefaultGridTab()];
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

---

## FileHandler Extensions

### New Required Method

Plugins must implement `getViewerRoute()` to tell Documents how to construct routes:

```typescript
interface FileHandler {
  // ... existing fields ...

  // NEW - REQUIRED for tab system
  getViewerRoute: (fileId: string) => string;

  // Optional settings modal for this file type
  settingsComponent?: string;
}
```

### Example Registrations

```typescript
// Flashcard plugin
{
  id: 'flashcard-deck-handler',
  pluginId: 'chaycards/core-flashcards',
  extensions: ['.deck'],
  getViewerRoute: (fileId) => `/app/flashcards/deck/${fileId}`,
  settingsComponent: 'chaycards/core-flashcards/DeckSettings',
  // ... other fields
}

// Canvas plugin
{
  id: 'canvas-handler',
  pluginId: 'chaycards/core-canvas',
  extensions: ['.canvas'],
  getViewerRoute: (fileId) => `/app/canvas/${fileId}`,
  // ... other fields
}
```

---

## Context Detection System

### DocumentViewerContext Interface

```typescript
interface DocumentViewerContext {
  isEmbedded: boolean;                         // Is viewer in Documents tab?
  openInNewTab?: (route: string) => void;      // Open another file in new tab
  closeTab?: () => void;                       // Close current tab
  setTabDirty?: (isDirty: boolean) => void;   // Mark tab dirty/clean
}
```

### Provided by Documents (embedded)

```typescript
// FileBrowser.tsx (when rendering tabs)
<DocumentViewerContext.Provider value={{
  isEmbedded: true,
  openInNewTab: (route) => addTab({ type: 'document', pluginRoute: route }),
  closeTab: () => removeTab(currentTabId),
  setTabDirty: (isDirty) => updateTab(currentTabId, { isDirty })
}}>
  <Route path={tab.pluginRoute} />  {/* Plugin viewer renders here */}
</DocumentViewerContext.Provider>
```

### Provided by Plugin (standalone)

```typescript
// Plugin's route definition
<DocumentViewerContext.Provider value={{ isEmbedded: false }}>
  <FlashcardDeckViewer deckId={deckId} />
</DocumentViewerContext.Provider>
```

### Plugin Usage Pattern

```typescript
// In plugin viewer component
const MyViewer: React.FC<{ fileId: string }> = ({ fileId }) => {
  const viewerContext = useContext(DocumentViewerContext);

  if (viewerContext.isEmbedded) {
    // Embedded in Documents
    // - Use viewerContext.openInNewTab() for links
    // - Use viewerContext.closeTab() for close button
    // - Minimal chrome (Documents provides breadcrumbs)
  } else {
    // Standalone route
    // - Use router.push() for links
    // - Show full navigation (Documents not present)
    // - Provide back button or home link
  }

  return <div>{/* ... */}</div>;
};
```

---

## Per-Tab Navigation History

### Visual Design

The breadcrumb bar includes back/forward buttons at the start:

```
┌──────────────────────────────────────────────────────────┐
│  [←] [→]  All Documents > Projects > ChayCards           │
└──────────────────────────────────────────────────────────┘
   ↑   ↑    └── Breadcrumb trail (clickable segments)
   │   └── Forward button (disabled if at end of history)
   └── Back button (disabled if at start of history)
```

**Button States**:
- Enabled: Solid icon, hover effect
- Disabled: Faded icon (opacity 0.4), no hover, cursor not-allowed

### History Management Functions

```typescript
// Add entry to current tab's history
const navigateInTab = (
  tabId: string,
  entry: Omit<TabHistoryEntry, 'timestamp'>
) => {
  setTabs(tabs.map(tab => {
    if (tab.id !== tabId) return tab;

    const newHistory = [
      // Keep all history up to current index
      ...tab.history.slice(0, tab.historyIndex + 1),
      // Add new entry (truncates "future")
      { ...entry, timestamp: Date.now() }
    ];

    return {
      ...tab,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }));
};

// Go back in tab history
const goBack = (tabId: string) => {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex <= 0) return;

  const prevEntry = tab.history[tab.historyIndex - 1];

  // Update tab state
  setTabs(tabs.map(t => {
    if (t.id !== tabId) return t;
    return { ...t, historyIndex: t.historyIndex - 1 };
  }));

  // Navigate to previous entry
  restoreHistoryEntry(tab, prevEntry);
};

// Go forward in tab history
const goForward = (tabId: string) => {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;

  const nextEntry = tab.history[tab.historyIndex + 1];

  // Update tab state
  setTabs(tabs.map(t => {
    if (t.id !== tabId) return t;
    return { ...t, historyIndex: t.historyIndex + 1 };
  }));

  // Navigate to next entry
  restoreHistoryEntry(tab, nextEntry);
};

// Restore UI state from history entry
const restoreHistoryEntry = (
  tab: DocumentTab,
  entry: TabHistoryEntry
) => {
  if (entry.type === 'grid') {
    // Restore grid view
    setCurrentFolderId(entry.folderId || null);

    // Restore scroll position (next frame to allow render)
    requestAnimationFrame(() => {
      const gridElement = document.querySelector('.file-grid');
      if (gridElement && entry.scrollPosition !== undefined) {
        gridElement.scrollTop = entry.scrollPosition;
      }
    });
  } else {
    // Restore document view
    const file = await documentsService.getFile(entry.fileId!);
    if (!file) return;

    // Update tab to show this document
    const handler = documentsService.getHandlerForFile(file);
    if (!handler) return;

    // Router navigation handled by tab system
    router.push(handler.getViewerRoute(file.id), { replace: true });

    // Restore scroll/cursor position (plugin handles this via context)
    requestAnimationFrame(() => {
      // For scrollable documents
      const docElement = document.querySelector('.document-viewer');
      if (docElement && entry.scrollPosition !== undefined) {
        docElement.scrollTop = entry.scrollPosition;
      }

      // For text editors (plugin-specific)
      if (entry.cursorPosition !== undefined) {
        // Plugin should listen for cursor restore event
        window.dispatchEvent(new CustomEvent('document-cursor-restore', {
          detail: { position: entry.cursorPosition }
        }));
      }
    });
  }
};
```

### Capturing Scroll and Cursor Positions

```typescript
// Capture current state before navigation
const captureCurrentState = (tab: DocumentTab): Partial<TabHistoryEntry> => {
  if (tab.type === 'grid') {
    const gridElement = document.querySelector('.file-grid');
    return {
      scrollPosition: gridElement?.scrollTop || 0
    };
  } else {
    const docElement = document.querySelector('.document-viewer');
    const state: Partial<TabHistoryEntry> = {
      scrollPosition: docElement?.scrollTop || 0
    };

    // For text editors, capture cursor position
    const cursorEvent = new CustomEvent('document-cursor-capture', {
      detail: { callback: (pos: number) => { state.cursorPosition = pos; } }
    });
    window.dispatchEvent(cursorEvent);

    return state;
  }
};

// Update current history entry with latest state
const updateCurrentHistoryEntry = (tabId: string) => {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const currentState = captureCurrentState(tab);

  setTabs(tabs.map(t => {
    if (t.id !== tabId) return t;

    const updatedHistory = [...t.history];
    updatedHistory[t.historyIndex] = {
      ...updatedHistory[t.historyIndex],
      ...currentState
    };

    return { ...t, history: updatedHistory };
  }));
};
```

### Click Handlers

```typescript
// When user clicks file in grid
const handleFileClick = async (file: StoredFile) => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;

  // Save current scroll position
  updateCurrentHistoryEntry(activeTabId);

  // Open file in current tab
  const handler = documentsService.getHandlerForFile(file);
  if (!handler) return;

  // Add to history
  navigateInTab(activeTabId, {
    type: 'document',
    fileId: file.id,
    scrollPosition: 0,  // Start at top of new document
    cursorPosition: 0
  });

  // Update tab to document type
  setTabs(tabs.map(t => {
    if (t.id !== activeTabId) return t;
    return {
      ...t,
      type: 'document',
      fileId: file.id,
      handler: handler,
      pluginRoute: handler.getViewerRoute(file.id),
      title: getFileDisplayName(file),
      breadcrumb: await getFolderPath(file.folderId)
    };
  }));
};

// When user clicks folder in grid
const handleFolderClick = (folderId: string) => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;

  // Save current scroll position
  updateCurrentHistoryEntry(activeTabId);

  // Navigate to folder
  navigateInTab(activeTabId, {
    type: 'grid',
    folderId: folderId,
    scrollPosition: 0  // Start at top of new folder
  });

  // Update UI
  setCurrentFolderId(folderId);
};
```

### Keyboard Shortcuts

```typescript
// Listen for keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt+← = Back
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      goBack(activeTabId);
    }

    // Alt+→ = Forward
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      goForward(activeTabId);
    }

    // Cmd/Ctrl+[ = Back (VS Code style)
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      goBack(activeTabId);
    }

    // Cmd/Ctrl+] = Forward (VS Code style)
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
      e.preventDefault();
      goForward(activeTabId);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTabId, tabs]);
```

### BreadcrumbBar Component

```typescript
const BreadcrumbBar: React.FC<{ tab: DocumentTab }> = ({ tab }) => {
  const canGoBack = tab.historyIndex > 0;
  const canGoForward = tab.historyIndex < tab.history.length - 1;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      {/* Back button */}
      <button
        onClick={() => goBack(tab.id)}
        disabled={!canGoBack}
        className={cn(
          "p-1 rounded hover:bg-accent transition-colors",
          !canGoBack && "opacity-40 cursor-not-allowed"
        )}
        title="Go back (Alt+←)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Forward button */}
      <button
        onClick={() => goForward(tab.id)}
        disabled={!canGoForward}
        className={cn(
          "p-1 rounded hover:bg-accent transition-colors",
          !canGoForward && "opacity-40 cursor-not-allowed"
        )}
        title="Go forward (Alt+→)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 text-sm">
        {tab.breadcrumb.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            <button
              onClick={() => handleBreadcrumbClick(item)}
              className="hover:text-primary transition-colors"
            >
              {item.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

### Plugin Integration

Plugins need to handle scroll/cursor restoration:

```typescript
// In plugin viewer component
const MyDocumentViewer: React.FC<{ fileId: string }> = ({ fileId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>(null);

  // Listen for scroll position restore
  useEffect(() => {
    const handleRestore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.scrollPosition !== undefined && containerRef.current) {
        containerRef.current.scrollTop = detail.scrollPosition;
      }
    };

    window.addEventListener('document-scroll-restore', handleRestore);
    return () => window.removeEventListener('document-scroll-restore', handleRestore);
  }, []);

  // Listen for cursor position restore (text editors only)
  useEffect(() => {
    const handleRestore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.position !== undefined && editorRef.current) {
        editorRef.current.setCursorPosition(detail.position);
      }
    };

    window.addEventListener('document-cursor-restore', handleRestore);
    return () => window.removeEventListener('document-cursor-restore', handleRestore);
  }, []);

  // Provide cursor position when requested
  useEffect(() => {
    const handleCapture = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (editorRef.current && detail.callback) {
        detail.callback(editorRef.current.getCursorPosition());
      }
    };

    window.addEventListener('document-cursor-capture', handleCapture);
    return () => window.removeEventListener('document-cursor-capture', handleCapture);
  }, []);

  return <div ref={containerRef}>{/* ... */}</div>;
};
```

### History Behavior Examples

**Example 1: Simple navigation**
```
[Grid (All Files)] → click folder → [Grid (Projects)]
                                      ↑ You are here

History: [{type: 'grid', folderId: null}, {type: 'grid', folderId: 'proj-123'}]
Index: 1
Back enabled: ✅  Forward enabled: ❌
```

**Example 2: Open document, then go back**
```
[Grid (Projects)] → click file → [Deck.deck] → click back → [Grid (Projects)]
                                                              ↑ You are here

History: [{type: 'grid', folderId: 'proj'}, {type: 'document', fileId: 'deck-456'}]
Index: 0
Back enabled: ❌  Forward enabled: ✅
```

**Example 3: Truncate future**
```
[Grid A] → [Grid B] → [Grid C] → go back → [Grid B] → click folder D → [Grid D]
                                             ↑ Index: 1                   ↑ Index: 2

Before folder D click:
History: [A, B, C]
Index: 1

After folder D click (C is erased):
History: [A, B, D]
Index: 2
```

---

## Tab Lifecycle

### Creation

```typescript
// Grid tab (folder view)
const createGridTab = (folderId: string | null) => ({
  id: generateId(),
  type: 'grid',
  title: folderId ? folder.name : 'All Files',
  breadcrumb: await getFolderPath(folderId),
  closeable: tabs.filter(t => t.type === 'grid').length > 0  // First not closeable
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

### Closing

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

### Switching

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

---

## Tab Opening Mechanisms

Users can open tabs from **4 different locations**:

### 1. Tree Right-Click Menu
```typescript
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
</ContextMenu>
```

### 2. Tree Three-Dot Menu
```typescript
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
</DropdownMenu>
```

### 3. Grid Right-Click Menu
```typescript
<ContextMenu>
  <ContextMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </ContextMenuItem>
</ContextMenu>
```

### 4. Grid Three-Dot Menu
```typescript
<DropdownMenu>
  <DropdownMenuItem onClick={() => openFileInTab(file)}>
    Open in New Tab
  </DropdownMenuItem>
</DropdownMenu>
```

### Consistent Handler

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

---

## FileBrowser Integration

### Before Tab System

```
FileBrowser
├── FolderTree (sidebar)
├── Header (breadcrumbs, search, buttons)
└── Grid/List view (files + folders)
```

### After Tab System

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

---

## Implementation Checklist

### Files to Create

- [ ] `src/plugins/core-documents/components/TabBar.tsx` - Tab UI component
- [ ] `src/plugins/core-documents/hooks/useDocumentTabs.tsx` - Tab state hook
- [ ] `src/plugins/core-documents/context/DocumentViewerContext.ts` - Context interface

### Files to Modify

- [ ] `src/plugins/core-documents/types.ts` - Add DocumentTab interface, extend FileHandler
- [ ] `src/plugins/core-documents/components/FileBrowser.tsx` - Integrate tab system
- [ ] `src/plugins/core-documents/components/FolderTree.tsx` - Add context menus
- [ ] `src/plugins/core-documents/components/FileCard.tsx` - Add click handlers
- [ ] `src/plugins/core-flashcards/` - Update FileHandler registration

### Key Features

- [ ] Tab creation (grid + document types)
- [ ] Tab closing (with unsaved check)
- [ ] Tab switching (keyboard + mouse)
- [ ] localStorage persistence
- [ ] Restore validation
- [ ] Context menus (4 locations)
- [ ] Dual access pattern
- [ ] isDirty state management

---

## Plugin Developer Guide

See [core-documents/CLAUDE.md](../../src/plugins/core-documents/CLAUDE.md) for complete plugin integration guide.

**Quick integration steps**:

1. **Register FileHandler with `getViewerRoute`**
2. **Create viewer component that detects context**
3. **Provide standalone route**
4. **Handle links to other files**

---

## Benefits

### User Experience
- ✅ Multi-document workflows (have multiple files open)
- ✅ State persistence (tabs restore on app restart)
- ✅ Clean URLs (no messy parameters)
- ✅ Familiar pattern (like VS Code, browser tabs)

### Plugin Integration
- ✅ Plugins work embedded OR standalone
- ✅ Simple integration (just implement FileHandler)
- ✅ Context awareness (adapt UX to embedding)
- ✅ No plugin changes needed for tab system

### Implementation
- ✅ Centralized state (localStorage)
- ✅ Validation on restore (handle missing files)
- ✅ Minimal coupling (plugins don't know about tabs)
- ✅ Future-proof (easy to add features like tab pinning)

---

## Future Enhancements (Phase 2+)

- **Tab reordering**: Drag tabs to reorder
- **Tab pinning**: Pin tabs so they can't be closed
- **Tab groups**: Group related tabs with visual separator
- **Split view**: Show two tabs side-by-side
- **Tab history**: Recently closed tabs
- **Keyboard shortcuts**: Cmd+T new tab, Cmd+W close tab, Cmd+1-9 switch to tab N

---

## Summary

The Documents tab system provides:

1. **Multi-document workflows** - keep multiple files open
2. **Plugin extensibility** - register handlers for custom document types
3. **Dual access pattern** - viewers work embedded OR standalone
4. **Context awareness** - plugins adapt UX based on embedding
5. **State persistence** - tabs restore after app restart

**Key integration point**: `getViewerRoute()` in FileHandler registration

**Key detection**: `DocumentViewerContext.isEmbedded` in viewer components

Estimated implementation: **~1200 lines across 9 files**
