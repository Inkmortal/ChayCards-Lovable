# Active Context

## Current Work Focus

### ✅ Foundation Infrastructure (COMPLETE - October 6, 2025)
1. ~~Setting up dual-platform support (Electron + Web)~~ ✅ Complete
2. ~~Multi-platform architecture analysis~~ ✅ Complete
3. ~~Capacitor mobile integration~~ ✅ Complete
4. ~~**Plugin System Infrastructure**~~ ✅ **COMPLETE** (October 6, 2025)
   - ~~PluginManager with dependency resolution~~ ✅ Complete (687 lines)
   - ~~Component/service namespacing~~ ✅ Complete
   - ~~Event bus for plugin communication~~ ✅ Complete
   - ~~Region system (header, sidebar, main, footer)~~ ✅ Complete
   - ~~Auto-navigation generation~~ ✅ Complete
   - ~~`publicSafe` metadata for anonymous users~~ ✅ Complete
   - ~~User plugin preferences (enabled_plugins)~~ ✅ Complete
   - ~~HMR support for development~~ ✅ Complete
5. ~~**Theme System with Pure Database Architecture**~~ ✅ **COMPLETE** (October 5, 2025)
   - ~~7 theme plugins (Catppuccin, Dracula, Gruvbox, etc.)~~ ✅ Complete
   - ~~Pure database storage (no memory leaks)~~ ✅ Complete
   - ~~Async service pattern~~ ✅ Complete
   - ~~Custom theme builder with live preview~~ ✅ Complete
   - ~~Favorites management~~ ✅ Complete
6. ~~**Core UI Plugin**~~ ✅ **COMPLETE** (October 6, 2025)
   - ~~32 shared components~~ ✅ Complete
   - ~~Layout, forms, data display, feedback~~ ✅ Complete
   - ~~All using semantic theme variables~~ ✅ Complete
7. ~~**Storage Infrastructure**~~ ✅ **COMPLETE** (October 1, 2025)
   - ~~SQLiteAdapter for Electron~~ ✅ Complete
   - ~~PostgreSQLAdapter via Cloudflare Tunnel~~ ✅ Complete
   - ~~Pure database patterns established~~ ✅ Complete
   - ~~Plugin storage namespacing~~ ✅ Complete
8. ~~**Electron SQLite Development Setup**~~ ✅ **COMPLETE** (September 30, 2025)
   - ~~Windows one-click launcher with auto-rebuild~~ ✅ Complete
   - ~~Local profile management~~ ✅ Complete
   - ~~IPC storage communication~~ ✅ Complete

### 🎯 Current Phase: Feature Plugins
1. **File Storage Implementation - Phase 1** 🔴 **IMPLEMENTATION PLAN READY** (October 7, 2025)
   - **Status**: Complete implementation plan created with all 12 files identified
   - **Problem**: Current storage only handles JSON - binary files get corrupted
   - **Solution**: Files stored AS PROPERTIES of entities, not as separate storage
   - **Key Innovation**: Database foreign keys prevent orphaned files (CASCADE DELETE)
   - **Architecture**:
     - Unified API: `set(key, data, files)` and `get(key)` returns `{ data, files }`
     - Files attach to entities in single atomic operation
     - Delete entity → files cascade automatically (database enforced)
     - User scoping via composite keys `(storage_key, field_name, user_id)`
   - **Platform Strategy**:
     - Electron: Files in userData/files/ with SHA-256 deduplication + SQLite metadata
     - Cloud: PostgreSQL BYTEA (Phase 1), migrate to S3 (Phase 3)
     - Local: Unlimited (disk space limit), Cloud: Payment plan quotas
   - **Implementation Scope** (12 files total):
     - Core Storage (7 files): StorageAdapter interface, SQLite/PostgreSQL adapters, IPC handlers, server endpoints
     - Plugins (5 files): DocumentsService, SettingsService, ThemeService, DemoDataService, DemoPage
     - All `storage.get()` calls updated to use `result?.data` pattern
     - No backward compatibility - clean slate approach
   - **See**: `/memory-bank/docs/FILE_STORAGE_SPEC.md` for complete specification
2. **Documents Plugin Phase 1** ✅ **COMPLETE** (October 6, 2025)
   - Core service architecture with dual-storage abstraction (772 lines)
   - Observer pattern with React hooks for state management
   - FileHandler registry for plugin extensibility
   - Folder hierarchy with validation and circular reference prevention
   - All critical fixes applied (initialization state, folder validation, type definitions)
   - TypeScript compiles with zero errors
   - ⚠️ **Awaiting file storage**: Can't store actual files yet (binary data corrupts)
3. **Game Plugin Design & Architecture** - Planning required
   - Task-to-game-time conversion mechanics
   - Godot server integration strategy
   - Plugin interface design
4. **Tasks Plugin** (core-tasks) - Ready to implement
   - Task list management
   - Priority/category system
   - Game integration hooks
5. **Knowledge Plugin** (core-knowledge) - Ready to implement
   - Flashcard generation from documents
   - Spaced repetition system
   - Progress tracking

**Current Status**: Foundation infrastructure 100% complete - all plugin systems, storage patterns, and core components operational. Ready to build feature plugins using established patterns.

- **Implementation Strategy**: "Vertical Slice First" - build minimal working system end-to-end
- **First Plugin**: Theme system (core-theme) with 7 theme variants ✅ Complete
- **Storage**: SQLite working in Electron with automatic better-sqlite3 rebuild ✅ Complete
- **User Flow**: Smart routing based on platform and setup completion ✅ Complete
- **Visual Design**: Duolingo-inspired aesthetic (rounded, chunky buttons, clean typography)
- **Deployment Strategy**: Local-first for desktop, cloud-first for web, future mobile support

## Recent Changes

### Navigation Tree Drag & Drop Library Research - 2025-10-09
**Context Research Complete**: Comprehensive analysis of modern navigation tree libraries and implementation patterns for folder/file drag & drop.

**Current State**:
- Simple FolderTree component (202 lines) - recently nuked broken drag & drop
- Clean slate: Basic rendering, expand/collapse, selection only
- Complete UX spec in DOCUMENTS_PLUGIN_SPEC.md with cross-panel drag & drop requirements
- Requirements: "Option A" pattern (show spinner → backend call → success/failure, NOT optimistic updates)

**Top Library Recommendations**:

1. **react-arborist** (PRIMARY RECOMMENDATION)
   - Complete tree view component for VSCode/Finder/Explorer equivalents
   - Built-in: drag-drop, multi-selection, inline editing, virtualization
   - Performance-optimized for large trees with efficient rendering
   - Active community, comprehensive docs: https://react-arborist.netlify.app/
   - Perfect fit for "Option A": `onMove` callback provides clean entry point for backend mutation
   - Cons: Higher-level abstraction (less granular control), steeper learning curve
   - Use Case: Feature-rich file explorers where complete solution preferred

2. **Pragmatic Drag and Drop** (Atlassian) (SECONDARY RECOMMENDATION)
   - Newest library (2024), successor to react-beautiful-dnd
   - Low-level building blocks, framework-agnostic (vanilla JS + TypeScript)
   - Lightweight, modern approach with excellent primitives
   - Tree examples: https://atlassian.design/components/pragmatic-drag-and-drop/examples
   - Cons: Requires building tree logic yourself, more boilerplate
   - Use Case: Maximum control and custom D&D interactions beyond simple trees

3. **@dnd-kit** (NOT RECOMMENDED for our use case)
   - 10kb minified, supports pointer/mouse/touch/keyboard
   - Highly configurable, minimal re-renders
   - We previously had issues: optimistic updates causing snap-back, state sync race conditions
   - Cons: Only one-level lists by default, requires custom tree implementation
   - Prone to state management complexity (our experience confirms)
   - Use Case: General D&D tasks, not specialized for trees

4. **@minoru/react-dnd-treeview**
   - Specialized for tree D&D, built on react-dnd
   - Simpler API with `onDrop` callback providing new data
   - Render props for customization
   - Cons: Less feature-rich than react-arborist, depends on older react-dnd ecosystem
   - Use Case: Simple tree structures needing quick solution

**Implementation Approach for "Option A" Backend-First Pattern**:

**Recommended Flow (using react-arborist)**:
```typescript
// 1. User drags folder/file
// 2. onMove callback triggers immediately
const moveNodeMutation = useMutation({
  mutationFn: moveNodeApiCall,
  onSuccess: () => {
    queryClient.invalidateQueries(['folderTree']); // Refetch from backend
  },
  onError: (error) => {
    toast.error('Failed to move folder');
  },
  onSettled: () => {
    setMovingNodeId(null); // Clear loading state
  }
});

const handleMove = ({ draggedIds, parentId, index }) => {
  setMovingNodeId(draggedIds[0]); // Show spinner on dragged item
  moveNodeMutation.mutate({ nodeId: draggedIds[0], parentId, index });
};

// 3. Backend call completes
// 4. Success → react-query refetches tree data → UI updates with confirmed state
// 5. Failure → error toast shown, tree stays unchanged (no snap-back)
```

**How to Avoid Previous Mistakes**:

1. **No Optimistic Updates** - Single source of truth is backend (via react-query cache)
   - Previous issue: Local state manipulation → race condition → items snap back
   - Solution: Show loading spinner, wait for backend confirmation, refetch

2. **No useEffect State Syncing** - Avoid `useEffect(() => setLocalTree(serverData), [serverData])`
   - Previous issue: Dependency cycles, race conditions between initialTree prop and local state
   - Solution: Pass react-query data directly to tree component (no local state)

3. **Query Cancellation** - Cancel outgoing refetches before mutations
   - Prevents old query overwriting optimistic update
   - Use `onMutate` to cancel queries: `queryClient.cancelQueries(['folderTree'])`

4. **Rollback Mechanism** - For temporary optimistic updates (if needed)
   - `onMutate` returns rollback function
   - `onError` calls rollback to revert
   - We prefer pessimistic (loading state) over optimistic for reliability

5. **Separation of Local State from Sync State**
   - React-query manages server state
   - Local state only for UI concerns (loading, hover, selection)
   - Never mix the two

**Cross-Panel Drag & Drop Patterns**:
- HTML5 Drag and Drop API for desktop
- Pointer Events for touch support (mobile)
- Tree acts as drop target, main view acts as drop target
- Visual feedback: borders, backgrounds, drop hints ("Move to Projects folder")
- Both panels share same mutation functions (insertBefore/insertAfter/makeChild)

**Best Practices Found**:
- Whole-row draggable (no separate drag handle)
- Drop zones: 15/70/15 for folders (before/into/after), 50/50 for files
- Hover-to-expand: 750ms delay with progress indicator (visual countdown)
- Multi-select: Cmd/Ctrl+Click, Shift+Click for range
- Mobile: Long-press (500ms) with haptic feedback

**Reference Implementations to Study**:
1. react-arborist official examples: https://react-arborist.netlify.app/
2. CodeSandbox examples: https://codesandbox.io/examples/package/react-arborist
3. Pragmatic Drag and Drop tree: https://atlassian.design/components/pragmatic-drag-and-drop/examples/tree-view
4. Building with react-arborist guide: https://blog.logrocket.com/using-react-arborist-create-tree-components/

**Next Agent**: Implementation agent should:
1. Install `react-arborist` as primary choice
2. Follow "Option A" backend-first pattern (no optimistic updates)
3. Use react-query for mutations with loading states
4. Implement cross-panel drag & drop using same mutation functions
5. Study official examples for best practices

**Key Variable Names** (for future implementation):
- Tree data: `unifiedTree` (from useUnifiedTree hook)
- Loading state: `movingNodeId` (string | null)
- Mutation: `moveNodeMutation` (useMutation hook)
- Backend methods: `insertBefore(nodeId, targetId)`, `insertAfter(nodeId, targetId)`, `makeChild(nodeId, parentId)`

**Files Referenced**:
- Current: `/src/plugins/core-documents/components/FolderTree.tsx` (202 lines, stateless)
- Backend: `/src/plugins/core-documents/services/DocumentsService.ts` (insertBefore/After/makeChild at lines 859-1020)
- Spec: `/memory-bank/docs/DOCUMENTS_PLUGIN_SPEC.md` (complete UX spec with cross-panel requirements)

## Recent Changes (Older Entries)

### UX Issues Research - FolderTree & Navigation - 2025-10-08
**Context Research Complete**: Critical UX issues in AppShell navigation toggle and FolderTree component requiring immediate fixes.

**Issue #1 - Navigation Toggle Placement**:
- **Current**: Hamburger menu (Menu icon) next to ChayCards logo in header (AppShell.tsx lines 138-143)
- **User wants**: Menu toggle next to "Navigation" text in sidebar
- **Files**: `src/renderer/layouts/AppShell.tsx` (lines 138-143 remove, lines 183-185 add)
- **Pattern**: Use Pin/PinOff icon or left/right arrow next to "Navigation" heading

**Issue #2 - "All Files" Root Node**:
- **Current**: Folders render at root level (FolderTree.tsx line 260)
- **User wants**: Single "All Files" item at root, all folders nested under it (indented)
- **Solution**:
  - Keep existing "All Files" button (lines 247-257) but add expand/collapse chevron
  - Render folders conditionally when "All Files" expanded
  - Increase folder indentation by 1 level (from `level={0}` to `level={1}`)

**Issue #3 - Drag-and-Drop Limitations**:
- **Problem 1**: Cannot drag child folder up to become parent
- **Problem 2**: No depth limit - can drag infinitely right
- **Current logic**: `handleDragEnd` in FolderTree.tsx (lines 204-224)
- **Solution**:
  - Add `MAX_FOLDER_DEPTH = 5` constant
  - Check `calculateDepth(targetFolderId)` before allowing drop
  - Allow drop on root/parent level to move folders up hierarchy

**Issue #4 - Sidebar Toggle in PageHeader**:
- **Current**: Collapse/expand button in FileBrowser PageHeader (lines 126-136)
- **User says**: Doesn't make sense there - should be IN the sidebar itself
- **Solution**: Move to top of sidebar (AppShell or FolderTree top section)

**Issue #5 - Folder Appearance (CRITICAL - User Frustration)**:
- **Current problem**: Folders look like long rectangular buttons (full-width Button component)
  ```typescript
  // FolderTree.tsx lines 103-115 - THE PROBLEM
  <div className={cn(
    'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer',
    'hover:bg-accent',
    isSelected && 'bg-accent font-medium'
  )}>
  ```
- **User complaint**: "Folders look terrible - just long buttons, not like folders"
- **Modern folder pattern** (VS Code, Finder, File Explorer):
  - Compact height (~32px per item)
  - Icon + name layout (not full-width button)
  - Indentation guides (vertical lines showing hierarchy)
  - Chevron BEFORE folder icon
  - Subtle hover (not full button highlight)
  - Selected state only on folder item, not full width

**Recommended Folder Styling**:
```typescript
<div
  className={cn(
    "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer",
    "hover:bg-accent/50 transition-colors",
    isSelected && "bg-accent",
    "min-h-[32px]"
  )}
  style={{ paddingLeft: `${level * 16 + 8}px` }}
>
  {hasChildren && (
    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", isExpanded && "rotate-90")} />
  )}
  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
  <span className="text-sm truncate flex-1">{folder.name}</span>
</div>
```

**Key Variable Names**:
- AppShell: `sidebarOpen`, `setSidebarOpen` (state for main nav sidebar)
- FolderTree: `expandedFolders` (Set<string>), `handleToggleExpand(folderId)`
- FolderNode: `isExpanded`, `isSelected`, `hasChildren`, `level` (depth)
- Drag handlers: `handleDragEnd`, `useDraggable`, `useDroppable` (from @dnd-kit)

**Files to Modify**:
1. `/src/renderer/layouts/AppShell.tsx` - Move navigation toggle from header to sidebar
2. `/src/plugins/core-documents/components/FolderTree.tsx` - Main fixes (appearance, "All Files" root, drag limits)
3. `/src/plugins/core-documents/components/FileBrowser.tsx` - Remove sidebar toggle from PageHeader

**Implementation Priority**:
1. ⭐⭐⭐ Issue #5 - Folder appearance (CRITICAL - user frustration)
2. ⭐⭐ Issue #2 - "All Files" virtual root
3. ⭐⭐ Issue #3 - Drag-and-drop limits
4. ⭐ Issue #1 & #4 - Navigation toggle placement

**Next Agent**: Implementation agent should start with Issue #5 (folder appearance).

### Documents Plugin UI Improvements Research - 2025-10-08
**Context Research Complete**: Comprehensive analysis of UI patterns for spacing, breadcrumbs, collapsible sidebar, folder cards, and file/folder ordering.

**Key Findings**:
- **Spacing Issue Identified**: FileBrowser root container has NO padding (`line 91: <div className="file-browser h-full flex flex-col">`)
  - Standard pattern from DemoPage.tsx: `p-8 max-w-6xl mx-auto space-y-8` (line 301)
  - Quick fix: Add `p-8 space-y-6` to root container
- **Collapsible Sidebar Pattern**: AppShell.tsx (lines 15, 138-178) provides exact implementation
  - State: `const [sidebarOpen, setSidebarOpen] = useState(true)`
  - Toggle icons: `PanelLeftClose` (already imported), `PanelLeft` (already imported)
  - Transition: `transition-all duration-300` with conditional width (`w-64` vs `w-0`)
  - Conditional rendering: `{sidebarOpen && <Content />}` prevents layout issues
- **Breadcrumb Navigation**: Hook already exists but unused
  - `useFolderPath(selectedFolderId)` from useDocuments.ts returns folder path array
  - Icons: `ChevronRight` (already imported) for separators
  - Pattern: "All Documents" root + clickable path segments
- **Folder Card Styling**: DemoPage.tsx shows beautiful card pattern
  - Current: `p-4` padding, `h-8 w-8` icon, `font-medium` text
  - Proposed: `p-6 border-2 rounded-2xl` card, `w-14 h-14` icon container, `text-xl font-bold` text
  - Color fallback: `folder.color || 'hsl(var(--primary))'` (use semantic theme variable)
- **File/Folder Order**: Currently folders first (line 202), user wants files first
  - Simple fix: Move `filesInFolder.map()` before `childFolders.map()` in render

**Spacing/Padding Standards** (from DemoPage.tsx):
- Page root: `p-8` padding
- Cards: `p-6` (large) or `p-4` (small)
- Sections: `space-y-8`, `space-y-6`, `space-y-4`
- Grid gaps: `gap-6` (main), `gap-4` (cards), `gap-3` (components)
- Border radius: `rounded-2xl` (cards), `rounded-xl` (sections), `rounded-lg` (items)

**Implementation Scope** (1 file):
1. `/src/plugins/core-documents/components/FileBrowser.tsx` (268 lines)
   - Add page padding (`p-8 space-y-6`) to root container (line 91)
   - Add sidebar toggle state and button (lines 161-172)
   - Add breadcrumb navigation above content area (import `useFolderPath`)
   - Enhance folder card styling (lines 203-221)
   - Reverse file/folder display order (swap map order lines 202-258)

**Priority Order**:
1. ⭐ Page padding (`p-8 space-y-6`) - QUICK WIN (1 line change)
2. ⭐ File/folder order swap - ONE LINE CHANGE
3. ⭐⭐ Collapsible sidebar toggle
4. ⭐⭐ Breadcrumb navigation
5. ⭐⭐⭐ Beautiful folder cards

**All patterns exist** - copy from AppShell.tsx (collapsible), DemoPage.tsx (cards, collapsible), existing imports.

**Files Referenced**:
- `/src/plugins/core-documents/components/FileBrowser.tsx` - Primary modification target
- `/src/renderer/layouts/AppShell.tsx` - Collapsible sidebar pattern
- `/src/plugins/demo-plugin/components/DemoPage.tsx` - Spacing and card patterns
- `/src/plugins/core-ui/components/PageHeader.tsx` - Component reference
- `/src/renderer/components/ui/collapsible.tsx` - Radix UI component

**See**: Complete research report in `/tmp/context_research_report.md` with code snippets and implementation examples.

### Folder Drag-and-Drop Implementation COMPLETE - 2025-10-08
**Status**: ✅ Implementation complete, ❌ Testing blocked by authentication issue

**What Was Completed**:
1. **Documentation Fixes** (8 files):
   - Fixed incorrect `core.ui` → `core-ui` plugin naming in CLAUDE.md files
   - Updated FRONTEND_ARCHITECTURE.md, activeContext.md, progress.md

2. **Folder Drag-and-Drop Implementation**:
   - ✅ Installed @dnd-kit packages (core, sortable, utilities)
   - ✅ Added `order?: number` field to Folder interface (types.ts:63)
   - ✅ Implemented `moveFolder()` in DocumentsService (lines 719-780)
     - Validates circular references and name conflicts
     - Automatically assigns order values
     - Emits 'folder:moved' events
   - ✅ Implemented `reorderFolders()` in DocumentsService (lines 782-819)
     - Batch updates folder order within same parent
     - Emits 'folders:reordered' events
   - ✅ Updated `createFolder()` to auto-assign order values (lines 502-521)
   - ✅ Updated `getFolderTree()` to sort by order field (lines 692-711)
   - ✅ Created FolderTree component with drag-and-drop (FolderTree.tsx)
     - Uses @dnd-kit/core for drag infrastructure
     - Visual feedback: 50% opacity when dragging, blue border on drop zone
     - Proper event handling for drag/drop operations
   - ✅ Integrated FolderTree into FileBrowser with callbacks (FileBrowser.tsx)
   - ✅ Fixed import path bug: `@/lib/utils` → `@/shared/lib/utils`

**Files Modified**:
- `src/plugins/core-documents/types.ts` - Added order field to Folder interface
- `src/plugins/core-documents/services/DocumentsService.ts` - Added move/reorder methods
- `src/plugins/core-documents/components/FolderTree.tsx` - NEW drag-and-drop component
- `src/plugins/core-documents/components/FileBrowser.tsx` - Integrated FolderTree
- 8 documentation files - Fixed core.ui → core-ui naming

**Blocking Issue - Authentication**:
- ❌ **Cannot test implementation** - Users can register but can't access /app/documents
- **Problem**: Auth token not persisting across page navigations in web mode
- **Symptom**: Immediate redirect to /login when accessing any /app/* route except /app/demo
- **Impact**: Folder drag-and-drop code is complete but untested
- **Next Step**: Debug authentication storage/retrieval before testing UI

**Next Steps After Auth Fix**:
1. Test folder drag-and-drop with frontend-qa-tester
2. Verify visual feedback works correctly
3. Test folder move operations (drag folder onto another folder)
4. Test folder reorder operations (drag folder between folders)
5. Create test folders to validate functionality end-to-end

**Implementation Details**:
- Service methods use database storage patterns (pure DB, no caches)
- Automatic order calculation prevents manual order management
- Backend validation prevents circular references
- Event system notifies observers of folder changes
- All TypeScript compilation passes with zero errors

### Folder Drag-and-Drop Research - 2025-10-08
**Context Research Complete**: Comprehensive analysis of Documents plugin folder system for implementing drag-and-drop folder reorganization.

**Current State:**
- **No drag-drop library installed** (package.json has no @dnd-kit, react-beautiful-dnd, or react-dnd)
- **Folder data structure exists** (`src/plugins/core-documents/types.ts`):
  - `Folder` interface: `id, name, parentId, color, icon, tags, createdAt, updatedAt`
  - **Missing**: `order` field for custom positioning within parent
- **DocumentsService has full folder CRUD** (`src/plugins/core-documents/services/DocumentsService.ts`):
  - `createFolder()` with Windows-like validation (unique names per parent, case-insensitive)
  - `updateFolder()` supports changing `parentId` (move to different parent)
  - `validateFolderMove()` prevents circular references
  - `getFolderTree()` builds hierarchical structure
  - **Current sorting**: Alphabetical by name (no custom ordering yet)
- **FileBrowser.tsx is placeholder** - No UI implementation yet
- **Core-UI components available**: Card, Button, List, EmptyState (no drag-drop components)

**Library Recommendation: @dnd-kit**
- Install: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Why @dnd-kit:**
  - Modern, accessible, performant (React 18 compatible)
  - Touch device support (mobile-first)
  - Tree structure support via sortable utilities
  - Smaller bundle than react-beautiful-dnd
  - Active maintenance

**Data Model Changes:**
```typescript
// Add to Folder interface in types.ts
interface Folder {
  // ... existing fields
  order: number;  // NEW: Custom ordering within parent (0, 1, 2, ...)
}
```

**Service API (Simplified & Clean):**
```typescript
// 1. Move folder to new parent (appends to end)
async moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<FolderOperationResult>
// Logic:
// - Validate no circular dependency
// - Update parentId
// - Set order = max(siblings.order) + 1
// - Save folder

// 2. Reorder folders within same parent
async reorderFolders(
  parentId: string | null,
  folderIds: string[]  // New order
): Promise<void>
// Logic:
// - Verify all folders have same parentId
// - Update order: folderIds[0].order = 0, folderIds[1].order = 1, etc.
// - Batch update (use transaction in SQLite)

// 3. Backfill order on first load
// In loadFromStorage():
// - Check if any folder missing order field
// - If yes, sort folders alphabetically by name within each parent
// - Assign orders: 0, 1, 2, ... per parent
```

**Implementation Plan (4 Phases):**

**Phase 1: Data & Service Layer (Backend Only)**
- [x] Add `order: number` to Folder interface (`types.ts`)
- [x] Update `DocumentsService.loadFromStorage()`:
  - Backfill order alphabetically for existing folders
  - Only runs once (check if folders have order field)
- [x] Update `createFolder()`: Set `order = max(siblings.order) + 1` (or 0 if no siblings)
- [x] Implement `moveFolder(folderId, newParentId)`:
  - Validate with `validateFolderMove()`
  - Update `parentId` and append to end of children
  - Return structured error for circular refs
- [x] Implement `reorderFolders(parentId, folderIds[])`:
  - Batch update with transaction support (SQLite)
  - Update order field based on array index
- [x] Update `getFolderTree()`: Sort children by `order` field (not alphabetically)
- [x] Add `batchUpdateFolders()` to StorageAdapter interface (transaction support)

**Phase 2: Static UI with Mock Data**
- [x] Build `FolderTree` component (hierarchical display)
- [x] Create mock folders with `order` field
- [x] Render folders sorted by order
- [x] Add expand/collapse functionality
- [x] Verify correct sorting without drag-drop

**Phase 3: Drag-Drop Integration**
- [x] Install packages: `npm install @dnd-kit/core @dnd-kit/sortable`
- [x] Wrap `FolderTree` in `DndContext`
- [x] Create `DraggableFolderItem` component with drag handle
- [x] Add drop zones:
  - **ON folder**: Highlight entire folder → calls `moveFolder()`
  - **BETWEEN folders**: Show horizontal line → calls `reorderFolders()`
- [x] Implement `onDragEnd` handler with optimistic UI updates:
  ```typescript
  const originalState = [...folders];
  setFolders(newOrderedFolders);  // Immediate UI update
  try {
    await documentsService.reorderFolders(parentId, newFolderIds);
  } catch (error) {
    setFolders(originalState);  // Revert on failure
    toast.error('Failed to reorder folders');
  }
  ```
- [x] Use `onDragOver` for real-time visual feedback during drag
- [x] Error handling with state reversion

**Phase 4: Visual Polish**
- [x] Drag handle icon (GripVertical from lucide-react)
- [x] Hover states on drop targets
- [x] Drop indicators (border highlight for "on folder", horizontal line for "between")
- [x] CSS transitions for smooth reordering animation
- [x] "Can't drop here" indicator for invalid targets (circular refs)
- [x] Keyboard accessibility (arrow keys for navigation, Enter to expand/collapse)
- [x] Breadcrumb trail showing destination path during drag

**Drop Target Differentiation:**
- **Drop ON folder**: User drags folder onto another folder to nest it
  - Visual: Highlight entire target folder with border/background
  - Action: `moveFolder(draggedId, targetId)`
  - Collision: `pointerWithin` algorithm
- **Drop BETWEEN folders**: User drags folder between two folders to reorder
  - Visual: Horizontal line indicator in gap
  - Action: `reorderFolders(parentId, newOrderedIds)`
  - Collision: `closestCenter` algorithm

**Ordering Strategy:**
- **Type**: Simple integer ordering (0, 1, 2, 3, ...)
- **Rationale**: Sufficient for <100 folders per parent (typical use case)
- **Trade-off**: Reordering requires updating multiple rows (row-shifting), but acceptable for MVP
- **Future**: Can migrate to fractional indexing (LexoRank-style) if performance issues

**Transaction Support:**
- **SQLite**: Uses better-sqlite3 transactions via `db.transaction()`
- **PostgreSQL**: REST API doesn't wrap batch updates in transactions yet (MVP risk accepted)
- **MVP Strategy**: Accept non-atomic risk - folder reordering unlikely to fail, user can retry on error
- **Phase 2**: Add transaction support to PostgreSQL adapter

**Key Files Modified:**
- `src/plugins/core-documents/types.ts` - Add `order` field to Folder
- `src/plugins/core-documents/services/DocumentsService.ts` - Add moveFolder(), reorderFolders()
- `src/shared/storage/StorageAdapter.ts` - Add batchUpdateFolders() interface
- `src/shared/storage/SQLiteAdapter.ts` - Implement batch updates with transactions
- `src/plugins/core-documents/components/FileBrowser.tsx` - Build folder tree UI
- `src/plugins/core-documents/components/FolderTree.tsx` - NEW: Hierarchical folder display with drag-drop
- `src/plugins/core-documents/components/DraggableFolderItem.tsx` - NEW: Individual folder with drag handle

**Testing Strategy:**
- Unit tests: moveFolder(), reorderFolders(), validateFolderMove()
- Integration tests: Drag folder onto another folder, drag folder between folders
- Edge cases: Circular reference prevention, batch update rollback
- Accessibility: Keyboard navigation, screen reader announcements

**See**: `memory-bank/docs/DOCUMENTS_PLUGIN_SPEC.md`, `memory-bank/docs/DOCUMENTS_DATA_MODEL.md` for full specifications.

## Recent Changes

### Navigation Tree - Complete Nuclear Cleanup (2025-10-10)
**Status**: ✅ Clean slate achieved - ready for fresh implementation

**What Was Nuked**:
1. **FolderTree.tsx** - Reduced from 713 lines → 202 lines
   - ❌ Removed: All @dnd-kit imports and drag & drop logic
   - ❌ Removed: Optimistic update system (updateTreeOptimistically, persistMoveAsync, rollback)
   - ❌ Removed: Local state management (useState for tree, hasSyncedRef race condition fixes)
   - ❌ Removed: Drop zone detection (before/into/after, 15/70/15 percentages)
   - ❌ Removed: Hover-to-expand functionality (750ms timers, auto-expand)
   - ❌ Removed: Drag overlay ghost component
   - ❌ Removed: useSortable hooks, SortableContext, DndContext
   - ✅ Kept: Simple tree rendering, expand/collapse, folder selection, clean styling

2. **FileBrowser.tsx** - Cleaned
   - ❌ Removed: All drag & drop handlers (handleInsertBefore, handleInsertAfter, handleMakeChild)
   - ❌ Removed: Event listeners and optimistic update logic
   - ✅ Changed: `initialTree` prop → `tree` prop (simple data passing)
   - ✅ Component now just displays data from backend via `tree` prop

3. **package.json** - Dependencies Removed
   - ❌ @dnd-kit/core (^6.3.1)
   - ❌ @dnd-kit/sortable (^10.0.0)
   - ❌ @dnd-kit/utilities (^3.2.2)
   - ✅ npm install removed 4 packages successfully

4. **DocumentsService.ts** - UNCHANGED (Intentional)
   - ✅ Kept: insertBefore, insertAfter, makeChild methods (backend operations)
   - ✅ Kept: File versions (insertFileBefore, insertFileAfter, makeFileChild)
   - These are pure backend operations - may be useful for future implementation

5. **useDocuments.ts** - Already Clean
   - ✅ No event listeners for file/folder changes
   - ✅ Hooks fetch once on mount only
   - ✅ No refetching on events

**Why the Nuclear Option**:
- Optimistic updates were causing tree to revert immediately after drop
- Race conditions between initialTree prop and local state
- Complex state syncing (useEffect, refs, dependency cycles)
- User frustration: "when i let go, the folder goes back to where it was"
- Better to start fresh with simpler, proven pattern

**Current State**:
- Tree displays folders/files from backend (via `tree` prop)
- Expand/collapse works perfectly
- Folder selection works perfectly
- NO drag & drop - clean slate
- NO sync issues - tree always matches backend
- NO race conditions - stateless component

**Implementation Plan Created**:
- Complete specification in `NAVIGATION_TREE_SPEC.md` (800+ lines)
- Option A chosen: Immediate backend persistence with loading spinners
- Features planned: Multi-select, Undo/Redo (Ctrl+Z), Mobile long-press
- Drop zones: 15/70/15 for folders, 50/50 for files
- Hover-to-expand: 750ms with progress indicator
- Whole row draggable (no separate drag handle)

**Next Steps**:
- When ready to re-implement: Follow NAVIGATION_TREE_SPEC.md exactly
- Start with Phase 1: Basic rendering (already done)
- Phase 2: Add @dnd-kit back with new approach
- Phase 3: Backend persistence (Option A pattern)
- Phase 4+: Multi-select, Undo, Mobile, Accessibility

**Key Learning**: Optimistic updates are hard to get right. Immediate backend persistence with loading indicators is simpler and more reliable.

### Folder System Architecture Research - 2025-10-09
**Context Research Complete**: Comprehensive analysis of current folder system implementation to inform complete refactor design.

**Current Data Schema**:
- **Folder Interface** (DocumentsService.ts:30-44):
  ```typescript
  interface Folder {
    id: string;
    userId: string;
    name: string;
    parentId: string | null;
    order: number;  // ⚠️ CRITICAL BUG: Float-based ordering
    color?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **Storage Pattern**: Flat storage with individual keys (`core-documents:folders:{folderId}`)
- **Query Pattern**: Fetch all folders, filter in-memory by `parentId` (O(N) reads every time)
- **No Validation**: No max depth, no circular reference prevention, no order uniqueness

**Current APIs**:
- `createFolder(name, parentId?, color?)` - Auto-assigns `order = maxOrder + 1`
- `moveFolder(folderId, newParentId, newOrder)` - Updates parentId and order
- `reorderFolders(folderId, newOrder)` - Changes order within same parent
- `listFolders(parentId?)` - Fetches ALL folders, filters by parentId
- **All methods**: No validation, no collision detection, no rebalancing

**Pain Points Identified**:

1. **Order Precision Loss** (FolderTree.tsx:165-170):
   ```typescript
   // Midpoint calculation leads to precision loss after ~50 operations
   return (prevOrder + nextOrder) / 2;  // ⚠️ BREAKS
   ```
   **Impact**: Folders stop reordering correctly

2. **Storage Inefficiency** (DocumentsService.ts:560-590):
   ```typescript
   // Every operation fetches EVERY folder from storage
   const allFolders = await this.storage.list<Folder>(this.STORAGE_KEYS.FOLDERS);
   ```
   **Impact**: O(N) reads for every single folder operation

3. **Event Cascade** (useDocuments.ts:120-140):
   ```typescript
   // Every folder move triggers full refetch of all folders
   const handleFolderMoved = (folder: Folder) => {
     refetchFolders();  // O(N) reads
   };
   ```
   **Impact**: Moving 10 folders = 10N storage reads

4. **No Validation** (DocumentsService.ts:620-650):
   - ❌ No circular reference detection
   - ❌ No max depth enforcement
   - ❌ No name validation
   - ❌ No order uniqueness

5. **Monolithic Component** (FolderTree.tsx:1-710):
   - Business logic mixed with UI
   - Hard to test
   - Poor code reuse
   - Performance issues (full tree re-renders)

**Required Changes for Refactor**:

**Must Replace**:
1. Float ordering → Lexicographic fractional indexing
2. Individual storage reads → Batch operations
3. Full refetches → Granular event-driven updates
4. Monolithic component → Extracted services + hooks
5. No validation → Comprehensive validation layer

**Must Add**:
1. Order rebalancing - Detect and fix collisions
2. Circular reference detection - Prevent invalid hierarchies
3. Max depth enforcement - Prevent infinite nesting
4. Optimistic UI updates - Update UI before backend confirms
5. Debounced events - Prevent cascade loops

**Must Preserve**:
1. Event bus pattern - Works well for decoupling
2. User scoping - Automatic filtering by userId
3. Platform abstraction - Storage adapter pattern is good
4. TypeScript strict mode - Strong typing prevents bugs

**Files Referenced**:
- `/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/src/plugins/core-documents/services/DocumentsService.ts`
- `/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/src/plugins/core-documents/components/FolderTree.tsx`
- `/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/src/plugins/core-documents/hooks/useDocuments.ts`
- `/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/src/plugins/core-documents/types.ts`

**Next Step**: Design complete refactor architecture based on these findings.

### Root Cause: Drag-to-Top Bug - 2025-10-08
**Bug Description**: User can drag folders to the bottom (bug #2 fixed) but CANNOT drag folders to become the first/top folder in the list.

**Root Cause Identified**: Both RootDropZone components (top and bottom) have **identical IDs** causing drop zone conflicts.

**Evidence**:
- Line 105: Top RootDropZone uses `id: 'drop-root'`
- Line 651: Top RootDropZone renders before folder list
- Line 668: Bottom RootDropZone renders after folder list
- Line 104-110: Both use same droppable data: `{ type: 'root', accepts: 'folder' }`
- Line 419-426: handleDragOver detects `targetDropId === 'drop-root'` without distinguishing which drop zone

**Specific Problem**:
When user drags folder to top RootDropZone:
1. Both drop zones respond to same ID `'drop-root'`
2. No position information in droppable data
3. handleDragEnd cannot differentiate top vs bottom drops
4. Likely behavior: Bottom drop zone wins (rendered last), folders always go to bottom

**Recommended Fix** (Files as Entity Properties pattern):
1. **Change IDs to be unique** (FolderTree.tsx lines 103-121):
   ```typescript
   // Top RootDropZone (line 651)
   const RootDropZone: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
     const { setNodeRef, isOver } = useDroppable({
       id: `drop-root-${position}`,  // UNIQUE ID
       data: {
         type: 'root',
         accepts: 'folder',
         position  // ADD POSITION
       }
     });
   ```

2. **Update handleDragOver** (lines 419-426) to capture position:
   ```typescript
   } else if (targetDropId.startsWith('drop-root')) {
     const position = over.data.current?.position || 'bottom';
     setDragOverState({
       targetFolderId: null,
       type: 'inside',
       indent: 4,
       targetLevel: 1,
       position  // ADD TO STATE
     });
   ```

3. **Update handleDragEnd** (lines 473-477) to use position for order calculation:
   ```typescript
   if (type === 'inside') {
     // Determine order based on position
     const newOrder = capturedDragState.position === 'top' ? 0 : 999;
     onFolderMove?.(draggedFolder.id, targetFolderId, newOrder);
   }
   ```

**Files Affected**:
- `/src/plugins/core-documents/components/FolderTree.tsx` (lines 103-121, 419-426, 473-477, 651, 668)

**Next Steps**:
1. Implementation agent should apply fix to FolderTree.tsx
2. Test dragging folder to top (should become first folder with order=0)
3. Test dragging folder to bottom (should become last folder with order=999)
4. Verify no regressions in drag-to-inside functionality

### Backlog Updates - 2025-10-08
Updated two major tasks to "Done" status in Notion:

1. **File Storage API** (282bbd9b-1a29-81be-9bcc-cdadacf99d1a)
   - Implemented Files as Entity Properties pattern
   - Extended StorageAdapter.set() with files parameter
   - Added files tables to SQLite and PostgreSQL
   - Superior to original dual-API spec

2. **Documents Plugin** (1fcbbd9b-1a29-812f-a383-cd5d7edbe1b0)
   - Full DocumentsService with CRUD operations
   - FileBrowser component with upload/download/delete
   - useDocuments hook for state management
   - Files as Entity Properties integration working

Both tasks moved from "In progress" to "Done" with detailed completion notes.

### Async/Await Pattern in React Event Handlers (October 8, 2025)
- **Bug Discovery**: Theme cycling button in demo plugin silently failing
  - **Root Cause**: Event handler called `themeService.getAvailableThemes()` without `await`
  - **Symptom**: Received `Promise<Theme[]>` instead of `Theme[]`, causing `.findIndex()` to fail
  - **Location**: `src/plugins/demo-plugin/components/DemoPage.tsx` line 237
- **Pattern Fix**: Make event handler async and await service calls
  ```typescript
  // ❌ WRONG: Synchronous handler calling async method
  const handleThemeChange = () => {
    const themes = themeService.getAvailableThemes(); // Returns Promise!
    // ...
  };

  // ✅ CORRECT: Async handler with await
  const handleThemeChange = async () => {
    const themes = await themeService.getAvailableThemes(); // Returns Theme[]
    // ...
  };
  ```
- **Key Learning**: **Any service method that accesses storage is async**
  - React event handlers CAN be async - just add `async` keyword
  - Always check service method signatures for `Promise<T>` return type
  - React handles async event handlers gracefully
- **Documentation Updated**:
  - Added "Async Service Methods in React Handlers Pattern" to systemPatterns.md
  - Documented common async methods: `getAvailableThemes()`, `loadSettings()`, `getDocuments()`, etc.
  - Clear examples of wrong vs correct usage
  - Pattern benefits: clear errors, no race conditions, consistent across all storage services
- **Files Changed**:
  - `src/plugins/demo-plugin/components/DemoPage.tsx` - Fixed handleThemeChange to be async
  - `memory-bank/systemPatterns.md` - Added async/await pattern documentation

### Files as Entity Properties Architecture (October 7, 2025)
- **Critical Discovery**: Binary file storage completely missing from current implementation
  - DocumentsService attempts to store Uint8Array via `storage.set()` which uses JSON.stringify()
  - Binary data corrupts: `Uint8Array([255, 216, 255])` becomes `{"0":255,"1":216,"2":255}`
  - Files cannot be properly stored or retrieved - Documents Plugin non-functional
- **Design Evolution**: Files as Properties of Entities (not separate storage)
  - **Problem with Separate APIs**: Orphaned files when entities deleted
    ```typescript
    await storage.set('doc-123', { title: 'Report' });
    await storage.setFile('file-xyz', pdfData); // Separate storage
    await storage.delete('doc-123'); // BUG: file-xyz orphaned!
    ```
  - **Solution**: Files attach to entities with CASCADE DELETE
    ```typescript
    await storage.set('doc-123', { title: 'Report' }, { pdf: pdfData });
    await storage.delete('doc-123'); // ✅ PDF automatically deleted
    ```
  - **User Insight**: "we can't trust plugins to handle orphaned ids" - led to database FK solution
- **Unified API Design**:
  - `set(key, data, files?)` - Store entity with optional binary files
  - `get(key)` - Returns `{ data, files }` with all attached files
  - `delete(key)` - Cascades to delete all attached files (database enforced)
  - Field names are arbitrary (pdf, thumbnail, avatar, etc.) - plugin's choice
- **Database Architecture**:
  - **SQLite**: `files` table with FK to `storage(key, user_id)` ON DELETE CASCADE
  - **PostgreSQL**: Same structure with JSONB metadata and BYTEA file data
  - Composite PK: `(storage_key, field_name, user_id)` prevents cross-user access
  - SHA-256 deduplication in Electron (content-based addressing)
- **Key Benefits**:
  - ✅ No orphaned files (database FK enforces lifecycle)
  - ✅ Atomic operations (entity + files stored/deleted together)
  - ✅ Simpler plugin code (no manual file tracking)
  - ✅ User scoping automatic (composite keys)
  - ✅ Testing without UI (simple Uint8Array in browser console)
- **Documentation Complete**:
  - FILE_STORAGE_SPEC.md: 630 lines with comprehensive examples and patterns
  - Database schemas for SQLite and PostgreSQL
  - Usage examples for Documents Plugin
  - Testing instructions for Electron and cloud
  - Implementation phases with 11 concrete tasks
- **Next Step**: Implement Phase 1 (extend StorageAdapter, add files table, update IPC/API)

### Files as Entity Properties - Phase 1 Implementation Plan Created (October 7, 2025)
- **Complete Implementation Roadmap**: All 12 files requiring modification identified
  - **Core Storage System (7 files)**:
    1. `StorageAdapter.ts` - Interface signatures (`get` returns `{ data, files }`, `set` accepts optional `files`)
    2. `SQLiteAdapter.ts` - Implementation with new return format
    3. `PostgreSQLAdapter.ts` - Implementation with base64 encoding for JSON transport
    4. `electron/database.cjs` - Add `files` table with CASCADE DELETE foreign key
    5. `electron/ipc/storageHandlers.cjs` - Update get/set handlers with SHA-256 file deduplication
    6. `electron/preload.cjs` - Update set signature to pass files parameter
    7. `server/index.js` - Add `files` table + update GET/PUT endpoints for BYTEA storage
  - **Plugin Updates (5 files)** - All `storage.get()` calls must change to `result?.data` pattern:
    1. `DocumentsService.ts` - Migrate to Files as Properties API, remove `fileStorageKey` field
    2. `SettingsService.ts` - Update 1 `storage.get()` call
    3. `ThemeService.ts` - Update ~14 `storage.get()` calls
    4. `DemoDataService.ts` - Update 1 `storage.get()` call
    5. `DemoPage.tsx` - Update 1 `storage.get()` call
- **Breaking Change Strategy**: No backward compatibility
  - Clean slate approach - all existing data can be cleared
  - No migration code - fresh start with new API
  - All plugin code updated simultaneously
- **Implementation Order**:
  1. Database schemas (SQLite + PostgreSQL files tables)
  2. IPC handlers (Electron file storage with SHA-256 deduplication)
  3. Server endpoints (PostgreSQL BYTEA storage with base64 transport)
  4. Storage adapters (update get/set methods)
  5. Interface (make breaking change official)
  6. All plugin services (update storage.get() calls)
  7. Testing (both Electron and Cloud platforms)
- **Key Technical Decisions**:
  - **Electron**: Files stored in `{userData}/files/{sha256-hash}` with metadata in SQLite
  - **Cloud**: Files stored as BYTEA in PostgreSQL `files` table
  - **Transport**: Base64 encoding for JSON over HTTP/REST
  - **Deduplication**: SHA-256 content-based addressing (Electron only)
  - **Cascade Delete**: Database foreign key constraints enforce lifecycle
- **Testing Requirements**:
  - Upload document in Electron, verify hash-based file storage
  - Upload document in Cloud, verify BYTEA storage in PostgreSQL
  - Delete entity, verify CASCADE DELETE removes file rows
  - All plugins (Settings, Theme, Demo) load data correctly after migration
  - No `storage.get()` calls returning undefined

### Documents Plugin Phase 1 Implementation (October 6, 2025)
- **Complete Service Architecture**: Built DocumentsService with dual-storage abstraction
  - **File Management**: Full CRUD operations for files with File Storage + JSON Storage APIs
  - **Folder Hierarchy**: Tree structure with parent-child relationships
  - **FileHandler Registry**: Priority-based handler system for plugin extensibility
  - **Observer Pattern**: State change notifications with immediate state provision
  - **React Hooks**: Complete hook library for reactive state management
  - **Initialization State Tracking**: Prevents race conditions during plugin loading
  - **Folder Name Validation**: Comprehensive validation preventing unsafe characters, path traversal
  - **Type Safety**: Fixed PluginManager interface with getStorage() method
- **Files Created** (1,977 lines total):
  - `src/plugins/core-documents/types.ts` (271 lines) - Complete type definitions
  - `src/plugins/core-documents/services/DocumentsService.ts` (772 lines) - Core service with all fixes
  - `src/plugins/core-documents/hooks/useDocuments.ts` (225 lines) - React hooks with initialization checks
  - `src/plugins/core-documents/components/FileBrowser.tsx` (71 lines) - Placeholder component
  - `src/plugins/core-documents/index.ts` (138 lines) - Plugin manifest
- **Files Modified**:
  - `src/shared/plugin-system/types.ts` - Added getStorage() method to PluginManager interface
- **Key Patterns Established**:
  - **Dual-Storage Abstraction**: Single methods handle both File Storage and JSON Storage internally
  - **Stateful Observer + Custom Hook**: Service tracks listeners, hooks consume state reactively
  - **Service Layer**: Plugins call service methods, service manages both storage APIs
  - **FileHandler Extensibility**: Other plugins can register handlers for specific file types
  - **Windows-like Folder Validation**: Unique names per parent (case-insensitive), path safety
- **Code Review Fixes Applied**:
  - Added `initialized` flag with `isInitialized()` method to prevent race conditions
  - Added `validateFolderName()` with comprehensive safety checks
  - Updated hooks to check initialization state before returning service
  - Fixed TypeScript compilation (zero errors)
- **Ready for Phase 2**: UI components with Grid/List views, drag-and-drop, advanced search

### Plugin System Enhancements (October 6, 2025)
- **User Plugin Preferences**: Implemented per-user plugin filtering system
  - **enabled_plugins** vs **installed_plugins** distinction (commit eb295eb)
    - `installed_plugins` - Plugins discovered by system via glob import
    - `enabled_plugins` - Plugins user has explicitly enabled (stored in users table)
    - Core plugins ALWAYS enabled regardless of preferences
  - **Storage Mode Selection**: Users table now includes `storageMode` field
    - Each user can have different storage preference (local/cloud/sync)
    - Stored alongside plugin preferences in PostgreSQL/SQLite
  - **API Endpoint**: `GET /api/users/me/plugins` returns user's enabled plugins
  - **PluginManager Integration**: `getUserPluginPreferences()` filters by user choice
    - Queries database before loading plugins
    - Respects core plugin requirement (cannot be disabled)
    - Falls back to all-enabled if no preferences found
- **Files Changed**:
  - `src/shared/plugin-system/PluginManager.ts` - Added user preferences logic (lines 162-244)
  - `server/index.js` - Added `/api/users/me/plugins` endpoint
  - Database schema - Added `enabled_plugins` column to users table
- **Key Benefits**:
  - Multi-tenant plugin filtering (different users, different plugins)
  - Granular control over plugin ecosystem
  - Core system stability (core plugins always load)
  - Scalable for plugin marketplace

### Theme System Pure Database Refactor (October 5, 2025)
- **Architecture Change**: Eliminated all in-memory caches for pure database storage
  - **Removed**: `Map<string, Theme>` for themes registry (was memory leak vulnerability)
  - **Removed**: `Set<string>` for favorites cache (caused duplicate state)
  - **Added**: Single source of truth in database under `core-theme:all-themes` key
  - **Why**: Caches persist between sessions in singleton services, causing memory leaks and state inconsistencies
- **Pure Database Pattern**: All theme data stored and queried from database
  - `core-theme:all-themes` - Single array containing all themes (plugin + custom)
  - `core-theme:favorites` - Array of favorite theme IDs
  - `core-theme:current-theme` - Active theme ID (uses STORAGE_KEYS constant)
  - Every operation reads from DB, modifies in memory, writes back to DB
  - No persistent caches between operations (stateless service pattern)
- **Async Service Pattern**: All ThemeService methods now return Promise
  - `registerTheme(theme)` - Checks DB for duplicates before adding (prevents re-registration on hot reload)
  - `getAvailableThemes()` - Returns `Promise<Theme[]>` from DB query
  - `getThemeById(id)` - Returns `Promise<Theme | undefined>` from DB query
  - `getCustomThemes()` - Filters themes by `source: 'custom'` from DB
  - `toggleFavorite(id)` - Reads favorites from DB, toggles, writes back
- **React Async Integration**: Components handle async initialization properly
  - `useAvailableThemes()` hook: `useState([])` + `useEffect` with service subscription
  - `onThemeListChange()` callback immediately provides current state (solves late subscriber problem)
  - Client-side filtering for search/category (no async service calls in UI)
  - Theme previews update React state synchronously (applyTheme is sync)
- **Source Field Addition**: Theme interface now includes `source: 'plugin' | 'custom'`
  - Plugin themes: Registered by theme plugins during onLoad, source = 'plugin'
  - Custom themes: Created by user in theme builder, source = 'custom'
  - Replaces ID prefix checking (`theme.id.startsWith('custom-')`)
  - Enables reliable filtering: `themes.filter(t => t.source === 'custom')`
- **Client-Side Filtering Pattern**: UI components filter themes locally instead of service methods
  - `ThemeModal.tsx`: Filters `availableThemes` array by search query and category
  - `useMemo` for performance (only recomputes when themes/query/category change)
  - Eliminates async service calls in render cycle (faster, simpler)
  - Service provides raw data, UI handles presentation logic
- **Files Changed**:
  - `src/plugins/core-theme/services/ThemeService.ts` - Complete refactor to async DB operations
  - `src/plugins/core-theme/hooks/useThemes.ts` - Fixed async state initialization
  - `src/plugins/core-theme/components/ThemeModal.tsx` - Client-side filtering with useMemo
  - `src/plugins/theme-catppuccin/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-dracula/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-gruvbox/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/theme-tokyonight/themes.ts` - Added async/await to registerTheme calls
  - `src/plugins/core-theme/index.ts` - Added async to onLoad for proper initialization
- **Key Benefits**:
  - Memory leak eliminated (no persistent caches in singleton)
  - Single source of truth (database only)
  - Consistent state across sessions
  - Duplicate prevention on hot reload
  - Simpler mental model (DB is always correct)
  - Client-side filtering for UI responsiveness

### Backend API Server and Login Issue Resolution (October 2, 2025)
- **Backend API Server Setup**: Added npm script to run Express server
  - Script: `npm run server` runs `cd server && node index.js`
  - Server must run on port 7243 (Windows, not WSL)
  - Provides REST API for authentication and storage operations
  - Uses PostgreSQL database for data persistence
- **Login Issue Root Cause Identified and Fixed**:
  - **Problem**: Login failing with "JSON.parse: unexpected character at line 1 column 1"
  - **Root Cause**: Backend API server on port 7243 was not running
  - **How it works**: Cloudflare tunnel at api.chaycards.com routes to localhost:7243
  - **Why it failed**: When server not running, tunnel returns HTML 404 page instead of JSON
  - **What broke**: Login.tsx expects JSON response with `token` field from `/api/auth/login`
  - **Solution**: Run `npm run server` (from Windows) before testing login/auth
- **WSL vs Windows Networking Discovery**: Critical infrastructure learning
  - Backend server MUST run on Windows (not WSL) for Cloudflare tunnel compatibility
  - **Why**: Cloudflare tunnel runs on Windows and points to Windows localhost:7243
  - **Key insight**: Windows localhost ≠ WSL localhost (different network namespaces)
  - **Tunnel config**: Routes api.chaycards.com → Windows localhost:7243
  - If server runs in WSL, Windows tunnel cannot reach it (different localhost)
- **Current Multi-Server Setup**:
  - Backend API: `npm run server` (port 7243, run from Windows for tunnel access)
  - Dev server: `npm run dev` (Vite on port 8080, can run in WSL)
  - Notion PM sync: `npm run notion-pm:server` (port 3001)
  - Cloudflare tunnel routes:
    - `api.chaycards.com` → Windows `localhost:7243` (backend API)
    - `dev.chaycards.com` → Windows `localhost:3001` (Notion PM sync)
- **Files Changed**:
  - `package.json` - Added "server": "cd server && node index.js" script (line 23)
  - No code changes needed - purely operational/infrastructure issue

### Authentication Flow and Public Page Optimization (October 2, 2025)
- **Fixed Public Page Plugin Loading**: Plugins no longer load on public pages
  - Public pages (/, /login, /register, /setup) skip plugin initialization entirely
  - main.tsx checks page type and only loads theme from localStorage on public pages
  - Eliminates unnecessary 401 errors from plugins trying to access storage without auth
  - AppShell handles plugin loading AFTER auth check passes
- **Centralized Auth Guard**: Single redirect point in AppShell
  - AppShell checks for auth_token before loading plugins
  - No token → redirect to /login (single, clean redirect)
  - Has token → load plugins and initialize storage
  - Eliminates double-redirect issue (plugins + AppShell both redirecting)
- **Theme System Improvements**: Dual storage strategy for universal theme support
  - Public pages: Theme loads from localStorage via publicThemeLoader.ts
  - App pages: Theme loads from user storage with localStorage sync
  - Priority: User storage > localStorage > default theme
  - Theme works on ALL pages without requiring authentication
- **Simplified Plugin Loading Flow**:
  1. Public pages → Load theme from localStorage, render app (no plugins)
  2. App pages → Load theme, render app, AppShell checks auth
  3. Auth pass → AppShell loads plugins and initializes storage
  4. Auth fail → AppShell redirects to /login
- **Files Modified**:
  - `src/main.tsx` - Added public page check, removed premature plugin loading for /app routes
  - `src/renderer/layouts/AppShell.tsx` - Added auth guard before plugin loading
  - `src/utils/publicThemeLoader.ts` - Created standalone theme loader for public pages
  - `src/plugins/core-theme/services/ThemeService.ts` - Implemented dual storage (localStorage + user storage)
  - `src/shared/plugin-system/PluginManager.ts` - Added public page checks (defense-in-depth, not actively used)
  - `src/shared/storage/PostgreSQLAdapter.ts` - Removed auth redirect logic (now in AppShell)

### Cloud Storage Infrastructure Setup Complete (October 1, 2025)
- **Cloudflare Tunnel for API Access**: Production-ready secure tunnel to local database
  - Tunnel name: `chaycards-api` (ID: `6c780a88-8816-46f3-8e89-fd866d5006fd`)
  - DNS: `api.chaycards.com` routes through Cloudflare to local machine
  - Config: Routes to `localhost:7243` (Express server)
  - Enables Lovable preview to access local PostgreSQL database
  - Future-proof: Same setup works for dev → staging → production deployment
- **Express API Server Running**: REST API on port 7243 (uncommon port for security)
  - PostgreSQL REST API with JSONB support
  - Comprehensive CORS configuration for all environments:
    - Lovable domains: `*.lovable.app`, `*.lovable.dev`, `*.lovableproject.com`
    - Production domains: `chaycards.com`, `app.chaycards.com`
    - Localhost: `http://localhost:8080` (dev server)
  - Fixed CORS callback bug: Changed from `callback(new Error(...))` (crashed requests) to `callback(null, false)` (proper rejection)
  - Comprehensive request/response logging for debugging
- **Storage Architecture Simplified**: One URL works everywhere
  - PostgreSQLAdapter hardcoded to `https://api.chaycards.com/api/storage`
  - No more .env file complexity or environment-specific URLs
  - Works identically in local dev, Lovable preview, and future production
  - Removed Vite proxy (no longer needed with Cloudflare Tunnel)
- **Architecture Flow**: `[Any Frontend] → https://api.chaycards.com/api/storage → [Cloudflare Tunnel] → [Local PC: Express:7243] → [PostgreSQL:5433]`
- **Key Learnings**:
  - CORS error handling: Must use `callback(null, false)` to reject, NOT throw errors or use `callback(new Error(...))`
  - Cloudflare Tunnel provides zero-config HTTPS and bypasses firewall issues
  - Hardcoding production URL in adapter enables same code everywhere (dev/preview/production)
  - Detailed logging in PostgreSQLAdapter crucial for debugging network issues
- **Files Modified**:
  - `server/index.js` - Port 7243, fixed CORS handling with proper callback
  - `src/shared/storage/PostgreSQLAdapter.ts` - Hardcoded `https://api.chaycards.com`, added comprehensive logging
  - `vite.config.ts` - Removed proxy configuration (no longer needed)
  - `.env` - Removed (no longer needed)

### Storage Architecture Refactor Complete (October 1, 2025)
- **Separated Theme from Core Settings**: Each plugin now manages its own storage
  - Core settings: `core-settings:app-settings` (storageMode, setupComplete, userId/email, updatedAt)
  - Theme preference: `core-theme:preference` (theme ID string)
  - No more localStorage coupling - everything uses StorageAdapter
- **Database Admin Tools**: Added comprehensive management UI in demo plugin
  - Database viewer showing all storage keys with type, JSON content, and byte size
  - "Reset Database" button to clear all data and restart setup flow
  - Real-time refresh to see storage changes
- **Smart Setup Detection**: Index.tsx checks both SettingsService AND actual storage
  - Handles case where localStorage cleared but SQLite still has data
  - Prevents accidental duplicate users on local storage
  - Auto-loads existing settings from storage on app start
- **Electron UI Polish**: Enhanced desktop experience
  - Custom frameless title bar with Discord/Slack-style window controls
  - TitleBar component with draggable region and minimize/maximize/close buttons
  - Fixed keyboard shortcuts (F12 for DevTools, Ctrl+/-/0 for zoom)
  - Fixed double scrollbar issue (changed min-h-screen to h-full overflow-y-auto)
  - Auto-redirects to first plugin route after login (no more blank page)
- **Storage Initialization Flow**: Proper async loading
  - SettingsService.setStorage() called after storage ready
  - ThemeService.initialize() loads theme from storage
  - Both services persist changes immediately to SQLite/PostgreSQL

### Electron SQLite Setup Complete (September 30, 2025)
- **Windows Development Launcher**: Created one-click `start-electron-windows.bat`
  - Auto-detects if better-sqlite3 needs rebuilding for Electron's Node.js version
  - Activates conda environment to access Python for node-gyp compilation
  - Creates `.electron-rebuilt` marker file to skip rebuild on subsequent runs
  - Validates Vite dev server is running before launching
- **SQLite Storage Working**: Full IPC communication established
  - Database initialized at `%APPDATA%\chaycards\storage.db`
  - All CRUD operations (get/set/delete/list/clear/has) working via IPC
  - Storage adapter properly integrated with PluginManager
  - Data persists between application sessions
- **Plugin Loading Order Fixed**: Storage initialization happens at correct lifecycle point
  - core-settings plugin loads first
  - initializeStorage() called after core-settings but before other plugins
  - Prevents race conditions where plugins try to use storage before it's ready
- **Better-sqlite3 Compilation**: Resolved Node.js version mismatch
  - WSL's better-sqlite3 compiled for regular Node.js (v127)
  - Electron uses embedded Node.js (v139)
  - electron-rebuild recompiles native modules for Electron's version
  - Automated in batch script with conda Python activation

### Electron + WSL Development Setup Fixed (October 2, 2025)
- **CRITICAL FIX: Single node_modules Strategy**: Resolved dual node_modules confusion
  - **Old broken approach**: Maintained separate `node_modules` (WSL/Linux) and `node_modules_win` (Windows) directories
  - **Problem**: Electron version mismatch between directories caused ABI incompatibility (v36.9.3 vs v38.2.0)
  - **Solution**: Use SINGLE `node_modules` with Windows-compiled packages
  - **How it works**:
    - Run `npm install` from **Windows Command Prompt** (NOT WSL)
    - Windows npm installs Windows-compiled native binaries (.node files) to `node_modules`
    - WSL Vite reads JavaScript/TypeScript source files (platform-agnostic)
    - Windows Electron uses Windows-compiled native modules
    - **NO CONFLICT**: They access different parts of node_modules (source vs binaries)
- **Batch Script Updates**: `start-electron-windows.bat` now properly configured
  - Shows Electron version on launch (debugging aid)
  - Deletes old build folder before rebuild (ensures clean compilation)
  - Explicitly passes `--version` flag to electron-rebuild (fixes ABI version detection)
  - Uses `node_modules\.bin\electron.cmd` (removed all node_modules_win references)
- **Database Schema Migration**: Auto-migration from old storage schema
  - Old schema: `storage (key, value)` without user scoping
  - New schema: `storage (key, value, user_id)` with foreign key to users table
  - Migration handled manually via bash commands to recreate database
  - Location: `%APPDATA%\chaycards\storage.db`
- **Key Breakthrough**: Understanding Electron ABI version requirements
  - Electron embeds specific Node.js version with specific ABI (Application Binary Interface)
  - Native modules MUST match this exact ABI version
  - electron-rebuild compiles modules for correct ABI, but must detect correct Electron version
  - Version mismatch (e.g., ABI 135 vs 139) causes "NODE_MODULE_VERSION" errors at runtime

### User Flow Routing Fixed (September 30, 2025)
- **Platform-Specific First Launch**:
  - Electron first-time users: Redirected to `/setup` to choose data model (local/sync/cloud)
  - Web first-time users: Stay on landing page to see features
  - Returning users (both platforms): Go straight to `/app` workspace
- **Setup State Persistence**: Using localStorage for setup completion tracking
  - `chaycards-setup-complete`: Boolean flag
  - `chaycards-user-choice`: Selected data model option
- **Development Mode Detection**: `import.meta.env.DEV` properly separates dev/production
  - Dev panel only visible in development (Lovable testing)
  - Production builds automatically hide dev features

### Plugin System Implementation Complete (September 29, 2025)
- **Core Plugin System**: Successfully implemented complete plugin infrastructure
  - PluginManager singleton with Vite glob imports for automatic plugin discovery
  - EventBus for plugin communication and theme change notifications
  - Pre-React plugin loading in main.tsx to ensure themes apply before component render
- **Theme System Plugin**: Built robust theme system as first plugin validation
  - 7 theme variants: Catppuccin (Latte/Frappé), Dracula, Tokyo Night, Gruvbox, Nord, Rose Pine
  - CSS custom properties system with localStorage persistence
  - Theme selector dropdown integrated into homepage header
  - Event-driven theme changes with real-time updates
  - **Universal Semantic Variables**: Standardized theme variables across all themes
    - 24 semantic variables (background, foreground, primary, secondary, tertiary, states, etc.)
    - Authentic colors from official theme specifications (Catppuccin.com, Dracula, etc.)
    - Plugin-extensible architecture for custom variables
- **Smart Platform Routing**: Enhanced homepage with intelligent user flow
  - Platform detection (Electron vs Web) for deployment-specific routing
  - Desktop: Local/Sync/Cloud storage options in setup page
  - Web: Cloud-first flow with download option for desktop apps
  - LocalStorage setup state persistence for returning users
- **Duolingo-Inspired Design**: Complete visual overhaul with chunky, rounded aesthetic
  - 3D shadow system (--shadow-3d, --shadow-3d-chunky, --shadow-3d-thick)
  - Hover animations with translate-y effects for interactive feedback
  - Colorful feature highlights and gradient buttons
  - Clean typography with generous spacing and text shadows

## Next Steps

### Immediate (High Priority)
1. **Game Plugin Design & Architecture** 🎯 **NEXT PRIORITY**
   - Design game client interface (hooks, events, data flow)
   - Task-to-game-time conversion mechanics
   - Godot server integration strategy (HTTP/WebSocket)
   - Plugin metadata format for game features

2. **Documents Plugin** (core-documents)
   - Document list view with grid/list toggle
   - CRUD operations (create, read, update, delete)
   - Markdown editor integration
   - Use core-ui components (PageHeader, Card, EmptyState)
   - Storage: `core-documents:all-documents` with pure DB pattern

3. **Tasks Plugin** (core-tasks)
   - Task list management
   - Priority/category/status system
   - Game integration hooks (task completion → game time)
   - Uses core-ui DataTable component

### Short Term
1. **Knowledge Plugin** (core-knowledge)
   - Flashcard generation from documents
   - Spaced repetition algorithm
   - Progress tracking and statistics
   - Review session interface

2. **Plugin Marketplace Foundation**
   - Plugin discovery interface
   - Installation/uninstallment flow
   - Plugin metadata standards
   - Version compatibility checking

3. **Testing Infrastructure**
   - Unit tests for PluginManager
   - Integration tests for storage adapters
   - E2E tests for plugin loading
   - Theme system test coverage

### Medium Term
1. AI Assistant Plugin (Live2D integration)
2. MCP Tools Plugin (tool calling integration)
3. Code Sandbox Plugin (Docker execution)
4. Plugin SDK documentation
5. Developer tools plugin
6. Cloud sync implementation

## Active Decisions and Considerations

### Technical Choices
- **Desktop**: Electron (proven, AI-friendly, rich UI support for game)
- **Mobile**: Capacitor (same codebase as web/desktop)
- **Web**: Direct React deployment (existing)
- **Game Server**: Godot headless (single project, HTTP/WebSocket)
- **Package Manager**: npm (not Bun) for consistency
- **Module System**: ES modules for app code, CommonJS for Electron main
- **State Management**: TBD - considering Zustand or Context API
- **Backend**: Express.js shared between local and cloud
- **Storage**: SQLite (local) / PostgreSQL (cloud) with same interface
- **Native Modules**: electron-rebuild for compiling to Electron's Node.js version

### Architecture Patterns
- **Plugin System**: Simple registry-based, like game mods
- **Component Namespacing**: `plugin-id/ComponentName` prevents collisions
- **Dynamic Resolution**: Components resolved at runtime from registry
- **Platform Detection**: Runtime detection, not build-time
- **Frontend-First**: Build UI with mocks, add backend later
- **Smart User Flow**: Platform-aware routing (local-first desktop, cloud-first web)
- **Theme-as-Plugin**: Theme system implemented as first plugin to validate architecture
- **Storage Adapter Pattern**: Same interface for SQLite/PostgreSQL/cloud backends

## Important Patterns and Preferences

### Code Organization
- Platform-specific code isolated in adapters
- Shared business logic in `src/shared/`
- Plugin code completely self-contained
- Clear separation between renderer and main process
- Python backends managed as plugin services

### Electron Development Workflow
- **Dual Environment**: WSL for development (Vite), Windows for Electron testing
- **Node Modules**: WSL modules for web dev, Windows modules copied for Electron
- **Better-sqlite3**: Must be rebuilt for Electron's Node.js version
- **One-Click Testing**: `start-electron-windows.bat` handles all setup automatically
- **Storage Location**: `%APPDATA%\chaycards\storage.db` persists between sessions

### Development Workflow
- Test in both Electron and Web regularly
- Use TypeScript for type safety
- Keep dependencies minimal
- Document architectural decisions
- SQLite for Electron, PostgreSQL for web/cloud

## Learnings and Project Insights

1. **Backend Server Windows Requirement**: Backend API server must run on Windows (not WSL) for Cloudflare tunnel compatibility
2. **WSL vs Windows Network Isolation**: Windows localhost and WSL localhost are different network namespaces - tunnel on Windows cannot reach WSL services
3. **Login JSON Parse Errors**: "JSON.parse: unexpected character" errors often mean server not running - tunnel returns HTML 404 instead of expected JSON response
4. **Multi-Server Development**: Complex projects may need multiple servers (backend API, dev server, PM sync) running simultaneously across environments
5. **Lovable Compatibility**: Must keep gptengineer.js script and lovable-tagger
6. **WSL vs Windows**: Node modules installed in one environment won't work in the other
7. **Native Modules**: better-sqlite3 must be compiled for Electron's specific Node.js version
8. **Python for node-gyp**: Requires Python in PATH; conda activation solves this in batch scripts
9. **One-Click Setup**: Batch script can detect missing setup and auto-rebuild on first run
10. **Storage Lifecycle**: Must initialize storage AFTER core-settings but BEFORE other plugins
11. **User Flow**: Platform detection enables different first-run experiences (setup vs landing)
12. **Development vs Production**: `import.meta.env.DEV` cleanly separates dev/prod features
13. **ES Modules**: Package.json "type": "module" affects all .js files
14. **Plugin Architecture**: Simple is better - like game mods, not enterprise
15. **Theme System**: CSS variable-based theming works excellently with plugin architecture
16. **Component Sharing**: Optional core-ui plugin provides consistency without forcing it
17. **Storage Keys**: Each plugin should own its own storage namespace (e.g., `plugin-id:key-name`)
18. **localStorage vs StorageAdapter**: Only use StorageAdapter - localStorage should be avoided except for pre-storage-init fallbacks
19. **Setup Persistence**: Check actual storage data, not just in-memory flags, to handle localStorage clearing
20. **Electron Title Bar**: Frameless windows (`frame: false`) require custom drag regions (`-webkit-app-region: drag`)
21. **Scrollbar Hierarchy**: Use `h-full overflow-y-auto` on pages, not `min-h-screen`, to prevent double scrollbars
22. **Theme Persistence**: Theme service should manage its own storage key, not rely on settings service
23. **Cloudflare Tunnel**: Provides production-ready HTTPS without certificates, bypasses firewalls, enables local-to-cloud flow
24. **CORS Callbacks**: In Express CORS configuration, use `callback(null, false)` to reject origins, NOT `callback(new Error(...))`
25. **Hardcoded Production URLs**: Simplifies deployment - same code works in dev/preview/production when using production infrastructure
26. **Uncommon Ports**: Using port 7243 instead of common ports (3000, 8000) adds basic security through obscurity
27. **WSL + Windows Shared node_modules**: Single node_modules works for both environments - WSL reads source files, Windows uses native binaries
28. **npm Install Location Matters**: ALWAYS run `npm install` from Windows (not WSL) to ensure Electron gets Windows-compiled native modules
29. **Electron ABI Versioning**: electron-rebuild MUST be passed explicit `--version` flag in dual environments to avoid auto-detection failures
30. **Database Manual Management**: For schema changes, manually recreate databases via bash/sqlite3 commands instead of hardcoding migrations
31. **Public Page Plugin Isolation**: Plugins should NOT load on public pages (/, /login, /register, /setup) to prevent auth errors
32. **Auth Guard Placement**: Check authentication in AppShell BEFORE loading plugins, not after - prevents double redirects
33. **Theme Universal Access**: Theme must work on ALL pages, so use localStorage for public pages and dual storage for app pages
34. **Plugin Loading Timing**: Never load plugins in main.tsx for /app routes - let AppShell handle auth check first, then load plugins
35. **Pure Database Storage**: Eliminate in-memory caches in singleton services - they persist between sessions causing memory leaks
36. **Async Service Pattern**: All storage operations should return Promises - use useState([]) + useEffect in React hooks for async initialization
37. **Client-Side Filtering**: Filter data in UI components with useMemo, not in async service methods - faster and simpler
38. **Source Field Over ID Prefix**: Use explicit `source: 'plugin' | 'custom'` field instead of checking `id.startsWith('custom-')`
39. **Single Source of Truth**: Database is always correct - read from DB, modify in memory, write back to DB (no persistent caches)
40. **Hot Reload Duplicate Prevention**: Check DB for existing data before registering to prevent duplicates on hot reload
41. **User Plugin Preferences**: Store enabled_plugins list in users table, not in generic storage - enables multi-tenant filtering
42. **Core Plugin Protection**: ALWAYS include core plugins in filter results regardless of user preferences - system stability requirement
43. **Plugin Discovery vs Enablement**: Separate discovered plugins (glob import) from enabled plugins (user choice) for proper filtering
44. **Storage Mode Per User**: Allow each user to choose their storage mode (local/cloud/sync) - stored in users table, not app settings
45. **API Endpoint Pattern**: Use `/api/users/me/*` pattern for user-specific data queries (follows REST conventions)
46. **publicSafe Metadata**: Mark plugins that don't need user storage with `publicSafe: true` - enables anonymous user experience
47. **Async Event Handlers**: React event handlers can be async - service methods that access storage return `Promise<T>` and must be awaited
