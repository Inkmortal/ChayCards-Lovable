/**
 * DocumentsService - Core file management service
 *
 * Provides:
 * - File CRUD operations with dual-API storage (metadata + content)
 * - Folder management with Windows-like validation
 * - FileHandler registry for plugin extensibility
 * - Observer pattern for React state updates
 * - Event emissions for all operations
 */

import type { StorageAdapter } from '@/shared/storage';
import { buildPluginStorageKey } from '@/shared/constants';
import { PluginManager } from '@/shared/plugin-system';
import type {
  StoredFile,
  Folder,
  FileHandler,
  SaveDocumentOptions,
  UpdateDocumentOptions,
  CreateFolderOptions,
  UpdateFolderOptions,
  ListFilesOptions,
  FolderTreeNode,
  TreeNode,
  SortMode,
  FileOperationResult,
  FolderOperationResult
} from '../types';
import { FOLDER_CONFIG, STORAGE_KEYS } from '../constants';

export class DocumentsService {
  private readonly PLUGIN_ID = 'core-documents';
  private readonly FILES_KEY = STORAGE_KEYS.FILES;
  private readonly FOLDERS_KEY = STORAGE_KEYS.FOLDERS;

  private storage: StorageAdapter | null = null;
  private initialized = false;

  // FileHandler registry (kept - this is actual service state, not storage data)
  private fileHandlers: Map<string, FileHandler> = new Map();

  constructor() {
    // Initialization happens in initialize()
  }

  /**
   * Initialize service with storage adapter
   * Called during plugin onLoad lifecycle
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    if (this.initialized) {
      console.log('[DocumentsService] Already initialized, skipping');
      return;
    }

    console.log('[DocumentsService] Initializing...');
    this.storage = storage;

    // Run migrations
    await this.migrateToV3();
    await this.migrateToV4();
    await this.migrateToV5();

    this.initialized = true;

    // Get counts for logging
    const files = await this.getFiles();
    const folders = await this.getFolders();
    console.log('[DocumentsService] Initialized with', files.length, 'files and', folders.length, 'folders');
  }

  /**
   * Check if service is initialized and ready to use
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ==================== Storage Access Methods ====================

  /**
   * Get all files from storage
   */
  async getFiles(): Promise<StoredFile[]> {
    if (!this.storage) {
      console.warn('[DocumentsService] Storage not initialized');
      return [];
    }

    try {
      const result = await this.storage.get<StoredFile[]>(this.FILES_KEY);
      return result?.data || [];
    } catch (error) {
      console.error('[DocumentsService] Failed to get files:', error);
      return [];
    }
  }

  /**
   * Get all folders from storage
   */
  async getFolders(): Promise<Folder[]> {
    if (!this.storage) {
      console.warn('[DocumentsService] Storage not initialized');
      return [];
    }

    try {
      const result = await this.storage.get<Folder[]>(this.FOLDERS_KEY);
      return result?.data || [];
    } catch (error) {
      console.error('[DocumentsService] Failed to get folders:', error);
      return [];
    }
  }

  // ==================== File CRUD Operations ====================

  /**
   * Save a document (handles both metadata and file content)
   * This is the single method that handles dual-API storage internally
   */
  async saveDocument(file: File, options: SaveDocumentOptions = {}): Promise<StoredFile> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const fileId = crypto.randomUUID();
    const extension = this.getExtension(file.name);

    // Calculate order: place at end of siblings (after folders and files)
    const folderId = options.folderId || null;
    const existingFiles = await this.getFiles();
    const existingFolders = await this.getFolders();

    const itemsInParent = [
      ...existingFolders.filter(f => f.parentId === folderId),
      ...existingFiles.filter(f => f.folderId === folderId)
    ];

    const maxOrder = itemsInParent.reduce((max, item) => Math.max(max, item.order || 0), -1);

    // 1. Create metadata object
    const metadata: StoredFile = {
      id: fileId,
      filename: file.name,
      extension,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      fileStorageKey: buildPluginStorageKey(this.PLUGIN_ID, `files/${fileId}`),
      folderId,
      order: maxOrder + FOLDER_CONFIG.ORDER_GAP,
      tags: options.tags || [],
      metadata: options.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessedAt: Date.now()
    };

    // 2. Save file content (File Storage API)
    const arrayBuffer = await file.arrayBuffer();
    await this.storage.set(metadata.fileStorageKey, new Uint8Array(arrayBuffer));

    // 3. Update metadata index (JSON Storage API)
    const files = await this.getFiles();
    files.push(metadata);
    await this.storage.set(this.FILES_KEY, files);

    // 4. Emit event (React hooks will refetch)
    const eventBus = PluginManager.getInstance().getEventBus();
    eventBus.emit('document:created', { file: metadata });

    console.log('[DocumentsService] Document saved:', metadata.filename);
    return metadata;
  }

  /**
   * Get a document by ID (returns metadata only)
   * Use getDocumentContent() to fetch file content
   */
  async getDocument(id: string): Promise<StoredFile | undefined> {
    const files = await this.getFiles();
    return files.find(file => file.id === id);
  }

  /**
   * Get document file content from File Storage
   */
  async getDocumentContent(id: string): Promise<Uint8Array | null> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const file = await this.getDocument(id);
    if (!file) {
      console.warn('[DocumentsService] Document not found:', id);
      return null;
    }

    try {
      const result = await this.storage.get<Uint8Array>(file.fileStorageKey);
      const content = result?.data;

      // Update access timestamp
      const files = await this.getFiles();
      const fileIndex = files.findIndex(f => f.id === id);
      if (fileIndex !== -1) {
        files[fileIndex].accessedAt = Date.now();
        await this.storage.set(this.FILES_KEY, files);
      }

      return content;
    } catch (error) {
      console.error('[DocumentsService] Failed to get document content:', error);
      return null;
    }
  }

  /**
   * Update document metadata and/or content
   */
  async updateDocument(id: string, options: UpdateDocumentOptions): Promise<FileOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const files = await this.getFiles();
    const fileIndex = files.findIndex(f => f.id === id);

    if (fileIndex === -1) {
      return { success: false, error: 'Document not found' };
    }

    const file = files[fileIndex];

    try {
      // Update metadata fields
      if (options.filename !== undefined) {
        file.filename = options.filename;
        file.extension = this.getExtension(options.filename);
      }

      if (options.folderId !== undefined) {
        file.folderId = options.folderId;
      }

      if (options.tags !== undefined) {
        file.tags = options.tags;
      }

      if (options.metadata !== undefined) {
        file.metadata = { ...file.metadata, ...options.metadata };
      }

      // Update file content if provided
      if (options.content) {
        const arrayBuffer = await options.content.arrayBuffer();
        await this.storage.set(file.fileStorageKey, new Uint8Array(arrayBuffer));

        file.size = options.content.size;
        file.mimeType = options.content.type || file.mimeType;
      }

      file.updatedAt = Date.now();

      // Save to storage
      await this.storage.set(this.FILES_KEY, files);

      // Invoke FileHandler callback if registered
      const handler = this.getHandlerForFile(file);
      if (handler?.onFileUpdated) {
        await handler.onFileUpdated(id, options);
      }

      // Emit event
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('document:updated', { file });

      console.log('[DocumentsService] Document updated:', file.filename);
      return { success: true, file };
    } catch (error) {
      console.error('[DocumentsService] Failed to update document:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a document (removes both metadata and file content)
   */
  async deleteDocument(id: string): Promise<FileOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const files = await this.getFiles();
    const fileIndex = files.findIndex(f => f.id === id);

    if (fileIndex === -1) {
      return { success: false, error: 'Document not found' };
    }

    const file = files[fileIndex];

    try {
      // 1. Invoke FileHandler callback if registered (before deletion)
      const handler = this.getHandlerForFile(file);
      if (handler?.onFileDeleted) {
        await handler.onFileDeleted(id);
      }

      // 2. Delete file content from File Storage
      await this.storage.delete(file.fileStorageKey);

      // 3. Remove from metadata index
      files.splice(fileIndex, 1);
      await this.storage.set(this.FILES_KEY, files);

      // 4. Emit event
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('document:deleted', { file });

      console.log('[DocumentsService] Document deleted:', file.filename);
      return { success: true };
    } catch (error) {
      console.error('[DocumentsService] Failed to delete document:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * List documents with filtering and sorting
   */
  async listDocuments(options: ListFilesOptions = {}): Promise<StoredFile[]> {
    const allFiles = await this.getFiles();
    let results = [...allFiles];

    // Filter by folder
    if (options.folderId !== undefined) {
      results = results.filter(file => file.folderId === options.folderId);
    }

    // Filter by extension
    if (options.extension) {
      results = results.filter(file => file.extension === options.extension);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(file =>
        options.tags!.some(tag => file.tags.includes(tag))
      );
    }

    // Search by filename
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      results = results.filter(file =>
        file.filename.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const direction = options.sortDirection || 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updatedAt':
          comparison = a.updatedAt - b.updatedAt;
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    // Pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      results = results.slice(start, end);
    }

    return results;
  }

  // ==================== Folder CRUD Operations ====================

  /**
   * Validate folder name for safety and compatibility
   */
  private validateFolderName(name: string): { valid: boolean; error?: string } {
    if (name.trim().length === 0) {
      return { valid: false, error: 'Folder name cannot be empty' };
    }

    if (name.length > 255) {
      return { valid: false, error: 'Folder name must be 255 characters or less' };
    }

    // Prevent filesystem-unsafe characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(name)) {
      return {
        valid: false,
        error: 'Folder name contains invalid characters. Avoid: < > : " / \\ | ? *'
      };
    }

    // Prevent relative path traversal
    if (name === '.' || name === '..') {
      return { valid: false, error: 'Folder name cannot be "." or ".."' };
    }

    return { valid: true };
  }

  /**
   * Create a folder with Windows-like validation
   */
  async createFolder(options: CreateFolderOptions): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    // Validate folder name
    const validation = this.validateFolderName(options.name);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get current folders from storage
    const folders = await this.getFolders();

    // Validate unique name within parent (case-insensitive)
    const nameExists = folders.some(
      folder =>
        folder.parentId === (options.parentId || null) &&
        folder.name.toLowerCase() === options.name.toLowerCase()
    );

    if (nameExists) {
      return {
        success: false,
        error: `A folder named "${options.name}" already exists in this location`
      };
    }

    // Calculate order: place at end of siblings
    const siblings = folders.filter(
      f => f.parentId === (options.parentId || null)
    );
    const maxOrder = siblings.reduce(
      (max, f) => Math.max(max, f.order || 0),
      0
    );

    // Calculate depth
    const depth = await this.calculateDepth(options.parentId || null, folders);

    const folder: Folder = {
      id: crypto.randomUUID(),
      name: options.name,
      parentId: options.parentId || null,
      order: maxOrder + FOLDER_CONFIG.ORDER_GAP,
      depth,
      color: options.color,
      icon: options.icon,
      tags: options.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      // Add to folders array and save
      folders.push(folder);
      await this.storage.set(this.FOLDERS_KEY, folders);

      // Emit event (React hooks will refetch)
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('folder:created', { folder });

      console.log('[DocumentsService] Folder created:', folder.name);
      return { success: true, folder };
    } catch (error) {
      console.error('[DocumentsService] Failed to create folder:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get folder by ID
   */
  async getFolder(id: string): Promise<Folder | undefined> {
    const folders = await this.getFolders();
    return folders.find(folder => folder.id === id);
  }

  /**
   * Update folder metadata
   */
  async updateFolder(id: string, options: UpdateFolderOptions): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    try {
      // Validate name if changing it
      if (options.name !== undefined) {
        const validation = this.validateFolderName(options.name);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      // Validate name uniqueness if changing name or parent
      if (options.name !== undefined || options.parentId !== undefined) {
        const newName = options.name || folder.name;
        const newParentId = options.parentId !== undefined ? options.parentId : folder.parentId;

        const nameExists = folders.some(
          f =>
            f.id !== id &&
            f.parentId === newParentId &&
            f.name.toLowerCase() === newName.toLowerCase()
        );

        if (nameExists) {
          return {
            success: false,
            error: `A folder named "${newName}" already exists in this location`
          };
        }
      }

      // Validate no circular reference if moving
      if (options.parentId !== undefined && options.parentId !== null) {
        if (!(await this.validateFolderMove(id, options.parentId))) {
          return {
            success: false,
            error: 'Cannot move folder into its own subfolder'
          };
        }
      }

      // Apply updates
      if (options.name !== undefined) folder.name = options.name;
      if (options.parentId !== undefined) folder.parentId = options.parentId;
      if (options.color !== undefined) folder.color = options.color;
      if (options.icon !== undefined) folder.icon = options.icon;
      if (options.tags !== undefined) folder.tags = options.tags;

      folder.updatedAt = Date.now();

      // Save to storage
      await this.storage.set(this.FOLDERS_KEY, folders);

      // Emit event
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('folder:updated', { folder });

      console.log('[DocumentsService] Folder updated:', folder.name);
      return { success: true, folder };
    } catch (error) {
      console.error('[DocumentsService] Failed to update folder:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a folder and optionally its contents
   */
  async deleteFolder(id: string, deleteContents = false): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    try {
      // Check for child folders
      const childFolders = folders.filter(f => f.parentId === id);

      // Check for files in folder
      const files = await this.getFiles();
      const filesInFolder = files.filter(f => f.folderId === id);

      if (!deleteContents && (childFolders.length > 0 || filesInFolder.length > 0)) {
        return {
          success: false,
          error: 'Folder is not empty. Delete or move contents first.'
        };
      }

      // Delete contents recursively if requested
      if (deleteContents) {
        // Delete child folders
        for (const childFolder of childFolders) {
          await this.deleteFolder(childFolder.id, true);
        }

        // Delete files
        for (const file of filesInFolder) {
          await this.deleteDocument(file.id);
        }
      }

      // Remove folder from array
      const updatedFolders = await this.getFolders(); // Re-fetch after recursive deletes
      const folderIndex = updatedFolders.findIndex(f => f.id === id);
      updatedFolders.splice(folderIndex, 1);

      // Save to storage
      await this.storage.set(this.FOLDERS_KEY, updatedFolders);

      // Emit event
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('folder:deleted', { folder });

      console.log('[DocumentsService] Folder deleted:', folder.name);
      return { success: true };
    } catch (error) {
      console.error('[DocumentsService] Failed to delete folder:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete folder and move all contents (child folders and files) to parent
   * Safer alternative to deleteFolder(id, true) - preserves data
   *
   * @param folderId - Folder to delete
   * @returns Operation result
   */
  async deleteFolderAndMoveContents(folderId: string): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    try {
      const parentId = folder.parentId;  // Where to move contents

      // Get all child folders
      const childFolders = folders.filter(f => f.parentId === folderId);

      // Get all files in this folder
      const files = await this.getFiles();
      const filesInFolder = files.filter(f => f.folderId === folderId);

      // Move all child folders to parent
      for (const childFolder of childFolders) {
        childFolder.parentId = parentId;
        childFolder.depth = await this.calculateDepth(parentId, folders);
        childFolder.updatedAt = Date.now();

        // Recursively update depth for descendants
        await this.updateDepth(childFolder.id, childFolder.depth, folders);
      }

      // Move all files to parent
      for (const file of filesInFolder) {
        file.folderId = parentId;
        file.updatedAt = Date.now();
      }

      // Delete the now-empty folder
      const folderIndex = folders.findIndex(f => f.id === folderId);
      folders.splice(folderIndex, 1);

      // Save changes atomically
      await this.storage.set(this.FOLDERS_KEY, folders);
      await this.storage.set(this.FILES_KEY, files);

      // Emit events
      const eventBus = PluginManager.getInstance().getEventBus();
      eventBus.emit('folder:deleted', { folder });
      eventBus.emit('folders:moved', { folders: childFolders, newParentId: parentId });
      eventBus.emit('files:moved', { files: filesInFolder, newParentId: parentId });

      console.log('[DocumentsService] Folder deleted and contents moved:', folder.name, 'to parent', parentId);
      return { success: true };
    } catch (error) {
      console.error('[DocumentsService] Failed to delete folder and move contents:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * List all folders
   */
  async listFolders(parentId: string | null = null): Promise<Folder[]> {
    const folders = await this.getFolders();
    if (parentId === null) {
      return folders.filter(f => f.parentId === null);
    }
    return folders.filter(f => f.parentId === parentId);
  }

  /**
   * Build folder tree structure
   */
  async getFolderTree(): Promise<FolderTreeNode[]> {
    const folders = await this.getFolders();
    const files = await this.getFiles();

    const buildTree = (parentId: string | null): FolderTreeNode[] => {
      const childFolders = folders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order

      return childFolders.map(folder => {
        const fileCount = files.filter(f => f.folderId === folder.id).length;

        return {
          ...folder,
          children: buildTree(folder.id),
          fileCount,
          isExpanded: false
        };
      });
    };

    return buildTree(null);
  }

  /**
   * Build unified tree structure with both folders and files
   * Used for sidebar tree view and main area
   */
  async getUnifiedTree(): Promise<TreeNode[]> {
    const folders = await this.getFolders();
    const files = await this.getFiles();

    const buildTree = (parentId: string | null): TreeNode[] => {
      // Get folders in this level
      const childFolders = folders
        .filter(f => this.normalizeParentId(f.parentId) === parentId)
        .map(folder => ({
          type: 'folder' as const,
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          order: folder.order,
          depth: folder.depth,
          color: folder.color,
          icon: folder.icon,
          tags: folder.tags,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          children: buildTree(folder.id),
          isExpanded: false
        }));

      // Get files in this level
      const childFiles = files
        .filter(f => this.normalizeParentId(f.folderId) === parentId)
        .map(file => ({
          type: 'file' as const,
          id: file.id,
          filename: file.filename,
          extension: file.extension,
          mimeType: file.mimeType,
          size: file.size,
          fileStorageKey: file.fileStorageKey,
          folderId: file.folderId,
          order: file.order,
          tags: file.tags,
          metadata: file.metadata,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          accessedAt: file.accessedAt
        }));

      // Combine and sort by order
      return [...childFolders, ...childFiles].sort((a, b) => a.order - b.order);
    };

    return buildTree(null);
  }

  /**
   * Validate folder move (prevent circular reference)
   */
  private async validateFolderMove(folderId: string, targetParentId: string): Promise<boolean> {
    const folders = await this.getFolders();
    let currentId: string | null = targetParentId;

    while (currentId) {
      if (currentId === folderId) {
        return false; // Circular reference!
      }

      const folder = folders.find(f => f.id === currentId);
      currentId = folder?.parentId || null;
    }

    return true;
  }


  // ==================== New Semantic Folder APIs ====================

  /**
   * Move folder to specific position in parent's children
   * This is the SIMPLE API that matches what react-arborist gives us
   *
   * @param folderId - Folder to move
   * @param parentId - New parent (null = root)
   * @param index - Position in parent's children array (0-based)
   */
  async moveToPosition(folderId: string, parentId: string | null, index: number): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: { code: 'STORAGE_ERROR', message: 'Storage not initialized' } };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);

    if (!folder) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } };
    }

    // Validate circular reference if moving to a folder parent
    if (parentId !== null && !(await this.validateFolderMove(folderId, parentId))) {
      return {
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'Cannot move folder into its own subfolder'
        }
      };
    }

    const oldParentId = folder.parentId;

    // Get siblings in the new parent (excluding the folder being moved)
    const siblings = folders
      .filter(f => this.normalizeParentId(f.parentId) === this.normalizeParentId(parentId) && f.id !== folderId)
      .sort((a, b) => a.order - b.order);

    // Update parent
    folder.parentId = parentId;

    // Calculate new order based on index
    if (siblings.length === 0) {
      // First child - use default starting order
      folder.order = 1000;
    } else if (index === 0) {
      // Insert before first sibling
      folder.order = Math.round(siblings[0].order - 1000);
    } else if (index >= siblings.length) {
      // Insert after last sibling
      folder.order = Math.round(siblings[siblings.length - 1].order + 1000);
    } else {
      // Insert between siblings at index-1 and index
      const before = siblings[index - 1];
      const after = siblings[index];
      folder.order = Math.round((before.order + after.order) / 2);
    }

    folder.updatedAt = Date.now();

    // Update depth if parent changed
    if (oldParentId !== parentId) {
      const newDepth = await this.calculateDepth(parentId, folders);
      await this.updateDepth(folderId, newDepth, folders);
    }

    // Save to storage
    await this.storage.set(this.FOLDERS_KEY, folders);

    return { success: true, data: folder };
  }

  /**
   * Insert folder before target folder (moves to target's parent if needed)
   */
  async insertBefore(folderId: string, targetFolderId: string): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: { code: 'STORAGE_ERROR', message: 'Storage not initialized' } };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    const target = folders.find(f => f.id === targetFolderId);

    if (!folder) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } };
    }
    if (!target) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Target folder not found' } };
    }

    // Validate circular reference if moving to different parent
    if (target.parentId !== null && !(await this.validateFolderMove(folderId, target.parentId))) {
      return {
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'Cannot move folder into its own subfolder'
        }
      };
    }

    const oldParentId = folder.parentId;

    // Move to target's parent
    folder.parentId = target.parentId;

    // Calculate new order (target - 500)
    folder.order = Math.round(target.order - 500);
    folder.updatedAt = Date.now();

    // Update depth if parent changed
    if (oldParentId !== target.parentId) {
      const newDepth = await this.calculateDepth(target.parentId, folders);
      await this.updateDepth(folderId, newDepth, folders);
    }

    // Queue write (debounced via queueSave)
    await this.storage.set(this.FOLDERS_KEY, folders);

    // NO EVENT EMISSION - UI already updated optimistically

    return { success: true, data: folder };
  }

  /**
   * Insert folder after target folder (moves to target's parent if needed)
   */
  async insertAfter(folderId: string, targetFolderId: string): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: { code: 'STORAGE_ERROR', message: 'Storage not initialized' } };
    }

    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    const target = folders.find(f => f.id === targetFolderId);

    if (!folder) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } };
    }
    if (!target) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Target folder not found' } };
    }

    // Validate circular reference if moving to different parent
    if (target.parentId !== null && !(await this.validateFolderMove(folderId, target.parentId))) {
      return {
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'Cannot move folder into its own subfolder'
        }
      };
    }

    const oldParentId = folder.parentId;

    // Move to target's parent
    folder.parentId = target.parentId;

    // Calculate new order (target + 500)
    folder.order = Math.round(target.order + 500);
    folder.updatedAt = Date.now();

    // Update depth if parent changed
    if (oldParentId !== target.parentId) {
      const newDepth = await this.calculateDepth(target.parentId, folders);
      await this.updateDepth(folderId, newDepth, folders);
    }

    // Queue write (debounced via queueSave)
    await this.storage.set(this.FOLDERS_KEY, folders);

    // NO EVENT EMISSION - UI already updated optimistically

    return { success: true, data: folder };
  }


  // ==================== Sorting API ====================

  /**
   * Sort all folders and files by specified mode
   * This is a one-time reorder operation - manual drag still works after
   */
  async sortItemsBy(mode: SortMode, parentId: string | null = null): Promise<{ success: boolean; error?: string }> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    if (mode === 'manual') {
      return { success: true }; // No-op for manual mode
    }

    const folders = await this.getFolders();
    const files = await this.getFiles();

    // Filter to parent scope
    const foldersInScope = parentId === null
      ? folders.filter(f => f.parentId === null)
      : folders.filter(f => f.parentId === parentId);

    const filesInScope = parentId === null
      ? files.filter(f => f.folderId === null)
      : files.filter(f => f.folderId === parentId);

    // Combine items
    type SortableItem = (Folder | StoredFile) & { itemType: 'folder' | 'file' };
    const allItems: SortableItem[] = [
      ...foldersInScope.map(f => ({ ...f, itemType: 'folder' as const })),
      ...filesInScope.map(f => ({ ...f, itemType: 'file' as const }))
    ];

    // Sort based on mode
    allItems.sort((a, b) => {
      if (mode === 'name') {
        const nameA = a.itemType === 'folder' ? (a as Folder).name : (a as StoredFile).filename;
        const nameB = b.itemType === 'folder' ? (b as Folder).name : (b as StoredFile).filename;
        return nameA.localeCompare(nameB);
      }

      if (mode === 'date') {
        return a.createdAt - b.createdAt;
      }

      if (mode === 'size') {
        const sizeA = a.itemType === 'file' ? (a as StoredFile).size : 0;
        const sizeB = b.itemType === 'file' ? (b as StoredFile).size : 0;
        return sizeA - sizeB;
      }

      return 0;
    });

    // Reassign orders
    allItems.forEach((item, index) => {
      item.order = index * FOLDER_CONFIG.ORDER_GAP;
      item.updatedAt = Date.now();
    });

    // Save back to storage
    await this.storage.set(this.FOLDERS_KEY, folders);
    await this.storage.set(this.FILES_KEY, files);

    // Emit events
    const eventBus = PluginManager.getInstance().getEventBus();
    eventBus.emit('folders:reordered', { parentId });
    eventBus.emit('files:reordered', { parentId });

    return { success: true };
  }

  // ==================== Internal Helper Methods ====================

  /**
   * Normalize parentId to handle null, "null", and undefined consistently
   */
  private normalizeParentId(id: string | null | undefined): string | null {
    if (id === null || id === undefined || id === 'null') {
      return null;
    }
    return id;
  }

  /**
   * Rebalance order values for siblings under parent
   * Assigns orders: 0, 1000, 2000, 3000, ...
   */
  private async rebalanceOrders(parentId: string | null): Promise<void> {
    if (!this.storage) return;

    const folders = await this.getFolders();
    const siblings = folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.order - b.order);

    for (let i = 0; i < siblings.length; i++) {
      siblings[i].order = i * FOLDER_CONFIG.ORDER_GAP;
      siblings[i].updatedAt = Date.now();
    }

    await this.storage.set(this.FOLDERS_KEY, folders);

    const eventBus = PluginManager.getInstance().getEventBus();
    eventBus.emit('folders:reordered', { parentId, folderIds: siblings.map(f => f.id) });

    console.log('[DocumentsService] Rebalanced orders for', siblings.length, 'folders under parent', parentId);
  }

  /**
   * Calculate depth for a folder
   */
  private async calculateDepth(parentId: string | null, folders?: Folder[]): Promise<number> {
    if (parentId === null) return 0;

    const allFolders = folders || await this.getFolders();
    let depth = 0;
    let currentId: string | null = parentId;

    while (currentId !== null) {
      depth++;
      const parent = allFolders.find(f => f.id === currentId);
      currentId = parent?.parentId || null;
    }

    return depth;
  }

  /**
   * Recursively update depth for folder and descendants
   */
  private async updateDepth(folderId: string, newDepth: number, folders?: Folder[]): Promise<void> {
    const allFolders = folders || await this.getFolders();
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return;

    folder.depth = newDepth;

    // Get all children and recursively update
    const children = allFolders.filter(f => f.parentId === folderId);
    for (const child of children) {
      await this.updateDepth(child.id, newDepth + 1, allFolders);
    }
  }


  /**
   * Migrate existing folders and files to v3 schema
   * Runs on service init, only once
   * v3: Adds order property to files for unified tree ordering
   *    Normalizes parentId/folderId to be strictly null for root items.
   */
  private async migrateToV3(): Promise<void> {
    if (!this.storage) return;

    const versionResult = await this.storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
    const version = versionResult?.data;

    if (version === 3) return; // Already migrated to v3

    console.log('[DocumentsService] Migrating to schema v3...');

    // Get all folders
    const foldersResult = await this.storage.get<Folder[]>(this.FOLDERS_KEY);
    const folders = foldersResult?.data || [];

    // Get all files
    const filesResult = await this.storage.get<StoredFile[]>(this.FILES_KEY);
    const files = filesResult?.data || [];

    // Migrate folders (existing v2 logic + normalization)
    if (folders.length > 0) {
      // Calculate depth for each folder
      for (const folder of folders) {
        // Normalize parentId to be strictly null for root
        folder.parentId = this.normalizeParentId(folder.parentId);

        folder.depth = await this.calculateDepth(folder.parentId, folders);

        // Ensure order exists
        if (folder.order === undefined || folder.order === null) {
          folder.order = 0;
        }
      }

      // Rebalance orders for each parent group
      const folderParentIds = new Set(folders.map(f => f.parentId));
      for (const parentId of folderParentIds) {
        await this.rebalanceOrders(parentId);
      }

      await this.storage.set(this.FOLDERS_KEY, folders);
    }

    // Migrate files (NEW in v3 + normalization)
    if (files.length > 0) {
      // Group files by parentId (folderId)
      const filesByParent = new Map<string | null, StoredFile[]>();
      for (const file of files) {
        // Normalize folderId to be strictly null for root
        file.folderId = this.normalizeParentId(file.folderId);

        const parentId = file.folderId;
        if (!filesByParent.has(parentId)) {
          filesByParent.set(parentId, []);
        }
        filesByParent.get(parentId)!.push(file);
      }

      // Assign orders to files within each parent
      for (const [parentId, parentFiles] of filesByParent) {
        // Get folders in same parent to find max order
        const foldersInParent = folders.filter(f => f.parentId === parentId);
        const maxFolderOrder = foldersInParent.reduce((max, f) => Math.max(max, f.order), -1);

        // Start file ordering after folders
        let fileOrder = maxFolderOrder + FOLDER_CONFIG.ORDER_GAP;

        for (const file of parentFiles) {
          if ((file as any).order === undefined || (file as any).order === null) {
            (file as any).order = fileOrder;
            fileOrder += FOLDER_CONFIG.ORDER_GAP;
          }
        }
      }

      await this.storage.set(this.FILES_KEY, files);
    }

    // Save schema version
    await this.storage.set(STORAGE_KEYS.SCHEMA_VERSION, 3);

    console.log('[DocumentsService] Migrated to schema v3 -', folders.length, 'folders and', files.length, 'files');
  }

  /**
   * Migrate to v4: Fix corrupted __ALL_FILES__ parentIds
   * Some folders were saved with parentId = "__ALL_FILES__" before ID translation was added
   * This migration converts those to proper null values
   */
  private async migrateToV4(): Promise<void> {
    if (!this.storage) return;

    const versionResult = await this.storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
    const version = versionResult?.data;

    if (version === 4) return; // Already migrated to v4

    console.log('[DocumentsService] Migrating to schema v4 (fixing __ALL_FILES__ corruption)...');

    const foldersResult = await this.storage.get<Folder[]>(this.FOLDERS_KEY);
    const folders = foldersResult?.data || [];

    let fixedCount = 0;
    for (const folder of folders) {
      if (folder.parentId === '__ALL_FILES__') {
        folder.parentId = null;
        folder.updatedAt = Date.now();
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      await this.storage.set(this.FOLDERS_KEY, folders);
      console.log(`[DocumentsService] Fixed ${fixedCount} folders with corrupted __ALL_FILES__ parentId`);
    }

    // Save schema version
    await this.storage.set(STORAGE_KEYS.SCHEMA_VERSION, 4);

    console.log('[DocumentsService] Migrated to schema v4');
  }

  /**
   * Migrate to v5: Fix corrupted __REACT_ARBORIST_INTERNAL_ROOT__ parentIds
   * React-arborist's internal root ID was leaking through before proper translation
   * This migration converts those to proper null values
   */
  private async migrateToV5(): Promise<void> {
    if (!this.storage) return;

    const versionResult = await this.storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
    const version = versionResult?.data;

    if (version === 5) return; // Already migrated to v5

    console.log('[DocumentsService] Migrating to schema v5 (fixing __REACT_ARBORIST_INTERNAL_ROOT__ corruption)...');

    const foldersResult = await this.storage.get<Folder[]>(this.FOLDERS_KEY);
    const folders = foldersResult?.data || [];

    let fixedCount = 0;
    for (const folder of folders) {
      if (folder.parentId === '__REACT_ARBORIST_INTERNAL_ROOT__') {
        folder.parentId = null;
        folder.updatedAt = Date.now();
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      await this.storage.set(this.FOLDERS_KEY, folders);
      console.log(`[DocumentsService] Fixed ${fixedCount} folders with corrupted __REACT_ARBORIST_INTERNAL_ROOT__ parentId`);
    }

    // Save schema version
    await this.storage.set(STORAGE_KEYS.SCHEMA_VERSION, 5);

    console.log('[DocumentsService] Migrated to schema v5');
  }

  // ==================== FileHandler Registry ====================

  /**
   * Register a file handler for a plugin
   */
  registerFileHandler(handler: FileHandler): void {
    this.fileHandlers.set(handler.id, handler);

    const eventBus = PluginManager.getInstance().getEventBus();
    eventBus.emit('filehandler:registered', { handler });

    console.log('[DocumentsService] FileHandler registered:', handler.id, 'for', handler.extensions);
  }

  /**
   * Unregister a file handler
   */
  unregisterFileHandler(handlerId: string): void {
    this.fileHandlers.delete(handlerId);
    console.log('[DocumentsService] FileHandler unregistered:', handlerId);
  }

  /**
   * Get file handler for a specific file
   * Returns highest priority handler that can handle the file
   */
  getHandlerForFile(file: StoredFile): FileHandler | undefined {
    const handlers = Array.from(this.fileHandlers.values())
      .filter(handler => {
        // Check extension
        const extensionMatch = handler.extensions.includes(file.extension);

        // Check MIME type
        const mimeMatch = handler.mimeTypes.includes(file.mimeType);

        // Check custom validation
        const customMatch = handler.canHandle ? handler.canHandle(file) : true;

        return (extensionMatch || mimeMatch) && customMatch;
      })
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    return handlers[0];
  }

  /**
   * Get all registered file handlers
   */
  getAllHandlers(): FileHandler[] {
    return Array.from(this.fileHandlers.values());
  }

  /**
   * Get handler by ID
   */
  getHandler(handlerId: string): FileHandler | undefined {
    return this.fileHandlers.get(handlerId);
  }

  // ==================== Utility Methods ====================

  /**
   * Extract file extension from filename
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Get file count in a folder
   */
  async getFileCount(folderId: string | null): Promise<number> {
    const files = await this.getFiles();
    return files.filter(f => f.folderId === folderId).length;
  }

  /**
   * Get total storage size used
   */
  async getTotalSize(): Promise<number> {
    const files = await this.getFiles();
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const files = await this.getFiles();
    const folders = await this.getFolders();
    const totalSize = await this.getTotalSize();

    return {
      totalFiles: files.length,
      totalFolders: folders.length,
      totalSize,
      fileHandlers: this.fileHandlers.size
    };
  }
}
