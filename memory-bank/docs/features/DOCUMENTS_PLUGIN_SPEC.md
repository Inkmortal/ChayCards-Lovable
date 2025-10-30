# Documents Plugin Specification

## Overview

The Documents plugin is ChayCards' **universal file management system** - Google Drive on crack, infinitely extensible through plugins.

**Core Purpose**: Store, organize, and manage FILES of any type. Documents is completely agnostic about file content - it just handles:
- File storage (local SQLite or cloud PostgreSQL)
- Folder hierarchies
- Metadata and tagging
- Search and discovery
- File operations (upload, download, move, delete)

**Critical Architectural Principle**:
- **Documents Plugin** = File system (storage + organization)
- **Content Plugins** = File type handlers (viewers + editors)
- **Complete Separation**: Documents stores bytes, plugins interpret meaning

**Analogy**:
```
Google Drive stores files → Apps open them (Docs, Sheets, Slides)
Documents stores files  → Plugins open them (Markdown, Flashcards, Kanban)
```

---

## User Experience Vision

### What Users Can Do

#### File Management (Documents Responsibility)
- **Upload** files via drag-and-drop or file picker
- **Create** new files (if plugins provide templates)
- **Organize** into nested folder structures
- **Tag** files for cross-cutting organization
- **Search** by name, tags, metadata, or content (if indexed)
- **Preview** files (if plugin provides viewer)
- **Download** files back to local disk
- **Move/Copy** files between folders
- **Bulk operations** on multiple files
- **Filter** by file type, date, size, tags

#### File Type Rendering (Plugin Responsibility)
When user opens a file, Documents:
1. Checks file extension (.md, .flashcard.json, .pdf, etc.)
2. Looks up registered handler from plugins
3. Loads the appropriate viewer/editor component
4. Renders plugin UI with file content

**Supported File Types (via plugins)**:
- `.md`, `.markdown`, `.txt` → Markdown plugin
- `.flashcard.json` → Flashcards plugin
- `.kanban.json` → Kanban plugin
- `.png`, `.jpg`, `.gif` → Image viewer plugin
- `.pdf` → PDF viewer plugin
- `.mp4`, `.webm` → Video player plugin
- **Any custom format a plugin wants to handle**

---

## User Interface & Interaction Design

### Tab-Based Workspace Layout

Documents plugin uses a **tab-based workspace** (like VS Code, Notion, browser tabs) for multi-document workflows:

```
┌──────────────────────────────────────────────────────────────┐
│ [Tree]        │ [📁 Grid] [📄 Deck.deck] [📝 Notes.md] [+]  │
│               ├──────────────────────────────────────────────┤
│ 📁 Projects   │  Active Tab Content:                         │
│   📁 ChayCards│  - Grid tab: File/folder grid view          │
│   📄 README   │  - Document tab: Plugin viewer/editor       │
│ 📁 Archive    │                                              │
│ 📁 Personal   │  Each tab has own breadcrumb                 │
│               │  Tabs persist via localStorage               │
└──────────────────────────────────────────────────────────────┘
     ↑                            ↑
  Always visible         Tab bar + tab content
  file tree              (grid OR document viewer)
```

**Key Differences from Traditional Two-Panel**:
- **Grid view is a tab** (not the "main view")
- **Multiple tabs open simultaneously** (keep multiple files open)
- **File tree outside tabs** (provides persistent navigation context)
- **Tabs persist across sessions** (localStorage-based state)

See [DOCUMENTS_TAB_SYSTEM.md](DOCUMENTS_TAB_SYSTEM.md) for complete tab architecture.

### Navigation Tree (Left Panel)

**Purpose**: Hierarchical folder/file browser for quick navigation and organization.

**Core Features**:
- Unified tree showing folders AND files together
- Expand/collapse folders (chevron icons)
- Select folder → main view shows contents
- Whole row draggable (no separate drag handle needed)
- Multi-select with Cmd/Ctrl+Click
- Visual hierarchy with indentation (16px per level)

**Visual Design**:
```
┌─────────────────────────────────┐
│ FILES & FOLDERS          [≡]    │ ← Header with collapse button
├─────────────────────────────────┤
│ 📁 Projects              (3)    │ ← Folder (count of children)
│   📁 ChayCards                  │ ← Nested folder (expanded)
│     📄 README.md      2.5 KB    │ ← File with size
│     📄 package.json   1.2 KB    │
│   📁 Archive           (12)     │ ← Collapsed folder
│ 📁 Personal                     │
│   📄 Notes.md         4.8 KB    │
└─────────────────────────────────┘
```

**Sizing**:
- Folder rows: 44px height (larger drop target)
- File rows: 36px height
- Icons: Folders 20px (w/ custom color), Files 16px (gray)
- Indentation: 16px per nesting level
- Chevrons: 14px (before folder icon)

#### Drag & Drop Interaction

**Option A: Immediate Backend Persistence** (Chosen approach)

**Flow**:
1. User drags folder/file
2. Original item fades to 30% opacity (stays in place - no tree reflow)
3. Ghost follows cursor (semi-transparent preview)
4. Drop zones highlight as cursor moves
5. User drops → show loading spinner on item
6. Backend API call (insertBefore/insertAfter/makeChild)
7. Success → remove spinner, tree refetches from backend
8. Failure → item snaps back, error toast

**Drop Zones** (Visual feedback):

```
Folder (3 zones):
┌────────────────────┐
│ ← 15% "before"     │ ← 2px blue line
├────────────────────┤
│                    │
│   70% "into"       │ ← Blue background + ring-4
│                    │
├────────────────────┤
│ ← 15% "after"      │ ← 2px blue line
└────────────────────┘

File (2 zones):
┌────────────────────┐
│   50% "before"     │ ← 2px blue line at midpoint
├────────────────────┤
│   50% "after"      │
└────────────────────┘
```

**Drop Zone Detection**:
- Cursor Y position relative to item bounds
- Folders: 15% top = before, 15% bottom = after, 70% middle = into
- Files: 50/50 split (no "into" zone - files can't contain children)

**Hover-to-Expand** (Deep navigation while dragging):
- Hover over collapsed folder with "into" drop zone for 750ms
- Folder auto-expands after timer completes
- Allows navigating into deep hierarchies without releasing drag
- Visual feedback: Subtle progress ring on folder icon (fills clockwise)
- Timer resets if cursor leaves "into" zone

**Multi-Select Dragging**:
- Cmd+Click (Mac) / Ctrl+Click (Windows) → Add to selection
- Shift+Click → Range select
- Drag any selected item → All selected items move together
- Ghost shows count badge: "3 items"
- All items inserted at target location in current order

**Keyboard Shortcuts**:
- Ctrl+Z → Undo last move
- Ctrl+Shift+Z / Ctrl+Y → Redo
- Arrow Up/Down → Navigate items
- Arrow Right → Expand folder
- Arrow Left → Collapse folder (or move to parent)
- Enter → Select folder
- Space → Toggle multi-select

**Mobile Touch**:
- Long-press (500ms) to start drag
- Haptic feedback on drag start (if available)
- Visual pulse animation during long-press countdown
- Touch-optimized drop zones (20/60/20 for folders instead of 15/70/15)

#### Cross-Panel Drag & Drop

**CRITICAL FEATURE**: Drag between navigation tree ↔ main content view

**Use Cases**:

**1. Tree → Main View** (Move to current folder):
```
User drags folder from tree → drops into main content area
  ↓
Folder moves to currently selected folder
  ↓
Both tree and main view update to reflect new location
```

**2. Main View → Tree** (Organize into folder):
```
User drags file card from main grid → drops onto folder in tree
  ↓
File moves into target folder
  ↓
Main view removes file (no longer in current folder)
Tree updates to show file under target folder (if expanded)
```

**3. Main View → Tree Root** (Move to top level):
```
User drags folder from main view → drops at tree root area
  ↓
Folder becomes root-level folder
  ↓
Appears in both tree and main view root
```

**Drop Zones for Cross-Panel**:
- **Tree** acts as drop targets (folder rows highlight)
- **Main view content area** acts as drop target (entire area highlights - "Move to current folder")
- **Main view empty space** at bottom (for when grid isn't full) - large drop zone

**Visual Feedback**:
- Valid drop target: Blue border/background highlight
- Invalid drop: Red border + cursor changes to 🚫
- Drop hint text: "Move to Projects folder" (tooltip near cursor)

### Main Content View (Right Panel)

**Purpose**: Display contents of selected folder with rich file previews and organization tools.

**View Modes**:

**Grid View** (default):
```
┌─────────────────────────────────────────────────────────┐
│ [Search] [Filter▾] [Sort▾] [Grid⬛/List☰] [Upload ↑]   │
├─────────────────────────────────────────────────────────┤
│ Projects > ChayCards                 3 files, 2 folders │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ 📁     │  │ 📁     │  │ 📄     │  │ 📄     │       │
│  │Archive │  │ src    │  │README  │  │package │       │
│  │        │  │        │  │        │  │        │       │
│  │ 12 ⋯   │  │ 45 ⋯   │  │ 2.5 KB │  │ 1.2 KB │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                          │
│  [Drop files here to upload]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**List View**:
```
┌─────────────────────────────────────────────────────────┐
│ Name              Type        Size      Modified         │
├─────────────────────────────────────────────────────────┤
│ 📁 Archive       Folder      12 items  2 days ago       │
│ 📁 src           Folder      45 items  1 hour ago       │
│ 📄 README.md     Markdown    2.5 KB    3 hours ago      │
│ 📄 package.json  JSON        1.2 KB    Yesterday        │
└─────────────────────────────────────────────────────────┘
```

**Drag & Drop in Main View**:

**Upload from Desktop**:
- Drag file from desktop → Drop anywhere in main view
- File uploads to currently selected folder
- Progress indicator during upload
- File card appears when complete

**Reorder Within Folder**:
- Drag file card → drop between other cards
- Manual ordering within same folder
- Visual insertion line shows where it will land

**Move to Different Folder**:
- Drag file card → drop on folder card in main view OR
- Drag file card → drop on folder in navigation tree
- Cross-panel drag & drop!

**Selection & Bulk Operations**:
- Click to select file
- Cmd/Ctrl+Click → Multi-select
- Shift+Click → Range select
- Selected items have blue border + checkmark
- Bulk actions: Move, Delete, Tag, Download as ZIP

**Context Menu** (Right-click):
```
┌───────────────────────┐
│ Open                  │
│ Open with...      ►   │ ← Shows available handlers
│ ───────────────────   │
│ Cut                   │
│ Copy                  │
│ Paste                 │
│ ───────────────────   │
│ Rename                │
│ Move to...        ►   │ ← Folder picker
│ Add tags...           │
│ ───────────────────   │
│ Download              │
│ Share...              │
│ ───────────────────   │
│ Delete                │
└───────────────────────┘
```

### Breadcrumb Navigation (Per-Tab)

**Location**: Inside each tab (both grid tabs and document tabs)

**Purpose**: Show where current view/file is located in folder hierarchy

**Grid Tab Breadcrumb**:
```
All Documents > Projects > ChayCards > src > components
    ^click          ^click      ^click      ^click
```
- Shows current folder path
- Click any segment → Navigate to that folder
- Updates when navigating folders within tab

**Document Tab Breadcrumb**:
```
All Documents > Projects > ChayCards > Deck.deck
                                       └── (file lives here)
```
- Shows where file is stored (not editable)
- Provides context: "This file lives in ChayCards folder"
- Click folder segments → Switch to grid tab showing that folder

**Key Pattern**: Each tab remembers its location independently

### Empty States

**No Files in Folder**:
```
┌─────────────────────────────────────────┐
│                                         │
│         📁                              │
│    This folder is empty                │
│                                         │
│  [Upload Files] or drag files here     │
│                                         │
└─────────────────────────────────────────┘
```

**No Search Results**:
```
┌─────────────────────────────────────────┐
│         🔍                              │
│    No files found for "vacation"       │
│                                         │
│    Try different search terms          │
└─────────────────────────────────────────┘
```

**First Time User**:
```
┌─────────────────────────────────────────┐
│         📂                              │
│   Welcome to Documents!                │
│                                         │
│  Upload your first file to get started │
│     [Choose File] [Create Folder]      │
│                                         │
│  Or try our demo files to explore      │
└─────────────────────────────────────────┘
```

### Loading States

**During Move Operation**:
- Spinner appears inline on item being moved (tree or main view)
- Other UI remains interactive
- If operation fails → item returns to original position + error toast

**During Upload**:
- Progress bar on upload zone
- File card appears with loading state (blurred thumbnail)
- Transitions to final state when complete

**During Initial Load**:
- Skeleton cards in grid (shimmer animation)
- Skeleton tree items (3-4 placeholder rows)

### Error States

**Failed Upload**:
```
┌────────────────────────────────┐
│ ⚠️ Upload failed               │
│ large-video.mp4 (2.3 GB)      │
│                                │
│ File exceeds 500 MB limit     │
│ [Try Again] [Cancel]          │
└────────────────────────────────┘
```

**Failed Move**:
Toast notification (bottom-right):
```
❌ Failed to move "Report.pdf"
   Cannot move into own subfolder
   [Undo] [×]
```

**Network Error**:
```
⚠️ Connection lost
   Changes will sync when reconnected
```

### Accessibility

**Keyboard Navigation**:
- Tab through tree items and file cards
- Arrow keys navigate within views
- Enter opens file/folder
- Space toggles selection
- Delete key removes selected items (with confirmation)

**Screen Reader**:
- ARIA labels on all interactive elements
- Live region announcements for drag & drop operations
- Role="tree" for navigation tree, role="grid" for file grid
- Announced: "Moved Report.pdf to Projects folder"

**Focus Management**:
- Clear focus indicators (blue outline)
- Focus returns to moved item after drop
- Focus trap in modals (file viewer, delete confirmation)

---

## User Workflows

### Workflow 1: Uploading Files
```
User drags "vacation-photos.zip" from desktop into Documents
  ↓
Documents extracts metadata:
  - filename: "vacation-photos.zip"
  - size: 45MB
  - mimeType: "application/zip"
  ↓
Checks for .zip handler → ZIP plugin registered
  ↓
Stores file in storage (chunks if > 10MB)
  ↓
File appears in Documents browser with ZIP icon
  ↓
User clicks file → ZIP plugin shows archive contents
  ↓
User can extract files, preview images inside, etc.
```

### Workflow 2: Creating New Files from Templates
```
User clicks "New File" in Documents
  ↓
Documents shows dropdown of available file types:
  - Markdown Note (markdown plugin)
  - Flashcard Deck (flashcards plugin)
  - Kanban Board (kanban plugin)
  ↓
User selects "Flashcard Deck"
  ↓
Flashcards plugin provides default template:
  {
    "version": "1.0",
    "cards": []
  }
  ↓
Documents creates file "Untitled Flashcard Deck.flashcard.json"
  ↓
Opens in Flashcards editor
  ↓
User edits, auto-saves back to Documents storage
```

### Workflow 3: Cross-Plugin File Usage
```
User has markdown file "JavaScript Notes.md"
  ↓
Opens in Markdown editor
  ↓
Highlights text: "What is a closure?"
  ↓
Right-click → "Create Flashcard from Selection"
  ↓
Flashcards plugin:
  1. Creates new file "JavaScript Closure.flashcard.json"
  2. Stores in Documents under same folder
  3. Links back to source markdown file in metadata
  ↓
File now visible in:
  - Documents browser (as .flashcard.json file)
  - Flashcards plugin's dedicated view
  - Markdown plugin's "Related Files" sidebar
  ↓
Any plugin can reference files stored in Documents
```

---

## Core Features

### 1. File Storage Schema

```typescript
interface StoredFile {
  id: string;              // UUID
  filename: string;        // "My Notes.md", "Flashcards.flashcard.json"
  extension: string;       // ".md", ".flashcard.json", ".pdf"
  mimeType: string;        // "text/markdown", "application/json"
  size: number;            // Bytes

  content: Blob | string;  // Raw file bytes or text

  metadata: {
    // User-managed
    tags: string[];
    description?: string;

    // System-managed
    wordCount?: number;     // For text files
    dimensions?: { w: number, h: number }; // For images
    duration?: number;      // For videos/audio

    // Plugin-specific
    [key: string]: any;     // Flashcards plugin adds reviewCount, etc.
  };

  folderId?: string;        // Parent folder
  linkedFiles?: string[];   // Related file IDs

  createdAt: number;
  updatedAt: number;
  accessedAt: number;       // Last opened
  uploadedBy?: string;      // User ID (multi-user future)
}
```

**Storage Keys (Current Implementation - Dual-Storage Pattern):**
```typescript
// Metadata index (list of all documents with metadata)
buildPluginStorageKey('core-documents', 'files') → StoredFile[]

// Individual file content (stored separately from metadata)
buildPluginStorageKey('core-documents', `files/${fileId}`) → Uint8Array

// Linking: StoredFile.fileStorageKey points to content key
// Example:
// Metadata: { id: 'abc-123', filename: 'Report.pdf', fileStorageKey: 'core-documents:files/abc-123', ... }
// Content:  'core-documents:files/abc-123' → Uint8Array(pdf bytes)
```

**Migration Plan (Files as Entity Properties - After Phase 1):**
```typescript
// Future: Unified storage (metadata + files together)
await storage.set('core-documents:doc:abc-123',
  { filename: 'Report.pdf', size: 1024, ... },  // Metadata
  { content: pdfBytes }                         // File content
);

// Benefits:
// - Single storage call (atomic operation)
// - Automatic CASCADE DELETE (no orphaned files)
// - No manual fileStorageKey linking needed
```

**Note**: Current implementation uses dual-storage pattern (metadata array + separate file content) for simplicity during MVP development. This will be migrated to the Files as Entity Properties pattern (see `/memory-bank/docs/FILE_STORAGE_SPEC.md`) after Phase 1 implementation completes.

### 2. File Type Handler Registry

Plugins register themselves as handlers for specific file types:

```typescript
interface FileHandler {
  extensions: string[];     // ['.md', '.markdown', '.txt']
  mimeTypes: string[];      // ['text/markdown', 'text/plain']
  viewerComponent?: string; // 'markdown/MarkdownViewer'
  editorComponent?: string; // 'markdown/MarkdownEditor'
  icon: string;             // Lucide icon name
  displayName: string;      // "Markdown Note"
  canCreate: boolean;       // Show in "New File" menu
  defaultTemplate?: string | object; // Default file content
  canImport?: boolean;      // Show in import wizard
}

// Example: Flashcards plugin registration
manager.registerFileHandler({
  extensions: ['.flashcard.json', '.flashcard'],
  mimeTypes: ['application/x-flashcard+json'],
  viewerComponent: 'core-flashcards/StudyView',
  editorComponent: 'core-flashcards/FlashcardEditor',
  icon: 'Brain',
  displayName: 'Flashcard Deck',
  canCreate: true,
  defaultTemplate: {
    version: '1.0',
    cards: [],
    settings: { cardsPerSession: 20 }
  }
});

// Example: Image viewer plugin registration
manager.registerFileHandler({
  extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  mimeTypes: ['image/*'],
  viewerComponent: 'image-viewer/ImageViewer',
  editorComponent: null,  // View-only, no editing
  icon: 'Image',
  displayName: 'Image',
  canCreate: false  // Can't create blank images
});
```

**NO built-in handlers** - Even markdown is a plugin!

### 3. Folder Organization

```typescript
interface Folder {
  id: string;
  name: string;
  parentId?: string;  // null = root level
  color?: string;     // Visual distinction
  icon?: string;      // Custom folder icon
  metadata: {
    fileCount: number;   // Cached for performance
    totalSize: number;   // Sum of file sizes
    lastModified: number;
  };
}
```

**Folder Features:**
- Unlimited nesting depth
- Drag-and-drop file/folder reorganization
- Collapse/expand state persistence
- Folder-level permissions (future)
- Shared folders (future)

### 4. File Upload & Storage

**Upload Sources:**
1. **Drag-and-drop** from desktop/file manager
2. **File picker** dialog
3. **Paste from clipboard** (images, text)
4. **Plugin API** (programmatic creation)
5. **Import wizard** (bulk upload)

**Upload Flow (Current Implementation):**
```typescript
async function uploadFile(file: File, options: UploadOptions): Promise<StoredFile> {
  const fileId = crypto.randomUUID();
  const extension = getExtension(file.name);

  // 1. Create metadata object
  const metadata: StoredFile = {
    id: fileId,
    filename: file.name,
    extension,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    fileStorageKey: buildPluginStorageKey('core-documents', `files/${fileId}`),
    folderId: options.folderId || null,
    tags: options.tags || [],
    metadata: options.metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    accessedAt: Date.now()
  };

  // 2. Save file content (Dual-Storage Pattern)
  const arrayBuffer = await file.arrayBuffer();
  await storage.set(metadata.fileStorageKey, new Uint8Array(arrayBuffer));

  // 3. Update metadata index (JSON Storage)
  cachedFiles.push(metadata);
  await storage.set(buildPluginStorageKey('core-documents', 'files'), cachedFiles);

  // 4. Emit event
  eventBus.emit('document:created', { file: metadata });

  return metadata;
}

// Future: Files as Entity Properties (simpler!)
async function uploadFile_Future(file: File, options: UploadOptions): Promise<StoredFile> {
  const fileId = crypto.randomUUID();
  const metadata = { filename: file.name, size: file.size, ... };
  const content = new Uint8Array(await file.arrayBuffer());

  // Single atomic operation - no manual linking needed
  await storage.set(`core-documents:doc:${fileId}`,
    metadata,
    { content }  // Files as properties
  );

  return { id: fileId, ...metadata };
}
```

**Large File Handling (Future - Phase 5):**

**Current Limitation**: Files of any size stored as single Uint8Array. No chunking implemented yet.

**Planned Implementation** (when user demand exists):
```typescript
// Future: Files > 10MB stored in chunks
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function saveFileChunked(file: StoredFile) {
  // With Files as Entity Properties API:
  const chunks = splitIntoChunks(file.content, CHUNK_SIZE);
  const fileChunks: Record<string, Uint8Array> = {};

  for (let i = 0; i < chunks.length; i++) {
    fileChunks[`chunk_${i}`] = chunks[i];
  }

  await storage.set(`core-documents:doc:${file.id}`,
    { ...metadata, chunkCount: chunks.length },
    fileChunks  // Multiple file properties: chunk_0, chunk_1, chunk_2, etc.
  );
}
```

**Note**: MVP uses single-storage approach for simplicity. Chunking adds complexity and is only needed for very large files (videos, high-res images). Will implement if users request it.

### 5. Search & Discovery

**Search Capabilities:**
- **Filename search**: Fast prefix/fuzzy matching
- **Tag search**: Filter by single or multiple tags
- **Metadata search**: Query plugin-specific metadata
- **Content search**: Full-text if file is text-based
- **Date filters**: Created/modified date ranges
- **Size filters**: Find large files
- **Type filters**: Filter by file extension/handler

**Search Syntax Examples:**
```
filename:vacation                 # Files with "vacation" in name
tag:#important tag:#work          # Multiple tags (AND)
ext:.md ext:.txt                  # Multiple extensions (OR)
size:>10mb                        # Files larger than 10MB
created:last-week                 # Recent files
folder:"/Work/Projects"           # Files in specific folder
```

**Smart Suggestions:**
- "Recently opened" (from accessedAt timestamp)
- "Large files" (size > threshold)
- "Unused files" (not accessed in X days)
- "Related files" (via linkedFiles references)

### 6. File Linking & Relationships

```typescript
interface FileLink {
  sourceId: string;    // File A
  targetId: string;    // File B
  linkType: string;    // 'references', 'derived-from', 'related-to'
  metadata?: object;   // Link-specific data
}

// Example: Markdown file links to flashcard file
{
  sourceId: 'markdown-123',
  targetId: 'flashcard-456',
  linkType: 'generated-from',
  metadata: {
    selectedText: 'What is a closure?',
    timestamp: 1735862400000
  }
}
```

**Link Features:**
- Bidirectional backlinks
- Graph visualization
- Broken link detection
- Link suggestions based on content similarity

---

## Technical Architecture

### Service Layer

#### DocumentsService
Core file management operations:

```typescript
class DocumentsService {
  private storage: StorageAdapter | null = null;
  private files: StoredFile[] = [];
  private fileHandlers = new Map<string, FileHandler>();

  // Storage integration
  async initialize(storage: StorageAdapter): Promise<void>

  // File operations
  async uploadFile(file: File): Promise<StoredFile>
  async createFile(template: Partial<StoredFile>): Promise<StoredFile>
  async getFile(id: string): Promise<StoredFile | null>
  async updateFile(id: string, changes: Partial<StoredFile>): Promise<StoredFile>
  async deleteFile(id: string): Promise<void>
  async downloadFile(id: string): Promise<Blob>

  // Query operations
  async getAllFiles(): Promise<StoredFile[]>
  async getFilesByFolder(folderId: string): Promise<StoredFile[]>
  async getFilesByTag(tag: string): Promise<StoredFile[]>
  async getFilesByExtension(ext: string): Promise<StoredFile[]>
  async searchFiles(query: string): Promise<StoredFile[]>

  // Handler registry
  registerFileHandler(handler: FileHandler): void
  getHandlerForFile(file: StoredFile): FileHandler | null
  getHandlerForExtension(ext: string): FileHandler | null
  getAllHandlers(): FileHandler[]
}
```

### Component Architecture

#### FileBrowser
Main file browsing interface:

**Views:**
- Grid view (thumbnails with filename)
- List view (detailed file info)
- Gallery view (large image previews)

**Features:**
- Multi-select with shift/ctrl
- Drag-and-drop file upload
- Drag-and-drop file organization
- Context menu (right-click actions)
- Keyboard navigation (arrows, enter, delete)

#### FileViewer
Dynamic viewer that loads plugin components:

```typescript
const FileViewer = ({ fileId }) => {
  const manager = PluginManager.getInstance();
  const docsService = manager.getService('core-documents/documentsService');
  const [file, setFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    docsService.getFile(fileId).then(setFile);
  }, [fileId]);

  if (!file) return <Loading />;

  // Get handler for this file type
  const handler = docsService.getHandlerForFile(file);
  if (!handler) {
    return <UnsupportedFileType file={file} />;
  }

  // Load plugin viewer component
  const ViewerComponent = manager.getComponent(handler.viewerComponent);
  if (!ViewerComponent) {
    return <HandlerNotFound handler={handler} />;
  }

  return (
    <ViewerComponent
      file={file}
      onUpdate={(changes) => docsService.updateFile(file.id, changes)}
    />
  );
};
```

#### FolderTree
Hierarchical folder navigation:

**Features:**
- Collapse/expand folders
- Drag-and-drop to move files
- Right-click folder actions
- Folder creation/rename/delete
- Breadcrumb navigation

---

## Event System

Documents emits events for plugins to react:

```typescript
// File lifecycle
'file:uploaded' → { file: StoredFile }
'file:created' → { file: StoredFile }
'file:updated' → { fileId: string, changes: object }
'file:deleted' → { fileId: string }
'file:moved' → { fileId: string, fromFolder: string, toFolder: string }

// File interaction
'file:opened' → { fileId: string, handler: FileHandler }
'file:downloaded' → { fileId: string }

// Registry
'documents:ready' → { documentsService: DocumentsService }
'handler:registered' → { handler: FileHandler }

// Folder operations
'folder:created' → { folder: Folder }
'folder:deleted' → { folderId: string }
```

**Example: Flashcards Plugin Listening**
```typescript
eventBus.on('file:created', async ({ file }) => {
  if (file.extension === '.md') {
    // Analyze markdown for potential flashcards
    const content = await documentsService.getFile(file.id);
    const suggestions = analyzeForFlashcards(content);

    if (suggestions.length > 0) {
      notify(`Found ${suggestions.length} potential flashcards in this file`);
    }
  }
});
```

---

## Extension Patterns

### Pattern 1: Registering a File Handler

```typescript
// Flashcards plugin onLoad:
onLoad: async (manager) => {
  const docsService = manager.getService('core-documents/documentsService');

  docsService.registerFileHandler({
    extensions: ['.flashcard.json'],
    mimeTypes: ['application/x-flashcard+json'],
    viewerComponent: 'core-flashcards/StudyView',
    editorComponent: 'core-flashcards/FlashcardEditor',
    icon: 'Brain',
    displayName: 'Flashcard Deck',
    canCreate: true,
    defaultTemplate: {
      version: '1.0',
      cards: []
    }
  });
}
```

### Pattern 2: Creating Files Programmatically

```typescript
// Plugin creates file on behalf of user
const docsService = manager.getService('core-documents/documentsService');

const newFile = await docsService.createFile({
  filename: 'JavaScript Closures.flashcard.json',
  extension: '.flashcard.json',
  mimeType: 'application/x-flashcard+json',
  content: JSON.stringify({
    version: '1.0',
    cards: [
      {
        front: 'What is a closure?',
        back: 'A function that remembers its lexical scope...'
      }
    ]
  }),
  metadata: {
    tags: ['javascript', 'concepts'],
    generatedFrom: sourceMarkdownFileId
  },
  folderId: currentFolderId
});
```

### Pattern 3: Enhancing File Cards

```typescript
// AI plugin adds intelligence to file previews
const OriginalFileCard = manager.getComponent('core-documents/FileCard');

const EnhancedFileCard = ({ file, ...props }) => (
  <div>
    <AISmartTags file={file} />
    <OriginalFileCard file={file} {...props} />
    <AIRelatedFiles fileId={file.id} />
  </div>
);

manager.setComponent('core-documents/FileCard', EnhancedFileCard);
```

---

## Implementation Phases

### Phase 1: Core Storage (MVP)
- [ ] File CRUD operations
- [ ] Basic storage integration (< 1MB files)
- [ ] File metadata schema
- [ ] Storage key patterns

### Phase 2: File Browser
- [ ] Grid view file browser
- [ ] Folder tree navigation
- [ ] File upload (drag-and-drop)
- [ ] Basic search (filename only)

### Phase 3: Handler System
- [ ] FileHandler registry
- [ ] Dynamic viewer loading
- [ ] "New File" menu from handlers
- [ ] Fallback for unknown file types

### Phase 4: Organization
- [ ] Tagging system
- [ ] Advanced search (tags, metadata)
- [ ] Bulk operations
- [ ] File linking

### Phase 5: Large Files
- [ ] Chunked file storage (> 10MB)
- [ ] Progress bars for uploads
- [ ] Streaming downloads
- [ ] Thumbnail generation

### Phase 6: Intelligence
- [ ] Content indexing for search
- [ ] Smart suggestions
- [ ] Graph visualization
- [ ] AI-powered tagging

---

## Open Design Questions

### Q1: File versioning strategy?
**Options**:
- A) No versioning (simplest, MVP)
- B) Snapshot on save (storage-heavy)
- C) Differential versioning (complex but efficient)

**Recommendation**: Start with A, add B later if users request.

### Q2: Maximum file size limit?
**Recommendation**:
- Warn at 50MB
- Hard limit at 500MB
- Suggest external storage (S3/R2) for larger files

### Q3: File sharing/permissions?
**Current Answer**: Not in MVP. All files private. Add in multi-user phase.

### Q4: Import/export formats?
**Essential**:
- Native format (.zip of all files)
- Individual file download

**Nice-to-have**:
- Notion database import
- Obsidian vault import
- Google Drive sync

### Q5: Thumbnail generation?
**Recommendation**:
- Images: Auto-generate on upload
- PDFs: First page thumbnail
- Videos: Frame at 10% duration
- Custom: Let plugins provide thumbnail component

---

## Success Metrics

### Storage Performance
- File upload time < 500ms (for < 1MB files)
- File retrieval time < 100ms
- Search results < 200ms
- No data corruption incidents

### User Adoption
- Files uploaded per week
- Average file size
- Most common file types
- Plugin handler usage distribution

### Plugin Ecosystem
- Number of file handlers registered
- Diversity of file types supported
- Handler usage frequency

---

## Related Documentation
- [Plugin System Architecture](PLUGIN_SYSTEM.md)
- [Storage Patterns](../../patterns/storage/) - Storage implementation patterns
- [Flashcards Plugin Spec](FLASHCARDS_PLUGIN_SPEC.md) *(to be created)*
- [Markdown Plugin Spec](MARKDOWN_PLUGIN_SPEC.md) *(to be created)*