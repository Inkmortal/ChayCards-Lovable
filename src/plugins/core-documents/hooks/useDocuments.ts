/**
 * React hooks for Documents Plugin
 *
 * Provides reactive access to files and folders with automatic updates
 * Uses observer pattern from DocumentsService
 */

import { useState, useEffect, useMemo } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import type { DocumentsService } from '../services/DocumentsService';
import type { StoredFile, Folder, FolderTreeNode, TreeNode, FileHandler, SortMode } from '../types';

/**
 * Internal hook to get DocumentsService instance
 * Returns undefined if service is not initialized to prevent race conditions
 */
const useDocumentsService = (): DocumentsService | undefined => {
  const service = PluginManager.getInstance().getService<DocumentsService>('core-documents/documentsService');

  // Only return service if it's initialized to prevent race conditions
  return service?.isInitialized() ? service : undefined;
};

/**
 * Hook to get all files with real-time updates
 */
export const useFiles = (): StoredFile[] => {
  const service = useDocumentsService();
  const [files, setFiles] = useState<StoredFile[]>([]);

  useEffect(() => {
    if (!service) return;

    // Initial fetch from storage ONLY (no event listeners!)
    const fetchFiles = async () => {
      const fetchedFiles = await service.getFiles();
      setFiles(fetchedFiles);
    };
    fetchFiles();

    // NO EVENT LISTENERS - UI updates optimistically, backend persistence is silent
  }, [service]);

  return files;
};

/**
 * Hook to get all folders with real-time updates
 */
export const useFolders = (): Folder[] => {
  const service = useDocumentsService();
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!service) return;

    // Initial fetch from storage ONLY (no event listeners!)
    const fetchFolders = async () => {
      const fetchedFolders = await service.getFolders();
      setFolders(fetchedFolders);
    };
    fetchFolders();

    // NO EVENT LISTENERS - UI updates optimistically, backend persistence is silent
  }, [service]);

  return folders;
};

/**
 * Helper to normalize parent/folder IDs to handle null, "null", and undefined.
 */
const normalizeId = (id: string | null | undefined): string | null => {
  if (id === null || id === undefined || id === 'null') {
    return null;
  }
  return id;
};

/**
 * Hook to get files in a specific folder
 */
export const useFilesInFolder = (folderId: string | null): StoredFile[] => {
  const allFiles = useFiles();

  return useMemo(
    () => allFiles.filter(file => normalizeId(file.folderId) === folderId),
    [allFiles, folderId]
  );
};

/**
 * Hook to get child folders of a parent
 */
export const useChildFolders = (parentId: string | null): Folder[] => {
  const allFolders = useFolders();

  return useMemo(
    () => allFolders.filter(folder => normalizeId(folder.parentId) === parentId),
    [allFolders, parentId]
  );
};

/**
 * Hook to get folder tree structure
 */
export const useFolderTree = (): FolderTreeNode[] => {
  const service = useDocumentsService();
  const folders = useFolders(); // Re-render when folders change
  const [tree, setTree] = useState<FolderTreeNode[]>([]);

  useEffect(() => {
    if (!service) {
      setTree([]);
      return;
    }

    const fetchTree = async () => {
      const folderTree = await service.getFolderTree();
      setTree(folderTree);
    };
    fetchTree();
  }, [service, folders]); // Re-fetch when folders change

  return tree;
};

/**
 * Hook to get unified tree structure (folders + files together)
 * Used for sidebar tree view
 *
 * Note: This hook refetches directly from service when triggerRefetch changes,
 * allowing manual cache-busting after drag operations
 */
export const useUnifiedTree = (triggerRefetch?: number): TreeNode[] => {
  const service = useDocumentsService();
  const [tree, setTree] = useState<TreeNode[]>([]);

  useEffect(() => {
    if (!service) {
      setTree([]);
      return;
    }

    const fetchTree = async () => {
      const unifiedTree = await service.getUnifiedTree();
      setTree(unifiedTree);
    };
    fetchTree();
  }, [service, triggerRefetch]); // Re-fetch when service initializes or triggerRefetch changes

  return tree;
};

/**
 * Hook to get a single file by ID
 */
export const useFile = (fileId: string | undefined): StoredFile | undefined => {
  const service = useDocumentsService();
  const files = useFiles(); // Re-render when files change

  return useMemo(() => {
    if (!service || !fileId) return undefined;
    return files.find(f => f.id === fileId);
  }, [files, fileId]);
};

/**
 * Hook to get a single folder by ID
 */
export const useFolder = (folderId: string | undefined): Folder | undefined => {
  const folders = useFolders(); // Re-render when folders change

  return useMemo(() => {
    if (!folderId) return undefined;
    return folders.find(f => f.id === folderId);
  }, [folders, folderId]);
};

/**
 * Hook to get all registered file handlers
 */
export const useFileHandlers = (): FileHandler[] => {
  const service = useDocumentsService();
  const [handlers, setHandlers] = useState<FileHandler[]>([]);

  useEffect(() => {
    if (!service) return;

    // Initial load
    setHandlers(service.getAllHandlers());

    // Listen for new handler registrations
    const eventBus = PluginManager.getInstance().getEventBus();
    const handleHandlerRegistered = () => {
      setHandlers(service.getAllHandlers());
    };

    eventBus.on('filehandler:registered', handleHandlerRegistered);

    return () => {
      eventBus.off('filehandler:registered', handleHandlerRegistered);
    };
  }, [service]);

  return handlers;
};

/**
 * Hook to get file handler for a specific file
 */
export const useFileHandler = (file: StoredFile | undefined): FileHandler | undefined => {
  const service = useDocumentsService();
  const handlers = useFileHandlers(); // Re-render when handlers change

  return useMemo(() => {
    if (!service || !file) return undefined;
    return service.getHandlerForFile(file);
  }, [service, file, handlers]);
};

/**
 * Hook to get statistics
 */
export const useDocumentStatistics = () => {
  const service = useDocumentsService();
  const files = useFiles(); // Re-render when files change
  const folders = useFolders(); // Re-render when folders change
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    fileHandlers: 0
  });

  useEffect(() => {
    if (!service) {
      setStats({
        totalFiles: 0,
        totalFolders: 0,
        totalSize: 0,
        fileHandlers: 0
      });
      return;
    }

    const fetchStats = async () => {
      const statistics = await service.getStatistics();
      setStats(statistics);
    };
    fetchStats();
  }, [service, files, folders]); // Re-fetch when files or folders change

  return stats;
};

/**
 * Hook to search files
 */
export const useFileSearch = (query: string): StoredFile[] => {
  const allFiles = useFiles();

  return useMemo(() => {
    if (!query.trim()) return allFiles;

    const searchLower = query.toLowerCase();
    return allFiles.filter(file =>
      file.filename.toLowerCase().includes(searchLower) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }, [allFiles, query]);
};

/**
 * Hook to get breadcrumb path for a folder
 */
export const useFolderPath = (folderId: string | null): Folder[] => {
  const folders = useFolders(); // Re-render when folders change

  return useMemo(() => {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;

      path.unshift(folder); // Add to beginning
      currentId = folder.parentId;
    }

    return path;
  }, [folderId, folders]);
};

/**
 * Hook for sorting folders and files
 * Returns function to trigger sort
 */
export const useSortBy = () => {
  const service = useDocumentsService();

  const sortBy = async (mode: SortMode, parentId: string | null = null) => {
    if (!service) {
      console.warn('[useSortBy] Service not initialized');
      return;
    }

    await service.sortItemsBy(mode, parentId);
  };

  return { sortBy };
};
