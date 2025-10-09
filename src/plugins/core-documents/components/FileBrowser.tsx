/**
 * FileBrowser - Main document management interface
 *
 * Phase 1: Placeholder component
 * Phase 2: Full implementation with mock data
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import { useDocumentStatistics } from '../hooks/useDocuments';

export const FileBrowser: React.FC = () => {
  const manager = PluginManager.getInstance();
  const stats = useDocumentStatistics();

  // Get UI components from core-ui plugin
  const PageHeader = manager.getComponent('core-ui/PageHeader');
  const EmptyState = manager.getComponent('core-ui/EmptyState');

  return (
    <div className="file-browser h-full flex flex-col">
      {/* Page Header */}
      {PageHeader && (
        <PageHeader
          title="Documents"
          subtitle="File management system"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {EmptyState ? (
          <EmptyState
            icon={FileText}
            title="Documents Plugin Loaded"
            description="DocumentsService initialized successfully. Ready for Phase 2 UI implementation."
          >
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p><strong>Statistics:</strong></p>
              <ul className="list-disc list-inside">
                <li>Total Files: {stats.totalFiles}</li>
                <li>Total Folders: {stats.totalFolders}</li>
                <li>Total Size: {(stats.totalSize / 1024).toFixed(2)} KB</li>
                <li>Registered Handlers: {stats.fileHandlers}</li>
              </ul>
            </div>
          </EmptyState>
        ) : (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Documents Plugin</h2>
            <p className="text-muted-foreground">
              DocumentsService initialized successfully.
            </p>
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p><strong>Statistics:</strong></p>
              <ul className="list-disc list-inside">
                <li>Total Files: {stats.totalFiles}</li>
                <li>Total Folders: {stats.totalFolders}</li>
                <li>Total Size: {(stats.totalSize / 1024).toFixed(2)} KB</li>
                <li>Registered Handlers: {stats.fileHandlers}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBrowser;
