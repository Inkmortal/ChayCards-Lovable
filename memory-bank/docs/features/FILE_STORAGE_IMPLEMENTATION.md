# File Storage Implementation - How Files Are Actually Stored

This document explains the concrete implementation of Files as Entity Properties in both Electron (desktop) and Cloud (web) environments.

---

## 🖥️ Electron (Desktop) Environment

### Overview
Files are stored on the **local filesystem** with metadata tracked in **SQLite**.

### Storage Architecture

```
%APPDATA%\ChayCards\
├── storage.db              ← SQLite database
└── files/                  ← Binary file storage
    ├── a3f8d9e2b1c4...    ← SHA-256 hash as filename
    ├── 7b2c1a9f4e6d...
    └── e4c9b8f3a2d1...
```

### Database Schema

**`storage` table** - Entity metadata:
```sql
CREATE TABLE storage (
  key TEXT NOT NULL,              -- e.g., 'core-flashcards:decks/deck-123'
  value TEXT NOT NULL,            -- JSON-stringified deck data
  user_id TEXT NOT NULL,
  updated_at INTEGER,
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**`files` table** - File metadata with CASCADE DELETE:
```sql
CREATE TABLE files (
  storage_key TEXT NOT NULL,      -- FK to storage.key
  field_name TEXT NOT NULL,       -- e.g., 'coverImage', 'deckData'
  hash TEXT NOT NULL,             -- SHA-256 hash for deduplication
  metadata TEXT,                  -- Optional JSONB metadata
  user_id TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_files_hash ON files(hash); -- For deduplication
```

### Example: Creating a Flashcard Deck with Cover Image

**Step 1: Renderer calls StorageAdapter**
```typescript
// In FlashcardService.ts
const deckKey = buildPluginStorageKey('core-flashcards', `decks/${deckId}`);
const coverImageBytes = new Uint8Array([...]); // Image data

await storage.set(deckKey,
  {
    id: deckId,
    name: 'Spanish Vocabulary',
    // ... other deck metadata
  },
  {
    coverImage: coverImageBytes  // File attached as property
  }
);
```

**Step 2: SQLiteAdapter sends IPC to Electron main process**
```typescript
// In SQLiteAdapter.ts
await window.electronAPI.storage.set(key, value, files);
```

**Step 3: Electron main process handles storage** ([storageHandlers.cjs:56-117](../../electron/ipc/storageHandlers.cjs#L56-L117)):

```javascript
ipcMain.handle('storage:set', (event, key, value, files) => {
  const currentUser = db.prepare('SELECT id FROM users ORDER BY last_used_at DESC LIMIT 1').get();

  // 1. Store deck metadata in storage table
  db.prepare(`
    INSERT INTO storage (key, value, user_id, updated_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(key, user_id) DO UPDATE SET
      value = excluded.value,
      updated_at = strftime('%s', 'now')
  `).run(key, JSON.stringify(value), currentUser.id);

  // 2. Store file if provided
  if (files && files.coverImage) {
    const fileData = files.coverImage; // Uint8Array

    // Calculate SHA-256 hash for deduplication
    const hash = crypto.createHash('sha256').update(fileData).digest('hex');
    // Result: "a3f8d9e2b1c4..." (64 hex characters)

    // Write to filesystem
    const filesDir = path.join(app.getPath('userData'), 'files');
    const filePath = path.join(filesDir, hash);
    fs.writeFileSync(filePath, fileData);

    // Store metadata in files table
    db.prepare(`
      INSERT INTO files (storage_key, field_name, hash, user_id, updated_at)
      VALUES (?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(storage_key, field_name, user_id) DO UPDATE SET
        hash = excluded.hash,
        updated_at = strftime('%s', 'now')
    `).run(key, 'coverImage', hash, currentUser.id);
  }
});
```

**What's on Disk After Creation:**

**storage.db** - SQLite database:
```sql
-- storage table
key                                | value                              | user_id
core-flashcards:decks/deck-123    | {"id":"deck-123","name":"Spanish"} | user-001

-- files table
storage_key                        | field_name  | hash           | user_id
core-flashcards:decks/deck-123    | coverImage  | a3f8d9e2b1c4... | user-001
```

**files/** - Filesystem:
```
%APPDATA%\ChayCards\files\
└── a3f8d9e2b1c4f6789abcdef...  ← Binary image data (SHA-256 filename)
```

### Deduplication in Action

**Scenario:** Two decks use the same cover image.

```typescript
// Deck 1 with image
await storage.set('core-flashcards:decks/deck-123', deck1Data, {
  coverImage: imageBytes  // hash = a3f8d9e2...
});

// Deck 2 with SAME image
await storage.set('core-flashcards:decks/deck-456', deck2Data, {
  coverImage: imageBytes  // hash = a3f8d9e2... (same!)
});
```

**Result on Disk:**

**Only ONE copy of the file:**
```
files/
└── a3f8d9e2b1c4...  ← Single file on disk
```

**Two metadata records:**
```sql
storage_key                     | field_name  | hash
core-flashcards:decks/deck-123 | coverImage  | a3f8d9e2b1c4...
core-flashcards:decks/deck-456 | coverImage  | a3f8d9e2b1c4...  ← Same hash!
```

### Retrieval Process

**Renderer calls:**
```typescript
const result = await storage.get('core-flashcards:decks/deck-123');
// Returns: { data: {...}, files: { coverImage: Uint8Array } }
```

**Electron main process** ([storageHandlers.cjs:16-54](../../electron/ipc/storageHandlers.cjs#L16-L54)):
```javascript
ipcMain.handle('storage:get', (event, key) => {
  // 1. Get deck metadata
  const row = db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?')
    .get(key, currentUser.id);

  // 2. Get file metadata
  const fileRows = db.prepare(
    'SELECT field_name, hash FROM files WHERE storage_key = ? AND user_id = ?'
  ).all(key, currentUser.id);

  // 3. Read files from disk
  const files = {};
  for (const fileRow of fileRows) {
    const filePath = path.join(filesDir, fileRow.hash);
    files[fileRow.field_name] = fs.readFileSync(filePath); // Returns Uint8Array
  }

  return {
    data: JSON.parse(row.value),
    files: files  // { coverImage: Uint8Array }
  };
});
```

### CASCADE DELETE in Action

**When you delete a deck:**
```typescript
await storage.delete('core-flashcards:decks/deck-123');
```

**What happens:**

1. **storage table** - Row deleted:
   ```sql
   DELETE FROM storage WHERE key = 'core-flashcards:decks/deck-123' AND user_id = 'user-001';
   ```

2. **files table** - CASCADE DELETE triggered automatically by FK constraint:
   ```sql
   -- SQLite automatically runs:
   DELETE FROM files
   WHERE storage_key = 'core-flashcards:decks/deck-123'
   AND user_id = 'user-001';
   ```

3. **Filesystem** - File remains (might be used by other decks):
   ```
   files/
   └── a3f8d9e2b1c4...  ← Still exists if referenced by other records
   ```

`✶ Insight ─────────────────────────────────────`
**Why Files Stay on Disk**: The filesystem files are NOT automatically deleted because they're deduplicated. If `deck-456` also uses the same image (same hash), we can't delete the file when `deck-123` is removed. A cleanup job could run periodically to remove unreferenced hashes:
```sql
-- Find orphaned files
SELECT DISTINCT hash FROM files;  -- Hashes in use
-- Delete files not in this list
```
`─────────────────────────────────────────────────`

---

## ☁️ Cloud (Web + PostgreSQL) Environment

### Overview
Files are stored as **BYTEA** (binary data type) directly in **PostgreSQL**.

### Storage Architecture

```
PostgreSQL Database (localhost:5433 or production)
├── storage table       ← Entity metadata (JSONB)
└── files table         ← Binary file data (BYTEA)
```

### Database Schema

**`storage` table** - Entity metadata:
```sql
CREATE TABLE storage (
  key TEXT NOT NULL,
  value JSONB NOT NULL,           -- Native JSONB (no stringify needed)
  user_id UUID NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**`files` table** - Binary file storage:
```sql
CREATE TABLE files (
  storage_key TEXT NOT NULL,      -- FK to storage.key
  field_name TEXT NOT NULL,       -- e.g., 'coverImage'
  file_data BYTEA NOT NULL,       -- Binary data stored directly
  metadata JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
```

### Example: Creating a Flashcard Deck with Cover Image

**Step 1: Renderer calls StorageAdapter**
```typescript
// Same as Electron
await storage.set(deckKey, deckData, { coverImage: imageBytes });
```

**Step 2: PostgreSQLAdapter makes HTTP request** ([PostgreSQLAdapter.ts:140-203](../../src/shared/storage/PostgreSQLAdapter.ts#L140-L203)):

```typescript
async set(key, value, files) {
  // Convert Uint8Array to base64 for JSON transport
  const filesForTransport = {};
  if (files?.coverImage) {
    let binaryString = '';
    for (let i = 0; i < files.coverImage.length; i++) {
      binaryString += String.fromCharCode(files.coverImage[i]);
    }
    filesForTransport.coverImage = btoa(binaryString); // Base64 encode
  }

  // Send to server
  await fetch(`${apiUrl}/${key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: deckData,
      files: filesForTransport  // { coverImage: "base64string..." }
    })
  });
}
```

**Step 3: Backend API stores in PostgreSQL** ([server/index.js:373-427](../../server/index.js#L373-L427)):

```javascript
app.put('/api/storage/:key', authenticateToken, async (req, res) => {
  const key = req.params.key;
  const { value, files } = req.body;
  const userId = req.user.id; // From JWT

  // 1. Store deck metadata in storage table
  await pool.query(
    `INSERT INTO storage (key, value, user_id, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (key, user_id) DO UPDATE SET
       value = $2::jsonb,
       updated_at = NOW()`,
    [key, JSON.stringify(value), userId]
  );

  // 2. Store file if provided
  if (files?.coverImage) {
    // Convert base64 back to Buffer
    const buffer = Buffer.from(files.coverImage, 'base64');

    // Store in files table
    await pool.query(
      `INSERT INTO files (storage_key, field_name, file_data, user_id, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (storage_key, field_name, user_id) DO UPDATE SET
         file_data = $3,
         updated_at = NOW()`,
      [key, 'coverImage', buffer, userId]
    );
  }

  res.json({ success: true });
});
```

**What's in PostgreSQL After Creation:**

```sql
-- storage table
SELECT key, value->>'name' as name, user_id FROM storage;

key                                | name               | user_id
core-flashcards:decks/deck-123    | Spanish Vocabulary | uuid-001

-- files table
SELECT storage_key, field_name, length(file_data) as bytes, user_id FROM files;

storage_key                        | field_name  | bytes  | user_id
core-flashcards:decks/deck-123    | coverImage  | 12345  | uuid-001
```

**View binary data:**
```sql
SELECT file_data FROM files
WHERE storage_key = 'core-flashcards:decks/deck-123'
AND field_name = 'coverImage';

-- Returns: \x89504e470d0a1a0a... (BYTEA hex format)
```

### Retrieval Process

**Renderer calls:**
```typescript
const result = await storage.get('core-flashcards:decks/deck-123');
```

**PostgreSQLAdapter fetches from API** ([PostgreSQLAdapter.ts:65-138](../../src/shared/storage/PostgreSQLAdapter.ts#L65-L138)):

```typescript
async get(key) {
  const response = await fetch(`${apiUrl}/${key}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const responseData = await response.json();
  // responseData = { value: {...}, files: { coverImage: "base64..." } }

  // Convert base64 back to Uint8Array
  const files = {};
  if (responseData.files?.coverImage) {
    const binaryString = atob(responseData.files.coverImage);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    files.coverImage = bytes;
  }

  return {
    data: responseData.value,
    files: files  // { coverImage: Uint8Array }
  };
}
```

**Backend API fetches from PostgreSQL** ([server/index.js:340-370](../../server/index.js#L340-L370)):

```javascript
app.get('/api/storage/:key', authenticateToken, async (req, res) => {
  const key = req.params.key;
  const userId = req.user.id;

  // 1. Get deck metadata
  const result = await pool.query(
    'SELECT value FROM storage WHERE key = $1 AND user_id = $2',
    [key, userId]
  );

  // 2. Get attached files
  const fileResult = await pool.query(
    'SELECT field_name, file_data FROM files WHERE storage_key = $1 AND user_id = $2',
    [key, userId]
  );

  // 3. Convert BYTEA to base64 for JSON transport
  const files = {};
  for (const fileRow of fileResult.rows) {
    files[fileRow.field_name] = fileRow.file_data.toString('base64');
  }

  res.json({
    value: result.rows[0]?.value,
    files: files  // { coverImage: "base64string..." }
  });
});
```

### CASCADE DELETE in Action

**When you delete a deck:**
```typescript
await storage.delete('core-flashcards:decks/deck-123');
```

**Backend API** ([server/index.js:429-448](../../server/index.js#L429-L448)):
```javascript
app.delete('/api/storage/:key', authenticateToken, async (req, res) => {
  const key = req.params.key;
  const userId = req.user.id;

  // Delete from storage table
  await pool.query(
    'DELETE FROM storage WHERE key = $1 AND user_id = $2',
    [key, userId]
  );

  // PostgreSQL CASCADE DELETE automatically runs:
  // DELETE FROM files WHERE storage_key = $1 AND user_id = $2

  res.json({ success: true, deleted: true });
});
```

**PostgreSQL automatically deletes files** because of the foreign key constraint:
```sql
FOREIGN KEY (storage_key, user_id)
  REFERENCES storage(key, user_id) ON DELETE CASCADE
```

`✶ Insight ─────────────────────────────────────`
**No Deduplication in PostgreSQL (Phase 1)**: Unlike Electron's SHA-256 hash deduplication, PostgreSQL stores each file as BYTEA directly. If two decks have the same image, two copies are stored. This is simpler but less space-efficient. Phase 3 of the spec plans S3 migration where deduplication could be reintroduced.
`─────────────────────────────────────────────────`

---

## 🔄 Comparison: Electron vs Cloud

| Aspect | Electron (Desktop) | Cloud (Web + PostgreSQL) |
|--------|-------------------|--------------------------|
| **File Storage** | Filesystem (`%APPDATA%\ChayCards\files\`) | PostgreSQL BYTEA column |
| **Metadata Storage** | SQLite `files` table | PostgreSQL `files` table |
| **Deduplication** | ✅ SHA-256 hash-based | ❌ No deduplication |
| **Transport** | IPC (direct binary) | HTTP + base64 encoding |
| **CASCADE DELETE** | ✅ SQLite foreign keys | ✅ PostgreSQL foreign keys |
| **User Scoping** | `user_id` column | `user_id UUID` column |
| **File Size Limit** | Disk space | PostgreSQL max (1GB default) |

---

## 🧪 How to Verify File Storage

### Electron (Desktop)

**1. Check SQLite database:**
```bash
# Windows
sqlite3 %APPDATA%\ChayCards\storage.db

# WSL
sqlite3 /mnt/c/Users/YourName/AppData/Roaming/ChayCards/storage.db
```

**Query files:**
```sql
-- List all files
SELECT storage_key, field_name, hash, user_id FROM files;

-- Check specific deck's files
SELECT * FROM files WHERE storage_key = 'core-flashcards:decks/deck-123';

-- Find file size (need to check filesystem)
SELECT hash FROM files WHERE field_name = 'coverImage';
```

**2. Check filesystem:**
```bash
# Windows
dir %APPDATA%\ChayCards\files

# WSL
ls -lh /mnt/c/Users/YourName/AppData/Roaming/ChayCards/files/
```

**3. Verify deduplication:**
```sql
-- Count unique hashes (files on disk)
SELECT COUNT(DISTINCT hash) FROM files;

-- Count total file records (metadata rows)
SELECT COUNT(*) FROM files;

-- If COUNT(DISTINCT hash) < COUNT(*), deduplication is working!
```

### Cloud (PostgreSQL)

**1. Connect to database:**
```bash
docker exec -it chaycards-postgres psql -U postgres -d chaycards
```

**2. Query files:**
```sql
-- List all files
SELECT storage_key, field_name, length(file_data) as bytes, user_id
FROM files;

-- Check specific deck's files
SELECT field_name, length(file_data) as size_bytes, created_at
FROM files
WHERE storage_key = 'core-flashcards:decks/deck-123';

-- Total storage used per user
SELECT user_id, SUM(length(file_data)) as total_bytes
FROM files
GROUP BY user_id;
```

**3. View file data (hex dump):**
```sql
-- Show first 100 bytes of file
SELECT substring(file_data from 1 for 100)
FROM files
WHERE storage_key = 'core-flashcards:decks/deck-123';

-- Check PNG signature (89 50 4E 47)
SELECT substring(file_data from 1 for 4)
FROM files
WHERE field_name = 'coverImage';
```

---

## 📊 Example: Complete Deck with Multiple Files

Here's what a deck with multiple attached files looks like in both environments.

### Scenario
A deck with:
- Cover image (PNG, 50 KB)
- Background audio (MP3, 2 MB)
- Custom template (HTML, 5 KB)

### Electron Storage

**Filesystem:**
```
%APPDATA%\ChayCards\files\
├── a3f8d9e2b1c4...  (50 KB)   ← Cover image
├── 7b2c1a9f4e6d...  (2 MB)    ← Background audio
└── e4c9b8f3a2d1...  (5 KB)    ← Custom template
```

**SQLite `files` table:**
```sql
storage_key                     | field_name       | hash           | user_id
core-flashcards:decks/deck-456 | coverImage       | a3f8d9e2b1c4... | user-001
core-flashcards:decks/deck-456 | backgroundAudio  | 7b2c1a9f4e6d... | user-001
core-flashcards:decks/deck-456 | customTemplate   | e4c9b8f3a2d1... | user-001
```

**SQLite `storage` table:**
```sql
key                             | value
core-flashcards:decks/deck-456 | {"id":"deck-456","name":"Advanced Spanish",...}
```

### PostgreSQL Storage

**`files` table:**
```sql
storage_key                     | field_name       | file_data (bytes) | user_id
core-flashcards:decks/deck-456 | coverImage       | \x89504e47...     | uuid-001
core-flashcards:decks/deck-456 | backgroundAudio  | \x494433...       | uuid-001
core-flashcards:decks/deck-456 | customTemplate   | \x3c68746d6c...   | uuid-001
```

**Query to see sizes:**
```sql
SELECT
  field_name,
  length(file_data) as bytes,
  pg_size_pretty(length(file_data)::bigint) as size
FROM files
WHERE storage_key = 'core-flashcards:decks/deck-456';

-- Result:
field_name       | bytes    | size
coverImage       | 51200    | 50 KB
backgroundAudio  | 2097152  | 2048 KB
customTemplate   | 5120     | 5 KB
```

---

## Summary

Both implementations achieve the same **Files as Entity Properties** pattern, but with different storage backends:

- **Electron**: Optimized for local performance with filesystem storage and deduplication
- **Cloud**: Simple BYTEA storage in PostgreSQL, ready for future S3 migration

Both provide:
- ✅ Atomic operations (entity + files together)
- ✅ CASCADE DELETE (no orphans)
- ✅ User scoping (composite keys)
- ✅ Same API for plugins (transparent to developers)
