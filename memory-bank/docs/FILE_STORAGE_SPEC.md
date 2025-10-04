# File Storage Architecture Specification

## Overview

ChayCards uses a **dual-API storage system** that provides clear separation between structured data (JSON) and binary files. This design eliminates confusion for plugin developers by making storage intent explicit.

### Design Philosophy

**Two Storage Types, Two APIs:**
- **JSON Storage** (`get/set`) - For settings, metadata, small structured data
- **File Storage** (`getFile/setFile`) - For binary files, documents, images, videos

**No hidden magic.** Plugin developers know exactly where their data lives.

---

## Storage APIs

### JSON Storage (Existing - Keep As-Is)

For structured data, settings, and metadata.

```typescript
interface StorageAdapter {
  // Get JSON data
  get<T = any>(key: string): Promise<T | null>;

  // Set JSON data
  set<T = any>(key: string, value: T): Promise<void>;

  // Delete data
  delete(key: string): Promise<void>;

  // List keys with optional prefix
  list(prefix?: string): Promise<string[]>;

  // Check if key exists
  has(key: string): Promise<boolean>;

  // Clear all data (use with caution!)
  clear(): Promise<void>;
}
```

**Rules:**
- ✅ Any JSON-serializable data (objects, arrays, primitives)
- ✅ Stored in database (SQLite or PostgreSQL)
- ✅ Fast, transactional, queryable
- ⚠️ Size limits: Warn at 100KB, error at 1MB
- 🎯 Use cases: Settings, task lists, metadata, small arrays

**Example:**
```typescript
const storage = PluginManager.getInstance().getStorage();

// Save settings
await storage.set('my-plugin:settings', {
  theme: 'dark',
  notifications: true
});

// Load settings
const settings = await storage.get<Settings>('my-plugin:settings');
```

---

### File Storage (New - Explicit API)

For binary files, documents, images, videos, and user uploads.

```typescript
interface StorageAdapter {
  // Store binary file
  setFile(key: string, data: Uint8Array, metadata?: FileMetadata): Promise<void>;

  // Retrieve binary file
  getFile(key: string): Promise<FileData | null>;

  // Delete file
  deleteFile(key: string): Promise<void>;

  // List files with optional prefix
  listFiles(prefix?: string): Promise<FileInfo[]>;

  // Get file metadata without downloading
  getFileMetadata(key: string): Promise<FileMetadata | null>;
}

interface FileMetadata {
  mimeType?: string;    // e.g., 'image/jpeg', 'application/pdf'
  fileName?: string;    // Original filename
  size?: number;        // File size in bytes
  pluginId?: string;    // For quota tracking
}

interface FileData {
  data: Uint8Array;     // Binary file content
  metadata: FileMetadata;
}

interface FileInfo {
  key: string;          // Storage key
  size: number;         // File size in bytes
  mimeType?: string;    // MIME type
  fileName?: string;    // Original filename
  createdAt: number;    // Unix timestamp
}
```

**Rules:**
- ✅ Binary data only (Uint8Array, Buffer, Blob)
- ✅ Always stored in filesystem (Electron) or database BYTEA (PostgreSQL)
- ✅ No arbitrary size limits (scales with storage)
- ✅ Quota limits per plugin (configurable)
- ⚠️ MIME type validation enforced
- 🎯 Use cases: Images, PDFs, videos, audio, user uploads

**Example:**
```typescript
const storage = PluginManager.getInstance().getStorage();

// Store a file
const fileData = await file.arrayBuffer();
await storage.setFile('my-plugin:files/avatar', new Uint8Array(fileData), {
  mimeType: 'image/jpeg',
  fileName: 'avatar.jpg',
  pluginId: 'my-plugin'
});

// Retrieve a file
const fileData = await storage.getFile('my-plugin:files/avatar');
if (fileData) {
  const blob = new Blob([fileData.data], { type: fileData.metadata.mimeType });
  // Use blob for display, download, etc.
}

// List all files for plugin
const files = await storage.listFiles('my-plugin:files/');
console.log(`Found ${files.length} files`);
```

---

## Storage Key Namespacing

**CRITICAL:** All plugins MUST namespace their storage keys using `buildPluginStorageKey()`.

### Pattern
```
plugin-id:key-name
```

### Helper Function
```typescript
import { buildPluginStorageKey } from '@/shared/constants';

// JSON data keys
const settingsKey = buildPluginStorageKey('my-plugin', 'settings');
// Returns: 'my-plugin:settings'

// File keys
const fileKey = buildPluginStorageKey('my-plugin', `files/${fileId}`);
// Returns: 'my-plugin:files/abc123'
```

### Examples
```typescript
// Settings
'core-settings:app-settings'
'my-plugin:user-preferences'

// Files
'core-documents:files/abc123'
'my-plugin:files/avatar.jpg'
'gallery-plugin:images/photo-001'
```

### Benefits
1. **Prevents collisions** - Each plugin's keys are isolated
2. **Enables queries** - `storage.list('my-plugin:')` returns all plugin keys
3. **Self-documenting** - Keys show which plugin owns them
4. **Quota tracking** - Can sum file sizes per plugin

---

## Implementation Details

### Electron (Local Storage)

**File Storage Location:**
```
{userData}/
  └── files/
      ├── {hash-1}.jpg        # Content-addressed storage
      ├── {hash-2}.pdf
      └── {hash-3}.mp4
```

**Database Schema (SQLite):**
```sql
-- Existing JSON storage table
CREATE TABLE storage (
  key TEXT NOT NULL,
  value TEXT NOT NULL,           -- JSON.stringify'd data
  user_id TEXT NOT NULL,
  updated_at INTEGER,
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- New file storage table
CREATE TABLE files (
  key TEXT NOT NULL,
  file_path TEXT NOT NULL,       -- Path to file in userData/files/
  file_name TEXT,                -- Original filename
  mime_type TEXT,
  file_size INTEGER NOT NULL,
  plugin_id TEXT,                -- For quota tracking
  user_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_plugin_id ON files(plugin_id);
```

**File Storage Strategy:**
- Files stored using content-based hashing (SHA-256)
- Automatic deduplication via hash-based filenames
- Metadata stored in database, content on filesystem
- User-scoped via `user_id` foreign key

**IPC Handlers:**
```javascript
// electron/ipc/fileHandlers.cjs

ipcMain.handle('storage:setFile', async (event, key, data, metadata) => {
  // 1. Get current user
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();

  // 2. Hash file content
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  const fileName = `${hash}${path.extname(metadata.fileName || '')}`;

  // 3. Write file to disk
  const filePath = path.join(filesDir, fileName);
  await fs.writeFile(filePath, data);

  // 4. Store metadata in database
  db.prepare(`
    INSERT INTO files (key, file_path, file_name, mime_type, file_size, plugin_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(key, user_id) DO UPDATE SET
      file_path = excluded.file_path,
      file_name = excluded.file_name,
      mime_type = excluded.mime_type,
      file_size = excluded.file_size,
      updated_at = strftime('%s', 'now')
  `).run(key, filePath, metadata.fileName, metadata.mimeType, data.length, metadata.pluginId, currentUser.id);
});

ipcMain.handle('storage:getFile', async (event, key) => {
  // 1. Get metadata from database
  const row = db.prepare(`
    SELECT file_path, file_name, mime_type, file_size
    FROM files WHERE key = ? AND user_id = ?
  `).get(key, currentUser.id);

  if (!row) return null;

  // 2. Read file from disk
  const data = await fs.readFile(row.file_path);

  return {
    data: Array.from(data),
    metadata: {
      fileName: row.file_name,
      mimeType: row.mime_type,
      size: row.file_size
    }
  };
});
```

---

### Cloud Storage (PostgreSQL)

**Database Schema:**
```sql
-- Existing JSON storage table
CREATE TABLE storage (
  key TEXT NOT NULL,
  value JSONB NOT NULL,          -- Native JSONB support
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (key, user_id)
);

-- New file storage table
CREATE TABLE files (
  key TEXT NOT NULL,
  file_data BYTEA NOT NULL,      -- Binary data stored directly
  file_name TEXT,
  mime_type TEXT,
  file_size INTEGER NOT NULL,
  plugin_id TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (key, user_id)
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_plugin_id ON files(plugin_id);
```

**File Storage Strategy:**
- Small/medium files stored as BYTEA in PostgreSQL
- Future: Large files (>10MB) migrated to R2/S3 object storage
- User-scoped via `user_id` foreign key
- MIME type validation enforced

**REST API Endpoints:**
```javascript
// server/index.js

// Upload file
app.put('/api/storage/file/:key', authenticateToken, upload.single('file'), async (req, res) => {
  const key = decodeURIComponent(req.params.key);
  const userId = req.user.id;
  const file = req.file;

  await pool.query(
    `INSERT INTO files (key, file_data, file_name, mime_type, file_size, plugin_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (key, user_id) DO UPDATE SET
       file_data = $2, file_name = $3, mime_type = $4, file_size = $5, updated_at = NOW()`,
    [key, file.buffer, file.originalname, file.mimetype, file.size, req.body.pluginId, userId]
  );

  res.json({ success: true });
});

// Download file
app.get('/api/storage/file/:key', authenticateToken, async (req, res) => {
  const result = await pool.query(
    'SELECT file_data, file_name, mime_type FROM files WHERE key = $1 AND user_id = $2',
    [key, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const row = result.rows[0];
  res.set('Content-Type', row.mime_type);
  res.set('Content-Disposition', `attachment; filename="${row.file_name}"`);
  res.send(row.file_data);
});
```

---

## Security & Validation

### User Scoping (Automatic)

**All storage operations are automatically scoped to the current user:**

**Electron:**
```javascript
// Always queries current user
const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();

// All queries include user_id
db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?')
  .get(key, currentUser.id);
```

**Cloud:**
```javascript
// JWT middleware extracts user from token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    req.user = user; // { id, username }
    next();
  });
};

// All queries include user_id from JWT
await pool.query(
  'SELECT value FROM storage WHERE key = $1 AND user_id = $2',
  [key, req.user.id]
);
```

**Result:** Users can only access their own data. Cross-user access is impossible.

### File Upload Validation

**MIME Type Whitelist:**
```typescript
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',

  // Video
  'video/mp4',
  'video/webm',

  // Archives
  'application/zip',
  'application/x-tar',
];

function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}
```

**File Size Limits:**
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
const MAX_PLUGIN_QUOTA = 500 * 1024 * 1024; // 500 MB per plugin

async function validateFileSize(size: number, pluginId: string): Promise<void> {
  // Check individual file size
  if (size > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 50 MB');
  }

  // Check plugin quota
  const currentUsage = await getPluginStorageUsage(pluginId);
  if (currentUsage + size > MAX_PLUGIN_QUOTA) {
    throw new Error('Plugin storage quota exceeded (500 MB limit)');
  }
}

async function getPluginStorageUsage(pluginId: string): Promise<number> {
  const result = db.prepare(
    'SELECT SUM(file_size) as total FROM files WHERE plugin_id = ? AND user_id = ?'
  ).get(pluginId, currentUser.id);

  return result?.total || 0;
}
```

**Filename Sanitization:**
```typescript
function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  const basename = path.basename(fileName);

  // Remove dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
```

---

## Plugin Developer Guide

### Basic File Storage

```typescript
import { PluginManager } from '@/shared/plugin-system';
import { buildPluginStorageKey } from '@/shared/constants';

class MyFileService {
  private storage = PluginManager.getInstance().getStorage();
  private readonly PLUGIN_ID = 'my-plugin';

  async saveUserAvatar(file: File): Promise<void> {
    // 1. Read file data
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // 2. Build storage key
    const key = buildPluginStorageKey(this.PLUGIN_ID, 'avatar');

    // 3. Store file
    await this.storage.setFile(key, data, {
      mimeType: file.type,
      fileName: file.name,
      pluginId: this.PLUGIN_ID
    });
  }

  async getUserAvatar(): Promise<Blob | null> {
    const key = buildPluginStorageKey(this.PLUGIN_ID, 'avatar');
    const fileData = await this.storage.getFile(key);

    if (!fileData) return null;

    return new Blob([fileData.data], {
      type: fileData.metadata.mimeType
    });
  }
}
```

### Documents Plugin Example

```typescript
class DocumentService {
  private storage = PluginManager.getInstance().getStorage();
  private readonly PLUGIN_ID = 'core-documents';

  async saveDocument(title: string, file: File): Promise<string> {
    const docId = crypto.randomUUID();

    // 1. Store file content
    const fileKey = buildPluginStorageKey(this.PLUGIN_ID, `files/${docId}`);
    const arrayBuffer = await file.arrayBuffer();
    await this.storage.setFile(fileKey, new Uint8Array(arrayBuffer), {
      mimeType: file.type,
      fileName: file.name,
      pluginId: this.PLUGIN_ID
    });

    // 2. Store metadata
    const metaKey = buildPluginStorageKey(this.PLUGIN_ID, 'documents');
    const docs = await this.storage.get<Document[]>(metaKey) || [];
    docs.push({
      id: docId,
      title: title,
      fileKey: fileKey,
      fileType: file.type,
      createdAt: Date.now()
    });
    await this.storage.set(metaKey, docs);

    return docId;
  }

  async getDocument(docId: string): Promise<{ meta: Document, file: Blob }> {
    // 1. Get metadata
    const metaKey = buildPluginStorageKey(this.PLUGIN_ID, 'documents');
    const docs = await this.storage.get<Document[]>(metaKey) || [];
    const doc = docs.find(d => d.id === docId);

    if (!doc) throw new Error('Document not found');

    // 2. Get file
    const fileData = await this.storage.getFile(doc.fileKey);
    if (!fileData) throw new Error('File not found');

    const file = new Blob([fileData.data], { type: fileData.metadata.mimeType });

    return { meta: doc, file };
  }

  async listDocuments(): Promise<Document[]> {
    const metaKey = buildPluginStorageKey(this.PLUGIN_ID, 'documents');
    return await this.storage.get<Document[]>(metaKey) || [];
  }

  async deleteDocument(docId: string): Promise<void> {
    // 1. Get document to find file key
    const metaKey = buildPluginStorageKey(this.PLUGIN_ID, 'documents');
    const docs = await this.storage.get<Document[]>(metaKey) || [];
    const doc = docs.find(d => d.id === docId);

    if (!doc) return;

    // 2. Delete file
    await this.storage.deleteFile(doc.fileKey);

    // 3. Remove from metadata
    const updatedDocs = docs.filter(d => d.id !== docId);
    await this.storage.set(metaKey, updatedDocs);
  }
}
```

---

## Migration Path

### Existing Code (No Changes Required)

```typescript
// JSON storage continues working exactly as before
await storage.set('settings', { theme: 'dark' });
const settings = await storage.get('settings');
```

### New File Storage (Opt-In)

```typescript
// New explicit API for files
await storage.setFile('avatar', fileData, { mimeType: 'image/jpeg' });
const avatar = await storage.getFile('avatar');
```

**No breaking changes. Backward compatible. Clear separation.**

---

## Implementation Phases

### Phase 1: Core File Storage (MVP)

**Goal:** Enable basic file storage for Documents plugin

**Tasks:**
1. ✅ Extend `StorageAdapter` interface with file methods
2. ✅ Add `files` table to SQLite schema (migration)
3. ✅ Add `files` table to PostgreSQL schema
4. ✅ Implement `fileHandlers.cjs` for Electron IPC
5. ✅ Add REST API endpoints for file upload/download
6. ✅ Implement file methods in `SQLiteAdapter`
7. ✅ Implement file methods in `PostgreSQLAdapter`
8. ✅ Add MIME type validation
9. ✅ Add file size limits
10. ✅ Update preload.cjs to expose file APIs

**Deliverables:**
- File storage works in both Electron and web
- Documents plugin can store files up to 50MB
- User-scoped, secure, validated

### Phase 2: Optimization & Quota Management

**Goal:** Add deduplication, quotas, and monitoring

**Tasks:**
1. Content-based deduplication (Electron)
2. Plugin quota tracking and enforcement
3. Storage usage dashboard
4. File cleanup on plugin uninstall
5. Compression for large text files

**Deliverables:**
- Reduced disk usage via deduplication
- Per-plugin quotas enforced
- Users can see storage usage

### Phase 3: Cloud Object Storage (R2/S3)

**Goal:** Scale to large files and reduce database load

**Tasks:**
1. Integrate Cloudflare R2 or AWS S3
2. Size-based threshold (>10MB → object storage)
3. Pre-signed URL generation
4. Direct client-to-R2 uploads
5. Migrate existing large files

**Deliverables:**
- Large file support (>50MB)
- Better scalability
- Lower database costs

### Phase 4: Advanced Features

**Goal:** Streaming, thumbnails, and AI integration

**Tasks:**
1. Streaming support for large files
2. Thumbnail generation for images
3. Vector database for AI/RAG
4. Full-text search in documents
5. Version history for files

---

## Best Practices

### ✅ DO

- **Use `buildPluginStorageKey()`** for all keys
- **Check `storage !== null`** before using (public pages return null)
- **Validate MIME types** before accepting files
- **Clean up files** when documents are deleted
- **Track plugin quotas** to prevent abuse
- **Use file methods** for binary data, JSON methods for structured data

### ❌ DON'T

- **Don't store large files as JSON** (use `setFile()` instead)
- **Don't bypass user scoping** (automatic, but respect it)
- **Don't hardcode paths** (use Electron `app.getPath()`)
- **Don't check `window.electronAPI` directly** (use `isElectron()`)
- **Don't create unnamespaced keys** (always use `buildPluginStorageKey()`)
- **Don't ignore quota limits** (track usage per plugin)

---

## Troubleshooting

### File Not Found After Upload

**Cause:** Key mismatch or user scoping issue

**Solution:**
```typescript
// Ensure same key used for set and get
const key = buildPluginStorageKey('my-plugin', 'file-id');
await storage.setFile(key, data, metadata);
const retrieved = await storage.getFile(key); // Use EXACT same key
```

### Storage Returns Null

**Cause:** On public page (login, register, setup)

**Solution:**
```typescript
const storage = PluginManager.getInstance().getStorage();
if (!storage) {
  console.warn('Storage not available on public page');
  return;
}
// Proceed with storage operations
```

### Quota Exceeded Error

**Cause:** Plugin exceeded 500MB limit

**Solution:**
```typescript
// Check current usage
const files = await storage.listFiles('my-plugin:files/');
const totalSize = files.reduce((sum, f) => sum + f.size, 0);
console.log(`Plugin storage: ${totalSize / 1024 / 1024} MB`);

// Clean up old files
for (const file of oldFiles) {
  await storage.deleteFile(file.key);
}
```

### MIME Type Rejected

**Cause:** File type not in whitelist

**Solution:**
```typescript
// Check allowed types before upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error(`File type ${file.type} not allowed`);
}
```

---

## Related Documentation

- **Plugin System:** `/memory-bank/docs/PLUGIN_SYSTEM.md`
- **Documents Plugin:** `/memory-bank/docs/DOCUMENTS_PLUGIN_SPEC.md`
- **Storage Adapter:** `/src/shared/storage/StorageAdapter.ts`
- **Platform Detection:** `/src/utils/platform.ts`
- **Storage Constants:** `/src/shared/constants.ts`

---

## Appendix: Complete Type Definitions

```typescript
// Complete StorageAdapter interface with file methods
export interface StorageAdapter {
  // JSON Storage
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;

  // File Storage
  setFile(key: string, data: Uint8Array, metadata?: FileMetadata): Promise<void>;
  getFile(key: string): Promise<FileData | null>;
  deleteFile(key: string): Promise<void>;
  listFiles(prefix?: string): Promise<FileInfo[]>;
  getFileMetadata(key: string): Promise<FileMetadata | null>;
}

export interface FileMetadata {
  mimeType?: string;
  fileName?: string;
  size?: number;
  pluginId?: string;
}

export interface FileData {
  data: Uint8Array;
  metadata: FileMetadata;
}

export interface FileInfo {
  key: string;
  size: number;
  mimeType?: string;
  fileName?: string;
  createdAt: number;
}

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```
