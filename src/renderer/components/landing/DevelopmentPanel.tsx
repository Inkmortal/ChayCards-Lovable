/**
 * DevelopmentPanel - Development routes quick navigation (dev mode only)
 */

import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DevelopmentPanelProps {
  onClose: () => void;
}

export const DevelopmentPanel: React.FC<DevelopmentPanelProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const routes = [
    { path: '/setup?platform=desktop', label: 'Setup Page (Desktop)', description: 'Local/Sync/Cloud options' },
    { path: '/setup?platform=web', label: 'Setup Page (Web)', description: 'Cloud-first with download option' },
    // Future routes for when they're implemented
    { path: '/app', label: 'Main App', description: 'Coming soon - main workspace' },
    { path: '/documents', label: 'Documents', description: 'Coming soon - document management' },
    { path: '/tasks', label: 'Tasks', description: 'Coming soon - task tracking' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">Development Routes</h3>
        <span className="text-xs text-muted-foreground">Lovable Testing</span>
      </div>
      {routes.map((route) => (
        <button
          key={route.path}
          onClick={() => {
            navigate(route.path);
            onClose();
          }}
          className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-foreground group-hover:text-accent-foreground">
                {route.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {route.description}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
          </div>
        </button>
      ))}
      <div className="border-t border-border pt-3 mt-3">
        <div className="text-xs text-muted-foreground text-center">
          Direct page access for prototyping
        </div>
      </div>
    </div>
  );
};
