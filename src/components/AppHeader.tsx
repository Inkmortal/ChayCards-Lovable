
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Upload, ExternalLink } from 'lucide-react';
import { platformService } from '../services/PlatformService';

interface AppHeaderProps {
  onCreateTask: () => void;
  onExport: () => void;
  onImport: () => void;
  taskCount: number;
  completedCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onCreateTask,
  onExport,
  onImport,
  taskCount,
  completedCount
}) => {
  const config = platformService.getConfig();

  const handleLearnMore = () => {
    platformService.openExternal('https://docs.lovable.dev');
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <p className="text-gray-600 mt-1">
              Cross-platform application running on {config.platform}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {config.platform === 'electron' ? 'Desktop App' : 'Web App'}
            </Badge>
            <Badge variant="outline">
              v{config.version}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{taskCount}</span> total tasks
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{completedCount}</span> completed
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{taskCount - completedCount}</span> remaining
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleLearnMore}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
            <Button onClick={onCreateTask}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
