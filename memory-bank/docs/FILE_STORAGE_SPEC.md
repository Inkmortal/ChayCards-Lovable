# File Storage Specification

## Overview

ChayCards provides a **unified storage system** where files are stored **as properties of entities**, not as separate storage items. This eliminates the orphan file problem and provides referential integrity through database foreign keys.

### Core Principle: Files as Entity Properties

**Files are NOT independent entities** - they are PROPERTIES attached to data entities. When you store an entity, you can optionally attach binary files. When you delete the entity, all attached files are automatically deleted (CASCADE DELETE).

```typescript
// Store entity WITH files in single operation
await storage.set('documents:doc-123',
  { title: 'Q4 Report', tags: ['finance'] },
  { pdf: pdfData, thumbnail: thumbnailData }
);

// Retrieve entity WITH files
const doc = await storage.get('documents:doc-123');
// Returns: { data: { title, tags }, files: { pdf: Uint8Array, thumbnail: Uint8Array } }

// Delete entity (cascades to files automatically)
await storage.delete('documents:doc-123');
```

**Benefits:**
- ✅ No orphaned files (database enforced)
- ✅ Atomic operations (entity + files stored/deleted together)
- ✅ User scoping automatic (composite keys prevent cross-user access)
- ✅ Simple API (no separate file management)
- ✅ Referential integrity (FK constraints enforce relationship)

---

## API Signature

```typescript
interface StorageAdapter {
  // Store entity with optional files
  set(key: string, data: any, files?: Record<string, Uint8Array | null>): Promise<void>;

  // Retrieve entity with files
  get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null>;

  // Delete entity (cascades to files)
  delete(key: string): Promise<void>;

  // List entity keys
  list(prefix?: string): Promise<string[]>;

  // Check if entity exists
  has(key: string): Promise<boolean>;

  // Clear all entities for current user
  clear(): Promise<void>;
}
```

**Key Changes from Old API:**
- `set()` now accepts optional `files` parameter (Record of field names to binary data)
- `get()` now returns `{ data, files }` instead of just data
- `delete()` automatically cascades to delete attached files
- No separate `setFile/getFile/deleteFile` methods

---

## Usage Examples

### Store Entity with Files

```typescript
import { PluginManager } from '@/shared/plugin-system';

const storage = PluginManager.getInstance().getStorage();

// Read files
const pdfData = new Uint8Array(await pdfFile.arrayBuffer());
const thumbnailData = new Uint8Array(await thumbnailFile.arrayBuffer());

// Store entity + files in single atomic operation
await storage.set('documents:doc-123',
  {
    title: 'Q4 Financial Report',
    tags: ['finance', 'quarterly'],
    createdAt: Date.now()
  },
  {
    pdf: pdfData,        // Field name is arbitrary
    thumbnail: thumbnailData
  }
);
```

### Retrieve Entity with Files

```typescript
const result = await storage.get('documents:doc-123');

if (result) {
  const { data, files } = result;

  console.log(data.title); // 'Q4 Financial Report'
  console.log(data.tags);  // ['finance', 'quarterly']

  // Access attached files
  const pdfBlob = new Blob([files.pdf], { type: 'application/pdf' });
  const thumbnailBlob = new Blob([files.thumbnail], { type: 'image/png' });
}
```

### Update Entity or Files

```typescript
// Update data only (files unchanged)
await storage.set('documents:doc-123',
  { title: 'Q4 Report (Revised)', tags: ['finance'] }
);

// Update files only (data unchanged)
const result = await storage.get('documents:doc-123');
await storage.set('documents:doc-123',
  result.data,
  { thumbnail: newThumbnailData } // Replace thumbnail, keep pdf
);

// Update both data and files
await storage.set('documents:doc-123',
  { title: 'New Title' },
  { pdf: newPdfData }
);

// Remove specific file (set to null)
await storage.set('documents:doc-123',
  result.data,
  { thumbnail: null } // Removes thumbnail, keeps pdf
);
```

### Delete Entity (Cascades to Files)

```typescript
// Delete entity - all attached files automatically deleted
await storage.delete('documents:doc-123');
```

---

## Database Schema

### SQLite (Electron Local Storage)

```sql
-- Entity storage (existing table)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value TEXT NOT NULL,           -- JSON.stringify'd data
  user_id TEXT NOT NULL,
  updated_at INTEGER,
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- File storage (new table)
CREATE TABLE files (
  storage_key TEXT NOT NULL,     -- FK to storage.key
  field_name TEXT NOT NULL,      -- Arbitrary label (pdf, thumbnail, etc.)
  hash TEXT NOT NULL,            -- SHA-256 hash for deduplication
  metadata JSONB,                -- {mimeType, fileName, size}
  user_id TEXT NOT NULL,         -- FK to users.id
  created_at INTEGER,
  updated_at INTEGER,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_hash ON files(hash); -- For deduplication
```

**File Storage Location:**
```
{userData}/files/
  ├── a3f8d9e2b1c4...jpg  # SHA-256 hash as filename
  ├── 7b2c1a9f4e6d...pdf
  └── e4c9b8f3a2d1...png
```

**Deduplication Strategy:**
- Files stored by SHA-256 hash (content-based addressing)
- If same file uploaded twice, only one copy on disk
- `files` table tracks which entities reference which hashes

### PostgreSQL (Cloud Storage)

```sql
-- Entity storage (existing table)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value JSONB NOT NULL,          -- Native JSONB support
  user_id UUID NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- File storage (new table)
CREATE TABLE files (
  storage_key TEXT NOT NULL,     -- FK to storage.key
  field_name TEXT NOT NULL,      -- Arbitrary label (pdf, thumbnail, etc.)
  file_data BYTEA NOT NULL,      -- Binary data stored directly
  metadata JSONB,                -- {mimeType, fileName, size}
  user_id UUID NOT NULL,         -- FK to users.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
```

**Storage Strategy:**
- Files stored as BYTEA in PostgreSQL (Phase 1)
- Future: Migrate to S3-compatible storage for scalability (Phase 3)

---

## Security

### User Scoping (Automatic)

All storage operations automatically scope to the current user via composite keys `(key, user_id)`:

**Electron:**
```javascript
// Current user automatically selected
const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();

// All queries include user_id
db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?')
  .get(key, currentUser.id);
```

**Cloud (PostgreSQL):**
```javascript
// JWT middleware extracts user ID from token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    req.user = user; // { id, username }
    next();
  });
};

// All queries include user_id from JWT
await pool.query(
  'SELECT value, user_id FROM storage WHERE key = $1 AND user_id = $2',
  [key, req.user.id]
);
```

**Result:** Users can ONLY access their own data. Cross-user access is impossible even if they know the key.

---

## Why This Design?

### Problem with Separate File Storage

**Old approach (separate APIs):**
```typescript
// Store entity
await storage.set('documents:doc-123', { title: 'Report' });

// Store file separately
await storage.setFile('files:xyz', pdfData);

// Delete entity
await storage.delete('documents:doc-123');
// BUG: files:xyz is now orphaned!
```

**Issues:**
- ❌ Orphaned files (no automatic cleanup)
- ❌ Manual lifecycle management (plugins must track file keys)
- ❌ Race conditions (entity deleted before file, or vice versa)
- ❌ Complex code (plugins need explicit cleanup logic)

### Solution: Files as Entity Properties

**New approach (unified API):**
```typescript
// Store entity + files together
await storage.set('documents:doc-123',
  { title: 'Report' },
  { pdf: pdfData }
);

// Delete entity (cascades to files)
await storage.delete('documents:doc-123');
// ✅ File automatically deleted (database enforced)
```

**Benefits:**
- ✅ No orphans (CASCADE DELETE enforced by database)
- ✅ Atomic operations (entity + files stored/deleted together)
- ✅ Simpler plugin code (no manual file tracking)
- ✅ Referential integrity (FK constraints)

---

## Implementation Phases

### Phase 1: Core Implementation - ✅ COMPLETE

**Goal:** Implement Files as Entity Properties in storage adapters

**Status:** ✅ Complete

**Tasks:**
1. ✅ Extend `StorageAdapter` interface with files parameter
2. ✅ Add `files` table to SQLite schema with FK to `storage(key, user_id)`
3. ✅ Add `files` table to PostgreSQL schema with FK to `storage(key, user_id)`
4. ✅ Update `storage:set` IPC handler to accept files parameter
5. ✅ Update `storage:get` IPC handler to return `{ data, files }`
6. ✅ Update `storage:delete` IPC handler to cascade delete files
7. ✅ Update `PUT /api/storage/:key` endpoint to accept files
8. ✅ Update `GET /api/storage/:key` endpoint to return `{ data, files }`
9. ✅ Update `DELETE /api/storage/:key` endpoint to cascade delete files
10. ✅ Implement file methods in `SQLiteAdapter`
11. ✅ Implement file methods in `PostgreSQLAdapter`

**Deliverables:**
- ✅ Files stored WITH entities in single atomic operation
- ✅ Database FK prevents orphans (CASCADE DELETE)
- ✅ User scoping via composite keys prevents cross-user access
- ✅ Works in both Electron (filesystem + SQLite) and web (PostgreSQL BYTEA)

**Implementation Details:**
- **StorageAdapter Interface**: [src/shared/storage/StorageAdapter.ts](../../src/shared/storage/StorageAdapter.ts#L25-L34)
- **Electron Implementation**: [electron/ipc/storageHandlers.cjs](../../electron/ipc/storageHandlers.cjs#L56-L117)
- **PostgreSQL Implementation**: [src/shared/storage/PostgreSQLAdapter.ts](../../src/shared/storage/PostgreSQLAdapter.ts#L140-L203)
- **Database Schema**: [electron/database.cjs](../../electron/database.cjs#L111-L134), [server/index.js](../../server/index.js#L131-L150)

### Phase 2: Payment Plan Quotas - FUTURE

**Goal:** Add cloud payment plans with configurable quotas

**Tasks:**
1. Add `payment_plan` column to users table
2. Implement payment plan-based quota enforcement
3. Add storage usage tracking per user
4. Create storage usage dashboard
5. Add upgrade prompts when limits reached

**Deliverables:**
- Free plan: 10 MB per file, 100 MB total
- Pro plan: 500 MB per file, 10 GB total
- Enterprise plan: Unlimited
- Local (Electron): Always unlimited (disk space is the limit)

### Phase 3: S3 Migration - FUTURE

**Goal:** Migrate PostgreSQL BYTEA → S3-compatible storage

**Why:**
- PostgreSQL BYTEA works but has limitations at scale
- Database bloat with large files
- Expensive backups
- S3/R2 is cheaper for file storage

**Migration Strategy:**
1. Add `s3_key` and `s3_bucket` columns to `files` table
2. Configure S3-compatible endpoint (CloudFlare R2, Backblaze B2, Wasabi)
3. Update server upload endpoint to store in S3 instead of BYTEA
4. Update download endpoint to fetch from S3
5. Migrate existing BYTEA files to S3 (one-time script)
6. Drop `file_data` BYTEA column after migration

**Client Impact:** ZERO - StorageAdapter interface unchanged, server implementation only

---

## Testing

### Testing Without Documents UI

Since the Documents plugin UI isn't ready yet, test directly via browser console:

**Test 1: Store entity with file**
```javascript
const storage = PluginManager.getInstance().getStorage();

// Create simple test data
const testData = { title: 'Test Document', tags: ['test'] };
const testFile = new Uint8Array([1, 2, 3, 4, 5]); // Simple binary data

// Store
await storage.set('test:doc-1', testData, { file1: testFile });
console.log('Stored successfully');
```

**Test 2: Retrieve entity with file**
```javascript
const result = await storage.get('test:doc-1');
console.log('Data:', result.data);
console.log('Files:', result.files);
console.log('File matches:',
  JSON.stringify(Array.from(result.files.file1)) === JSON.stringify([1,2,3,4,5])
);
```

**Test 3: Delete entity (verify cascade)**
```javascript
await storage.delete('test:doc-1');
const result = await storage.get('test:doc-1');
console.log('After delete:', result); // Should be null
```

### Local Testing (Electron)

**Run Electron app:**
```bash
# WSL: Start Vite dev server
npm run dev

# Windows: Start Electron
npm run electron:win
```

**Verify file storage:**
```bash
# Check files directory
dir %APPDATA%\ChayCards\files

# Check files table
sqlite3 %APPDATA%\ChayCards\storage.db "SELECT * FROM files;"
```

### Cloud Testing (PostgreSQL)

**Start local PostgreSQL:**
```bash
docker-compose up postgres
# PostgreSQL on localhost:5433
```

**Start API server:**
```bash
npm run server
# Server on http://localhost:7243
```

**Verify:**
```bash
# Connect to PostgreSQL
docker exec -it chaycards-postgres psql -U postgres -d chaycards

# Check files table
SELECT storage_key, field_name, length(file_data) as bytes, metadata
FROM files
WHERE user_id = (SELECT id FROM users WHERE username = 'your-username');
```

---

## Plugin Developer Guide

### Basic Usage

```typescript
import { PluginManager } from '@/shared/plugin-system';
import { buildPluginStorageKey } from '@/shared/constants';

class DocumentService {
  private storage = PluginManager.getInstance().getStorage();
  private readonly PLUGIN_ID = 'documents-plugin';

  async saveDocument(title: string, file: File): Promise<string> {
    const docId = crypto.randomUUID();
    const key = buildPluginStorageKey(this.PLUGIN_ID, docId);

    // Read file data
    const fileData = new Uint8Array(await file.arrayBuffer());

    // Store entity + file together
    await this.storage.set(key,
      {
        id: docId,
        title,
        fileType: file.type,
        fileName: file.name,
        createdAt: Date.now()
      },
      {
        content: fileData // Arbitrary field name
      }
    );

    return docId;
  }

  async getDocument(docId: string): Promise<{ meta: any, file: Blob } | null> {
    const key = buildPluginStorageKey(this.PLUGIN_ID, docId);
    const result = await this.storage.get(key);

    if (!result) return null;

    return {
      meta: result.data,
      file: new Blob([result.files.content], { type: result.data.fileType })
    };
  }

  async deleteDocument(docId: string): Promise<void> {
    const key = buildPluginStorageKey(this.PLUGIN_ID, docId);
    await this.storage.delete(key); // Cascades to delete file
  }
}
```

### Multiple Files Per Entity

```typescript
async saveUserProfile(user: User, avatar: File, resume: File): Promise<void> {
  const key = buildPluginStorageKey('profiles', user.id);

  const avatarData = new Uint8Array(await avatar.arrayBuffer());
  const resumeData = new Uint8Array(await resume.arrayBuffer());

  await this.storage.set(key,
    {
      name: user.name,
      email: user.email,
      bio: user.bio
    },
    {
      avatar: avatarData,  // Field names are arbitrary
      resume: resumeData
    }
  );
}
```

### Updating Individual Files

```typescript
async updateAvatar(userId: string, newAvatar: File): Promise<void> {
  const key = buildPluginStorageKey('profiles', userId);

  // Get existing data
  const result = await this.storage.get(key);
  if (!result) throw new Error('User not found');

  // Update avatar only
  const avatarData = new Uint8Array(await newAvatar.arrayBuffer());
  await this.storage.set(key,
    result.data,                    // Keep existing data
    { avatar: avatarData }          // Replace avatar, keep resume
  );
}
```

---

## Best Practices

### ✅ DO

- **Use `buildPluginStorageKey()`** for all keys to prevent collisions
- **Check `storage !== null`** before using (public pages return null)
- **Use arbitrary field names** that make sense for your use case (pdf, thumbnail, avatar)
- **Delete entities** when no longer needed (files cascade automatically)
- **Test file integrity** by comparing SHA-256 hashes after retrieval

### ❌ DON'T

- **Don't bypass user scoping** (automatic, but respect it)
- **Don't check `window.electronAPI` directly** (use `isElectron()` from `@/utils/platform`)
- **Don't create unnamespaced keys** (always use `buildPluginStorageKey()`)
- **Don't manually track file lifecycles** (database handles it)

---

## Troubleshooting

### Files Not Returned After Storage

**Cause:** Files parameter was `undefined` or empty object during `set()`

**Solution:**
```typescript
// ❌ Wrong - files is undefined
await storage.set(key, data, undefined);

// ✅ Correct - files is empty object (no files attached)
await storage.set(key, data, {});

// ✅ Correct - files provided
await storage.set(key, data, { pdf: pdfData });
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
```

### File Corruption After Retrieval

**Cause:** Data type mismatch or encoding issue

**Solution:**
```typescript
// Verify integrity with SHA-256 hash
import crypto from 'crypto';

const originalHash = crypto.createHash('sha256').update(originalData).digest('hex');
const retrievedHash = crypto.createHash('sha256').update(result.files.pdf).digest('hex');

console.assert(originalHash === retrievedHash, 'File corrupted!');
```

---

## Related Documentation

- **Storage Adapter:** `/src/shared/storage/StorageAdapter.ts`
- **Platform Detection:** `/src/utils/platform.ts`
- **Storage Constants:** `/src/shared/constants.ts`
- **Plugin System:** `/memory-bank/docs/PLUGIN_SYSTEM.md`
