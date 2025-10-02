/**
 * Sidebar Widget - Component for AppShell sidebar region
 * Shows quick stats
 */

import { Activity } from "lucide-react";
import { PluginManager } from "../../../shared/plugin-system";

export const SidebarWidget = () => {
  const pluginManager = PluginManager.getInstance();
  const componentCount = pluginManager.getRegisteredComponents().length;
  const serviceCount = pluginManager.getRegisteredServices().length;

  return (
    <div
      className="p-3 rounded-lg border border-border w-full min-w-0 overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary flex-shrink-0" />
        <h3 className="font-bold text-xs text-foreground break-words">System Stats</h3>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-muted-foreground flex-shrink-0">Components:</span>
          <span className="font-mono font-medium text-foreground flex-shrink-0">{componentCount}</span>
        </div>
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-muted-foreground flex-shrink-0">Services:</span>
          <span className="font-mono font-medium text-foreground flex-shrink-0">{serviceCount}</span>
        </div>
      </div>
    </div>
  );
};