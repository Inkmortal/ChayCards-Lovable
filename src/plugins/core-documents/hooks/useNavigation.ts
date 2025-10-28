/**
 * useNavigation Hook
 *
 * Universal navigation hook that works in both Documents tabs and standalone routes.
 * Automatically detects context and routes navigation appropriately.
 *
 * @example
 * // In plugin component (works in both contexts)
 * const navigation = useNavigation();
 *
 * // Navigate to component
 * navigation.push({
 *   type: 'component',
 *   component: 'core-flashcards/CardEditor',
 *   props: { deckId: '123', cardId: '456' }
 * });
 *
 * // Navigate to file
 * navigation.push({ type: 'file', fileId: 'abc123' });
 *
 * // Navigate to folder
 * navigation.push({ type: 'folder', folderId: null });
 */

import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentViewerContext, NavigationItem } from '../context/DocumentViewerContext';
import { PluginManager } from '@/shared/plugin-system';
import type { DocumentsService } from '../services/DocumentsService';

export interface UseNavigationReturn {
  /**
   * Navigate to a new location
   * In Documents: Adds to tab history
   * Standalone: Uses React Router
   */
  push: (item: NavigationItem) => void;

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

  const push = (item: NavigationItem) => {
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
  };

  return {
    push,
    isEmbedded: documentsContext.isEmbedded
  };
}

/**
 * Convert NavigationItem to a route string for standalone navigation
 */
function buildRouteFromNavigationItem(item: NavigationItem): string | null {
  const manager = PluginManager.getInstance();

  if (item.type === 'file') {
    // Get file handler and use its route
    const documentsService = manager.getService<DocumentsService>('core-documents/documentsService');
    if (documentsService) {
      // This is async in reality, but we'll handle it synchronously for navigation
      // In practice, the file should already be loaded when navigating
      const handler = documentsService.getHandlerForExtension('.deck'); // Simplified - would need file extension
      if (handler) {
        return handler.getViewerRoute(item.fileId);
      }
    }
    return null;
  }

  if (item.type === 'folder') {
    // Folder navigation goes to Documents root
    return '/app/documents';
  }

  if (item.type === 'component') {
    // Look up route mapping from plugin manifest
    const [pluginId] = item.component.split('/');
    const plugin = manager.getPlugin(pluginId);

    if (plugin && plugin.navigationRoutes) {
      const routeBuilder = plugin.navigationRoutes[item.component];
      if (routeBuilder) {
        return routeBuilder(item.props || {});
      }
    }

    // Fallback: generate default route
    console.warn(`[useNavigation] No navigationRoutes mapping for ${item.component}, using fallback`);
    return `/app/${pluginId}`;
  }

  return null;
}
