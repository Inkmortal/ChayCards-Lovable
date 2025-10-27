# Testing Files as Entity Properties - Flashcard Decks

## Overview

We've successfully implemented the "Files as Entity Properties" pattern for flashcard decks. This test plan verifies the implementation works correctly.

## What Changed

### Before (Array-based Storage)
```typescript
// Single storage key with array of decks
'core-flashcards:decks' → [deck1, deck2, deck3]
```

**Problems:**
- Decks didn't appear in Documents folder browser
- No integration with Documents plugin
- Manual cleanup required when deleting decks

### After (Entity-based Storage with Files as Entity Properties)
```typescript
// Individual storage keys for each deck
'core-flashcards:decks/deck-123' → { deck metadata }
'core-documents:files' → [..., {deck StoredFile record}, ...]
```

**Benefits:**
- ✅ Decks appear as `.deck` files in Documents
- ✅ Automatic CASCADE DELETE (database enforced)
- ✅ Files as Entity Properties pattern (ready for media attachments)
- ✅ Proper folder organization

## Test Plan

### Prerequisites
1. Start development environment:
   ```bash
   # From WSL
   npm run dev
   ```

2. Open browser at `http://localhost:8080`
3. Log in with test credentials (username: `test`, password: `test1234`)

### Test 1: Create a Deck

**Steps:**
1. Navigate to Flashcards page (`/app/flashcards`)
2. Click "Create Deck" button
3. Name the deck "Test Deck 1"
4. Save

**Expected Results:**
- ✅ Deck appears in Flashcards list
- ✅ Deck is stored at `'core-flashcards:decks/{deck-id}'`
- ✅ StoredFile record created in `'core-documents:files'`
- ✅ Deck visible in Documents folder browser (Flashcards folder)

**Verification (Browser Console):**
```javascript
const storage = PluginManager.getInstance().getStorage();
const keys = await storage.list('core-flashcards:decks/');
console.log('Deck keys:', keys);

const result = await storage.get(keys[0]);
console.log('Deck data:', result.data);
console.log('Attached files:', result.files);
```

### Test 2: Update Deck Name

**Steps:**
1. Click on "Test Deck 1"
2. Edit name to "My Spanish Vocabulary"
3. Save

**Expected Results:**
- ✅ Deck name updated in Flashcards
- ✅ Filename updated to "My Spanish Vocabulary.deck"
- ✅ StoredFile record updated in Documents
- ✅ Documents UI shows new filename

### Test 3: Move Deck to Different Folder

**Steps:**
1. In Documents, create a new folder "Study Decks"
2. Drag "My Spanish Vocabulary.deck" to "Study Decks" folder
3. Check Flashcards page

**Expected Results:**
- ✅ Deck moved to new folder
- ✅ Flashcards page reflects folder change
- ✅ folderId updated in deck metadata

### Test 4: Delete Deck

**Steps:**
1. Delete "My Spanish Vocabulary.deck" from Documents
2. OR delete from Flashcards page
3. Check storage

**Expected Results:**
- ✅ Deck removed from Flashcards list
- ✅ Deck key deleted from storage
- ✅ StoredFile record removed from Documents
- ✅ No orphaned files (CASCADE DELETE works)

**Verification (Browser Console):**
```javascript
const storage = PluginManager.getInstance().getStorage();
const keys = await storage.list('core-flashcards:decks/');
console.log('Remaining decks:', keys); // Should be empty or not include deleted deck

const files = await storage.get('core-documents:files');
console.log('Documents files:', files.data); // Should not include deleted deck
```

### Test 5: Multiple Decks in Folder

**Steps:**
1. Create 3 decks: "Deck A", "Deck B", "Deck C"
2. All should go to "Flashcards" folder by default
3. Check Documents folder browser

**Expected Results:**
- ✅ All 3 decks appear in Flashcards folder
- ✅ Each has proper `.deck` extension
- ✅ Each has unique storage key
- ✅ Order preserved (ORDER_GAP spacing)

### Test 6: Storage Pattern Verification

**Browser Console Test:**
```javascript
const storage = PluginManager.getInstance().getStorage();

// List all deck keys
const deckKeys = await storage.list('core-flashcards:decks/');
console.log('Deck keys:', deckKeys);

// Get first deck with files
const result = await storage.get(deckKeys[0]);
console.log('Deck metadata:', result.data);
console.log('Attached files:', Object.keys(result.files));
console.log('Files count:', Object.keys(result.files).length);

// Verify StoredFile exists
const files = await storage.get('core-documents:files');
const deckFile = files.data.find(f => f.id === result.data.id);
console.log('StoredFile record:', deckFile);
console.log('Extension:', deckFile.extension); // Should be '.deck'
console.log('MIME type:', deckFile.mimeType); // Should be 'application/x-flashcard-deck'
```

### Test 7: FileHandler Registration

**Steps:**
1. Open Documents folder
2. Right-click → "New File"
3. Check available file types

**Expected Results:**
- ✅ "Flashcard Deck" option appears
- ✅ Icon shows 🗂️ (folder icon)
- ✅ Clicking creates new deck
- ✅ Deck appears in both Documents and Flashcards

### Test 8: Electron (Desktop) Environment

**Steps:**
1. Start Electron app:
   ```bash
   # From Windows
   npm run electron:win
   ```

2. Log in
3. Create a deck
4. Check file system

**Expected Results:**
- ✅ Deck stored in SQLite database
- ✅ Files deduplication works (SHA-256 hashing)
- ✅ Files directory: `%APPDATA%\ChayCards\files\`
- ✅ CASCADE DELETE via SQLite foreign keys

**Verification (Windows Command Prompt):**
```bash
# Check files directory
dir %APPDATA%\ChayCards\files

# Check SQLite database
sqlite3 %APPDATA%\ChayCards\storage.db "SELECT * FROM files WHERE storage_key LIKE 'core-flashcards:decks/%';"
```

### Test 9: Cloud (Web) Environment

**Prerequisites:**
1. Start PostgreSQL:
   ```bash
   docker-compose up postgres
   ```

2. Start API server:
   ```bash
   npm run server
   ```

3. Access app at `http://localhost:8080`
4. Register/login with cloud account

**Steps:**
1. Create a deck
2. Check PostgreSQL database

**Expected Results:**
- ✅ Deck stored in PostgreSQL
- ✅ Files stored as BYTEA in `files` table
- ✅ CASCADE DELETE via PostgreSQL foreign keys

**Verification (PostgreSQL):**
```bash
docker exec -it chaycards-postgres psql -U postgres -d chaycards

# Check files table
SELECT storage_key, field_name, length(file_data) as bytes, user_id
FROM files
WHERE storage_key LIKE 'core-flashcards:decks/%';

# Check storage table
SELECT key, value->>'name' as deck_name, user_id
FROM storage
WHERE key LIKE 'core-flashcards:decks/%';
```

## Known Issues

None at this time. If you encounter any issues, please report them with:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser console errors
4. Storage adapter in use (Electron/Web)

## Success Criteria

✅ All 9 tests pass
✅ No console errors
✅ Decks appear in Documents folder browser
✅ CASCADE DELETE works (no orphaned files)
✅ Storage pattern matches Files as Entity Properties spec
✅ Works in both Electron and Web environments

## Next Steps (Future)

1. **Media File Support**: Attach images/audio to cards
   ```typescript
   await storage.set('core-flashcards:cards/card-456',
     { /* card metadata */ },
     {
       frontImage: imageUint8Array,
       backAudio: audioUint8Array
     }
   );
   ```

2. **Deck Export/Import**: Use Files as Entity Properties for deck backups
3. **Deck Templates**: Store template media as attached files
4. **Anki Import**: Preserve Anki media files when importing

## Documentation

- **FILE_STORAGE_SPEC.md**: Complete Files as Entity Properties specification
- **PLUGIN_SYSTEM.md**: Plugin development guide
- **StorageAdapter.ts**: Interface documentation
