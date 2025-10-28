# Documents Plugin - Data Model & Architecture

## Overview

This document defines the **data model**, **service layer architecture**, and **API contracts** for the Documents Plugin. It incorporates the dual-storage pattern (JSON + File Storage) while abstracting complexity behind a clean service API.

---

## Design Principles

### 1. Service Layer Abstraction
**Problem:** Forcing plugin developers to manage both JSON metadata storage AND file content storage is error-prone.

**Solution:** DocumentsService provides high-level methods that handle both automatically.

```typescript
// ❌ BAD: Plugin developers manage dual storage
await storage.set('metadata', { id, filename, ... });
await storage.setFile('content', fileData, { ... });

// ✅ GOOD: Service handles complexity
await documentsService.saveDocument(file, { folderId, tags });
```

### 2. Metadata Separation
**Metadata (JSON Storage):** Fast queries, filtering, search
**Content (File Storage):** Binary files, large data

```
List 1000 files → Query JSON metadata (fast)
Open 1 file → Load file content (only when needed)
```

### 3. Plugin Extensibility
- **DocumentCard:** Generic layout with plugin injection points
- **Context Menus:** Plugins can add custom menu items
- **File Handlers:** Plugins register viewers/editors for file types
- **Folder Validation:** Windows-like rules (unique names per parent)

---

## Core Data Structures

### StoredFile (Metadata)

```typescript
interface StoredFile {
  // Identity
  id: string;                    // UUID
  filename: string;              // "My Notes.md", "Photo.png"
  extension: string;             // ".md", ".png", ".pdf"
  mimeType: string;              // "text/markdown", "image/png"
  size: number;                  // Bytes

  // Storage Reference (Internal - Service manages this)
  fileStorageKey: string;        // "core-documents:files/abc123"

  // Organization
  folderId: string | null;       // Parent folder (null = root)
  tags: string[];                // ["work", "important"]

  // Metadata
  metadata: {
    description?: string;

    // Handler-specific metadata (added by plugins)
    // Markdown plugin adds: { wordCount: 1500, headings: [...] }
    // Image plugin adds: { width: 1920, height: 1080 }
    [key: string]: any;
  };

  // Timestamps
  createdAt: number;             // Unix timestamp (milliseconds)
  updatedAt: number;
  accessedAt: number;            // Last opened

  // Relationships
  linkedFiles?: string[];        // IDs of related files
}

// Storage Location:
// buildPluginStorageKey('core-documents', 'files') → StoredFile[]
```

### Folder

```typescript
interface Folder {
  // Identity
  id: string;                    // UUID
  name: string;                  // "Work", "Projects", "Photos"
  parentId: string | null;       // null = root level

  // Visual Customization
  color?: string;                // Hex color (#FF5733)
  icon?: string;                 // Lucide icon name ("Folder", "Briefcase")

  // Cached Metadata (for performance)
  metadata: {
    fileCount: number;           // Number of files in folder
    totalSize: number;           // Sum of file sizes (bytes)
    lastModified: number;        // Most recent file update
  };

  // UI State (persisted)
  isExpanded: boolean;           // Collapse/expand state
  order: number;                 // Custom ordering (drag-to-reorder)
}

// Validation Rules:
// 1. Unlimited nesting depth
// 2. Unique names within same parent (case-insensitive)
// 3. No circular references (folder can't be its own ancestor)

// Storage Location:
// buildPluginStorageKey('core-documents', 'folders') → Folder[]
```

### FileHandler (Plugin Registry)

```typescript
interface FileHandler {
  // Identity
  id: string;                    // "markdown-handler", "pdf-viewer"
  pluginId: string;              // "core-markdown", "pdf-viewer-plugin"

  // File Type Matching
  extensions: string[];          // [".md", ".markdown", ".txt"]
  mimeTypes: string[];           // ["text/markdown", "text/plain"]

  // UI Components (namespaced plugin components)
  viewerComponent?: string;      // "core-markdown/MarkdownViewer"
  editorComponent?: string;      // "core-markdown/MarkdownEditor"
  previewComponent?: string;     // "core-markdown/MarkdownPreview" (for cards)

  // Display
  icon: string;                  // Lucide icon name ("FileText", "Image")
  displayName: string;           // "Markdown Document"
  color?: string;                // Badge/accent color (#3B82F6)

  // Capabilities
  canCreate: boolean;            // Show in "New File" menu
  canEdit: boolean;              // Has editor component
  supportsPreview: boolean;      // Can show inline preview in card

  // Template for New Files
  defaultTemplate?: string | object;

  // Context Menu Items (plugin-specific actions)
  contextMenuItems?: ContextMenuItem[];

  // NEW - Tab System Integration (REQUIRED for document tabs)
  getViewerRoute: (fileId: string) => string;  // "/app/flashcards/deck/123"

  // Optional settings modal component (opened from tab context menu)
  settingsComponent?: string;    // "core-flashcards/DeckSettings"
}

// Storage Location:
// Registered in-memory via DocumentsService.registerFileHandler()
// Not persisted (registered on plugin load)

// Example Registration:
// {
//   id: 'flashcard-deck-handler',
//   pluginId: 'core-flashcards',
//   extensions: ['.deck'],
//   getViewerRoute: (fileId) => `/app/flashcards/deck/${fileId}`,
//   settingsComponent: 'core-flashcards/DeckSettings',
//   // ... other fields
// }
```

### ContextMenuItem (Extensible Right-Click Menu)

```typescript
interface ContextMenuItem {
  id: string;                    // "open", "rename", "delete", "convert-to-pdf"
  label: string;                 // "Open", "Rename", "Delete", "Convert to PDF"
  icon?: string;                 // Lucide icon name
  onClick: (fileId: string) => void | Promise<void>;

  // Visual Options
  divider?: boolean;             // Show divider above this item
  dangerous?: boolean;           // Red text (for destructive actions)
  shortcut?: string;             // "Ctrl+O", "Del"

  // Metadata
  pluginId?: string;             // Track which plugin added this item
  order?: number;                // Custom ordering (lower = higher)
}

// Default Context Menu Items (Documents plugin provides):
// - Open
// - Rename
// - Move to folder...
// - Add tags...
// - ---
// - Delete
// - Properties

// Plugin-Added Items:
// - Markdown plugin: "Edit", "Export to PDF"
// - Flashcards plugin: "Generate flashcards from this"
// - Image plugin: "Set as avatar", "Edit in..."
```

### DocumentCard (Generic Layout with Plugin Injection)

```typescript
interface DocumentCardProps {
  file: StoredFile;

  // Generic Layout (Documents plugin provides)
  header: {
    icon: ReactNode;             // File type icon
    title: string;               // Filename
    subtitle?: string;           // File path or description
    badge?: ReactNode;           // Plugin can inject status badges
  };

  // Preview Area (Plugin-specific)
  preview?: ReactNode;           // Plugin provides preview component

  // Footer
  footer: {
    metadata: string;            // "Modified 2 days ago • 45 KB"
    actions?: ReactNode;         // Plugin-specific quick actions
  };

  // Interactions
  onClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isDragging?: boolean;
}

// Usage Pattern:
// 1. Documents plugin provides base card layout
// 2. File handler plugin injects preview component
// 3. Other plugins can wrap card to add features
```

---

## Service Layer API

### DocumentsService (High-Level API)

Plugin developers interact with DocumentsService, NOT raw storage.

```typescript
class DocumentsService {
  // ============================================
  // FILE OPERATIONS
  // ============================================

  /**
   * Save a file (metadata + content)
   * Handles both JSON storage and File storage internally
   */
  async saveDocument(file: File, options: SaveDocumentOptions): Promise<StoredFile>

  interface SaveDocumentOptions {
    folderId?: string | null;    // Parent folder
    tags?: string[];             // Initial tags
    metadata?: Record<string, any>; // Handler-specific metadata
    linkedFiles?: string[];      // Related file IDs
  }

  /**
   * Get a file (metadata + content)
   * Returns both together, updates access time
   */
  async getDocument(fileId: string): Promise<{
    metadata: StoredFile;
    content: Blob;
  } | null>

  /**
   * Update file metadata and/or content
   * Only provided fields are updated
   */
  async updateDocument(fileId: string, updates: {
    file?: File;                 // New file content (replaces existing)
    filename?: string;           // Rename file
    folderId?: string | null;    // Move to different folder
    tags?: string[];             // Replace tags
    metadata?: Record<string, any>; // Merge with existing metadata
  }): Promise<void>

  /**
   * Delete a file (metadata + content)
   * Cleans up both storage locations
   */
  async deleteDocument(fileId: string): Promise<void>

  // ============================================
  // QUERY OPERATIONS (Fast - metadata only)
  // ============================================

  /**
   * List all files (metadata only, no content)
   */
  async listDocuments(): Promise<StoredFile[]>

  /**
   * Get files in specific folder
   */
  async getDocumentsByFolder(folderId: string | null): Promise<StoredFile[]>

  /**
   * Get files with specific tag
   */
  async getDocumentsByTag(tag: string): Promise<StoredFile[]>

  /**
   * Get files by extension
   */
  async getDocumentsByExtension(ext: string): Promise<StoredFile[]>

  /**
   * Search files by filename or tags
   */
  async searchDocuments(query: string, filters?: SearchFilters): Promise<StoredFile[]>

  interface SearchFilters {
    tags?: string[];             // Filter by tags (AND)
    extensions?: string[];       // Filter by extension (OR)
    dateRange?: {
      start: number;
      end: number;
    };
    sizeRange?: {
      min: number;
      max: number;
    };
    folderId?: string | null;    // Search within folder
  }

  // ============================================
  // FOLDER OPERATIONS
  // ============================================

  /**
   * Create a new folder
   * Validates unique name within parent
   */
  async createFolder(name: string, parentId?: string | null): Promise<Folder>

  /**
   * Get folder by ID
   */
  async getFolder(folderId: string): Promise<Folder | null>

  /**
   * List all folders
   */
  async listFolders(): Promise<Folder[]>

  /**
   * Get folder tree (nested structure)
   */
  async getFolderTree(): Promise<FolderTreeNode[]>

  interface FolderTreeNode {
    folder: Folder;
    children: FolderTreeNode[];
    depth: number;
  }

  /**
   * Update folder metadata
   */
  async updateFolder(folderId: string, updates: {
    name?: string;               // Validates uniqueness
    parentId?: string | null;    // Move to different parent
    color?: string;
    icon?: string;
    isExpanded?: boolean;
  }): Promise<void>

  /**
   * Delete folder (and all contents recursively)
   * WARNING: Destructive operation
   */
  async deleteFolder(folderId: string, options?: {
    recursive?: boolean;         // Delete contents (default: false)
    moveContentsTo?: string;     // Move contents to another folder
  }): Promise<void>

  /**
   * Validate folder name
   * Checks uniqueness within parent
   */
  validateFolderName(name: string, parentId: string | null): Promise<{
    valid: boolean;
    error?: string;
  }>

  // ============================================
  // FILE HANDLER REGISTRY
  // ============================================

  /**
   * Register a file type handler (called by plugins)
   */
  registerFileHandler(handler: FileHandler): void

  /**
   * Get handler for specific file
   */
  getHandlerForFile(file: StoredFile): FileHandler | null

  /**
   * Get handler by extension
   */
  getHandlerForExtension(ext: string): FileHandler | null

  /**
   * Get all registered handlers
   */
  getAllHandlers(): FileHandler[]

  /**
   * Get handlers that can create new files
   */
  getCreatableHandlers(): FileHandler[]
}
```

---

## Storage Pattern (Internal Implementation)

**Plugin developers don't need to know this** - DocumentsService handles it.

### JSON Storage (Metadata)

```typescript
// All file metadata in single array
const METADATA_KEY = buildPluginStorageKey('core-documents', 'files');
await storage.set<StoredFile[]>(METADATA_KEY, files);

// All folder data in single array
const FOLDERS_KEY = buildPluginStorageKey('core-documents', 'folders');
await storage.set<Folder[]>(FOLDERS_KEY, folders);
```

**Benefits:**
- Fast queries (no file content loaded)
- Simple structure (single array)
- Easy to filter/search/sort

### File Storage (Content)

```typescript
// Each file stored separately
const fileKey = buildPluginStorageKey('core-documents', `files/${fileId}`);
await storage.setFile(fileKey, fileData, {
  mimeType: file.type,
  fileName: file.name,
  pluginId: 'core-documents'
});
```

**Benefits:**
- Large files don't slow down metadata queries
- Content loaded only when needed
- Chunking support for large files (future)

---

## Folder Validation Rules

### Windows-Like Behavior

```typescript
// Rule 1: Unique names within same parent (case-insensitive)
validateFolderName("Work", null) → ✅ valid
validateFolderName("work", null) → ❌ "Folder 'work' already exists"

// Rule 2: Unlimited nesting
/Work/Projects/ChayCards/Docs/Spec → ✅ valid (5 levels deep)

// Rule 3: No circular references
moveFolder("A", "A") → ❌ "Cannot move folder into itself"
moveFolder("A", "A/B") → ❌ "Cannot move folder into its own child"

// Rule 4: Valid characters (same as Windows)
validateFolderName("New Folder") → ✅ valid
validateFolderName("Folder<>:") → ❌ "Invalid characters: < > :"

// Rule 5: Empty names not allowed
validateFolderName("") → ❌ "Folder name cannot be empty"
validateFolderName("   ") → ❌ "Folder name cannot be only whitespace"
```

### Validation Implementation

```typescript
async validateFolderName(name: string, parentId: string | null): Promise<ValidationResult> {
  // 1. Check empty/whitespace
  if (!name.trim()) {
    return { valid: false, error: 'Folder name cannot be empty' };
  }

  // 2. Check invalid characters
  const invalidChars = /[<>:"|?*\\\/]/g;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Folder name contains invalid characters' };
  }

  // 3. Check uniqueness (case-insensitive)
  const folders = await this.listFolders();
  const siblings = folders.filter(f => f.parentId === parentId);
  const duplicate = siblings.find(f =>
    f.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    return { valid: false, error: `Folder '${name}' already exists` };
  }

  return { valid: true };
}
```

---

## Event System

DocumentsService emits events for plugin reactivity:

```typescript
// File Lifecycle
EventBus.emit('file:uploaded', { file: StoredFile });
EventBus.emit('file:created', { file: StoredFile });
EventBus.emit('file:updated', { fileId: string, updates: object });
EventBus.emit('file:deleted', { fileId: string });
EventBus.emit('file:moved', { fileId: string, fromFolder: string, toFolder: string });

// File Interaction
EventBus.emit('file:opened', { fileId: string, handler: FileHandler });
EventBus.emit('file:downloaded', { fileId: string });

// Folder Operations
EventBus.emit('folder:created', { folder: Folder });
EventBus.emit('folder:updated', { folderId: string, updates: object });
EventBus.emit('folder:deleted', { folderId: string });

// Registry
EventBus.emit('documents:ready', { documentsService: DocumentsService });
EventBus.emit('handler:registered', { handler: FileHandler });
```

### Plugin Event Usage

```typescript
// Flashcards plugin listens for markdown files
EventBus.on('file:created', async ({ file }) => {
  if (file.extension === '.md') {
    const { content } = await documentsService.getDocument(file.id);
    const suggestions = analyzeForFlashcards(content);

    if (suggestions.length > 0) {
      notify(`Found ${suggestions.length} potential flashcards`);
    }
  }
});

// AI plugin enhances file cards
EventBus.on('documents:ready', ({ documentsService }) => {
  // Wrap file card to add AI features
  const OriginalCard = PluginManager.getInstance()
    .getComponent('core-documents/FileCard');

  const AIEnhancedCard = ({ file, ...props }) => (
    <>
      <AITagSuggestions file={file} />
      <OriginalCard file={file} {...props} />
      <AIRelatedFiles fileId={file.id} />
    </>
  );

  PluginManager.getInstance()
    .setComponent('core-documents/FileCard', AIEnhancedCard);
});
```

---

## Context Menu Extensibility

### Default Menu (Documents Plugin)

```typescript
const DEFAULT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: 'open',
    label: 'Open',
    icon: 'ExternalLink',
    onClick: (fileId) => openFile(fileId),
    shortcut: 'Enter'
  },
  {
    id: 'rename',
    label: 'Rename',
    icon: 'Edit',
    onClick: (fileId) => showRenameDialog(fileId),
    shortcut: 'F2'
  },
  {
    id: 'move',
    label: 'Move to folder...',
    icon: 'FolderInput',
    onClick: (fileId) => showMoveDialog(fileId)
  },
  {
    id: 'tags',
    label: 'Add tags...',
    icon: 'Tags',
    onClick: (fileId) => showTagDialog(fileId)
  },
  {
    id: 'divider-1',
    label: '',
    divider: true
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'Trash2',
    onClick: (fileId) => deleteFile(fileId),
    dangerous: true,
    shortcut: 'Del'
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: 'Info',
    onClick: (fileId) => showProperties(fileId),
    shortcut: 'Alt+Enter'
  }
];
```

### Plugin Adding Menu Items

```typescript
// Markdown plugin adds custom actions
const markdownHandler: FileHandler = {
  id: 'markdown-handler',
  // ... other fields

  contextMenuItems: [
    {
      id: 'edit-markdown',
      label: 'Edit',
      icon: 'FileEdit',
      onClick: (fileId) => openMarkdownEditor(fileId),
      pluginId: 'core-markdown',
      order: 1  // Appears near top
    },
    {
      id: 'export-pdf',
      label: 'Export to PDF',
      icon: 'FileDown',
      onClick: (fileId) => exportToPDF(fileId),
      pluginId: 'core-markdown',
      order: 20
    }
  ]
};

// Context menu merges default + plugin items
function buildContextMenu(file: StoredFile): ContextMenuItem[] {
  const handler = documentsService.getHandlerForFile(file);
  const pluginItems = handler?.contextMenuItems || [];

  return [
    ...DEFAULT_MENU_ITEMS,
    ...pluginItems
  ].sort((a, b) => (a.order || 100) - (b.order || 100));
}
```

---

## Card Rendering System

### Architecture Overview

The Documents Plugin provides a **generic card layout** while **plugins inject preview components** for different file types. This creates a consistent UI while allowing extensibility.

**Key Concept:** Documents owns the card shell, plugins provide the preview content.

```typescript
┌─────────────────────────────────────────┐
│ FileCard (Documents Plugin)             │
│ ┌─────────────────────────────────────┐ │
│ │ Header: Icon, Title, Menu (Generic) │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Preview Area (Plugin-Specific)      │ │
│ │ MarkdownPreview / ImagePreview /    │ │
│ │ PDFPreview / DefaultIcon            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Footer: Metadata, Tags (Generic)    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### FileCard Component

```typescript
// Documents Plugin provides base card
const FileCard: React.FC<{ file: StoredFile }> = ({ file }) => {
  const documentsService = useService<DocumentsService>('core-documents');

  // 1. Look up file handler based on extension/mimeType
  const handler = documentsService.getHandlerForFile(file);

  // 2. Load plugin preview component if available
  const PreviewComponent = handler?.previewComponent
    ? PluginManager.getInstance().getComponent(handler.previewComponent)
    : null;

  return (
    <Card className="file-card">
      {/* Generic Header */}
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileIcon type={file.extension} /> {/* Generic icon */}
          <h3>{file.filename}</h3>
        </div>
        <ContextMenu file={file} handler={handler} />
      </CardHeader>

      {/* Plugin-Specific Preview */}
      <CardContent>
        {PreviewComponent ? (
          <PreviewComponent file={file} />
        ) : (
          <DefaultFileIcon extension={file.extension} size="large" />
        )}
      </CardContent>

      {/* Generic Footer */}
      <CardFooter>
        <div className="metadata">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{formatRelativeTime(file.updatedAt)}</span>
        </div>
        <div className="tags">
          {file.tags.map(tag => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};
```

### Handler Registration Examples

**Markdown Plugin:**
```typescript
// core-markdown plugin registers handler
const markdownHandler: FileHandler = {
  id: 'markdown-handler',
  pluginId: 'core-markdown',
  extensions: ['.md', '.markdown'],
  mimeTypes: ['text/markdown'],

  // Components (namespaced strings)
  viewerComponent: 'core-markdown/MarkdownViewer',
  editorComponent: 'core-markdown/MarkdownEditor',
  previewComponent: 'core-markdown/MarkdownPreview', // Used in FileCard

  icon: 'FileText',
  displayName: 'Markdown Document',
  color: '#3B82F6',
  canCreate: true,
  canEdit: true,
  supportsPreview: true
};

documentsService.registerFileHandler(markdownHandler);

// Preview component implementation
export const MarkdownPreview: React.FC<{ file: StoredFile }> = ({ file }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    async function loadPreview() {
      const { content } = await documentsService.getDocument(file.id);
      const text = await content.text();

      // Show first 3 lines as preview
      const lines = text.split('\n').slice(0, 3);
      setPreview(lines.join('\n'));
    }
    loadPreview();
  }, [file.id]);

  return (
    <div className="markdown-preview">
      <ReactMarkdown>{preview}</ReactMarkdown>
      <div className="fade-overlay" />
    </div>
  );
};
```

**Image Plugin:**
```typescript
const imageHandler: FileHandler = {
  id: 'image-handler',
  pluginId: 'core-images',
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  viewerComponent: 'core-images/ImageViewer',
  previewComponent: 'core-images/ImagePreview',

  icon: 'Image',
  displayName: 'Image',
  canCreate: false,
  canEdit: false,
  supportsPreview: true
};

export const ImagePreview: React.FC<{ file: StoredFile }> = ({ file }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      const { content } = await documentsService.getDocument(file.id);
      const url = URL.createObjectURL(content);
      setImageUrl(url);
    }
    loadImage();

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [file.id]);

  return (
    <div className="image-preview">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={file.filename}
          className="object-cover w-full h-full"
        />
      ) : (
        <Skeleton className="w-full h-full" />
      )}
    </div>
  );
};
```

**PDF Plugin:**
```typescript
const pdfHandler: FileHandler = {
  id: 'pdf-handler',
  pluginId: 'core-pdfs',
  extensions: ['.pdf'],
  mimeTypes: ['application/pdf'],

  viewerComponent: 'core-pdfs/PDFViewer',
  previewComponent: 'core-pdfs/PDFPreview',

  icon: 'FileType',
  displayName: 'PDF Document',
  canCreate: false,
  canEdit: false,
  supportsPreview: true
};

export const PDFPreview: React.FC<{ file: StoredFile }> = ({ file }) => {
  return (
    <div className="pdf-preview">
      <FileType className="w-16 h-16 text-red-500" />
      <p className="text-sm text-muted-foreground mt-2">
        {file.metadata.pageCount || '—'} pages
      </p>
    </div>
  );
};
```

### Visual Example

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Notes.md        │  │ Photo.jpg       │  │ Report.pdf      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ # JavaScript    │  │    [Image]      │  │     [PDF]       │
│ Closures are... │  │   [Thumbnail]   │  │   15 pages      │
│ Functions that  │  │                 │  │                 │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ 15 KB • 2d ago  │  │ 2.3 MB • 5d ago │  │ 450 KB • 1w ago │
│ [programming]   │  │ [photos]        │  │ [work]          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
    Markdown             Image               PDF
    Preview            Preview             Preview
```

### Component Lookup Flow

```typescript
// Step-by-step process when FileCard renders

// 1. FileCard receives StoredFile
<FileCard file={{
  id: '1',
  filename: 'Notes.md',
  extension: '.md',
  mimeType: 'text/markdown'
}} />

// 2. DocumentsService looks up handler
const handler = documentsService.getHandlerForFile(file);
// Returns: markdownHandler (registered by core-markdown plugin)

// 3. Extract preview component name
const componentName = handler.previewComponent;
// Returns: 'core-markdown/MarkdownPreview'

// 4. PluginManager loads component
const PreviewComponent = PluginManager.getInstance()
  .getComponent('core-markdown/MarkdownPreview');
// Returns: MarkdownPreview React component

// 5. Render preview inside card
<CardContent>
  <PreviewComponent file={file} />
</CardContent>
// Renders: Markdown preview with first 3 lines

// 6. Preview component loads file content
const { content } = await documentsService.getDocument(file.id);
// Loads actual markdown content from File Storage

// 7. Display preview
<ReactMarkdown>{preview}</ReactMarkdown>
// Shows rendered markdown in card

// 8. User clicks card → Opens full viewer
onClick={() => openFileViewer(file, handler)}
// Opens MarkdownViewer (full-screen editor)
```

### Fallback for Unsupported Files

```typescript
// If no handler registered for .xyz extension
const DefaultFileIcon: React.FC<{ extension: string }> = ({ extension }) => {
  return (
    <div className="unsupported-preview">
      <FileQuestion className="w-16 h-16 text-muted-foreground" />
      <p className="text-sm mt-2">
        {extension.toUpperCase().slice(1)} File
      </p>
      <p className="text-xs text-muted-foreground">
        No preview available
      </p>
    </div>
  );
};
```

### Multiple Handlers for Same File Type

```typescript
// Documents Service returns PRIMARY handler
getHandlerForFile(file: StoredFile): FileHandler | null {
  // 1. Check by extension
  const handlers = this.getAllHandlers()
    .filter(h => h.extensions.includes(file.extension));

  // 2. Return first registered (plugins can override)
  return handlers[0] || null;
}

// User can choose alternative handler via context menu
<ContextMenuItem
  label="Open with..."
  onClick={(fileId) => showHandlerPicker(fileId)}
>
  <ContextMenuSub>
    {handlers.map(handler => (
      <ContextMenuItem
        key={handler.id}
        label={handler.displayName}
        onClick={() => openWith(fileId, handler)}
      />
    ))}
  </ContextMenuSub>
</ContextMenuItem>
```

### Plugin Wrapping Cards

```typescript
// Other plugins can wrap FileCard to add features
EventBus.on('documents:ready', ({ documentsService }) => {
  const OriginalCard = PluginManager.getInstance()
    .getComponent('core-documents/FileCard');

  // AI plugin adds smart suggestions
  const AIEnhancedCard: React.FC<{ file: StoredFile }> = (props) => (
    <div className="ai-enhanced">
      <AITagSuggestions file={props.file} />
      <OriginalCard {...props} />
      <AIRelatedFiles fileId={props.file.id} />
    </div>
  );

  PluginManager.getInstance()
    .setComponent('core-documents/FileCard', AIEnhancedCard);
});
```

---

## Mock Data Pattern

For frontend development, create realistic mock data:

```typescript
// Mock Files
const mockFiles: StoredFile[] = [
  {
    id: '1',
    filename: 'JavaScript Notes.md',
    extension: '.md',
    mimeType: 'text/markdown',
    size: 15420,
    fileStorageKey: 'core-documents:files/1',
    folderId: 'work-folder',
    tags: ['programming', 'javascript'],
    metadata: {
      description: 'Study notes for JavaScript closures and async',
      wordCount: 1542,
      headings: ['Closures', 'Async/Await', 'Promises']
    },
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 86400000,  // 1 day ago
    accessedAt: Date.now() - 3600000   // 1 hour ago
  },
  {
    id: '2',
    filename: 'Vacation Photos.zip',
    extension: '.zip',
    mimeType: 'application/zip',
    size: 45000000, // 45 MB
    fileStorageKey: 'core-documents:files/2',
    folderId: 'personal-folder',
    tags: ['photos', 'vacation', '2024'],
    metadata: {
      description: 'Hawaii trip photos',
      fileCount: 127,
      compressed: true
    },
    createdAt: Date.now() - 604800000, // 1 week ago
    updatedAt: Date.now() - 604800000,
    accessedAt: Date.now() - 259200000  // 3 days ago
  }
];

// Mock Folders
const mockFolders: Folder[] = [
  {
    id: 'work-folder',
    name: 'Work',
    parentId: null,
    color: '#3B82F6',
    icon: 'Briefcase',
    metadata: {
      fileCount: 15,
      totalSize: 2500000,
      lastModified: Date.now() - 86400000
    },
    isExpanded: true,
    order: 1
  },
  {
    id: 'projects-folder',
    name: 'Projects',
    parentId: 'work-folder',
    icon: 'FolderGit2',
    metadata: {
      fileCount: 8,
      totalSize: 1200000,
      lastModified: Date.now() - 172800000
    },
    isExpanded: true,
    order: 1
  },
  {
    id: 'personal-folder',
    name: 'Personal',
    parentId: null,
    color: '#10B981',
    icon: 'User',
    metadata: {
      fileCount: 23,
      totalSize: 52000000,
      lastModified: Date.now() - 259200000
    },
    isExpanded: false,
    order: 2
  }
];
```

---

## Implementation Checklist

### Phase 1: Data Model & Service (Backend)
- [ ] Define TypeScript interfaces (StoredFile, Folder, FileHandler)
- [ ] Implement DocumentsService class
- [ ] Add storage integration (JSON + File Storage pattern)
- [ ] Implement folder validation logic
- [ ] Add event emitters for all operations
- [ ] Write unit tests for service methods

### Phase 2: UI Components (Frontend - Mock Data)
- [ ] Create mock data matching real schema
- [ ] Build FileBrowser component (Grid/List views)
- [ ] Build FolderTree component (collapsible hierarchy)
- [ ] Implement FileCard with plugin injection points
- [ ] Add context menu system (right-click + three-dot)
- [ ] Implement drag-and-drop interactions (visual only)
- [ ] Build search bar with advanced filters

### Phase 3: File Handler System
- [ ] Implement FileHandler registry
- [ ] Build FileViewer dynamic loader
- [ ] Create "New File" menu from handlers
- [ ] Add fallback for unsupported file types

### Phase 4: Backend Connection
- [ ] Connect frontend to DocumentsService
- [ ] Implement actual file upload/download
- [ ] Add File Storage API integration
- [ ] Test with real storage (SQLite/PostgreSQL)

---

## Related Documentation

- [Documents Plugin Spec](DOCUMENTS_PLUGIN_SPEC.md) - Full feature specification
- [File Storage Spec](FILE_STORAGE_SPEC.md) - Dual-API storage architecture
- [Plugin System](PLUGIN_SYSTEM.md) - Plugin architecture and patterns
- [System Patterns](../systemPatterns.md) - Core architectural patterns
