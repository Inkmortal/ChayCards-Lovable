/**
 * useDocumentTabs - Tab System State Management Hook
 *
 * Manages:
 * - Tab creation/closing/switching
 * - Per-tab navigation history with back/forward
 * - localStorage persistence
 * - Scroll position restoration
 * - Tab validation on restore
 *
 * @example
 * const {
 *   tabs,
 *   activeTabId,
 *   activeTab,
 *   addGridTab,
 *   addDocumentTab,
 *   closeTab,
 *   switchTab,
 *   goBack,
 *   goForward,
 *   canGoBack,
 *   canGoForward
 * } = useDocumentTabs();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  DocumentTabType,
  GridTab,
  DocumentTab,
  TabHistoryEntry,
  BreadcrumbItem,
  TabState,
  StoredFile,
  Folder,
  FileHandler
} from '../types';
import type { NavigationItem } from '../context/DocumentViewerContext';
import { DocumentsService } from '../services/DocumentsService';

const STORAGE_KEY = 'chaycards:documents:tabs';

/**
 * Generate unique tab ID
 */
const generateTabId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate breadcrumb trail for a folder path
 */
const generateBreadcrumb = async (
  folderId: string | null,
  documentsService: DocumentsService
): Promise<BreadcrumbItem[]> => {
  const breadcrumb: BreadcrumbItem[] = [
    { id: 'root', name: 'All Documents', folderId: null }
  ];

  if (!folderId) return breadcrumb;

  // Build path from folder to root
  let currentId: string | null = folderId;
  const folders: Folder[] = [];

  while (currentId) {
    const folder = await documentsService.getFolder(currentId);
    if (!folder) break;
    folders.unshift(folder);
    currentId = folder.parentId;
  }

  // Add folders to breadcrumb
  folders.forEach(folder => {
    breadcrumb.push({
      id: folder.id,
      name: folder.name,
      folderId: folder.id
    });
  });

  return breadcrumb;
};

/**
 * Create default grid tab (root folder)
 */
const createDefaultGridTab = (): GridTab => {
  return {
    id: generateTabId(),
    type: 'grid',
    title: 'All Files',
    breadcrumb: [{ id: 'root', name: 'All Documents', folderId: null }],
    closeable: false,
    folderId: null,
    history: [
      {
        type: 'grid',
        folderId: null,
        timestamp: Date.now(),
        scrollPosition: 0
      }
    ],
    historyIndex: 0
  };
};

/**
 * Get file display name (without extension)
 */
const getFileDisplayName = (file: StoredFile): string => {
  return file.filename.replace(file.extension, '');
};

export interface UseDocumentTabsReturn {
  // Tab state
  tabs: DocumentTabType[];
  activeTabId: string;
  activeTab: DocumentTabType | undefined;

  // Tab operations
  addGridTab: (folderId: string | null) => Promise<void>;
  addDocumentTab: (file: StoredFile, handler: FileHandler) => Promise<void>;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;

  // Navigation history
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  canGoBack: (tabId: string) => boolean;
  canGoForward: (tabId: string) => boolean;
  navigateInTab: (tabId: string, item: NavigationItem) => void;

  // Helper to open file in current tab
  openFileInCurrentTab: (file: StoredFile) => Promise<void>;
  navigateToFolder: (folderId: string | null) => void;
}

/**
 * Helper: Find folder in tree by ID
 */
const findInTree = (tree: any[], id: string): any | null => {
  for (const node of tree) {
    if (node.type === 'folder' && node.id === id) return node;
    if (node.children) {
      const found = findInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Helper: Build breadcrumb trail from tree
 */
const buildBreadcrumbFromTree = (tree: any[], targetId: string | null): BreadcrumbItem[] => {
  const root: BreadcrumbItem = { id: 'root', name: 'All Documents', folderId: null };
  if (!targetId) return [root];

  const path: BreadcrumbItem[] = [];

  function findPath(nodes: any[], id: string, currentPath: BreadcrumbItem[] = []): boolean {
    for (const node of nodes) {
      if (node.type !== 'folder') continue;

      const item: BreadcrumbItem = {
        id: node.id,
        name: node.name,
        folderId: node.id
      };

      if (node.id === id) {
        path.push(...currentPath, item);
        return true;
      }

      if (node.children && findPath(node.children, id, [...currentPath, item])) {
        return true;
      }
    }
    return false;
  }

  findPath(tree, targetId);
  return [root, ...path];
};

export const useDocumentTabs = (
  documentsService: DocumentsService,
  localTree: any[]
): UseDocumentTabsReturn => {
  const [tabs, setTabs] = useState<DocumentTabType[]>([createDefaultGridTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const navigate = useNavigate();
  const isRestoringRef = useRef(false);

  /**
   * Save tab state to localStorage
   */
  const saveTabState = useCallback((tabsToSave: DocumentTabType[], activeId: string) => {
    try {
      const state: TabState = {
        tabs: tabsToSave,
        activeTabId: activeId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[useDocumentTabs] Failed to save tab state:', error);
    }
  }, []);

  /**
   * Restore tab state from localStorage
   */
  const restoreTabState = useCallback(async () => {
    if (isRestoringRef.current) return;
    isRestoringRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        isRestoringRef.current = false;
        return;
      }

      const state: TabState = JSON.parse(stored);

      // Validate tabs
      const validTabs: DocumentTabType[] = [];

      for (const tab of state.tabs) {
        if (tab.type === 'grid') {
          // Grid tabs are always valid
          validTabs.push(tab);
        } else {
          // Validate document tabs - check if file still exists
          const file = await documentsService.getDocument(tab.fileId);
          if (file) {
            const handler = documentsService.getHandlerForFile(file);
            if (handler) {
              validTabs.push(tab);
            }
          }
        }
      }

      // Ensure at least one grid tab
      if (validTabs.length === 0) {
        validTabs.push(createDefaultGridTab());
      }

      // Ensure first grid tab is not closeable
      const firstGridTab = validTabs.find(t => t.type === 'grid') as GridTab | undefined;
      if (firstGridTab) {
        firstGridTab.closeable = false;
      }

      // Validate active tab ID
      let newActiveTabId = state.activeTabId;
      if (!validTabs.find(t => t.id === newActiveTabId)) {
        newActiveTabId = validTabs[0].id;
      }

      setTabs(validTabs);
      setActiveTabId(newActiveTabId);
    } catch (error) {
      console.error('[useDocumentTabs] Failed to restore tab state:', error);
      setTabs([createDefaultGridTab()]);
      setActiveTabId(tabs[0].id);
    } finally {
      isRestoringRef.current = false;
    }
  }, [documentsService, tabs]);

  /**
   * Restore tab state on mount
   */
  useEffect(() => {
    restoreTabState();
  }, []);

  /**
   * Save tab state whenever it changes
   */
  useEffect(() => {
    if (!isRestoringRef.current) {
      saveTabState(tabs, activeTabId);
    }
  }, [tabs, activeTabId, saveTabState]);

  /**
   * Add a grid tab showing folder contents
   */
  const addGridTab = useCallback(async (folderId: string | null) => {
    const folder = folderId ? await documentsService.getFolder(folderId) : null;
    const breadcrumb = await generateBreadcrumb(folderId, documentsService);

    const newTab: GridTab = {
      id: generateTabId(),
      type: 'grid',
      title: folder ? folder.name : 'All Files',
      breadcrumb,
      closeable: tabs.filter(t => t.type === 'grid').length > 0,
      folderId,
      history: [
        {
          type: 'grid',
          folderId,
          timestamp: Date.now(),
          scrollPosition: 0
        }
      ],
      historyIndex: 0
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs, documentsService]);

  /**
   * Add a document tab showing file viewer
   */
  const addDocumentTab = useCallback(async (file: StoredFile, handler: FileHandler) => {
    // Check if file is already open in a tab
    const existingTab = tabs.find(
      t => t.type === 'document' && t.fileId === file.id
    ) as DocumentTab | undefined;

    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(existingTab.id);
      return;
    }

    const breadcrumb = await generateBreadcrumb(file.folderId, documentsService);

    const newTab: DocumentTab = {
      id: generateTabId(),
      type: 'document',
      title: getFileDisplayName(file),
      fileId: file.id,
      handler,
      pluginRoute: undefined, // TODO: Remove pluginRoute or implement getViewerRoute in FileHandler
      breadcrumb,
      closeable: true,
      isDirty: false,
      history: [
        {
          type: 'document',
          fileId: file.id,
          timestamp: Date.now(),
          scrollPosition: 0,
          cursorPosition: 0
        }
      ],
      historyIndex: 0
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);

    // Navigate to plugin route
    navigate(newTab.pluginRoute, { replace: true });
  }, [tabs, documentsService, navigate]);

  /**
   * Close a tab
   */
  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);

    if (!tab?.closeable) return;

    // Check for unsaved changes
    if (tab.type === 'document' && tab.isDirty) {
      const confirmed = confirm(
        `"${tab.title}" has unsaved changes. Close anyway?`
      );
      if (!confirmed) return;
    }

    const newTabs = tabs.filter(t => t.id !== tabId);

    // Switch to adjacent tab if closing active
    if (activeTabId === tabId) {
      const closedIndex = tabs.findIndex(t => t.id === tabId);
      const newActiveTab = newTabs[closedIndex] || newTabs[closedIndex - 1] || newTabs[0];
      setActiveTabId(newActiveTab.id);
    }

    setTabs(newTabs);
  }, [tabs, activeTabId]);

  /**
   * Switch to a different tab
   */
  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    setActiveTabId(tabId);

    // Update browser history
    if (tab.type === 'document') {
      navigate(tab.pluginRoute, { replace: true });
    } else {
      navigate('/app/documents', { replace: true });
    }
  }, [tabs, navigate]);

  /**
   * Mark tab as dirty/clean
   */
  const setTabDirty = useCallback((tabId: string, isDirty: boolean) => {
    setTabs(tabs.map(tab => {
      if (tab.id === tabId && tab.type === 'document') {
        return { ...tab, isDirty };
      }
      return tab;
    }));
  }, [tabs]);

  /**
   * Capture current scroll/cursor position
   */
  const captureCurrentState = useCallback((tab: DocumentTabType): Partial<TabHistoryEntry> => {
    if (tab.type === 'grid') {
      const gridElement = document.querySelector('.file-grid');
      return {
        scrollPosition: gridElement?.scrollTop || 0
      };
    } else {
      const docElement = document.querySelector('.document-viewer');
      const state: Partial<TabHistoryEntry> = {
        scrollPosition: docElement?.scrollTop || 0
      };

      // For text editors, capture cursor position via custom event
      const cursorEvent = new CustomEvent('document-cursor-capture', {
        detail: {
          callback: (pos: number) => {
            state.cursorPosition = pos;
          }
        }
      });
      window.dispatchEvent(cursorEvent);

      return state;
    }
  }, []);

  /**
   * Update current history entry with latest state
   */
  const updateCurrentHistoryEntry = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const currentState = captureCurrentState(tab);

    setTabs(tabs.map(t => {
      if (t.id !== tabId) return t;

      const updatedHistory = [...t.history];
      updatedHistory[t.historyIndex] = {
        ...updatedHistory[t.historyIndex],
        ...currentState
      };

      return { ...t, history: updatedHistory };
    }));
  }, [tabs, captureCurrentState]);

  /**
   * Add entry to tab's navigation history
   */
  const navigateInTab = useCallback((
    tabId: string,
    item: NavigationItem
  ) => {
    // FIX: Use functional updater to avoid stale state
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id !== tabId) return tab;

      // Convert NavigationItem to TabHistoryEntry
      let entry: TabHistoryEntry;
      if (item.type === 'file') {
        entry = {
          type: 'document',
          fileId: item.fileId,
          scrollPosition: 0,
          timestamp: Date.now()
        };
      } else if (item.type === 'folder') {
        entry = {
          type: 'grid',
          folderId: item.folderId,
          scrollPosition: 0,
          timestamp: Date.now()
        };
      } else {
        // type === 'component'
        entry = {
          type: 'component',
          component: item.component,
          componentProps: item.props,
          scrollPosition: 0,
          timestamp: Date.now()
        };
      }

      const newHistory = [
        // Keep all history up to current index
        ...tab.history.slice(0, tab.historyIndex + 1),
        // Add new entry (truncates "future")
        entry
      ];

      return {
        ...tab,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    }));
  }, []); // Remove tabs dependency since we use functional updater

  /**
   * Restore UI state from history entry
   */
  const restoreHistoryEntry = useCallback(async (
    tab: DocumentTabType,
    entry: TabHistoryEntry
  ) => {
    if (entry.type === 'grid') {
      // Restore grid view
      const folder = entry.folderId ? await documentsService.getFolder(entry.folderId) : null;
      const breadcrumb = await generateBreadcrumb(entry.folderId, documentsService);

      // Update tab
      setTabs(tabs.map(t => {
        if (t.id !== tab.id) return t;
        return {
          ...t,
          type: 'grid',
          title: folder ? folder.name : 'All Files',
          folderId: entry.folderId,
          breadcrumb
        } as GridTab;
      }));

      // Restore scroll position (next frame to allow render)
      requestAnimationFrame(() => {
        const gridElement = document.querySelector('.file-grid');
        if (gridElement && entry.scrollPosition !== undefined) {
          gridElement.scrollTop = entry.scrollPosition;
        }
      });
    } else {
      // Restore document view
      const file = await documentsService.getDocument(entry.fileId!);
      if (!file) return;

      const handler = documentsService.getHandlerForFile(file);
      if (!handler) return;

      const breadcrumb = await generateBreadcrumb(file.folderId, documentsService);

      // Update tab
      setTabs(tabs.map(t => {
        if (t.id !== tab.id) return t;
        return {
          ...t,
          type: 'document',
          title: getFileDisplayName(file),
          fileId: file.id,
          handler,
          pluginRoute: handler.getViewerRoute(file.id),
          breadcrumb
        } as DocumentTab;
      }));

      // Navigate to plugin route
      navigate(handler.getViewerRoute(file.id), { replace: true });

      // Restore scroll/cursor position (next frame)
      requestAnimationFrame(() => {
        // For scrollable documents
        const docElement = document.querySelector('.document-viewer');
        if (docElement && entry.scrollPosition !== undefined) {
          docElement.scrollTop = entry.scrollPosition;
        }

        // For text editors (plugin-specific)
        if (entry.cursorPosition !== undefined) {
          window.dispatchEvent(new CustomEvent('document-cursor-restore', {
            detail: { position: entry.cursorPosition }
          }));
        }
      });
    }
  }, [tabs, documentsService, navigate]);

  /**
   * Go back in tab history
   */
  const goBack = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.historyIndex <= 0) return;

    const prevEntry = tab.history[tab.historyIndex - 1];

    // Update history index
    setTabs(tabs.map(t => {
      if (t.id !== tabId) return t;
      return { ...t, historyIndex: t.historyIndex - 1 };
    }));

    // Restore previous entry
    await restoreHistoryEntry(tab, prevEntry);
  }, [tabs, restoreHistoryEntry]);

  /**
   * Go forward in tab history
   */
  const goForward = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;

    const nextEntry = tab.history[tab.historyIndex + 1];

    // Update history index
    setTabs(tabs.map(t => {
      if (t.id !== tabId) return t;
      return { ...t, historyIndex: t.historyIndex + 1 };
    }));

    // Restore next entry
    await restoreHistoryEntry(tab, nextEntry);
  }, [tabs, restoreHistoryEntry]);

  /**
   * Check if can go back
   */
  const canGoBack = useCallback((tabId: string): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.historyIndex > 0 : false;
  }, [tabs]);

  /**
   * Check if can go forward
   */
  const canGoForward = useCallback((tabId: string): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.historyIndex < tab.history.length - 1 : false;
  }, [tabs]);

  /**
   * Open file in current tab (adds to history)
   */
  const openFileInCurrentTab = useCallback(async (file: StoredFile) => {
    console.log('[useDocumentTabs] openFileInCurrentTab called', { fileId: file.id, filename: file.filename });

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    console.log('[useDocumentTabs] Active tab before update:', {
      type: activeTab.type,
      historyLength: activeTab.history.length,
      historyIndex: activeTab.historyIndex
    });

    // Save current scroll position
    updateCurrentHistoryEntry(activeTabId);

    // Get handler
    const handler = documentsService.getHandlerForFile(file);
    if (!handler) {
      console.error('[useDocumentTabs] No handler for file:', file.extension);
      return;
    }

    console.log('[useDocumentTabs] Handler found:', {
      handlerId: handler.id,
      viewerComponent: handler.viewerComponent
    });

    // Add to history
    console.log('[useDocumentTabs] Calling navigateInTab with type:file');
    navigateInTab(activeTabId, {
      type: 'file',
      fileId: file.id
    });

    // Update tab to document type
    const breadcrumb = await generateBreadcrumb(file.folderId, documentsService);

    console.log('[useDocumentTabs] Updating tab metadata to document type');
    // FIX: Use functional updater to avoid stale state
    setTabs(prevTabs => prevTabs.map(t => {
      if (t.id !== activeTabId) return t;
      return {
        ...t,
        type: 'document',
        title: getFileDisplayName(file),
        fileId: file.id,
        handler,
        breadcrumb,
        isDirty: false
      } as DocumentTab;
    }));

    console.log('[useDocumentTabs] openFileInCurrentTab completed');
  }, [tabs, activeTabId, documentsService, navigate, navigateInTab, updateCurrentHistoryEntry]);

  /**
   * Navigate to folder in current tab (adds to history)
   * OPTIMIZED: Uses localTree for instant navigation (no async DB calls)
   */
  const navigateToFolder = useCallback((folderId: string | null) => {
    // DEBUG: Track who's calling navigateToFolder
    console.log('[useDocumentTabs] navigateToFolder called', {
      folderId,
      activeTabId,
      stack: new Error().stack
    });

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    console.log('[useDocumentTabs] navigateToFolder - active tab before:', {
      type: activeTab.type,
      historyLength: activeTab.history.length,
      historyIndex: activeTab.historyIndex
    });

    // Find folder in local tree (instant, no async)
    const folder = folderId ? findInTree(localTree, folderId) : null;

    // Build breadcrumb from local tree (instant, no async)
    const breadcrumb = buildBreadcrumbFromTree(localTree, folderId);

    // Save current scroll position
    const currentState = captureCurrentState(activeTab);

    // Update tabs with new history entry
    setTabs(prevTabs => {
      return prevTabs.map(t => {
        if (t.id !== activeTabId) return t;

        // Update current history entry with captured state
        const updatedHistory = [...t.history];
        updatedHistory[t.historyIndex] = {
          ...updatedHistory[t.historyIndex],
          ...currentState
        };

        // Add new history entry
        const newHistory = [
          ...updatedHistory.slice(0, t.historyIndex + 1),
          { type: 'grid', folderId, scrollPosition: 0, timestamp: Date.now() }
        ];

        // Return updated tab with new history and updated properties
        return {
          ...t,
          type: 'grid',
          title: folder ? folder.name : 'All Files',
          folderId,
          breadcrumb,
          history: newHistory,
          historyIndex: newHistory.length - 1
        } as GridTab;
      });
    });
  }, [tabs, activeTabId, localTree, captureCurrentState]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return {
    tabs,
    activeTabId,
    activeTab,
    addGridTab,
    addDocumentTab,
    closeTab,
    switchTab,
    setTabDirty,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    navigateInTab,
    openFileInCurrentTab,
    navigateToFolder
  };
};
