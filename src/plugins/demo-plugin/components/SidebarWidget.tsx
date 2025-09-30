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
      className="p-4 rounded-xl border-2 border-border"
      style={{
        background: 'hsl(var(--card))',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm text-foreground">System Stats</h3>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Components:</span>
          <span className="font-mono font-medium text-foreground">{componentCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Services:</span>
          <span className="font-mono font-medium text-foreground">{serviceCount}</span>
        </div>
      </div>
    </div>
  );
};