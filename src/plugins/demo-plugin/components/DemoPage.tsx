/**
 * Demo Page - Main demo route component
 * Shows plugin system capabilities and theme integration
 */

import { Card } from "@/renderer/components/ui/card";
import { Button } from "@/renderer/components/ui/button";
import { Palette, Zap, Box, Code } from "lucide-react";
import { PluginManager } from "../../../shared/plugin-system";

export const DemoPage = () => {
  const pluginManager = PluginManager.getInstance();
  const themeService = pluginManager.getService('core-theme/themeService');
  const loadedPlugins = pluginManager.getLoadedPlugins();

  const handleThemeChange = () => {
    if (themeService) {
      const themes = themeService.getAvailableThemes();
      const currentTheme = themeService.getCurrentTheme();
      const currentIndex = themes.findIndex((t: any) => t.id === currentTheme?.id);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      themeService.setTheme(nextTheme.id);
    }
  };

  const testEventBus = () => {
    const eventBus = pluginManager.getEventBus();
    eventBus.emit('demo:test-event', { message: 'Hello from Demo Plugin!' });
    console.log('Event emitted: demo:test-event');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div
          className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
            boxShadow: 'var(--shadow-3d-chunky)'
          }}
        >
          <Zap className="w-10 h-10" style={{ color: 'hsl(var(--primary-foreground))' }} />
        </div>
        <h1 className="text-5xl font-bold text-foreground">Demo Plugin</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          This plugin demonstrates the ChayCards plugin system capabilities including regions, theming, and component registration.
        </p>
      </div>

      {/* Interactive Demo Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Theme System Demo */}
        <Card className="p-6 border-2 rounded-2xl bg-card/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Theme System</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Current theme: <span className="font-medium text-foreground">{themeService?.getCurrentTheme()?.name || 'Unknown'}</span>
          </p>
          <Button
            onClick={handleThemeChange}
            className="w-full"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
              color: 'hsl(var(--primary-foreground))',
              boxShadow: 'var(--shadow-3d)'
            }}
          >
            Cycle Next Theme
          </Button>
        </Card>

        {/* Event Bus Demo */}
        <Card className="p-6 border-2 rounded-2xl bg-card/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Event Bus</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Test plugin communication via EventBus. Check console for output.
          </p>
          <Button
            onClick={testEventBus}
            variant="outline"
            className="w-full border-2"
          >
            Emit Test Event
          </Button>
        </Card>
      </div>

      {/* Plugin System Info */}
      <Card className="p-6 border-2 rounded-2xl bg-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <Box className="w-6 h-6 text-info" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Loaded Plugins</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {loadedPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="p-4 rounded-xl border border-border bg-background/50"
            >
              <h3 className="font-bold text-foreground mb-1">{plugin.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{plugin.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{plugin.id}</span>
                <span className="text-xs text-muted-foreground">v{plugin.version}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Theme Variables Demo */}
      <Card className="p-6 border-2 rounded-2xl bg-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center">
            <Code className="w-6 h-6 text-tertiary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Semantic Theme Variables</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          All components use semantic CSS variables that adapt to the current theme:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Primary', var: '--primary' },
            { name: 'Secondary', var: '--secondary' },
            { name: 'Tertiary', var: '--tertiary' },
            { name: 'Success', var: '--success' },
            { name: 'Info', var: '--info' },
            { name: 'Warning', var: '--warning' },
            { name: 'Destructive', var: '--destructive' },
            { name: 'Accent', var: '--accent' },
          ].map((color) => (
            <div key={color.var} className="text-center space-y-2">
              <div
                className="w-full h-16 rounded-xl border-2 border-border"
                style={{ background: `hsl(var(${color.var}))` }}
              />
              <p className="text-xs font-medium text-foreground">{color.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};