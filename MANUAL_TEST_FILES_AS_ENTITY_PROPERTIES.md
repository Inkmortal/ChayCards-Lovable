# Manual Testing Guide: Files as Entity Properties

**Purpose**: Verify the Files as Entity Properties implementation for flashcard decks works correctly.

**Prerequisites**:
- Dev server running on http://localhost:8080
- Logged in as test user (test/test1234)
- Browser developer console open (F12)

---

## Test 1: Verify Storage Pattern (Entity-Based, Not Array)

**What This Tests**: Confirms decks are stored as individual entities, not a single array.

**Browser Console Commands**:
```javascript
// Get storage adapter
const storage = PluginManager.getInstance().getStorage();

// List all deck keys (should see individual deck keys, not single 'decks' key)
const deckKeys = await storage.list('core-flashcards:decks/');
console.log('✅ Deck keys (should be array of "core-flashcards:decks/{deckId}"):', deckKeys);

// Get first deck with files
if (deckKeys.length > 0) {
  const result = await storage.get(deckKeys[0]);
  console.log('✅ Deck data:', result.data);
  console.log('✅ Attached files (should be empty object for now):', result.files);
} else {
  console.log('⚠️ No decks found - create one first via Flashcards plugin');
}
```

**Expected Result**:
- ✅ `deckKeys` is an array like `['core-flashcards:decks/abc123', 'core-flashcards:decks/def456']`
- ✅ `result.data` contains deck object with id, name, cards, etc.
- ✅ `result.files` is an empty object `{}` (no file attachments yet)
- ❌ Should NOT see a single key like `'core-flashcards:decks'`

---

## Test 2: Verify Documents Integration

**What This Tests**: Confirms decks appear as `.deck` files in Documents plugin.

**Browser Console Commands**:
```javascript
// Get Documents service
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');

// Get all files
const files = await documentsService.getFiles();
console.log('📁 All files:', files);

// Filter to deck files only
const deckFiles = files.filter(f => f.extension === '.deck');
console.log('✅ Deck files (.deck):', deckFiles);

// Check structure of first deck file
if (deckFiles.length > 0) {
  const deckFile = deckFiles[0];
  console.log('✅ Deck file structure:', {
    filename: deckFile.filename,
    extension: deckFile.extension,
    mimeType: deckFile.mimeType,
    fileStorageKey: deckFile.fileStorageKey,
    folderId: deckFile.folderId,
    metadata: deckFile.metadata
  });
}
```

**Expected Result**:
- ✅ `deckFiles` contains StoredFile objects for each deck
- ✅ Each deck file has:
  - `filename`: `"Deck Name.deck"`
  - `extension`: `".deck"`
  - `mimeType`: `"application/x-flashcard-deck"`
  - `fileStorageKey`: `"core-flashcards:decks/{deckId}"`
  - `metadata.type`: `"flashcard-deck"`
  - `metadata.cardCount`: number of cards in deck

---

## Test 3: Create New Deck

**What This Tests**: Deck creation creates both storage entity AND StoredFile record.

**Steps**:
1. Go to Flashcards plugin
2. Click "New Deck" (or create via file browser if integrated)
3. Name it "Test Deck for Verification"

**Browser Console Verification**:
```javascript
// Check storage
const storage = PluginManager.getInstance().getStorage();
const keys = await storage.list('core-flashcards:decks/');
console.log('✅ Total decks in storage:', keys.length);

// Check Documents
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');
const files = await documentsService.getFiles();
const deckFiles = files.filter(f => f.extension === '.deck');
console.log('✅ Total .deck files in Documents:', deckFiles.length);

// Verify they match
console.log(keys.length === deckFiles.length
  ? '✅ PASS: Storage count matches Documents count'
  : '❌ FAIL: Mismatch between storage and Documents');

// Find the new deck
const testDeck = deckFiles.find(f => f.filename.includes('Test Deck'));
if (testDeck) {
  console.log('✅ Found test deck:', testDeck.filename);

  // Verify storage entity exists
  const storageResult = await storage.get(testDeck.fileStorageKey);
  console.log('✅ Storage entity exists:', !!storageResult);
  console.log('✅ Deck data:', storageResult.data);
} else {
  console.log('❌ Test deck not found in Documents');
}
```

**Expected Result**:
- ✅ New deck appears in both storage AND Documents
- ✅ Counts match between storage keys and .deck files
- ✅ `fileStorageKey` correctly points to storage entity

---

## Test 4: Rename Deck

**What This Tests**: Renaming updates both deck entity AND StoredFile filename.

**Steps**:
1. Rename "Test Deck for Verification" to "Renamed Test Deck"
2. Wait for update to complete

**Browser Console Verification**:
```javascript
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');
const files = await documentsService.getFiles();
const renamedDeck = files.find(f => f.filename.includes('Renamed Test Deck'));

if (renamedDeck) {
  console.log('✅ PASS: StoredFile filename updated:', renamedDeck.filename);

  // Verify storage entity also updated
  const storage = PluginManager.getInstance().getStorage();
  const result = await storage.get(renamedDeck.fileStorageKey);
  console.log('✅ Storage deck name:', result.data.name);
  console.log(result.data.name === 'Renamed Test Deck'
    ? '✅ PASS: Storage entity name updated'
    : '❌ FAIL: Storage name not updated');
} else {
  console.log('❌ FAIL: Renamed deck not found');
}
```

**Expected Result**:
- ✅ StoredFile `filename` changes to "Renamed Test Deck.deck"
- ✅ Storage entity `name` property updates to "Renamed Test Deck"

---

## Test 5: Move Deck to Different Folder

**What This Tests**: Moving updates StoredFile folderId.

**Steps**:
1. Create a new folder in Documents (or use existing)
2. Move "Renamed Test Deck" to that folder
3. Note the folder ID from the URL or UI

**Browser Console Verification**:
```javascript
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');
const files = await documentsService.getFiles();
const movedDeck = files.find(f => f.filename.includes('Renamed Test Deck'));

if (movedDeck) {
  console.log('✅ Deck folderId:', movedDeck.folderId);

  // Verify storage entity also updated
  const storage = PluginManager.getInstance().getStorage();
  const result = await storage.get(movedDeck.fileStorageKey);
  console.log('✅ Storage deck folderId:', result.data.folderId);
  console.log(result.data.folderId === movedDeck.folderId
    ? '✅ PASS: Folder ID matches between Documents and Storage'
    : '❌ FAIL: Folder ID mismatch');
}
```

**Expected Result**:
- ✅ StoredFile `folderId` updates to new folder
- ✅ Storage entity `folderId` property also updates

---

## Test 6: CASCADE DELETE

**What This Tests**: Deleting deck removes BOTH storage entity AND StoredFile.

**Steps**:
1. Note the deck ID of "Renamed Test Deck"
2. Delete the deck via Flashcards plugin

**Browser Console Verification**:
```javascript
// Replace with actual deck ID from previous tests
const deletedDeckId = 'PASTE_DECK_ID_HERE';
const deletedDeckKey = `core-flashcards:decks/${deletedDeckId}`;

// Check storage
const storage = PluginManager.getInstance().getStorage();
const storageExists = await storage.has(deletedDeckKey);
console.log(storageExists
  ? '❌ FAIL: Storage entity still exists after delete'
  : '✅ PASS: Storage entity deleted');

// Check Documents
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');
const files = await documentsService.getFiles();
const fileExists = files.some(f => f.id === deletedDeckId);
console.log(fileExists
  ? '❌ FAIL: StoredFile still exists after delete'
  : '✅ PASS: StoredFile removed from Documents');

// Verify no orphaned records
const allDeckKeys = await storage.list('core-flashcards:decks/');
const allDeckFiles = files.filter(f => f.extension === '.deck');
console.log('📊 Final counts:');
console.log('  Storage keys:', allDeckKeys.length);
console.log('  Document files:', allDeckFiles.length);
console.log(allDeckKeys.length === allDeckFiles.length
  ? '✅ PASS: No orphaned records'
  : '❌ FAIL: Count mismatch indicates orphaned records');
```

**Expected Result**:
- ✅ Storage entity deleted (`storage.has()` returns false)
- ✅ StoredFile removed from Documents array
- ✅ No orphaned records (counts match)

---

## Test 7: Verify File Storage Architecture

**What This Tests**: Confirms the `{ data, files }` return structure works.

**Browser Console Commands**:
```javascript
const storage = PluginManager.getInstance().getStorage();
const keys = await storage.list('core-flashcards:decks/');

if (keys.length > 0) {
  const result = await storage.get(keys[0]);

  // Check structure
  console.log('✅ Result structure:', {
    hasData: 'data' in result,
    hasFiles: 'files' in result,
    dataType: typeof result.data,
    filesType: typeof result.files,
    filesIsObject: result.files !== null && typeof result.files === 'object'
  });

  console.log('✅ Return structure matches interface:',
    'data' in result && 'files' in result && typeof result.files === 'object'
      ? '✅ PASS'
      : '❌ FAIL');
} else {
  console.log('⚠️ No decks to test - create one first');
}
```

**Expected Result**:
- ✅ `result` is object with `{ data, files }` structure
- ✅ `result.data` contains deck object
- ✅ `result.files` is an object (empty `{}` for now, will have content when Phase 2 adds media)

---

## Test 8: Electron Environment (Optional)

**What This Tests**: Electron-specific file storage with SHA-256 deduplication.

**Prerequisites**: Run app in Electron (not browser)

**Browser Console Commands**:
```javascript
// Check if running in Electron
const isElectron = typeof window.electronAPI !== 'undefined';
console.log(isElectron ? '✅ Running in Electron' : '⚠️ Running in browser');

if (isElectron) {
  // Storage should use SQLiteAdapter
  const storage = PluginManager.getInstance().getStorage();
  console.log('✅ Storage adapter:', storage.constructor.name);
  console.log(storage.constructor.name === 'SQLiteAdapter'
    ? '✅ PASS: Using SQLiteAdapter in Electron'
    : '❌ FAIL: Wrong adapter for Electron');
}
```

**Expected Result**:
- ✅ `isElectron` is true
- ✅ Storage adapter is `SQLiteAdapter`

---

## Summary Checklist

After running all tests, verify:

- [ ] ✅ Decks stored as individual entities (not array)
- [ ] ✅ Each deck has `{ data, files }` structure
- [ ] ✅ Decks appear as `.deck` files in Documents
- [ ] ✅ StoredFile records created on deck creation
- [ ] ✅ Renaming updates both storage and Documents
- [ ] ✅ Moving folders updates folderId in both places
- [ ] ✅ Deleting removes both storage entity and StoredFile
- [ ] ✅ No orphaned records after deletion
- [ ] ✅ Storage/Documents counts always match

---

## Troubleshooting

### Mismatch between storage and Documents counts
**Symptom**: Number of deck keys doesn't match number of .deck files

**Solution**:
```javascript
// Find orphaned storage keys
const storage = PluginManager.getInstance().getStorage();
const keys = await storage.list('core-flashcards:decks/');
const documentsService = PluginManager.getInstance().getService('core-documents/documentsService');
const files = await documentsService.getFiles();
const deckFiles = files.filter(f => f.extension === '.deck');

// Find storage keys without corresponding StoredFile
const orphanedKeys = keys.filter(key => {
  const deckId = key.split('/')[1];
  return !deckFiles.some(f => f.id === deckId);
});
console.log('🔍 Orphaned storage keys:', orphanedKeys);

// Find StoredFiles without corresponding storage key
const orphanedFiles = deckFiles.filter(f => {
  const expectedKey = `core-flashcards:decks/${f.id}`;
  return !keys.includes(expectedKey);
});
console.log('🔍 Orphaned StoredFiles:', orphanedFiles);
```

### StoredFile not created on deck creation
**Symptom**: Deck exists in storage but not in Documents

**Check**:
```javascript
// Verify FlashcardService.createDeck() was called
// (not manual storage.set())
const flashcardService = PluginManager.getInstance().getService('core-flashcards/flashcardService');
console.log('✅ FlashcardService available:', !!flashcardService);
```

**Fix**: Always create decks through FlashcardService methods, not direct storage calls.

---

## Next Steps After Verification

Once all tests pass:
1. ✅ Implementation is confirmed working
2. ✅ Ready for Phase 2: Media file attachments (images/audio on cards)
3. ✅ Can commit changes with confidence
4. ✅ Update progress.md and activeContext.md with test results
