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
  FileOperationResult,
  FolderOperationResult
} from '../types';

export class DocumentsService {
  private readonly PLUGIN_ID = 'core-documents';
  private readonly FILES_KEY = buildPluginStorageKey(this.PLUGIN_ID, 'files');
  private readonly FOLDERS_KEY = buildPluginStorageKey(this.PLUGIN_ID, 'folders');

  private storage: StorageAdapter | null = null;
  private initialized = false;

  // In-memory cache for performance
  private cachedFiles: StoredFile[] = [];
  private cachedFolders: Folder[] = [];

  // FileHandler registry
  private fileHandlers: Map<string, FileHandler> = new Map();

  // Observer pattern for React hooks
  private fileListeners: Set<(files: StoredFile[]) => void> = new Set();
  private folderListeners: Set<(folders: Folder[]) => void> = new Set();

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
    await this.loadFromStorage();
    this.initialized = true;
    console.log('[DocumentsService] Initialized with', this.cachedFiles.length, 'files and', this.cachedFolders.length, 'folders');
  }

  /**
   * Check if service is initialized and ready to use
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Load data from storage into cache
   */
  private async loadFromStorage(): Promise<void> {
    if (!this.storage) {
      console.warn('[DocumentsService] Storage not initialized');
      return;
    }

    try {
      const filesResult = await this.storage.get<StoredFile[]>(this.FILES_KEY);
      const files = filesResult?.data;
      this.cachedFiles = files || [];

      const foldersResult = await this.storage.get<Folder[]>(this.FOLDERS_KEY);
      const folders = foldersResult?.data;
      this.cachedFolders = folders || [];
    } catch (error) {
      console.error('[DocumentsService] Failed to load from storage:', error);
      this.cachedFiles = [];
      this.cachedFolders = [];
    }
  }

  /**
   * Save files cache to storage
   */
  private async saveFilesToStorage(): Promise<void> {
    if (!this.storage) {
      console.warn('[DocumentsService] Storage not initialized');
      return;
    }

    try {
      await this.storage.set(this.FILES_KEY, this.cachedFiles);
    } catch (error) {
      console.error('[DocumentsService] Failed to save files:', error);
      throw error;
    }
  }

  /**
   * Save folders cache to storage
   */
  private async saveFoldersToStorage(): Promise<void> {
    if (!this.storage) {
      console.warn('[DocumentsService] Storage not initialized');
      return;
    }

    try {
      await this.storage.set(this.FOLDERS_KEY, this.cachedFolders);
    } catch (error) {
      console.error('[DocumentsService] Failed to save folders:', error);
      throw error;
    }
  }

  /**
   * Notify file listeners of state change
   */
  private notifyFileListeners(): void {
    this.fileListeners.forEach(callback => {
      try {
        callback(this.cachedFiles);
      } catch (error) {
        console.error('[DocumentsService] File listener error:', error);
      }
    });
  }

  /**
   * Notify folder listeners of state change
   */
  private notifyFolderListeners(): void {
    this.folderListeners.forEach(callback => {
      try {
        callback(this.cachedFolders);
      } catch (error) {
        console.error('[DocumentsService] Folder listener error:', error);
      }
    });
  }

  // ==================== Observer Pattern API ====================

  /**
   * Subscribe to file changes
   * Immediately invokes callback with current state
   * Returns unsubscribe function
   */
  onFilesChange(callback: (files: StoredFile[]) => void): () => void {
    // Immediate state provision (solves late subscriber problem)
    callback(this.cachedFiles);

    // Add to listeners for future changes
    this.fileListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.fileListeners.delete(callback);
    };
  }

  /**
   * Subscribe to folder changes
   * Immediately invokes callback with current state
   * Returns unsubscribe function
   */
  onFoldersChange(callback: (folders: Folder[]) => void): () => void {
    callback(this.cachedFolders);
    this.folderListeners.add(callback);

    return () => {
      this.folderListeners.delete(callback);
    };
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

    // 1. Create metadata object
    const metadata: StoredFile = {
      id: fileId,
      filename: file.name,
      extension,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      fileStorageKey: buildPluginStorageKey(this.PLUGIN_ID, `files/${fileId}`),
      folderId: options.folderId || null,
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
    this.cachedFiles.push(metadata);
    await this.saveFilesToStorage();

    // 4. Notify listeners
    this.notifyFileListeners();

    // 5. Emit event
    const eventBus = PluginManager.getInstance().getEventBus();
    eventBus.emit('document:created', { file: metadata });

    console.log('[DocumentsService] Document saved:', metadata.filename);
    return metadata;
  }

  /**
   * Get a document by ID (returns metadata only)
   * Use getDocumentContent() to fetch file content
   */
  getDocument(id: string): StoredFile | undefined {
    return this.cachedFiles.find(file => file.id === id);
  }

  /**
   * Get document file content from File Storage
   */
  async getDocumentContent(id: string): Promise<Uint8Array | null> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const file = this.getDocument(id);
    if (!file) {
      console.warn('[DocumentsService] Document not found:', id);
      return null;
    }

    try {
      const result = await this.storage.get<Uint8Array>(file.fileStorageKey);
      const content = result?.data;

      // Update access timestamp
      file.accessedAt = Date.now();
      await this.saveFilesToStorage();

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

    const file = this.getDocument(id);
    if (!file) {
      return { success: false, error: 'Document not found' };
    }

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

      // Save and notify
      await this.saveFilesToStorage();
      this.notifyFileListeners();

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

    const fileIndex = this.cachedFiles.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      return { success: false, error: 'Document not found' };
    }

    const file = this.cachedFiles[fileIndex];

    try {
      // 1. Delete file content from File Storage
      await this.storage.delete(file.fileStorageKey);

      // 2. Remove from metadata index
      this.cachedFiles.splice(fileIndex, 1);
      await this.saveFilesToStorage();

      // 3. Notify listeners
      this.notifyFileListeners();

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
  listDocuments(options: ListFilesOptions = {}): StoredFile[] {
    let results = [...this.cachedFiles];

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

    // Validate unique name within parent (case-insensitive)
    const nameExists = this.cachedFolders.some(
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

    const folder: Folder = {
      id: crypto.randomUUID(),
      name: options.name,
      parentId: options.parentId || null,
      color: options.color,
      icon: options.icon,
      tags: options.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      this.cachedFolders.push(folder);
      await this.saveFoldersToStorage();
      this.notifyFolderListeners();

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
  getFolder(id: string): Folder | undefined {
    return this.cachedFolders.find(folder => folder.id === id);
  }

  /**
   * Update folder metadata
   */
  async updateFolder(id: string, options: UpdateFolderOptions): Promise<FolderOperationResult> {
    if (!this.storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    const folder = this.getFolder(id);
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

        const nameExists = this.cachedFolders.some(
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
        if (!this.validateFolderMove(id, options.parentId)) {
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

      await this.saveFoldersToStorage();
      this.notifyFolderListeners();

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

    const folder = this.getFolder(id);
    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    try {
      // Check for child folders
      const childFolders = this.cachedFolders.filter(f => f.parentId === id);

      // Check for files in folder
      const filesInFolder = this.cachedFiles.filter(f => f.folderId === id);

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

      // Remove folder
      const folderIndex = this.cachedFolders.findIndex(f => f.id === id);
      this.cachedFolders.splice(folderIndex, 1);

      await this.saveFoldersToStorage();
      this.notifyFolderListeners();

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
   * List all folders
   */
  listFolders(parentId: string | null = null): Folder[] {
    if (parentId === null) {
      return this.cachedFolders.filter(f => f.parentId === null);
    }
    return this.cachedFolders.filter(f => f.parentId === parentId);
  }

  /**
   * Build folder tree structure
   */
  getFolderTree(): FolderTreeNode[] {
    const buildTree = (parentId: string | null): FolderTreeNode[] => {
      const folders = this.cachedFolders.filter(f => f.parentId === parentId);

      return folders.map(folder => {
        const fileCount = this.cachedFiles.filter(f => f.folderId === folder.id).length;

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
   * Validate folder move (prevent circular reference)
   */
  private validateFolderMove(folderId: string, targetParentId: string): boolean {
    let currentId: string | null = targetParentId;

    while (currentId) {
      if (currentId === folderId) {
        return false; // Circular reference!
      }

      const folder = this.cachedFolders.find(f => f.id === currentId);
      currentId = folder?.parentId || null;
    }

    return true;
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
  getFileCount(folderId: string | null): number {
    return this.cachedFiles.filter(f => f.folderId === folderId).length;
  }

  /**
   * Get total storage size used
   */
  getTotalSize(): number {
    return this.cachedFiles.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalFiles: this.cachedFiles.length,
      totalFolders: this.cachedFolders.length,
      totalSize: this.getTotalSize(),
      fileHandlers: this.fileHandlers.size
    };
  }
}
