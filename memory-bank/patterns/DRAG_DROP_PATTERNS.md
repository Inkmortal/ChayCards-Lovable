# Drag-and-Drop Patterns

Comprehensive patterns and best practices for implementing drag-and-drop functionality in the ChayCards application.

## React-Arborist Padding Rules (CRITICAL)

### The Problem

When using react-arborist (or any virtualized list with absolute positioning), **CSS padding on the list container breaks cursor positioning calculations**.

**Symptom**: Drag-and-drop cursor appears offset from the correct position (e.g., 8px too high), making it look closer to the bottom folder instead of being centered.

### Root Cause Analysis

React-arborist calculates cursor position using this formula:
```
cursor_position = rowHeight * index + paddingTop
```

**The calculation assumes `paddingTop` prop is the ONLY padding.**

When you add CSS padding (e.g., `className="p-2"` which adds 8px), the library doesn't account for it:

1. **React-arborist calculation**: `cursor_position = 36 * 1 + 8 = 44px`
2. **Actual visual rendering**: Content starts at `44px + 8px CSS padding = 52px`
3. **Result**: Cursor drawn at 44px, but visually should be at 52px → **8px offset**

The cursor component uses **absolute positioning** and doesn't inherit CSS padding from the container, so it relies entirely on the prop-based calculation.

### Mathematical Breakdown

```typescript
// Given:
rowHeight = 36px
index = 1 (second row)
paddingTop prop = 8px
className = "p-2" (adds 8px CSS padding)

// React-arborist cursor calculation:
cursor_y = 36 * 1 + 8 = 44px

// Actual row rendering:
row_top = 44px (prop padding) + 8px (CSS padding) = 52px

// Visual result:
// Cursor drawn at 44px ─────────────┐
//                                   │ 8px gap (THE BUG)
// Row actually at 52px ─────────────┘
```

### The Solution

**Let react-arborist control ALL spacing through props only.** Remove CSS padding from the container.

```typescript
// ❌ WRONG: CSS padding conflicts with props
<Tree
  className="p-2"      // Adds 8px CSS padding
  paddingTop={8}       // Adds 8px prop padding
  // Result: 16px total, but cursor calc only uses 8px → OFFSET
/>

// ✅ CORRECT: Only use react-arborist props for padding
<Tree
  paddingTop={8}       // Single source of truth
  paddingBottom={8}
  // No CSS padding classes!
/>
```

### Real-World Fix

**File**: `src/plugins/core-documents/components/FolderTree.tsx`

```typescript
// BEFORE (broken):
<Tree
  className="flex-1 overflow-auto p-2 rounded-lg"
  // ... other props
/>

// AFTER (fixed):
<Tree
  className="flex-1 overflow-auto rounded-lg"  // Removed p-2
  paddingTop={8}
  paddingBottom={8}
  // ... other props
/>
```

**Result**: Cursor now properly centered between folders during drag operations.

### Key Principles

1. **Let the library control spacing** - Use `paddingTop`/`paddingBottom` props exclusively
2. **No CSS padding on container** - `className` should not include `p-*`, `px-*`, `py-*` classes
3. **Absolute positioning caveat** - Cursor component doesn't inherit container padding
4. **Calculation assumptions** - Library assumes props are the only spacing source

### When This Pattern Applies

This pattern is critical for:
- **Virtualized list libraries**: react-window, react-virtualized, react-arborist
- **Absolute positioning overlays**: Any component using absolute positioning for cursors, indicators, or feedback elements
- **Position calculations**: Libraries that calculate positions based on prop values
- **Drag-and-drop implementations**: Visual feedback components that must align with list items

### Common Mistake

```typescript
// This looks fine visually but breaks cursor positioning:
<Tree
  className="p-4 bg-background border rounded-lg"
  paddingTop={16}
  paddingBottom={16}
/>
// The p-4 adds 16px CSS padding that cursor calculation ignores
// Result: Cursor offset by 16px
```

**Fix**: Move background and border to a wrapper div, keep Tree padding-free:
```typescript
<div className="bg-background border rounded-lg">
  <Tree
    paddingTop={16}
    paddingBottom={16}
  />
</div>
```

### Pattern Benefits

- ✅ Visual rendering matches mathematical calculations exactly
- ✅ Cursor appears properly centered between items
- ✅ No confusing visual offsets during drag operations
- ✅ Predictable behavior across all tree depths
- ✅ Consistent with library design assumptions

### Debug Checklist

If you see drag cursor offset issues:

1. **Check for CSS padding** - Look for `p-*`, `px-*`, `py-*` classes on Tree component
2. **Verify prop usage** - Confirm `paddingTop`/`paddingBottom` props are set
3. **Calculate expected position** - Use formula: `rowHeight * index + paddingTop`
4. **Inspect cursor element** - Check if it uses absolute positioning
5. **Test at different depths** - Verify offset is consistent across tree levels

### References

- **Implementation**: `src/plugins/core-documents/components/FolderTree.tsx` line 291
- **Date Fixed**: 2025-10-15
- **Related Issue**: Drag-and-Drop Cursor Position Fix

---

## Other Drag-and-Drop Patterns

### Backend-First Pattern (Option A)

When implementing drag-and-drop with backend persistence:

1. **User drags item** → Show loading spinner on dragged item
2. **Call backend API** → Await response
3. **Success** → Refetch tree data, UI updates with confirmed state
4. **Failure** → Show error toast, tree stays unchanged (no snap-back)

**Key benefits**:
- No optimistic updates to manage
- Single source of truth (backend)
- No race conditions
- No complex rollback logic

### Common Pitfalls

1. **Optimistic updates** - Hard to get right, prone to race conditions
2. **State syncing with useEffect** - Creates dependency cycles
3. **Full tree refetches** - Inefficient, causes flickering
4. **Mixed local and server state** - Leads to inconsistencies

### Best Practices

- **Whole-row draggable** - No separate drag handle required
- **Drop zones**: 15/70/15 for folders (before/into/after)
- **Hover-to-expand**: 750ms delay with progress indicator
- **Visual feedback**: Borders, backgrounds, opacity changes
- **Loading states**: Show spinner during backend operations
- **Error handling**: Clear error messages, no silent failures

---

## Folder Sidebar Tree - Complete Implementation (October 2025)

This section documents the complete folder tree implementation in the Documents plugin, serving as a reference for future drag-and-drop features.

### Architecture Overview

**Component Structure**:
- `FolderTree.tsx` - React-arborist integration, drag-and-drop handling
- `FileBrowser.tsx` - ID translation layer, folder creation dialog
- `DocumentsService.ts` - Backend persistence, schema migrations
- `useDocuments.ts` - React hooks for folder data

**Key Pattern**: Virtual Tree with ID Translation

The implementation uses a "virtual root node" pattern where `"__ALL_FILES__"` exists only in the UI layer. An ID translation layer at the component boundary prevents virtual IDs from leaking into the database.

```typescript
// Virtual node exists in UI only
const virtualTree = [
  {
    id: '__ALL_FILES__',
    name: 'All Files',
    type: 'folder',
    children: actualFolders  // Real database folders
  }
];

// Translation happens at component boundary (FileBrowser.tsx:150)
const handleFolderMove = async (draggedId, operation) => {
  const actualParentId = operation.parentId === '__ALL_FILES__'
    ? null  // Convert virtual ID to database null
    : operation.parentId;

  await documentsService.moveFolder(draggedId, {
    parentId: actualParentId,  // Only real IDs reach the database
    index: operation.index
  });
};
```

### Data Integrity Approach

**Philosophy**: Fix corrupted data at source with migrations, not with read-time normalization.

**Problem Encountered**: Early implementation allowed `parentId = "__ALL_FILES__"` to be saved to the database before the ID translation layer was added.

**Wrong Approach** (initially tried):
```typescript
// ❌ Hiding corruption with normalization
private normalizeParentId(id: string | null): string | null {
  if (id === '__ALL_FILES__') return null;  // Fallback for bad data
  return id;
}
```

**Correct Approach** (implemented):
```typescript
// ✅ Fix corruption with migration (DocumentsService.ts:1548-1584)
private async migrateToV4(): Promise<void> {
  const folders = await this.storage.get<Folder[]>(this.FOLDERS_KEY);

  let fixedCount = 0;
  for (const folder of folders) {
    if (folder.parentId === '__ALL_FILES__') {
      folder.parentId = null;
      folder.updatedAt = Date.now();
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    await this.storage.set(this.FOLDERS_KEY, folders);
    console.log(`Fixed ${fixedCount} folders with corrupted data`);
  }

  await this.storage.set(STORAGE_KEYS.SCHEMA_VERSION, 4);
}
```

**Defense in Depth**:
1. **V4 Migration** - Fixes past mistakes (one-time cleanup)
2. **ID Translation** - Prevents future mistakes (ongoing protection)
3. **No Normalization Fallbacks** - Bugs surface immediately (fail fast)

### UI Polish Features

#### 1. Folder Alignment (FolderTree.tsx:281)

**Problem**: Folders with children (chevron) misaligned with folders without children (spacer).

**Root Cause**: Chevron button width (p-0.5 + w-3.5 = 18px) ≠ Spacer width (w-4 = 16px)

**Fix**: Changed spacer to exact match:
```typescript
// Before: <div className="w-4 flex-shrink-0" />
// After:  <div className="w-[18px] flex-shrink-0" />
```

#### 2. Reactive Tree Updates (FileBrowser.tsx:275)

**Problem**: New folders didn't appear until page refresh.

**Root Cause**: No refetch trigger after successful creation.

**Fix**: Increment refetch key after operations:
```typescript
if (result.success) {
  setTreeRefetchKey(prev => prev + 1);  // Trigger useUnifiedTree refetch
  setCreateFolderOpen(false);
  setNewFolderName('');
  setNewFolderColor(defaultFolderColor);
}
```

**Pattern**: Same approach used for drag-and-drop operations.

#### 3. HSL Color Picker (FileBrowser.tsx:406-438)

**Problem**: Native `<input type="color">` provides poor UX and doesn't match theme plugin aesthetics.

**Solution**: Integrated HslColorPicker from react-colorful with Popover component:

```typescript
// Helper functions for color conversion (lines 20-72)
const hslStringToObject = (hsl: string): { h: number; s: number; l: number } => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  return { h, s, l };
};

const hslObjectToString = (color: { h: number; s: number; l: number }): string => {
  return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`;
};

const hslToHex = (hsl: string): string => {
  // Full HSL → RGB → Hex conversion
  // Stores colors as hex in database for compatibility
};

// UI Implementation
<Popover
  trigger={
    <button style={{ backgroundColor: `hsl(${newFolderColor})` }}>
      Click to choose color
    </button>
  }
>
  <HslColorPicker
    color={hslStringToObject(newFolderColor)}
    onChange={(color) => setNewFolderColor(hslObjectToString(color))}
  />
</Popover>
```

#### 4. Theme-Aware Defaults (FileBrowser.tsx:113-119)

**Problem**: Hardcoded blue default didn't adapt to theme changes.

**Solution**: Read `--primary` CSS variable for default color:
```typescript
const defaultFolderColor = React.useMemo(() => {
  const primaryHsl = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim();
  return primaryHsl || '221 83% 53%'; // Fallback to blue-500 HSL
}, []);
```

**Storage Format**: Colors stored as hex in database, converted to/from HSL for UI manipulation.

### Drag-and-Drop Implementation

**Library**: react-arborist (provides virtualized tree with built-in drag-and-drop)

**Visual Feedback**:
- Custom cursor component with blue line and circle indicator
- Smooth 150ms transition when cursor moves
- Drop zone highlights (opacity changes, ring effects)
- Processing state with subtle opacity during saves

**Backend Persistence**:
```typescript
const handleMove = async ({ dragIds, parentId, index }) => {
  try {
    await onMove(dragIds[0], { parentId, index });
    // Success: tree stays as-is (optimistic UI update)
  } catch (error) {
    // Failure: react-arborist reverts automatically
    console.error('Move failed, reverted:', error);
  }
};
```

**Pattern**: Silent error handling with automatic revert (no toast spam during drag operations).

### Key Files and Line Numbers

1. **FolderTree.tsx** (323 lines)
   - React-arborist integration
   - Custom cursor component (lines 22-63)
   - Tree node renderer (lines 191-312)
   - Vertical hierarchy lines (lines 238-261)

2. **FileBrowser.tsx** (significant updates)
   - ID translation layer (line 150)
   - HSL color helpers (lines 20-72)
   - Color picker UI (lines 406-438)
   - Refetch trigger (line 275)
   - Default theme color (lines 113-119)

3. **DocumentsService.ts**
   - V4 migration (lines 1548-1584)
   - Cleaned normalizeParentId (lines 1320-1328)

4. **useDocuments.ts**
   - Cleaned normalizeId helper (lines 70-78)
   - Removed debug logging

### Known Limitations

1. **No Magnetic Top/Bottom Dropping**
   - React-arborist doesn't support "stick to edges" behavior out of the box
   - Would require custom drop zone detection
   - Future enhancement

2. **No Hover-to-Expand**
   - Folders don't auto-expand when dragging over them
   - React-arborist supports this but not implemented yet
   - Future enhancement

### Lessons Learned

1. **Virtual nodes need boundaries** - ID translation at component boundaries prevents pollution
2. **Migrations beat normalization** - Fix corrupt data once, don't hide it forever
3. **CSS padding breaks positioning** - Virtualized lists need prop-based spacing only
4. **Theme integration matters** - Default colors should adapt to active theme
5. **Refetch patterns** - Incrementing keys is cleaner than manual state updates
6. **HSL for UX, hex for storage** - HSL easier to manipulate in UI, hex more compatible for storage

### References

- **Implementation Date**: October 15-17, 2025
- **Total Lines Added**: ~500 across 4 files
- **Libraries**: react-arborist, react-colorful
- **Related Docs**: See "React-Arborist Padding Rules" section above for critical CSS pattern
