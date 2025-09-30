/**
 * Demo Page - Main demo route component
 * Shows plugin system capabilities including data storage and cross-plugin communication
 */

import { Card } from "@/renderer/components/ui/card";
import { Button } from "@/renderer/components/ui/button";
import { Palette, Zap, Box, Code, Database, Trash2, Plus } from "lucide-react";
import { PluginManager } from "../../../shared/plugin-system";
import { useState, useEffect } from "react";

export const DemoPage = () => {
  const pluginManager = PluginManager.getInstance();

  // *** CROSS-PLUGIN DATA ACCESS ***
  // Accessing service from core-theme plugin
  const themeService = pluginManager.getService('core-theme/themeService');

  // *** OWN PLUGIN DATA ***
  // Accessing own service from demo-plugin
  const demoDataService = pluginManager.getService('demo-plugin/dataService');

  const loadedPlugins = pluginManager.getLoadedPlugins();
  const [currentTheme, setCurrentTheme] = useState(themeService?.getCurrentTheme());
  const [notes, setNotes] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Subscribe to theme changes
  useEffect(() => {
    if (!themeService) return;

    const unsubscribe = themeService.onThemeChange((theme: any) => {
      setCurrentTheme(theme);
    });

    return unsubscribe;
  }, [themeService]);

  // Load notes from storage
  useEffect(() => {
    if (demoDataService) {
      setNotes(demoDataService.getNotes());
    }
  }, [demoDataService]);

  const handleThemeChange = () => {
    if (themeService) {
      const themes = themeService.getAvailableThemes();
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

  const addNote = () => {
    if (demoDataService && noteTitle.trim()) {
      demoDataService.addNote(noteTitle, noteContent);
      setNotes(demoDataService.getNotes());
      setNoteTitle('');
      setNoteContent('');
    }
  };

  const deleteNote = (id: string) => {
    if (demoDataService) {
      demoDataService.deleteNote(id);
      setNotes(demoDataService.getNotes());
    }
  };

  const clearAllNotes = () => {
    if (demoDataService) {
      demoDataService.clearAll();
      setNotes([]);
    }
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
          Demonstrates plugin system capabilities: data storage, cross-plugin communication, regions, and theming.
        </p>
      </div>

      {/* Interactive Demo Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cross-Plugin Communication Demo */}
        <Card className="p-6 border-2 rounded-2xl bg-card/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">Cross-Plugin Access</h2>
              <p className="text-xs text-muted-foreground mt-1">Reading from core-theme plugin</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Getting service: <span className="font-mono text-xs bg-muted px-1 rounded">core-theme/themeService</span>
            </p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current theme data:</p>
              <p className="font-medium text-foreground">{currentTheme?.name || 'Unknown'}</p>
            </div>
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
          </div>
        </Card>

        {/* Event Bus Demo */}
        <Card className="p-6 border-2 rounded-2xl bg-card/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">Event Bus</h2>
              <p className="text-xs text-muted-foreground mt-1">Plugin-to-plugin messaging</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
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

      {/* Data Storage Demo */}
      <Card className="p-6 border-2 rounded-2xl bg-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">Plugin Data Storage</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Using own service: <span className="font-mono bg-muted px-1 rounded">demo-plugin/dataService</span>
            </p>
          </div>
          {notes.length > 0 && (
            <Button
              onClick={clearAllNotes}
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          Plugins manage their own data via services. This uses localStorage (persists across refreshes).
        </p>

        {/* Add Note Form */}
        <div className="mb-6 space-y-3 p-4 bg-muted/30 rounded-xl">
          <input
            type="text"
            placeholder="Note title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:outline-none"
          />
          <textarea
            placeholder="Note content (optional)"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:outline-none resize-none"
          />
          <Button
            onClick={addNote}
            disabled={!noteTitle.trim()}
            className="w-full"
            style={{
              background: noteTitle.trim()
                ? 'linear-gradient(145deg, hsl(var(--success)), hsl(var(--success) / 0.85))'
                : 'hsl(var(--muted))',
              color: noteTitle.trim() ? 'white' : 'hsl(var(--muted-foreground))',
              boxShadow: noteTitle.trim() ? 'var(--shadow-3d)' : 'none'
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No notes yet. Add one above to test data persistence!
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground mb-3">
              {notes.length} note{notes.length !== 1 ? 's' : ''} stored (persists across refreshes)
            </p>
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl border-2 border-border bg-background/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{note.title}</h3>
                    {note.content && (
                      <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteNote(note.id)}
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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