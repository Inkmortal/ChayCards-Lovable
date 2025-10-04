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

**Storage Keys:**
```typescript
// File index (list of all files)
buildPluginStorageKey('core-documents', 'files') → StoredFile[]

// Individual file content (for files < 1MB)
buildPluginStorageKey('core-documents', `file:${id}`) → { ...metadata, content }

// Chunked file storage (for files > 1MB)
buildPluginStorageKey('core-documents', `file:${id}:meta`) → metadata
buildPluginStorageKey('core-documents', `file:${id}:chunk:0`) → Blob
buildPluginStorageKey('core-documents', `file:${id}:chunk:1`) → Blob
```

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

**Upload Flow:**
```typescript
async function uploadFile(file: File): Promise<StoredFile> {
  // 1. Read file metadata
  const metadata = {
    filename: file.name,
    extension: getExtension(file.name),
    mimeType: file.type,
    size: file.size
  };

  // 2. Check if handler exists
  const handler = findHandlerForFile(metadata);
  if (!handler) {
    throw new Error('No plugin can handle this file type');
  }

  // 3. Read file content
  const content = await file.arrayBuffer();

  // 4. Store in Documents storage
  const storedFile: StoredFile = {
    id: generateUUID(),
    ...metadata,
    content: new Blob([content]),
    metadata: {
      tags: [],
      handler: handler.displayName
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 5. Save to storage
  await saveFile(storedFile);

  // 6. Emit event
  eventBus.emit('file:uploaded', { file: storedFile });

  return storedFile;
}
```

**Large File Handling:**
```typescript
// Files > 10MB stored in chunks
const CHUNK_SIZE = 1MB * 5; // 5MB chunks

async function saveFileChunked(file: StoredFile) {
  // Save metadata separately
  await storage.set(
    buildPluginStorageKey('core-documents', `file:${file.id}:meta`),
    { ...file, content: undefined }  // No content in metadata
  );

  // Save content in chunks
  const chunks = splitIntoChunks(file.content, CHUNK_SIZE);
  for (let i = 0; i < chunks.length; i++) {
    await storage.set(
      buildPluginStorageKey('core-documents', `file:${file.id}:chunk:${i}`),
      chunks[i]
    );
  }
}
```

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
- [Storage Architecture](../systemPatterns.md#storage-architecture)
- [Flashcards Plugin Spec](FLASHCARDS_PLUGIN_SPEC.md) *(to be created)*
- [Markdown Plugin Spec](MARKDOWN_PLUGIN_SPEC.md) *(to be created)*