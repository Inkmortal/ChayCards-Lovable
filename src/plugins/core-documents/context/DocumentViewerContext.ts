/**
 * DocumentViewerContext - Plugin Integration Context
 *
 * Allows plugin viewers to detect whether they're embedded in Documents
 * or running standalone, and provides tab control functions when embedded.
 *
 * @example
 * // In plugin viewer component
 * const viewerContext = useContext(DocumentViewerContext);
 *
 * if (viewerContext.isEmbedded) {
 *   // Embedded in Documents - use tab controls
 *   viewerContext.openInNewTab?.('/app/flashcards/deck/123');
 *   viewerContext.setTabDirty?.(true);
 * } else {
 *   // Standalone route - use router
 *   router.push('/app/flashcards/deck/123');
 * }
 */

import { createContext } from 'react';

/**
 * Context provided to plugin viewers for detecting embedding
 * and controlling tab behavior
 */
export interface DocumentViewerContextValue {
  /**
   * Is this viewer embedded in a Documents tab?
   * - true: Viewer is inside Documents plugin (show minimal chrome)
   * - false: Viewer is standalone route (show full navigation)
   */
  isEmbedded: boolean;

  /**
   * Open a file in a new tab (embedded only)
   * @param route - Plugin route from handler.getViewerRoute()
   * @example openInNewTab('/app/flashcards/deck/abc123')
   */
  openInNewTab?: (route: string) => void;

  /**
   * Close the current tab (embedded only)
   * Will check isDirty before closing
   */
  closeTab?: () => void;

  /**
   * Mark current tab as dirty/clean (embedded only)
   * @param isDirty - true = has unsaved changes, false = clean
   */
  setTabDirty?: (isDirty: boolean) => void;

  /**
   * Navigate within current tab (adds to history)
   * @param fileId - File to open in current tab
   */
  navigateInTab?: (fileId: string) => void;
}

/**
 * Default context value for standalone viewers
 */
const defaultContextValue: DocumentViewerContextValue = {
  isEmbedded: false,
};

/**
 * React context for plugin viewer integration
 */
export const DocumentViewerContext = createContext<DocumentViewerContextValue>(
  defaultContextValue
);
