import React from 'react';
import { PluginManager } from '@/shared/plugin-system';
import { DocumentViewerContext } from '../context/DocumentViewerContext';
import type { DocumentTabType } from '../types';

interface DocumentViewContentProps {
  activeTab: DocumentTabType;
  activeTabId: string;
  documentsService: any;
  manager: PluginManager;
  addDocumentTab: (file: any, handler: any) => Promise<void>;
  closeTab: (tabId: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  navigateInTab: (tabId: string, item: any) => void;
  goBack: (tabId: string) => Promise<void>;
  canGoBack: (tabId: string) => boolean;
}

export const DocumentViewContent: React.FC<DocumentViewContentProps> = ({
  activeTab,
  activeTabId,
  documentsService,
  manager,
  addDocumentTab,
  closeTab,
  setTabDirty,
  navigateInTab,
  goBack,
  canGoBack
}) => {
  return (
    <DocumentViewerContext.Provider
      value={{
        isEmbedded: true,
        openInNewTab: async (route: string) => {
          // Parse route to extract fileId
          // This is a simplification - in production, you'd parse the route properly
          const fileId = route.split('/').pop();
          if (fileId) {
            const file = await documentsService.getDocument(fileId);
            if (file) {
              const handler = documentsService.getHandlerForFile(file);
              if (handler) {
                await addDocumentTab(file, handler);
              }
            }
          }
        },
        closeTab: () => closeTab(activeTabId),
        setTabDirty: (isDirty: boolean) => setTabDirty(activeTabId, isDirty),
        navigateInTab: (item) => navigateInTab(activeTabId, item),
        goBack: () => goBack(activeTabId),
        canGoBack: canGoBack(activeTabId)
      }}
    >
      <div className="document-viewer flex-1 overflow-auto">
        {/* Render current history entry */}
        {(() => {
          const currentHistory = activeTab.history[activeTab.historyIndex];

          // DEBUG: Log state to understand why tab is blank
          console.log('[FileBrowser] Document viewer rendering:', {
            activeTabType: activeTab.type,
            activeTabId: activeTab.id,
            activeTabFileId: activeTab.fileId,
            handler: activeTab.handler,
            handlerViewerComponent: activeTab.handler?.viewerComponent,
            historyIndex: activeTab.historyIndex,
            historyLength: activeTab.history.length,
            currentHistory,
            currentHistoryType: currentHistory?.type,
            conditionCheck: {
              currentHistoryTypeIsDocument: currentHistory?.type === 'document',
              activeTabTypeIsDocument: activeTab.type === 'document',
              bothTrue: currentHistory?.type === 'document' && activeTab.type === 'document'
            }
          });

          if (currentHistory.type === 'component') {
            // Render component from history
            const ComponentToRender = manager.getComponent(currentHistory.component || '');

            if (!ComponentToRender) {
              return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-medium">Component not found</p>
                    <p className="text-sm">Component '{currentHistory.component}' is not registered</p>
                  </div>
                </div>
              );
            }

            // Normalize props: ensure fileId is available for Documents-integrated components
            // This allows plugins to use domain-specific IDs (deckId, noteId, etc.) internally
            // while still working with Documents' fileId convention
            let normalizedProps = { ...(currentHistory.componentProps || {}) };

            // If no fileId but has a domain-specific ID, use that as fileId alias
            if (!normalizedProps.fileId) {
              const domainIdKeys = ['deckId', 'noteId', 'projectId', 'taskId', 'boardId', 'documentId'];
              for (const key of domainIdKeys) {
                if (normalizedProps[key]) {
                  normalizedProps.fileId = normalizedProps[key];
                  break;
                }
              }
            }

            return <ComponentToRender {...normalizedProps} />;
          } else if (currentHistory.type === 'document' && activeTab.type === 'document') {
            // Render file viewer component
            const ViewerComponent = manager.getComponent(activeTab.handler.viewerComponent || '');

            if (!ViewerComponent) {
              return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-medium">Viewer not found</p>
                    <p className="text-sm">Component '{activeTab.handler.viewerComponent}' is not registered</p>
                  </div>
                </div>
              );
            }

            // Render the plugin's viewer component with fileId prop
            return <ViewerComponent fileId={activeTab.fileId} />;
          }

          // DEBUG: This is why the tab is blank
          console.error('[FileBrowser] Returning null - no matching render condition!', {
            currentHistoryType: currentHistory?.type,
            activeTabType: activeTab.type,
            reason: 'Neither component nor document condition matched'
          });

          return null;
        })()}
      </div>
    </DocumentViewerContext.Provider>
  );
};
