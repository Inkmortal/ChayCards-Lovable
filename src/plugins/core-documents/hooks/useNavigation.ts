/**
 * useNavigation Hook
 *
 * Universal navigation hook that works in both Documents tabs and standalone routes.
 * Automatically detects context and routes navigation appropriately.
 *
 * IMPORTANT: Plugin components should ALWAYS use this hook for navigation,
 * never use useNavigate() directly. This ensures navigation works correctly
 * regardless of whether the component is embedded in Documents or standalone.
 *
 * @example
 * // In plugin component (works in both contexts)
 * const navigation = useNavigation();
 *
 * // Navigate to component
 * navigation.push({
 *   type: 'component',
 *   component: 'chaycards/core-flashcards/CardEditor',
 *   props: { deckId: '123', cardId: '456' }
 * });
 *
 * // Navigate to file
 * navigation.push({ type: 'file', fileId: 'abc123' });
 *
 * // Navigate to folder
 * navigation.push({ type: 'folder', folderId: null });
 *
 * // Go back (context-aware)
 * navigation.goBack();
 */

import { useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentViewerContext, NavigationItem } from '../context/DocumentViewerContext';
import { PluginManager } from '@/shared/plugin-system';
import type { DocumentsService } from '../services/DocumentsService';
import type { FileHandler } from '../types';

export interface UseNavigationReturn {
  /**
   * Navigate to a new location
   * In Documents: Adds to tab history
   * Standalone: Uses React Router
   */
  push: (item: NavigationItem) => void;

  /**
   * Go back to previous location
   * In Documents: Goes back in tab history
   * Standalone: Uses browser history (router.back())
   */
  goBack: () => void;

  /**
   * Is this component embedded in Documents?
   */
  isEmbedded: boolean;
}

/**
 * Hook for universal navigation across Documents and standalone contexts
 */
export function useNavigation(): UseNavigationReturn {
  const documentsContext = useContext(DocumentViewerContext);
  const router = useNavigate();

  const push = useCallback((item: NavigationItem) => {
    if (documentsContext.isEmbedded && documentsContext.navigateInTab) {
      // Embedded in Documents - push to tab history
      documentsContext.navigateInTab(item);
    } else {
      // Standalone route - convert to URL and use React Router
      const route = buildRouteFromNavigationItem(item);
      if (route) {
        router(route);
      } else {
        console.warn('[useNavigation] Could not build route for navigation item:', item);
      }
    }
  }, [documentsContext, router]);

  const goBack = useCallback(() => {
    if (documentsContext.isEmbedded && documentsContext.goBack) {
      // Embedded in Documents - go back in tab history
      documentsContext.goBack();
    } else {
      // Standalone - use browser history
      router(-1);
    }
  }, [documentsContext, router]);

  return {
    push,
    goBack,
    isEmbedded: documentsContext.isEmbedded
  };
}

/**
 * Convert NavigationItem to a route string for standalone navigation
 */
function buildRouteFromNavigationItem(item: NavigationItem): string | null {
  const manager = PluginManager.getInstance();

  if (item.type === 'file') {
    // Get file from DocumentsService to determine its handler
    const documentsService = manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (documentsService) {
      // Try to get the file to determine its extension
      // Note: This is synchronous lookup - file should be cached/loaded already
      const file = documentsService.getCachedFile(item.fileId);

      if (file) {
        const handler = documentsService.getHandlerForFile(file);
        if (handler?.getViewerRoute) {
          return handler.getViewerRoute(item.fileId);
        }
      }

      // Fallback: Try all registered handlers to find one with getViewerRoute
      const handlers = documentsService.getFileHandlers();
      for (const handler of handlers) {
        if (handler.getViewerRoute) {
          // Use the first handler that has a route builder
          // This works for cases where we know the fileId maps to a specific type
          return handler.getViewerRoute(item.fileId);
        }
      }
    }

    // Ultimate fallback - go to documents with the file ID
    console.warn('[useNavigation] No handler with getViewerRoute found for file:', item.fileId);
    return `/app/documents?file=${item.fileId}`;
  }

  if (item.type === 'folder') {
    // Folder navigation goes to Documents, optionally with folder ID
    if (item.folderId) {
      return `/app/documents?folder=${item.folderId}`;
    }
    return '/app/documents';
  }

  if (item.type === 'component') {
    // Look up route mapping from plugin manifest
    // Component format: 'chaycards/core-flashcards/CardEditor'
    const parts = item.component.split('/');
    const pluginId = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    const plugin = manager.getPlugin(pluginId);

    if (plugin && plugin.navigationRoutes) {
      const routeBuilder = plugin.navigationRoutes[item.component];
      if (routeBuilder) {
        return routeBuilder(item.props || {});
      }
    }

    // Fallback: try to construct a reasonable route
    console.warn(`[useNavigation] No navigationRoutes mapping for ${item.component}, using fallback`);

    // Extract the last part as the component name and try common patterns
    const componentName = parts[parts.length - 1];
    const baseRoute = `/app/${parts[1]?.replace('core-', '') || 'unknown'}`;

    // If props contain common ID patterns, append them
    if (item.props?.deckId) {
      return `${baseRoute}/deck/${item.props.deckId}`;
    }
    if (item.props?.fileId) {
      return `${baseRoute}/${item.props.fileId}`;
    }

    return baseRoute;
  }

  return null;
}
