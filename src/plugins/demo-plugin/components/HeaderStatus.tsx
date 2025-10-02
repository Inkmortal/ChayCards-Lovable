/**
 * Header Status - Component for AppShell header region
 * Shows live plugin status
 */

import { CheckCircle } from "lucide-react";
import { PluginManager } from "../../../shared/plugin-system";

export const HeaderStatus = () => {
  const pluginManager = PluginManager.getInstance();
  const pluginCount = pluginManager.getLoadedPlugins().length;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border"
      style={{
        background: 'hsl(var(--card))',
      }}
    >
      <CheckCircle className="w-4 h-4 text-success" />
      <span className="text-sm font-medium text-foreground">
        {pluginCount} plugins
      </span>
    </div>
  );
};