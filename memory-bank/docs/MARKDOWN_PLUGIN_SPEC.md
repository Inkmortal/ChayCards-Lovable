# Markdown Plugin Specification

## Overview

The Markdown plugin provides a lightweight note-taking and document editing experience with live markdown preview, syntax highlighting, and optional file attachments. It's designed for quick notes, code snippets, and technical documentation.

## Plugin Identity

- **Plugin ID**: `core-markdown`
- **Plugin Name**: Markdown Notes
- **Category**: Core Plugin
- **Dependencies**: `core-ui`, `core-theme`

## Features

### Phase 1 (MVP)
- [x] Create markdown notes with live preview
- [x] Syntax highlighting for code blocks
- [x] Basic markdown formatting (headers, lists, links, images)
- [x] Search and filter notes
- [x] Tag support
- [ ] Optional file attachments (images, code files)

### Phase 2 (Enhanced)
- [ ] Split-pane editor (source + preview)
- [ ] Drag-and-drop image uploads
- [ ] Note linking (wiki-style [[links]])
- [ ] Export to PDF/HTML
- [ ] Code block syntax highlighting with language detection

### Phase 3 (Advanced)
- [ ] Collaboration features (comments, mentions)
- [ ] Version history with diff view
- [ ] Mermaid diagram support
- [ ] Math equation support (LaTeX)
- [ ] Template system for common note types

## Data Model

### Note Entity

```typescript
interface MarkdownNote {
  id: string;                    // UUID
  title: string;                 // Note title (extracted from first # heading or manual)
  content: string;               // Raw markdown content
  tags: string[];                // Organizational tags

  // Optional file attachments
  imageStorageKey?: string;      // Link to attached image file
  codeFileStorageKey?: string;   // Link to attached code file

  // Metadata
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  lastViewedAt: number;          // Unix timestamp
  favorited: boolean;            // Quick access flag

  // Organization
  folderId?: string;             // Optional parent folder
  linkedNoteIds: string[];       // References to other notes
}

interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;             // For nested folders
  color?: string;                // Visual organization
  createdAt: number;
}
```

### Storage Keys

Current implementation uses dual-storage pattern:

- **Notes Index**: `core-markdown:notes` → `MarkdownNote[]`
- **Folders Index**: `core-markdown:folders` → `NoteFolder[]`
- **Image Attachments**: `core-markdown:files/{noteId}/image` → `Uint8Array`
- **Code File Attachments**: `core-markdown:files/{noteId}/code` → `Uint8Array`

## Storage Integration

### Current Pattern (Dual-Storage - Before Phase 1)

When creating markdown notes with optional file attachments:

```typescript
// Example: Creating a note with an attached image
async function createNoteWithImage(
  title: string,
  content: string,
  imageFile?: File
): Promise<string> {
  const noteId = crypto.randomUUID();

  // 1. Create note metadata
  const note: MarkdownNote = {
    id: noteId,
    title,
    content,
    tags: [],
    imageStorageKey: imageFile
      ? buildPluginStorageKey('core-markdown', `files/${noteId}/image`)
      : undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastViewedAt: Date.now(),
    favorited: false,
    linkedNoteIds: []
  };

  // 2. Store image file separately (binary data)
  if (imageFile) {
    const imageData = new Uint8Array(await imageFile.arrayBuffer());
    await storage.set(note.imageStorageKey!, imageData);
  }

  // 3. Add note to index
  const allNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];
  allNotes.push(note);
  await storage.set('core-markdown:notes', allNotes);

  return noteId;
}

// Example: Retrieving a note with attachments
async function getNoteWithAttachments(noteId: string): Promise<NoteWithAttachments | null> {
  // 1. Find note in index
  const allNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];
  const note = allNotes.find(n => n.id === noteId);

  if (!note) return null;

  // 2. Fetch attached files if they exist
  const imageData = note.imageStorageKey
    ? await storage.get<Uint8Array>(note.imageStorageKey)
    : null;

  const codeFileData = note.codeFileStorageKey
    ? await storage.get<Uint8Array>(note.codeFileStorageKey)
    : null;

  return {
    ...note,
    imageData,
    codeFileData
  };
}

// Example: Updating note content (no file changes)
async function updateNoteContent(noteId: string, newContent: string): Promise<void> {
  const allNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];
  const note = allNotes.find(n => n.id === noteId);

  if (!note) throw new Error('Note not found');

  note.content = newContent;
  note.updatedAt = Date.now();

  await storage.set('core-markdown:notes', allNotes);
}

// Example: Deleting a note (MUST delete attachments AND metadata)
async function deleteNote(noteId: string): Promise<void> {
  // 1. Find note to get attachment keys
  const allNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];
  const noteIndex = allNotes.findIndex(n => n.id === noteId);

  if (noteIndex === -1) return;

  const note = allNotes[noteIndex];

  // 2. Delete attached files first
  if (note.imageStorageKey) {
    await storage.delete(note.imageStorageKey);
  }
  if (note.codeFileStorageKey) {
    await storage.delete(note.codeFileStorageKey);
  }

  // 3. Remove from notes array
  allNotes.splice(noteIndex, 1);
  await storage.set('core-markdown:notes', allNotes);
}

// Example: Attaching a new file to existing note
async function attachImageToNote(noteId: string, imageFile: File): Promise<void> {
  const allNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];
  const note = allNotes.find(n => n.id === noteId);

  if (!note) throw new Error('Note not found');

  // Delete old image if exists
  if (note.imageStorageKey) {
    await storage.delete(note.imageStorageKey);
  }

  // Store new image
  const imageStorageKey = buildPluginStorageKey('core-markdown', `files/${noteId}/image`);
  const imageData = new Uint8Array(await imageFile.arrayBuffer());
  await storage.set(imageStorageKey, imageData);

  // Update note metadata
  note.imageStorageKey = imageStorageKey;
  note.updatedAt = Date.now();

  await storage.set('core-markdown:notes', allNotes);
}
```

**Key Points**:
- Note metadata stored at: `core-markdown:notes` → `MarkdownNote[]`
- Folder structure at: `core-markdown:folders` → `NoteFolder[]`
- Image files (binary) at: `core-markdown:files/{noteId}/image` → `Uint8Array`
- Code files (binary) at: `core-markdown:files/{noteId}/code` → `Uint8Array`
- Use `imageStorageKey` and `codeFileStorageKey` fields to link metadata to content
- **IMPORTANT**: Must manually delete both attachment files AND note metadata to avoid orphans

### Future Pattern (Files as Entity Properties - After Phase 1)

Once Phase 1 of FILE_STORAGE_SPEC.md is implemented, this becomes much simpler:

```typescript
// Future: Create note with image in single atomic operation
async function createNoteWithImage_Future(
  title: string,
  content: string,
  imageFile?: File
): Promise<string> {
  const noteId = crypto.randomUUID();

  // Metadata for the note
  const noteMetadata: MarkdownNote = {
    id: noteId,
    title,
    content,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastViewedAt: Date.now(),
    favorited: false,
    linkedNoteIds: []
  };

  // Files to attach (if provided)
  const files: Record<string, Uint8Array> = {};
  if (imageFile) {
    files.image = new Uint8Array(await imageFile.arrayBuffer());
  }

  // Single atomic operation - note + files together!
  await storage.set(
    `core-markdown:note:${noteId}`,
    noteMetadata,
    files  // Files as properties!
  );

  return noteId;
}

// Future: Retrieve note with attachments in single call
async function getNoteWithAttachments_Future(noteId: string): Promise<NoteWithAttachments | null> {
  const result = await storage.get(`core-markdown:note:${noteId}`);

  if (!result) return null;

  // Returns: { data: noteMetadata, files: { image: Uint8Array, code: Uint8Array } }
  return {
    ...result.data,
    imageData: result.files.image,
    codeFileData: result.files.code
  };
}

// Future: Update note content (metadata only, files unchanged)
async function updateNoteContent_Future(noteId: string, newContent: string): Promise<void> {
  const result = await storage.get(`core-markdown:note:${noteId}`);

  if (!result) throw new Error('Note not found');

  result.data.content = newContent;
  result.data.updatedAt = Date.now();

  // Update metadata only, preserve existing files
  await storage.set(
    `core-markdown:note:${noteId}`,
    result.data,
    result.files  // Keep existing files
  );
}

// Future: Delete note (attachments automatically cascade)
async function deleteNote_Future(noteId: string): Promise<void> {
  await storage.delete(`core-markdown:note:${noteId}`);
  // Done! Image and code files automatically deleted via CASCADE DELETE
}

// Future: Attach/replace image (update files property)
async function attachImageToNote_Future(noteId: string, imageFile: File): Promise<void> {
  const result = await storage.get(`core-markdown:note:${noteId}`);

  if (!result) throw new Error('Note not found');

  // Replace image file (or add if doesn't exist)
  result.files.image = new Uint8Array(await imageFile.arrayBuffer());
  result.data.updatedAt = Date.now();

  await storage.set(
    `core-markdown:note:${noteId}`,
    result.data,
    result.files  // Updated files
  );
}
```

**Benefits of Future API**:
- ✅ Single atomic operation (note + files together)
- ✅ Automatic CASCADE DELETE (no orphaned attachment files)
- ✅ No manual linking via storage keys
- ✅ Simpler code, fewer bugs
- ✅ Files are properties of notes, not separate entities
- ✅ Easy to add/remove/replace attachments

**See**: `/memory-bank/docs/FILE_STORAGE_SPEC.md` for complete specification.

## Service API

```typescript
class MarkdownService {
  // Note CRUD
  createNote(title: string, content: string, tags?: string[]): Promise<MarkdownNote>
  updateNote(id: string, updates: Partial<MarkdownNote>): Promise<void>
  deleteNote(id: string): Promise<void>
  getNote(id: string): Promise<MarkdownNote | null>
  getAllNotes(): Promise<MarkdownNote[]>

  // Search and filter
  searchNotes(query: string): Promise<MarkdownNote[]>
  getNotesByTag(tag: string): Promise<MarkdownNote[]>
  getFavoritedNotes(): Promise<MarkdownNote[]>

  // File attachments (current dual-storage pattern)
  attachImage(noteId: string, imageFile: File): Promise<void>
  getAttachments(noteId: string): Promise<{ image?: Uint8Array; code?: Uint8Array }>
  removeAttachment(noteId: string, type: 'image' | 'code'): Promise<void>

  // Organization
  createFolder(name: string, parentId?: string): Promise<NoteFolder>
  moveNoteToFolder(noteId: string, folderId: string): Promise<void>

  // Linking
  linkNotes(sourceId: string, targetId: string): Promise<void>
  getLinkedNotes(noteId: string): Promise<MarkdownNote[]>

  // Export
  exportToMarkdown(noteId: string): Promise<string>
  exportToPDF(noteId: string): Promise<Blob>  // Phase 2
}
```

## Component Structure

```
core-markdown/
├── components/
│   ├── MarkdownEditor.tsx        # Main editor component
│   ├── MarkdownPreview.tsx       # Live preview pane
│   ├── NoteList.tsx              # All notes list view
│   ├── NoteCard.tsx              # Individual note card
│   ├── FolderTree.tsx            # Folder navigation
│   ├── TagCloud.tsx              # Tag visualization
│   └── AttachmentManager.tsx     # File attachment UI
├── services/
│   └── MarkdownService.ts        # Business logic
├── hooks/
│   ├── useMarkdown.ts            # Markdown parsing hook
│   ├── useNotes.ts               # Note management hook
│   └── useFolders.ts             # Folder management hook
├── types.ts                       # TypeScript interfaces
└── index.ts                       # Plugin definition
```

## UI Design

### Note List View
```
┌─────────────────────────────────────────┐
│ 📝 Markdown Notes        [+ New Note]   │
├─────────────────────────────────────────┤
│ 🔍 Search...              🏷️ Filter     │
├─────────────────────────────────────────┤
│ 📁 Folders                              │
│   └─ Work Notes (12)                    │
│   └─ Personal (5)                       │
│                                          │
│ 📌 Favorited                            │
│ ┌───────────────────────────────────┐  │
│ │ API Design Patterns                │  │
│ │ Last edited: 2 hours ago           │  │
│ │ 🏷️ architecture, backend            │  │
│ └───────────────────────────────────┘  │
│                                          │
│ ┌───────────────────────────────────┐  │
│ │ React Hook Patterns                │  │
│ │ Last edited: Yesterday             │  │
│ │ 🏷️ react, frontend                  │  │
│ │ 🖼️ 1 attachment                     │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Editor View
```
┌─────────────────────────────────────────┐
│ 📝 API Design Patterns      ⭐ Favorite │
│ 🏷️ architecture, backend                │
├─────────────────────────────────────────┤
│ Editor                 │ Preview         │
│                        │                 │
│ # REST vs GraphQL      │ # REST vs Graph │
│                        │                 │
│ ## Key Differences     │ ## Key Differen │
│                        │                 │
│ - REST: Resource-based │ - REST: Resourc │
│ - GraphQL: Query lang  │ - GraphQL: Quer │
│                        │                 │
│ ```typescript          │ ```typescript   │
│ const api = fetch(...) │ const api = fet │
│ ```                    │ ```             │
│                        │                 │
│ 📎 Attachments:        │                 │
│   🖼️ architecture.png   │                 │
│   [+ Add file]         │                 │
└─────────────────────────────────────────┘
```

## Route Configuration

```typescript
routes: [
  {
    path: '/notes',
    component: 'core-markdown/NoteList',
    label: 'Notes',
    icon: 'FileText',
    showInNav: true,
    order: 30
  },
  {
    path: '/notes/:id',
    component: 'core-markdown/MarkdownEditor',
    showInNav: false
  }
]
```

## Integration Points

### With Documents Plugin
- Convert markdown notes to documents
- Export notes as PDF/HTML documents
- Import documents as markdown notes

### With Flashcards Plugin
- Extract flashcards from markdown headers
- Create flashcards from code snippets
- Link notes to flashcard decks

### With Tasks Plugin
- Extract TODO items from markdown checkboxes
- Create tasks from note sections
- Link tasks to related notes

## Technical Considerations

### Performance
- **Lazy loading**: Only load note content when opened
- **Virtual scrolling**: Handle large note lists efficiently
- **Debounced saving**: Auto-save with 500ms debounce
- **Syntax highlighting**: Use lightweight library (e.g., Prism.js)

### Security
- **XSS prevention**: Sanitize markdown output before rendering HTML
- **File validation**: Restrict attachment file types and sizes
- **User scoping**: All notes scoped to authenticated user

### Accessibility
- **Keyboard shortcuts**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link)
- **ARIA labels**: Proper labeling for screen readers
- **Focus management**: Logical tab order in editor

## Migration Path

### From Current Dual-Storage to Future API

When Phase 1 is implemented, migration script:

```typescript
async function migrateMarkdownNotes(): Promise<void> {
  // 1. Get all notes from old index
  const oldNotes = await storage.get<MarkdownNote[]>('core-markdown:notes') || [];

  // 2. Migrate each note
  for (const note of oldNotes) {
    // Load attachment files if they exist
    const files: Record<string, Uint8Array> = {};

    if (note.imageStorageKey) {
      const imageData = await storage.get<Uint8Array>(note.imageStorageKey);
      if (imageData) {
        files.image = imageData;
      }
    }

    if (note.codeFileStorageKey) {
      const codeData = await storage.get<Uint8Array>(note.codeFileStorageKey);
      if (codeData) {
        files.code = codeData;
      }
    }

    // Remove storage key fields from metadata
    const { imageStorageKey, codeFileStorageKey, ...cleanMetadata } = note;

    // Store in new format
    await storage.set(
      `core-markdown:note:${note.id}`,
      cleanMetadata,
      files
    );
  }

  // 3. Clean up old storage
  await storage.delete('core-markdown:notes');

  console.log(`Migrated ${oldNotes.length} markdown notes`);
}
```

## Implementation Phases

### Phase 1: MVP (2-3 weeks)
1. Basic markdown editor with live preview
2. Create/edit/delete notes
3. Tag support and search
4. Simple list view
5. Optional image attachments (dual-storage pattern)

### Phase 2: Enhanced Features (2-3 weeks)
1. Split-pane editor
2. Folder organization
3. Drag-and-drop file uploads
4. Note linking
5. Export to PDF/HTML
6. Migrate to Files as Entity Properties API

### Phase 3: Advanced Features (3-4 weeks)
1. Collaboration features
2. Version history with diff view
3. Mermaid diagram support
4. Math equation support
5. Template system

## Testing Strategy

### Unit Tests
- Note CRUD operations
- Markdown parsing and rendering
- File attachment handling
- Search and filtering logic

### Integration Tests
- Full note lifecycle (create → edit → attach files → delete)
- Folder organization
- Note linking and backreferences

### E2E Tests
- Create note and verify in list
- Upload image and verify preview
- Search notes and verify results
- Export note and verify output

## Success Metrics

- **Performance**: Notes load in < 100ms
- **Reliability**: 99.9% uptime for note operations
- **User Experience**: Auto-save within 500ms of typing
- **Data Integrity**: Zero orphaned attachment files after migration

## References

- `/memory-bank/docs/FILE_STORAGE_SPEC.md` - File storage architecture
- `/memory-bank/docs/DOCUMENTS_PLUGIN_SPEC.md` - Similar plugin pattern
- `/memory-bank/docs/FLASHCARD_SYSTEM.md` - Integration opportunities
- `/src/plugins/CLAUDE.md` - Plugin development guide
