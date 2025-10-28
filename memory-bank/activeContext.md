# Active Context

## Current Work Focus

### ✅ Completed: Documents Tab System - Routing Architecture Removed

**Status**: ✅ COMPLETE - Fixed navigation bug, removed unnecessary routing infrastructure
**Date**: 2025-10-27

**Major Architecture Fix**: Removed incorrect routing layer from tab system

During implementation, discovered **architectural mismatch** between documentation and actual requirements:
- **Documentation claimed**: Dual access pattern with URL routing, shareable links, DocumentRouter/DocumentViewerWrapper
- **Actual requirement**: Tab-based rendering with per-tab history, NO URL routing

**Architecture Correction - Pure Tab-Based Rendering**:
- ❌ **WRONG (never needed)**: URL routing, DocumentRouter, DocumentViewerWrapper, getViewerRoute()
- ✅ **CORRECT (now implemented)**: Tab-based component rendering, stays at /app/documents

**Core Design Decisions (Updated)**:
1. **localStorage tab state** - Persistent tabs across sessions
2. **Component-based rendering** - PluginManager.getComponent(), NOT React Router
3. **Per-tab history** - Each tab has independent navigation stack with breadcrumb back/forward
4. **Documents stays at /app/documents** - No URL navigation, tabs render plugin viewers directly
5. **Zero plugin burden** - Plugins provide ONE viewer component, no routes needed

**What Was Fixed**:
- ✅ Removed navigation bug in useDocumentTabs.tsx (navigate() call causing page navigation)
- ✅ Deleted DocumentRouter.tsx (not needed for tab rendering)
- ✅ Deleted DocumentViewerWrapper.tsx (context provided in FileBrowser)
- ✅ Removed getViewerRoute() from FileHandler interface
- ✅ Updated systemPatterns.md (removed 400+ lines of incorrect routing docs)
- ✅ Updated core-documents/CLAUDE.md (simplified plugin integration guide)

**Infrastructure Status**:
- ✅ `DocumentViewerContext.ts` - Context interface complete
- ✅ `useDocumentTabs.tsx` - Tab state management with localStorage complete
- ✅ `TabBar.tsx` - Tab UI component complete
- ✅ `types.ts` - DocumentTab interfaces (no pluginRoute field)
- ✅ `FileBrowser.tsx` - Renders plugin viewers in tabs via PluginManager
- ✅ Per-tab history with back/forward controls in breadcrumb

### Documents Plugin - Drag-Drop Refinements Needed

**Status**: Tree-to-grid working, other directions need UX improvements
**Recent Completion**: 2025-10-26

**Current State**:
- ✅ Tree-to-grid drag-drop: WORKING (double execution fixed)
- ⚠️ Grid horizontal insertion: Needs UX improvement (functional but poor feel)
- ⚠️ Tree vertical insertion: Needs UX improvement (functional but poor feel)
- ❌ Grid-to-tree drag-drop: BROKEN/poor UX (opposite direction from tree-to-grid)

**User Feedback**:
- "left and right insert cursor for grid view sucks ass"
- "cursor up down insert for filetree sucks fucking ass"
- "filegrid to filetree sucks fucking ass"

**Technical Context**:
- Used mutual exclusion guards to fix tree-to-grid double execution
- FolderCard and Container drop handlers now check hover state before executing
- Pattern established for preventing simultaneous handler execution

---

## Recent Changes

### Documents Tab System Architecture - October 27, 2025

**Major architectural decision documented** for the Documents plugin tab system. This is a foundational change that affects how users interact with documents and how plugins integrate their viewers.

**What was documented**:

1. **Tab System Pattern** (`systemPatterns.md`):
   - Complete 400+ line documentation of tab system architecture
   - Tab types (grid vs document), state structure, lifecycle management
   - localStorage persistence strategy with validation on restore
   - FileHandler extensions with `getViewerRoute()` method
   - Dual access pattern (embedded vs standalone)
   - Context detection system with DocumentViewerContext
   - Four-location context menu pattern
   - Plugin developer guide with code examples

2. **Plugin Developer Guide** (`core-documents/CLAUDE.md`):
   - Complete 500+ line guide for plugin developers
   - Step-by-step plugin integration guide
   - Context menu patterns and drag-drop system
   - Common patterns and pitfalls to avoid
   - Testing checklist

**Key Design Decisions**:
- **localStorage over URL params** - Clean URLs, persistent state, industry standard
- **Grid view always in tab** - Consistent UX
- **File tree outside tabs** - Always visible
- **Dual access pattern** - Embedded OR standalone

**Implementation Status**: ✅ DOCUMENTED, ⏳ READY TO IMPLEMENT

### Files as Entity Properties Implementation (2025-10-27)
**Status**: ✅ COMPLETE

**What Was Built**:
- Complete "Files as Entity Properties" storage pattern implementation
- Flashcard decks now store file attachments alongside metadata
- Works identically in Electron (filesystem + SQLite) and Cloud (PostgreSQL BYTEA)

**Key Changes**:
1. **FlashcardService Storage Overhaul**:
   - Changed from `storage.get<Deck[]>()` to `storage.get<{data: Deck[], files: Record<string, Uint8Array>}>()`
   - Added `.data` accessor pattern throughout service
   - Prepared infrastructure for deck cover images and card media

2. **Documents Integration**:
   - Decks create proper File records in DocumentsService
   - Full deck JSON stored as file content (not separate storage)
   - FileHandler registered for `.deck` extension

**Benefits Achieved**:
- CASCADE DELETE prevents orphaned files
- Content-based deduplication (Electron)
- Single atomic operations (no multi-step file management)
- Foundation for card media attachments (images, audio)

**Documentation Created**:
- `FILE_STORAGE_IMPLEMENTATION.md` - Complete architecture explanation
- `TEST_FILES_AS_ENTITY_PROPERTIES.md` - Comprehensive test plan
- Updated `FILE_STORAGE_SPEC.md` status to ✅ Complete

### Tree-to-Grid Drag-Drop Double Execution Fix (2025-10-26)
**Status**: ✅ COMPLETE

**Problem**: Dragging folders from tree to grid executed drop handler twice with different parameters

**Root Cause**: Both FolderCard drop handler AND Container drop handler executing simultaneously

**Solution**: Added mutual exclusion guards based on hover state
- FolderCard: Only executes when `dropIndicatorRef.current === 'into'` (blue ring visible)
- Container: Only executes when `containerInsertionIndex !== null` (before/after indicator visible)

**Testing Results**:
- ✅ Tree-to-grid drops work correctly
- ✅ No more flashing behavior
- ✅ Folders go to correct parent
- ✅ Single backend call per drop operation

**Files Modified**:
- `src/plugins/core-documents/components/FileBrowser.tsx` (2 guard additions)

### Optimistic UI Performance Improvements (2025-10-22)
**Status**: ✅ COMPLETE

**Changes Made**:
- Optimistic folder moves update local tree state immediately
- Backend persistence happens asynchronously
- Refetch triggers after backend confirms success
- Visual feedback instant, no perceived lag

**Pattern Established**:
```typescript
// 1. Update local state
setLocalTree(updateTreeAfterMove(tree, folderId, newParentId, index));

// 2. Persist to backend
await documentsService.moveToPosition(folderId, newParentId, index);

// 3. Trigger refetch to sync
setTreeRefetchKey(prev => prev + 1);
```

### Dual-Pane Architecture Research (2025-10-20)
**Status**: Research complete, pattern established

**Findings**:
- FolderTree (sidebar) uses react-arborist for drag-drop
- FileBrowser main view uses custom folder cards with drag-drop
- Virtual root node `__ALL_FILES__` represents root level
- Both views sync via shared DocumentsService backend

**Key Pattern**:
- Tree provides hierarchical navigation with drag-drop
- Main view provides detailed grid/list visualization
- Optimistic updates keep both views in sync

### Drag-Drop Research (2025-10-19)
**Status**: Research validated, patterns documented

**Critical Findings**:
- setState in onDragOver prevents onDrop from firing (confirmed by multiple sources)
- Best practice: Use onDragEnter/onDragLeave (discrete events) for state updates
- Performance: Discrete events = 2 re-renders vs 60 re-renders/sec with onDragOver

**Validated Pattern**:
```typescript
// ✅ CORRECT - Discrete events
onDragEnter={() => setHovering(true)}
onDragLeave={() => setHovering(false)}

// ❌ WRONG - Continuous events
onDragOver={() => setHovering(true)}  // Prevents onDrop!
```

### Documents Plugin Sidebar Tree (2025-10-17)
**Status**: ✅ COMPLETE

**Implementation**:
- react-arborist integration for folder tree
- Three-dot menus on folders (Create, Rename, Delete, Change Color)
- Drag-drop within tree working reliably
- Custom cursor component for drop indicators

**Files Created/Modified**:
- `FolderTree.tsx` - Tree component with react-arborist
- `FileBrowser.tsx` - Main integration point
- All CRUD operations working through DocumentsService

---

## Next Steps

### Immediate (High Priority)

1. **Resolve Plugin Storage Architecture** 🎯 **CURRENT**
   - Decision: Align with documented pattern or update docs?
   - If aligning: Refactor flashcard storage to use Documents-centric pattern
   - If diverging: Document the dual-storage "virtual file" pattern officially

2. **Fix Grid-to-Tree Drag-Drop**
   - Investigate why opposite direction from tree-to-grid fails
   - Apply similar mutual exclusion guard pattern
   - Test thoroughly with various drop targets

3. **Improve Drag-Drop UX**
   - Refine horizontal insertion indicators for grid view
   - Refine vertical insertion indicators for tree view
   - Consider different visual feedback (not just cursors)

### Short Term

1. **Flashcard Deck Viewer**
   - Implement DeckView component registered via FileHandler
   - Card study interface
   - Progress tracking

2. **Card Media Attachments**
   - Attach images to card fronts/backs
   - Audio attachments for pronunciation
   - Uses Files as Entity Properties pattern

3. **Anki Import**
   - Import .apkg files
   - Preserve media files
   - Create deck files in Documents

---

## Active Decisions and Considerations

### Technical Choices
- **Desktop**: Electron (proven, AI-friendly, rich UI support)
- **Mobile**: Capacitor (same codebase as web/desktop)
- **Web**: Direct React deployment
- **Package Manager**: npm (not Bun) for consistency
- **Module System**: ES modules for app code, CommonJS for Electron main
- **Backend**: Express.js shared between local and cloud
- **Storage**: SQLite (local) / PostgreSQL (cloud) with same interface

### Architecture Patterns
- **Plugin System**: Simple registry-based, like game mods
- **Component Namespacing**: `plugin-id/ComponentName` prevents collisions
- **Dynamic Resolution**: Components resolved at runtime from registry
- **Platform Detection**: Runtime detection, not build-time
- **Storage Adapter Pattern**: Same interface for SQLite/PostgreSQL/cloud backends
- **Files as Entity Properties**: Files stored as properties of entities, CASCADE DELETE

### Current Architectural Questions

1. **Plugin-Documents Storage Integration**:
   - Should plugins maintain separate storage and link to Documents (current)?
   - Or should plugins store ALL content IN Documents (documented)?
   - Trade-offs: Flexibility vs simplicity, separation vs integration

2. **Drag-Drop Library Choice**:
   - react-arborist for tree (chosen, working well)
   - Custom implementation for grid (working but UX needs refinement)
   - Consider dnd-kit for grid? Or refine custom approach?

---

## Important Patterns and Preferences

### Code Organization
- Platform-specific code isolated in adapters
- Shared business logic in `src/shared/`
- Plugin code completely self-contained
- Clear separation between renderer and main process

### Electron Development Workflow
- **Dual Environment**: WSL for development (Vite), Windows for Electron testing
- **Node Modules**: Single node_modules with Windows-compiled native binaries
- **Better-sqlite3**: Must be rebuilt for Electron's Node.js version
- **One-Click Testing**: `start-electron-windows.bat` handles all setup automatically
- **Storage Location**: `%APPDATA%\chaycards\storage.db` persists between sessions

### Development Workflow
- Test in both Electron and Web regularly
- Use TypeScript for type safety
- Keep dependencies minimal
- Document architectural decisions
- SQLite for Electron, PostgreSQL for web/cloud

### Git Workflow Preferences

**CRITICAL USER PREFERENCE**: When user says "commit", **ALWAYS stage ALL changed files** without asking.

- **Default behavior**: Use `git add .` or `git add -A` to stage everything
- **No selective staging**: Don't ask which files to include - stage them all
- **User expectation**: "commit" means commit everything that changed
- **Only exception**: User explicitly specifies files to commit (rare)

---

## Key Learnings

### Storage Architecture
- **Pure Database Storage**: Eliminate in-memory caches in singleton services - they persist between sessions causing memory leaks
- **Single Source of Truth**: Database is always correct - read from DB, modify in memory, write back to DB
- **Async Service Pattern**: All storage operations should return Promises
- **Files as Entity Properties**: Attach files to entities as properties, let CASCADE DELETE handle cleanup

### Drag-Drop Implementation
- **setState in onDragOver**: Breaks onDrop - use onDragEnter/onDragLeave instead
- **Mutual Exclusion Guards**: Check hover state before executing drop handlers
- **Optimistic Updates**: Update local state immediately, persist async, refetch to confirm

### Platform Development
- **WSL + Windows Shared node_modules**: Single node_modules works - WSL reads source, Windows uses binaries
- **npm Install Location Matters**: ALWAYS run `npm install` from Windows for Electron compatibility
- **Electron ABI Versioning**: electron-rebuild MUST be passed explicit `--version` flag

### Plugin Architecture
- **Public Page Plugin Isolation**: Plugins should NOT load on public pages to prevent auth errors
- **Auth Guard Placement**: Check authentication in AppShell BEFORE loading plugins
- **Storage Keys**: Each plugin should own its own storage namespace (e.g., `plugin-id:key-name`)
- **publicSafe Metadata**: Mark plugins that don't need user storage with `publicSafe: true`

---

## Historical Archive

For historical work from September-October 2025, see:
- `memory-bank/archive/2025-09-september-work.md` - Sept 29-30 entries
- `memory-bank/archive/2025-10-foundation-work.md` - Oct 1-10 foundation infrastructure
