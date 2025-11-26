/**
 * Core Documents Plugin - Constants
 */

export const FOLDER_CONFIG = {
  MAX_DEPTH: 5,
  ORDER_GAP: 1000,          // Gap between siblings
  ORDER_MIN_GAP: 100,       // Trigger rebalance if gap smaller
  REBALANCE_THRESHOLD: 50,  // Rebalance every N operations (optional)
} as const;

export const STORAGE_KEYS = {
  FILES: 'chaycards/core-documents:files',
  FOLDERS: 'chaycards/core-documents:folders',
  SCHEMA_VERSION: 'chaycards/core-documents:schema-version',
} as const;
