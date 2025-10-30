# Files as Entity Properties Pattern

**Category:** Storage
**Type:** Code Pattern
**Triggers:** file upload, file storage, file metadata, document storage

## Overview

Store files as properties of entities rather than separate tables. Files are embedded in entity metadata as JSON arrays, enabling automatic user scoping and simplified queries.

## API Usage

```typescript
// Storing entity with files
await storage.set(key, data, {
  files: [{
    filename: 'document.pdf',
    content: base64String  // or Buffer
  }]
});

// Retrieving entity with files
const result = await storage.get(key);
// result.data.files = [{ filename, content }]
```

## Key Points

- Files stored in entity's `files` JSON array
- User scoping automatic (inherited from entity)
- No separate file_metadata table needed
- Retrieval returns files with entity data

## Existing Implementation

**DocumentsService.ts:342** - `uploadFile()` method uses this pattern

## Deprecated Patterns

❌ **DO NOT USE:**
- `storage.setFile()` - Legacy API
- Separate `file_metadata` table
- Manual user_id scoping for files

## Migration Path

If you find code using deprecated patterns:
1. Replace `storage.setFile()` with `storage.set(key, data, {files})`
2. Remove file_metadata table queries
3. Use `data.files` array instead of separate lookups
