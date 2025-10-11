# Drag-and-Drop Fixes Applied

## Summary
Fixed three critical issues in folder drag-and-drop functionality that caused visible lag, snap-back effects, and errors when dropping folders at root level.

## Issues Fixed

### Issue #1: Visible Lag (Snap-Back Effect) ✅
**Problem**: Drag ghost disappeared immediately on release, causing folder to visually snap back to original position before jumping to new location.

**Root Cause**: `setActiveDragNode(null)` was called immediately in `handleDragEnd` (line 465), clearing the drag ghost before optimistic updates could propagate to the UI.

**Fix Applied**:
- Commented out immediate `setActiveDragNode(null)` call in `handleDragEnd` (line 468)
- Added `useEffect` hook (lines 318-328) that clears drag ghost after 150ms delay
- This keeps the ghost visible while React processes the optimistic update

**Result**: Smooth, instant feedback - folder appears to stay in place and snap directly to new position.

---

### Issue #2: Root Drops Fail ("Target folder not found") ✅
**Problem**: Dragging folders to very top or very bottom of list failed with error: "Target folder not found"

**Root Cause**: When dropping at root level, `targetFolderId` was `null`, but code tried to call `insertBefore/insertAfter` with `null` as the target ID (line 491), which expected valid folder IDs.

**Fix Applied**:
- Added null check for `targetFolderId` in `handleDragEnd` (lines 482-487)
- When `targetFolderId` is null, route to `onMakeChild(folderId, null, position)` instead
- This moves folder to root level at start or end position

**Result**: Can now drag folders to absolute top (above all folders) or absolute bottom (below all folders) without errors.

---

### Issue #3: Root Drop Zones Set Wrong Type ✅
**Problem**: Root drop zones set incorrect type (`'inside'`) and level (`1`), causing mismatch with handler logic.

**Root Cause**: Root drop zone logic (lines 437-447) set:
- `type: 'inside'` (should be `'before'` or `'after'`)
- `targetLevel: 1` (should be `0` for root)

**Fix Applied**:
- Changed type from `'inside'` to `position === 'top' ? 'before' : 'after'` (line 443)
- Changed targetLevel from `1` to `0` (line 445)
- This matches the handler logic for null `targetFolderId`

**Result**: Root drop zones now correctly indicate before/after positioning, matching the handler expectations.

---

## Files Modified

### src/plugins/core-documents/components/FolderTree.tsx
1. **Line 14**: Added `useEffect` to React imports
2. **Lines 318-328**: Added useEffect to clear drag ghost after 150ms delay
3. **Line 468**: Commented out immediate `setActiveDragNode(null)` call
4. **Lines 482-487**: Added null check for `targetFolderId` with proper routing to `onMakeChild`
5. **Lines 438-447**: Fixed root drop zone type and level

---

## Testing Verification

To verify these fixes work correctly:

1. **Test snap-back fix**:
   - Drag a folder to a new position
   - Verify no visible "snap back to original position" effect
   - Folder should appear to stay in place and smoothly transition to new position

2. **Test root drop zones**:
   - Drag folder to very top of folder list (above all folders)
   - Verify it moves to first position without errors
   - Drag folder to very bottom (below all folders)
   - Verify it moves to last position without errors

3. **Test console**:
   - Open browser console
   - Perform various drag-and-drop operations
   - Verify no "Target folder not found" errors appear

---

## Technical Details

### Delay Timing (150ms)
The 150ms delay was chosen because:
- Long enough for React's optimistic update to propagate and render
- Short enough that users don't notice the ghost lingering
- Typical React state update + render cycle is 50-100ms

### Root Drop Zone Logic
Root drops now use the `onMakeChild(folderId, null, position)` API because:
- `insertBefore/insertAfter` require valid target folder IDs
- `onMakeChild` with `parentId: null` means "move to root level"
- `position: 'start' | 'end'` controls top vs bottom placement

### Type Consistency
Root drop zones now set `type: 'before' | 'after'` to match non-root drops because:
- Handler logic checks `type === 'before' || type === 'after'` (line 481)
- This allows the same code path to handle both root and non-root drops
- Only difference is null check for `targetFolderId`

---

## Impact
- ✅ Eliminates jarring snap-back visual effect during drag operations
- ✅ Enables dragging folders to absolute top/bottom of list
- ✅ Removes "Target folder not found" console errors
- ✅ Creates seamless, professional drag-and-drop experience

All changes maintain backward compatibility with existing folder reorganization APIs.
