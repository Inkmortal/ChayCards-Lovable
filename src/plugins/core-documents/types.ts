/**
 * Core Documents Plugin - Type Definitions
 *
 * File-based document management system with folders, tags, and extensible FileHandlers.
 * Follows the dual-API storage pattern: JSON metadata + File content.
 */

/**
 * Stored file metadata with reference to file content in File Storage
 */
export interface StoredFile {
  /** Unique identifier */
  id: string;

  /** Original filename with extension */
  filename: string;

  /** File extension (e.g., '.md', '.txt', '.pdf') */
  extension: string;

  /** MIME type (e.g., 'text/markdown', 'application/pdf') */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** Storage key for file content in File Storage API */
  fileStorageKey: string;

  /** Parent folder ID (null = root) */
  folderId: string | null;

  /** Display order within parent - INTEGER ONLY, gaps of 1000 */
  order: number;

  /** User-defined tags for categorization */
  tags: string[];

  /** Custom metadata from FileHandlers or user */
  metadata: Record<string, any>;

  /** Creation timestamp */
  createdAt: number;

  /** Last modification timestamp */
  updatedAt: number;

  /** Last access timestamp */
  accessedAt: number;
}

/**
 * Folder for organizing files hierarchically
 */
export interface Folder {
  /** Unique identifier */
  id: string;

  /** Folder name (unique within parent, case-insensitive) */
  name: string;

  /** Parent folder ID (null = root) */
  parentId: string | null;

  /** Display order within parent - INTEGER ONLY, gaps of 1000 */
  order: number;

  /** Cached depth for O(1) max depth validation */
  depth: number;

  /** Optional color for visual organization */
  color?: string;

  /** Optional icon name */
  icon?: string;

  /** User-defined tags */
  tags: string[];

  /** Creation timestamp */
  createdAt: number;

  /** Last modification timestamp */
  updatedAt: number;
}

/**
 * Icon types for FileHandlers - discriminated union for type safety
 * Plugins can use emojis, Lucide icons, or custom components
 */
export type FileHandlerIcon =
  | { type: 'emoji'; emoji: string }           // e.g., { type: 'emoji', emoji: '🎴' }
  | { type: 'lucide'; name: string }           // e.g., { type: 'lucide', name: 'Brain' }
  | { type: 'component'; name: string };       // e.g., { type: 'component', name: 'plugin-id/IconComponent' }

/**
 * FileHandler registration for plugin extensibility
 * Plugins register handlers to provide custom viewers/editors for file types
 */
export interface FileHandler {
  /** Unique handler identifier (e.g., 'markdown-handler') */
  id: string;

  /** Plugin that registered this handler */
  pluginId: string;

  /** Handler display name */
  name: string;

  /** Supported file extensions (e.g., ['.md', '.markdown']) */
  extensions: string[];

  /** Supported MIME types (e.g., ['text/markdown']) */
  mimeTypes: string[];

  /** Icon for this file type - supports emoji, Lucide icons, or custom components */
  icon: FileHandlerIcon;

  /** Optional preview component (namespaced: 'plugin-id/ComponentName') */
  previewComponent?: string;

  /** Optional viewer component (namespaced: 'plugin-id/ComponentName') */
  viewerComponent?: string;

  /** Optional editor component (namespaced: 'plugin-id/ComponentName') */
  editorComponent?: string;

  /** Priority for handler selection (higher = preferred) */
  priority: number;

  /** Custom validation function */
  canHandle?: (file: StoredFile) => boolean;
}

/**
 * Options for saving a document
 */
export interface SaveDocumentOptions {
  /** Target folder ID */
  folderId?: string | null;

  /** Tags to apply */
  tags?: string[];

  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Options for updating a document
 */
export interface UpdateDocumentOptions {
  /** New filename */
  filename?: string;

  /** Move to different folder */
  folderId?: string | null;

  /** Replace tags */
  tags?: string[];

  /** Merge or replace metadata */
  metadata?: Record<string, any>;

  /** Update file content */
  content?: File;
}

/**
 * Options for creating a folder
 */
export interface CreateFolderOptions {
  /** Folder name */
  name: string;

  /** Parent folder ID (null = root) */
  parentId?: string | null;

  /** Optional color */
  color?: string;

  /** Optional icon */
  icon?: string;

  /** Tags */
  tags?: string[];
}

/**
 * Options for updating a folder
 */
export interface UpdateFolderOptions {
  /** New folder name */
  name?: string;

  /** Move to different parent */
  parentId?: string | null;

  /** Change color */
  color?: string;

  /** Change icon */
  icon?: string;

  /** Replace tags */
  tags?: string[];
}

/**
 * File list query options
 */
export interface ListFilesOptions {
  /** Filter by folder ID */
  folderId?: string | null;

  /** Filter by tags (any match) */
  tags?: string[];

  /** Filter by extension */
  extension?: string;

  /** Search query (filename) */
  search?: string;

  /** Sort field */
  sortBy?: 'filename' | 'createdAt' | 'updatedAt' | 'size';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Limit results */
  limit?: number;

  /** Skip results (pagination) */
  offset?: number;
}

/**
 * Folder tree node for hierarchical display
 */
export interface FolderTreeNode extends Folder {
  /** Child folders */
  children: FolderTreeNode[];

  /** File count in this folder */
  fileCount: number;

  /** Is folder expanded in UI */
  isExpanded?: boolean;
}

/**
 * Unified tree node that can be either a folder or file
 * Used for sidebar tree view that shows both types together
 */
export type TreeNode =
  | {
      type: 'folder';
      id: string;
      name: string;
      parentId: string | null;
      order: number;
      depth: number;
      color?: string;
      icon?: string;
      tags: string[];
      createdAt: number;
      updatedAt: number;
      children: TreeNode[];
      isExpanded?: boolean;
    }
  | {
      type: 'file';
      id: string;
      filename: string;
      extension: string;
      mimeType: string;
      size: number;
      fileStorageKey: string;
      folderId: string | null;
      order: number;
      tags: string[];
      metadata: Record<string, any>;
      createdAt: number;
      updatedAt: number;
      accessedAt: number;
    };

/**
 * View mode for file browser
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort order for files
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort mode for unified tree
 */
export type SortMode = 'manual' | 'name' | 'date' | 'size';

/**
 * File operation result
 */
export interface FileOperationResult {
  /** Success status */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Resulting file if successful */
  file?: StoredFile;
}

/**
 * Folder operation result
 */
export interface FolderOperationResult {
  /** Success status */
  success: boolean;

  /** Result data (folder or folders) */
  data?: Folder | Folder[];

  /** Structured error details */
  error?: {
    code: 'VALIDATION_ERROR' | 'CIRCULAR_REFERENCE' | 'MAX_DEPTH' | 'STORAGE_ERROR' | 'NOT_FOUND';
    message: string;
    details?: any;
  };
}
