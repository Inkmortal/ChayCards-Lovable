/**
 * Core Documents Plugin
 *
 * Complete file management system with:
 * - File upload and storage
 * - Hierarchical folder organization
 * - Drag-and-drop interface
 * - FileHandler extensibility for plugins
 * - Advanced search and filtering
 * - Grid and List views
 */

import type { Plugin } from '@/shared/plugin-system/types';
import { DocumentsService } from './services/DocumentsService';

// Components
import { FileBrowser } from './components/FileBrowser';
// Phase 2: Additional components
// import { FolderTree } from './components/FolderTree';
// import { FileCard } from './components/FileCard';
// import { FileViewer } from './components/FileViewer';

export const CoreDocumentsPlugin: Plugin = {
  id: 'core-documents',
  name: 'Documents',
  version: '1.0.0',
  description: 'File management system with folders, tags, and extensible file handlers',

  // Requires core-ui for UI components
  requires: ['core-ui'],

  // Components (will be auto-namespaced to 'core-documents/ComponentName')
  components: {
    'FileBrowser': FileBrowser,
    // Phase 2: Additional UI components
    // 'FolderTree': FolderTree,
    // 'FileCard': FileCard,
    // 'FileViewer': FileViewer,
  },

  // Services (auto-namespaced to 'core-documents/serviceName')
  services: {
    'documentsService': new DocumentsService()
  },

  // Routes
  routes: [
    {
      path: '/app/documents',
      component: 'core-documents/FileBrowser', // Will be created in Phase 2
      label: 'Documents',
      icon: 'FileText',
      showInNav: true,
      order: 20
    }
  ],

  // Plugin lifecycle: onLoad
  onLoad: async (manager) => {
    console.log('[CoreDocumentsPlugin] Loading...');

    // Get service and storage
    const service = manager.getService<DocumentsService>('core-documents/documentsService');
    const storage = manager.getStorage();

    // Initialize service with storage
    if (service && storage) {
      await service.initialize(storage);
      console.log('[CoreDocumentsPlugin] Service initialized');
    } else if (!storage) {
      console.warn('[CoreDocumentsPlugin] Storage not available (public page?)');
    }

    // Listen for document events (for debugging/logging)
    const eventBus = manager.getEventBus();

    eventBus.on('document:created', ({ file }) => {
      console.log('[CoreDocumentsPlugin] Document created:', file.filename);
    });

    eventBus.on('document:updated', ({ file }) => {
      console.log('[CoreDocumentsPlugin] Document updated:', file.filename);
    });

    eventBus.on('document:deleted', ({ file }) => {
      console.log('[CoreDocumentsPlugin] Document deleted:', file.filename);
    });

    eventBus.on('folder:created', ({ folder }) => {
      console.log('[CoreDocumentsPlugin] Folder created:', folder.name);
    });

    eventBus.on('filehandler:registered', ({ handler }) => {
      console.log('[CoreDocumentsPlugin] FileHandler registered:', handler.id);
    });

    console.log('[CoreDocumentsPlugin] Loaded successfully');
  }
};

export default CoreDocumentsPlugin;

// Export types for other plugins to use
export type {
  StoredFile,
  Folder,
  FileHandler,
  SaveDocumentOptions,
  UpdateDocumentOptions,
  CreateFolderOptions,
  UpdateFolderOptions,
  ListFilesOptions,
  FolderTreeNode,
  ViewMode,
  SortOrder,
  FileOperationResult,
  FolderOperationResult
} from './types';

// Export service for type safety
export { DocumentsService } from './services/DocumentsService';

// Export hooks for plugin developers
export {
  useFiles,
  useFolders,
  useFilesInFolder,
  useChildFolders,
  useFolderTree,
  useFile,
  useFolder,
  useFileHandlers,
  useFileHandler,
  useDocumentStatistics,
  useFileSearch,
  useFolderPath
} from './hooks/useDocuments';
