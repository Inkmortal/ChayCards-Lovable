/**
 * React hooks for Documents Plugin
 *
 * Provides reactive access to files and folders with automatic updates
 * Uses observer pattern from DocumentsService
 */

import { useState, useEffect, useMemo } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import type { DocumentsService } from '../services/DocumentsService';
import type { StoredFile, Folder, FolderTreeNode, FileHandler } from '../types';

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

    // Service calls setFiles immediately with current state
    // Then notifies on future changes
    const unsubscribe = service.onFilesChange(setFiles);

    return unsubscribe;
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

    const unsubscribe = service.onFoldersChange(setFolders);

    return unsubscribe;
  }, [service]);

  return folders;
};

/**
 * Hook to get files in a specific folder
 */
export const useFilesInFolder = (folderId: string | null): StoredFile[] => {
  const allFiles = useFiles();

  return useMemo(
    () => allFiles.filter(file => file.folderId === folderId),
    [allFiles, folderId]
  );
};

/**
 * Hook to get child folders of a parent
 */
export const useChildFolders = (parentId: string | null): Folder[] => {
  const allFolders = useFolders();

  return useMemo(
    () => allFolders.filter(folder => folder.parentId === parentId),
    [allFolders, parentId]
  );
};

/**
 * Hook to get folder tree structure
 */
export const useFolderTree = (): FolderTreeNode[] => {
  const service = useDocumentsService();
  const folders = useFolders(); // Re-render when folders change

  return useMemo(() => {
    if (!service) return [];
    return service.getFolderTree();
  }, [service, folders]);
};

/**
 * Hook to get a single file by ID
 */
export const useFile = (fileId: string | undefined): StoredFile | undefined => {
  const service = useDocumentsService();
  const files = useFiles(); // Re-render when files change

  return useMemo(() => {
    if (!service || !fileId) return undefined;
    return service.getDocument(fileId);
  }, [service, fileId, files]);
};

/**
 * Hook to get a single folder by ID
 */
export const useFolder = (folderId: string | undefined): Folder | undefined => {
  const service = useDocumentsService();
  const folders = useFolders(); // Re-render when folders change

  return useMemo(() => {
    if (!service || !folderId) return undefined;
    return service.getFolder(folderId);
  }, [service, folderId, folders]);
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

  return useMemo(() => {
    if (!service) {
      return {
        totalFiles: 0,
        totalFolders: 0,
        totalSize: 0,
        fileHandlers: 0
      };
    }
    return service.getStatistics();
  }, [service, files, folders]);
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
  const service = useDocumentsService();
  const folders = useFolders(); // Re-render when folders change

  return useMemo(() => {
    if (!service || !folderId) return [];

    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = service.getFolder(currentId);
      if (!folder) break;

      path.unshift(folder); // Add to beginning
      currentId = folder.parentId;
    }

    return path;
  }, [service, folderId, folders]);
};
