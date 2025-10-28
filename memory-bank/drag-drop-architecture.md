# Drag-Drop Architecture

## Core Pattern: Per-Item Drop Zones

**CRITICAL:** ChayCards uses **per-item drop zones**, NOT container-level gap detection. This matches production systems (dnd-kit, react-beautiful-dnd) and the tree implementation.

### Why Per-Item?

After multiple failed attempts at container-level gap detection with coordinate translation, we discovered that production systems don't detect gaps directly. They use:

1. **Per-item `useDrop`** - Each item is BOTH draggable AND droppable
2. **Collision detection** - React-dnd's closest-center algorithm determines which item is closest to mouse
3. **Proximity detection** - Each item calculates if mouse is on its left, center, or right
4. **No gap math** - Gaps are handled automatically by "closest item wins"

### The Problem with Container-Level

Container-level approaches fail because:
- **CSS Grid gaps are NOT DOM elements** - When you set `gap: 16px`, the browser creates empty space, but there's no HTML element there. No hover events fire when mouse is in a gap.
- Viewport → container coordinate translation is error-prone
- Calculating which gap the mouse is in requires complex geometry
- Cursors flicker due to coordinate mismatches

**The Solution:** Extend each item's drop zone INTO the gaps, so there's no "dead space". The gap is covered by overlapping drop zones from adjacent items.

### The Per-Item Solution

Each item detects if it's the closest to the mouse, and shows indicators accordingly:

```
Mouse moves horizontally:
┌────┐  gap  ┌────┐  gap  ┌────┐
│ F1 │  →    │ F2 │       │ F3 │
└────┘       └────┘       └────┘

In gap between F1 and F2:
- F1's center: 50px from mouse
- F2's center: 60px from mouse
→ F1 is closest → F1 shows "right" indicator

Mouse moves slightly right:
- F1's center: 70px from mouse
- F2's center: 40px from mouse ← NOW CLOSEST
→ F2 is closest → F2 shows "left" indicator
```

**The "gap" cursor is actually shown by the closest folder!**

## Implementation Details

### Tree (Vertical) vs Grid (Horizontal)

Both use the same per-item pattern, adapted for layout direction:

| Aspect | Tree (Vertical) | Grid (Horizontal) |
|--------|----------------|-------------------|
| **Zones** | Top 25%, Middle 50%, Bottom 25% | Left 30%, Middle 40%, Right 30% |
| **Insert before** | Top zone → line cursor above | Left zone → line cursor on left edge |
| **Drop into** | Middle zone → highlight folder | Middle zone → highlight folder |
| **Insert after** | Bottom zone → line cursor below | Right zone → line cursor on right edge |
| **Hook** | `useDrop` in TreeNodeRenderer | `useDrop` in FolderCard |
| **State** | Local `dropCursor` state | Local `dropIndicator` state |
| **Rendering** | Inside TreeNode (lines 600-646) | Inside FolderCard |

### Horizontal Zone Detection (Grid) - Extended Drop Zones

**CRITICAL:** To detect gaps, each folder's drop zone extends **into the gaps**:

```typescript
const cardRect = cardRef.current.getBoundingClientRect();
const mouseX = monitor.getClientOffset().x;

// EXTENDED DROP ZONE: Extend card's drop zone into the gaps
// CSS Grid gap-4 = 16px, so each card "owns" half of the gaps on each side
const GAP_SIZE = 16; // CSS Grid gap-4
const HALF_GAP = GAP_SIZE / 2;

// Extended bounds - includes half of gaps on each side
const extendedLeft = cardRect.left - HALF_GAP;
const extendedRight = cardRect.right + HALF_GAP;
const extendedWidth = extendedRight - extendedLeft;

const relativeX = mouseX - extendedLeft;

// Detect zones relative to extended bounds
// LEFT GAP ZONE (0 to HALF_GAP): Mouse in the gap to the left of this card
if (relativeX < HALF_GAP) {
  setDropIndicator('left');
}
// RIGHT GAP ZONE (extendedWidth - HALF_GAP to extendedWidth): Mouse in the gap to the right
else if (relativeX > extendedWidth - HALF_GAP) {
  setDropIndicator('right');
}
// VISUAL CARD ZONE: Mouse over the actual visible card
else {
  // Calculate position relative to visual card bounds (not extended bounds)
  const visualRelativeX = mouseX - cardRect.left;
  const visualWidth = cardRect.width;

  // 30% left zone on visual card = insert before
  if (visualRelativeX < visualWidth * 0.3) {
    setDropIndicator('left');
  }
  // 30% right zone on visual card = insert after
  else if (visualRelativeX > visualWidth * 0.7) {
    setDropIndicator('right');
  }
  // 40% middle zone on visual card = drop into
  else {
    setDropIndicator('highlight');
  }
}
```

**Why This Works:**
- Drop zones overlap in gaps - no "dead space"
- Cursor renders at card edge (`left: -3px`, `right: -3px`), visually appearing in the gap
- React-dnd's collision detection determines which folder is closest
- Matches tree pattern (tree extends zones into padding, grid extends into gaps)

### Visual Feedback: Static During Drag

**IMPORTANT:** The grid does NOT reorder during drag. Only visual indicators show:

- **Dragged folder:** Grays out (`opacity-40`) in both grid AND tree (cross-component consistency)
- **Grid layout:** Stays completely static
- **Closest folder:** Shows ONE indicator (left cursor, right cursor, or highlight)
- **All other folders:** No indicators

This matches the tree's behavior and prevents the "moving target" UX problem.

### Backend Integration

On drop, the `dropIndicator` value determines the operation:

```typescript
if (dropIndicator === 'highlight') {
  // Drop INTO target folder
  parentId = targetFolder.id
  index = 0 (first child)
}

if (dropIndicator === 'left') {
  // Insert BEFORE target folder
  parentId = currentParentId
  index = targetFolder.index
}

if (dropIndicator === 'right') {
  // Insert AFTER target folder
  parentId = currentParentId
  index = targetFolder.index + 1
}
```

### Optimistic Updates

Optimistic updates happen **after drop**, not during hover:

1. **During hover:** Only visual indicators show (no tree mutation)
2. **On drop:** Immediately update `localTree` state (optimistic)
3. **Backend call:** Persist to database async
4. **On failure:** Revert `localTree` to previous state

This is safe because:
- Grid was static during drag (user saw exactly where they were dropping)
- Update happens after user's intentional drop action
- Revert is simple (just restore previous tree)

### Collision Detection Algorithm

React-dnd uses **closest-center** algorithm by default:

1. Calculate distance from dragged item's center to each droppable item's center
2. The droppable with the smallest distance gets `isOver: true`
3. Only that droppable's hover callback fires
4. Only that droppable renders its indicator

This means:
- Only ONE folder shows an indicator at a time
- The "closest" folder is determined automatically
- No manual "which gap am I in?" calculations needed

## Edge Cases

### Row Boundaries

Handled automatically by per-item zones:
- **Start of row:** Leftmost folder's left zone
- **End of row:** Rightmost folder's right zone

No special detection needed - the leftmost/rightmost folders just happen to be closest when mouse is at row edges.

### Parent Navigation Card

Special case handling:
- **Left zone:** DISABLED (can't insert before parent card)
- **Middle zone:** Drop INTO parent (navigate up)
- **Right zone:** Insert at index 0 (first child of current folder)

### Cross-Component Drops

Tree → Grid, Grid → Tree, Breadcrumb → Grid all work because:
- All drag sources use `type: 'FOLDER'`
- All drop targets `accept: 'FOLDER'`
- Backend receives same `{ parentId, index }` format

## Common Mistakes to Avoid

❌ **Container-level gap detection** - Don't calculate gaps geometrically
❌ **Coordinate translation** - Don't convert viewport → container coords
❌ **Optimistic reordering during hover** - Don't update tree on hover
❌ **Multiple cursors** - Don't render cursors for all folders
❌ **Hardcoded row detection** - Don't assume grid column count

✅ **Per-item drop zones** - Each folder has `useDrop`
✅ **Card-relative positioning** - Indicators positioned relative to card
✅ **Static during drag** - Grid doesn't move, only indicators show
✅ **Single indicator** - Only closest folder shows indicator
✅ **Dynamic row handling** - Works with any grid wrapping

## File Locations

- **Tree implementation:** `src/plugins/core-documents/components/FolderTree.tsx`
  - TreeNodeRenderer lines 312-538 (useDrop with vertical zones)
  - Cursor rendering lines 600-646 (inside TreeNode)

- **Grid implementation:** `src/plugins/core-documents/components/FileBrowser.tsx`
  - FolderCard lines 198-244 (useDrop with horizontal zones)
  - Indicator rendering inside FolderCard

## References

- **dnd-kit documentation:** Per-item drop zones with SortableContext
- **react-beautiful-dnd:** Optimistic updates in onDragEnd
- **React DnD:** Closest-center collision detection algorithm
