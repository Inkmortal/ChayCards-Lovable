# Navigation Tree Specification

**Status**: Planned (Clean slate - ready for implementation)
**Last Updated**: 2025-01-10
**Component**: `src/plugins/core-documents/components/FolderTree.tsx`

## Overview

Professional drag-and-drop navigation tree for documents plugin with immediate backend persistence, undo/redo support, and multi-select capabilities.

---

## Core Principles

1. **Visual Clarity** - User always knows where items will land
2. **Forgiving UX** - Large drop targets, hard to make mistakes
3. **Instant Feedback** - Clear visual states during every operation
4. **Predictable Behavior** - Same action always produces same result
5. **No Magic** - User controls everything explicitly

---

## Visual Design

### Tree Display

**Structure:**
- Folders and files displayed together in unified hierarchy
- 16px indentation per nesting level
- Folder rows: 44px height (larger target for drops)
- File rows: 36px height
- Smooth expand/collapse animations (150ms ease-out)

**Visual States:**
```
┌─────────────────────────────────────┐
│ 📁 Projects              [expanded] │ ← Selected folder (accent bg)
│   📁 ChayCards                      │ ← Hover state (muted/50 bg)
│   📄 README.md            2.5 KB    │ ← File (gray icon + size)
│   📁 Archive                        │ ← Collapsed folder
└─────────────────────────────────────┘
```

**Icons:**
- Folders: `<Folder>` with custom color (user-defined)
- Files: `<FileText>` in muted foreground color
- Chevron: `<ChevronRight>` collapsed, `<ChevronDown>` expanded (3.5px size)

---

## Drag & Drop Interaction

### 1. Drag Initiation

**Desktop (Mouse):**
- Entire row is draggable (no separate drag handle)
- 8px movement threshold before drag starts (prevents accidental drags on click)

**Mobile (Touch):**
- Long-press (500ms) to start drag
- Haptic feedback on drag start (if available)
- Visual pulse animation during long-press countdown

### 2. During Drag

**Dragged Item:**
- Original item stays in place but fades to 30% opacity
- `pointer-events: none` prevents interaction
- Ghost follows cursor exactly (no offset)
- Ghost appearance:
  ```
  ┌──────────────────────────┐
  │ 📁 Project Folder        │ ← Semi-transparent (80% opacity)
  │                          │    Border + shadow for elevation
  └──────────────────────────┘
  ```

**Tree Behavior:**
- All items remain in original positions (NO reflow/shifting)
- Drop zones highlight dynamically as cursor moves

### 3. Drop Zones

**For Folders (3 zones):**
- **Top 15%** → "Drop BEFORE" (insert above target)
  - Visual: 2px blue line above folder row
- **Middle 70%** → "Drop INTO" (make child of target)
  - Visual: Entire folder row gets blue background (`bg-primary/40`)
  - + Ring highlight (`ring-4 ring-primary`)
- **Bottom 15%** → "Drop AFTER" (insert below target)
  - Visual: 2px blue line below folder row

**For Files (2 zones):**
- **Top 50%** → "Drop BEFORE"
  - Visual: 2px blue line above file row
- **Bottom 50%** → "Drop AFTER"
  - Visual: 2px blue line below file row
- No "into" zone (files cannot contain children)

**Drop Zone Visual Reference:**
```
Folder:
┌────────────────────┐
│ ← 15% "before"     │ ← Blue line here
├────────────────────┤
│                    │
│   70% "into"       │ ← Blue background + ring
│                    │
├────────────────────┤
│ ← 15% "after"      │ ← Blue line here
└────────────────────┘

File:
┌────────────────────┐
│                    │
│   50% "before"     │ ← Blue line at midpoint
│                    │
├────────────────────┤
│   50% "after"      │
└────────────────────┘
```

### 4. Hover-to-Expand (Deep Navigation)

**Behavior:**
- Hover over collapsed folder with "into" drop zone for **750ms**
- Folder auto-expands after timer completes
- Allows navigating into deep hierarchies while dragging

**Visual Feedback:**
- Subtle progress ring appears on folder icon (fills clockwise over 750ms)
- Timer resets if cursor leaves "into" zone

**Implementation Note:**
```typescript
// Track hover start time
const [hoverTarget, setHoverTarget] = useState<{ id: string; startTime: number } | null>(null);

// When dropZone === 'into' and hovering same folder for 750ms
useEffect(() => {
  if (hoverTarget && dropZone === 'into') {
    const elapsed = Date.now() - hoverTarget.startTime;
    const remaining = 750 - elapsed;

    if (remaining > 0) {
      timerId = setTimeout(() => {
        // Auto-expand folder
        setExpandedFolders(prev => new Set(prev).add(hoverTarget.id));
      }, remaining);
    }
  }
}, [hoverTarget, dropZone]);
```

---

## Backend Persistence (Option A)

### Flow

**On Drop:**
```
1. User drops item
2. Show loading spinner on item (inline, small, right side of row)
3. Call backend API:
   - insertBefore(itemId, targetId)
   - insertAfter(itemId, targetId)
   - makeChild(itemId, parentId, 'end')
4. Success:
   - Remove spinner
   - Item stays in new position
   - Tree re-fetches from backend to ensure sync
5. Failure:
   - Remove spinner
   - Item snaps back to original position (no state update occurred)
   - Show error toast: "Failed to move [item name]. [error message]"
```

**Why This Works:**
- ✅ UI always matches backend (no sync drift)
- ✅ Clear feedback (spinner = "saving...", no spinner = "saved")
- ✅ Automatic rollback (item never moved in state until backend confirms)
- ✅ Simple mental model
- ✅ No race conditions or optimistic update complexity

### API Calls

**Folders:**
```typescript
// Drop above folder
await documentsService.insertBefore(draggedFolderId, targetFolderId);

// Drop below folder
await documentsService.insertAfter(draggedFolderId, targetFolderId);

// Drop into folder
await documentsService.makeChild(draggedFolderId, targetFolderId, 'end');
```

**Files:**
```typescript
// Drop above file/folder
await documentsService.insertFileBefore(draggedFileId, targetId);

// Drop below file/folder
await documentsService.insertFileAfter(draggedFileId, targetId);

// Drop into folder
await documentsService.makeFileChild(draggedFileId, targetFolderId, 'end');
```

### Loading States

**Spinner Design:**
```tsx
{isMoving && (
  <div className="flex-shrink-0 mr-2">
    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
  </div>
)}
```

**State Management:**
```typescript
// Track which items are currently being moved
const [movingItems, setMovingItems] = useState<Set<string>>(new Set());

const handleDrop = async (itemId: string, targetId: string, zone: DropZone) => {
  // Mark item as moving
  setMovingItems(prev => new Set(prev).add(itemId));

  try {
    const result = await persistMove(itemId, targetId, zone);

    if (result.success) {
      // Re-fetch tree from backend to ensure sync
      await refetchTree();
    } else {
      // Show error toast
      showToast({ variant: 'destructive', title: 'Move failed', description: result.error });
    }
  } finally {
    // Remove loading state
    setMovingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }
};
```

---

## Multi-Select

### Behavior

**Selection:**
- Click item → Single select (clear previous selection)
- **Cmd+Click** (Mac) / **Ctrl+Click** (Windows) → Add to selection
- **Shift+Click** → Range select (from last selected to clicked item)
- Visual: Selected items have subtle blue background + checkmark icon

**Dragging Multiple Items:**
- Drag any selected item → All selected items move together
- Ghost shows count badge: "3 items"
- Drop behavior: All items inserted at target location in their current order

**Visual State:**
```
┌─────────────────────────────────────┐
│ ✓ 📁 Projects                       │ ← Selected (blue bg)
│   ✓ 📁 ChayCards                    │ ← Selected (blue bg)
│     📄 README.md            2.5 KB  │
│   📁 Archive                        │
└─────────────────────────────────────┘

While dragging:
┌──────────────────────────┐
│ 📁 2 folders             │ ← Multi-item ghost
│ Badge: "2 items"         │
└──────────────────────────┘
```

### Implementation

```typescript
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

const handleItemClick = (itemId: string, event: React.MouseEvent) => {
  if (event.metaKey || event.ctrlKey) {
    // Toggle selection
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  } else if (event.shiftKey) {
    // Range select (find items between last selected and current)
    // ... range selection logic
  } else {
    // Single select
    setSelectedItems(new Set([itemId]));
  }
};

const handleDragStart = (itemId: string) => {
  // If dragging selected item, drag all selected items
  const itemsToDrag = selectedItems.has(itemId)
    ? Array.from(selectedItems)
    : [itemId];

  setDraggingItems(itemsToDrag);
};

const handleDrop = async (targetId: string, zone: DropZone) => {
  // Move all dragging items to target
  for (const itemId of draggingItems) {
    await persistMove(itemId, targetId, zone);
  }
};
```

---

## Undo/Redo (Ctrl+Z)

### Command Pattern

**History Stack:**
```typescript
interface MoveCommand {
  type: 'move';
  itemId: string;
  fromParentId: string | null;
  fromOrder: number;
  toParentId: string | null;
  toOrder: number;
  timestamp: number;
}

const [history, setHistory] = useState<MoveCommand[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);
```

**Operations:**
```typescript
// After successful move
const recordMove = (command: MoveCommand) => {
  // Trim any "future" history if we're in middle of stack
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(command);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

// Undo (Ctrl+Z)
const undo = async () => {
  if (historyIndex < 0) return;

  const command = history[historyIndex];

  // Reverse the move
  await documentsService.moveToPosition(
    command.itemId,
    command.fromParentId,
    command.fromOrder
  );

  await refetchTree();
  setHistoryIndex(historyIndex - 1);
};

// Redo (Ctrl+Shift+Z or Ctrl+Y)
const redo = async () => {
  if (historyIndex >= history.length - 1) return;

  const command = history[historyIndex + 1];

  // Re-apply the move
  await documentsService.moveToPosition(
    command.itemId,
    command.toParentId,
    command.toOrder
  );

  await refetchTree();
  setHistoryIndex(historyIndex + 1);
};
```

**Keyboard Shortcuts:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo(); // Ctrl+Shift+Z
      } else {
        undo(); // Ctrl+Z
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      redo(); // Ctrl+Y (Windows convention)
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [history, historyIndex]);
```

**Visual Feedback:**
- Brief toast on undo: "Undid move of [item name]"
- Brief toast on redo: "Redid move of [item name]"
- Disable undo/redo menu items when not available (historyIndex checks)

---

## Context Menus (4 Locations)

### Purpose

The tab system requires context menus in **4 locations** to provide consistent file operations everywhere:
1. **Tree right-click** - Right-click on tree node
2. **Tree three-dot menu** - Dropdown menu button in tree
3. **Grid right-click** - Right-click on file/folder card in main view
4. **Grid three-dot menu** - Dropdown menu button on cards

All 4 locations share the same context menu items and handlers.

### Menu Items

**For Folders**:
```typescript
[
  { id: 'open', label: 'Open', icon: 'FolderOpen', onClick: openFolder },
  { id: 'open-new-tab', label: 'Open in New Tab', icon: 'Plus', onClick: openFolderInNewTab },
  { divider: true },
  { id: 'rename', label: 'Rename', icon: 'Edit', onClick: renameFolder },
  { id: 'change-color', label: 'Change Color', icon: 'Palette', onClick: changeColor },
  { divider: true },
  { id: 'delete', label: 'Delete', icon: 'Trash2', onClick: deleteFolder, dangerous: true }
]
```

**For Files**:
```typescript
[
  { id: 'open', label: 'Open', icon: 'ExternalLink', onClick: openFileInTab },
  { id: 'open-new-tab', label: 'Open in New Tab', icon: 'Plus', onClick: openFileInNewTab },
  { divider: true },
  { id: 'rename', label: 'Rename', icon: 'Edit', onClick: renameFile },
  { id: 'settings', label: 'Settings', icon: 'Settings', onClick: openSettings }, // If handler provides settingsComponent
  { divider: true },
  { id: 'delete', label: 'Delete', icon: 'Trash2', onClick: deleteFile, dangerous: true }
]
```

### Implementation Pattern

**Shared Handler Functions**:
```typescript
// DocumentsService provides these (same handlers for all 4 locations)
const openFileInTab = (file: StoredFile, activeTab: boolean = true) => {
  const handler = documentsService.getHandlerForFile(file);
  if (!handler) return;

  // Check if already open
  const existingTab = tabs.find(t => t.type === 'document' && t.fileId === file.id);
  if (existingTab) {
    if (activeTab) setActiveTabId(existingTab.id);
    return;
  }

  // Create new document tab
  const newTab = createDocumentTab(file, handler);
  setTabs([...tabs, newTab]);
  if (activeTab) setActiveTabId(newTab.id);
};

const openFileInNewTab = (file: StoredFile) => openFileInTab(file, true);

const openSettings = (file: StoredFile) => {
  const handler = documentsService.getHandlerForFile(file);
  if (!handler?.settingsComponent) return;

  // Open settings modal
  const SettingsComponent = PluginManager.getInstance().getComponent(handler.settingsComponent);
  showModal(<SettingsComponent file={file} />);
};
```

**Tree Context Menu Component**:
```tsx
// Right-click menu
<ContextMenu>
  <ContextMenuTrigger asChild>
    <TreeNode item={item} />
  </ContextMenuTrigger>
  <ContextMenuContent>
    {getContextMenuItems(item).map(menuItem => (
      menuItem.divider ? (
        <ContextMenuSeparator key={menuItem.id} />
      ) : (
        <ContextMenuItem
          key={menuItem.id}
          onClick={() => menuItem.onClick(item)}
          className={menuItem.dangerous ? 'text-destructive' : ''}
        >
          {menuItem.icon && <Icon name={menuItem.icon} className="mr-2" />}
          {menuItem.label}
        </ContextMenuItem>
      )
    ))}
  </ContextMenuContent>
</ContextMenu>

// Three-dot menu (dropdown)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {getContextMenuItems(item).map(menuItem => (
      menuItem.divider ? (
        <DropdownMenuSeparator key={menuItem.id} />
      ) : (
        <DropdownMenuItem
          key={menuItem.id}
          onClick={() => menuItem.onClick(item)}
          className={menuItem.dangerous ? 'text-destructive' : ''}
        >
          {menuItem.icon && <Icon name={menuItem.icon} className="mr-2" />}
          {menuItem.label}
        </DropdownMenuItem>
      )
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Visual Design

**Tree Context Menu Placement**:
- Right-click: Menu appears at cursor position
- Three-dot menu: Button appears on hover (right side of tree node)

**Grid Context Menu Placement**:
- Right-click: Menu appears at cursor position
- Three-dot menu: Button visible in top-right of card

**Consistent Styling**:
- Icons: 16px size, `mr-2` spacing
- Dangerous actions: Red text (`text-destructive`)
- Dividers: Between action groups
- Hover: Background highlight (`hover:bg-accent`)

---

## Mobile Adaptations

### Touch Gestures

**Long-Press to Drag:**
```typescript
const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
const [isPressing, setIsPressing] = useState(false);

const handleTouchStart = (e: TouchEvent, itemId: string) => {
  setIsPressing(true);

  // Start 500ms timer
  const timer = setTimeout(() => {
    // Trigger haptic feedback (if available)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Show visual pulse on item
    setDragPulseItem(itemId);

    // After pulse, start drag
    setTimeout(() => {
      startDrag(itemId);
    }, 150);
  }, 500);

  setPressTimer(timer);
};

const handleTouchEnd = () => {
  setIsPressing(false);
  if (pressTimer) {
    clearTimeout(pressTimer);
  }
};
```

**Long-Press Visual:**
```css
@keyframes press-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.95); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.pressing {
  animation: press-pulse 500ms ease-in-out;
}
```

**Touch-Optimized Drop Zones:**
- Increase drop zone sizes on touch devices:
  - Folders: Top 20%, Middle 60%, Bottom 20%
  - Files: Top 50%, Bottom 50%
- Larger tap targets (minimum 44px height maintained)

---

## Accessibility

### Keyboard Navigation

**Tree Navigation:**
- **Arrow Up/Down** - Move selection between items
- **Arrow Right** - Expand folder (if collapsed)
- **Arrow Left** - Collapse folder (if expanded) OR move to parent
- **Enter** - Select folder (show its contents in main pane)
- **Space** - Toggle multi-select on focused item

**Drag & Drop via Keyboard:**
- **Ctrl+X** - Cut selected items
- **Ctrl+V** - Paste items at focused location
- **Ctrl+Z** - Undo
- **Ctrl+Shift+Z** - Redo

### Screen Reader Support

**ARIA Labels:**
```tsx
<div
  role="tree"
  aria-label="Document navigation tree"
  aria-multiselectable="true"
>
  <div
    role="treeitem"
    aria-expanded={isExpanded}
    aria-selected={isSelected}
    aria-label={`${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`}
    aria-level={level + 1}
    aria-posinset={index + 1}
    aria-setsize={siblings.length}
  >
    {/* Item content */}
  </div>
</div>
```

**Live Regions for Feedback:**
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {moveStatus === 'moving' && `Moving ${itemName}...`}
  {moveStatus === 'success' && `Moved ${itemName} successfully`}
  {moveStatus === 'error' && `Failed to move ${itemName}`}
</div>
```

---

## Error Handling

### Backend Failures

**Scenarios:**
1. **Network timeout** - Show "Network error, please try again"
2. **Circular reference** - Show "Cannot move folder into its own subfolder"
3. **Not found** - Show "Item no longer exists, refreshing tree..."
4. **Validation error** - Show specific error message from backend

**Visual Feedback:**
```tsx
// Error toast (shadcn/ui toast component)
toast({
  variant: "destructive",
  title: "Failed to move item",
  description: error.message || "An unexpected error occurred",
  action: (
    <ToastAction altText="Try again" onClick={retryMove}>
      Try again
    </ToastAction>
  ),
});

// Item returns to original position (no state update on error)
// Tree stays in sync with backend
```

### Validation Rules

**Prevent Invalid Moves:**
- ❌ Cannot move folder into itself
- ❌ Cannot move folder into its own descendant (circular reference)
- ❌ Cannot drop file "into" another file
- ✅ Can move folder/file to any valid parent
- ✅ Can reorder items within same parent

**Backend Validation:**
```typescript
// DocumentsService.ts
async validateFolderMove(folderId: string, newParentId: string): Promise<boolean> {
  if (folderId === newParentId) return false; // Self

  // Check if newParent is descendant of folder
  const isDescendant = await this.isDescendant(newParentId, folderId);
  return !isDescendant;
}
```

---

## Performance Considerations

### Large Trees (1000+ items)

**Virtualization:**
- Use `react-window` or `@tanstack/react-virtual` for trees with >500 items
- Only render visible items + 10 item buffer above/below viewport
- Maintain scroll position during tree updates

**Memoization:**
```typescript
// Memoize tree flattening
const flattenedTree = useMemo(() => flattenTree(tree), [tree]);

// Memoize item IDs for drag context
const itemIds = useMemo(() => flattenedTree.map(item => item.id), [flattenedTree]);

// Memoize TreeItem component
const TreeItem = React.memo(({ item, ... }) => {
  // Component implementation
}, (prev, next) => {
  // Custom comparison for re-render optimization
  return (
    prev.item.id === next.item.id &&
    prev.isExpanded === next.isExpanded &&
    prev.isSelected === next.isSelected
  );
});
```

**Debounced Expand:**
- Expanding folder with many children? Show loading skeleton first
- Render children after 16ms frame to prevent janky animation

---

## Implementation Checklist

**Phase 1: Basic Tree Rendering** ✅
- [x] Display folders and files in hierarchy
- [x] Expand/collapse folders
- [x] Select folders
- [x] Clean styling with proper indentation

**Phase 2: Drag & Drop**
- [ ] Configure @dnd-kit/core with collision detection
- [ ] Implement drag initiation (8px threshold)
- [ ] Create drag ghost with item preview
- [ ] Calculate drop zones (15/70/15 for folders, 50/50 for files)
- [ ] Visual feedback (blue lines, folder highlighting)
- [ ] Implement hover-to-expand (750ms timer)

**Phase 3: Backend Persistence**
- [ ] Loading spinner on dragged item
- [ ] Call DocumentsService API methods
- [ ] Handle success (refetch tree)
- [ ] Handle errors (show toast, keep item in place)
- [ ] Error toast notifications

**Phase 4: Multi-Select**
- [ ] Cmd/Ctrl+Click to toggle selection
- [ ] Shift+Click for range selection
- [ ] Visual checkmarks on selected items
- [ ] Multi-item drag ghost with count badge
- [ ] Batch move all selected items

**Phase 5: Undo/Redo**
- [ ] Command history stack
- [ ] Record moves after successful persistence
- [ ] Implement undo (Ctrl+Z)
- [ ] Implement redo (Ctrl+Shift+Z, Ctrl+Y)
- [ ] Toast feedback on undo/redo

**Phase 6: Mobile**
- [ ] Long-press gesture (500ms)
- [ ] Haptic feedback on drag start
- [ ] Visual pulse during long-press
- [ ] Touch-optimized drop zones (20/60/20)

**Phase 7: Accessibility**
- [ ] Keyboard navigation (arrow keys)
- [ ] Cut/paste via Ctrl+X/Ctrl+V
- [ ] ARIA labels and roles
- [ ] Screen reader announcements
- [ ] Focus management

**Phase 8: Polish**
- [ ] Animations (expand/collapse, drag, drop)
- [ ] Virtualization for large trees (>500 items)
- [ ] Performance optimization (memoization)
- [ ] Error boundary for graceful failures

---

## Future Enhancements

**Nice-to-Have Features:**
- [ ] Drag & drop from external sources (files from desktop)
- [ ] Breadcrumb trail during drag (shows "Moving to: Projects > Archive")
- [ ] Preview pane when hovering over files during drag
- [ ] Batch operations (select multiple + right-click menu "Move to...")
- [ ] Search/filter tree (highlight matching items)
- [ ] Collapse all / Expand all buttons
- [ ] Recent items quick access

---

## References

**Libraries:**
- Drag & Drop: [@dnd-kit/core](https://docs.dndkit.com/) (when re-implemented)
- Icons: [lucide-react](https://lucide.dev/)
- UI Components: [shadcn/ui](https://ui.shadcn.com/)
- Virtualization: [@tanstack/react-virtual](https://tanstack.com/virtual/latest)

**Design Inspiration:**
- VS Code File Explorer
- Notion Sidebar
- macOS Finder (column view)
- Linear Issue Tree
