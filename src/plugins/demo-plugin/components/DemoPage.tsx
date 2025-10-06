/**
 * Demo Page - Main demo route component
 * Shows plugin system capabilities including data storage and cross-plugin communication
 */

import { Card } from "@/renderer/components/ui/card";
import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Badge } from "@/renderer/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/renderer/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/renderer/components/ui/collapsible";
import { Palette, Zap, Box, Code, Database, Trash2, Plus, HardDrive, Cloud, Users, ChevronDown, Shield, Clock } from "lucide-react";
import { PluginManager } from "../../../shared/plugin-system";
import { useState, useEffect } from "react";
import { isElectron } from "@/utils/platform";
import { STORAGE_KEYS } from "@/shared/constants";

export const DemoPage = () => {
  const pluginManager = PluginManager.getInstance();

  // *** CROSS-PLUGIN DATA ACCESS ***
  // Accessing service from core-theme plugin
  const themeService = pluginManager.getService('core-theme/themeService');

  // *** OWN PLUGIN DATA ***
  // Accessing own service from demo-plugin
  const demoDataService = pluginManager.getService('demo-plugin/dataService');

  // Get settings service to check storage mode
  const settingsService = pluginManager.getService('core-settings/settingsService');
  const storageMode = settingsService?.getStorageMode() || 'unknown';

  const loadedPlugins = pluginManager.getLoadedPlugins();
  const [currentTheme, setCurrentTheme] = useState(themeService?.getCurrentTheme());
  const [notes, setNotes] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showTableView, setShowTableView] = useState(false);
  const [allStorageKeys, setAllStorageKeys] = useState<string[]>([]);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [pluginFilter, setPluginFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // User Management state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserTableView, setShowUserTableView] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Storage Admin state
  const [expandedStorageKeys, setExpandedStorageKeys] = useState<Set<string>>(new Set());

  // Extract unique plugin namespaces from storage keys
  const getPluginNamespaces = () => {
    const namespaces = new Set<string>();
    allStorageKeys.forEach(key => {
      const colonIndex = key.indexOf(':');
      if (colonIndex !== -1) {
        namespaces.add(key.substring(0, colonIndex));
      }
    });
    return Array.from(namespaces).sort();
  };

  // Filter storage keys based on plugin and search query
  const getFilteredKeys = () => {
    let filtered = allStorageKeys;

    // Apply plugin filter
    if (pluginFilter !== 'all') {
      filtered = filtered.filter(key => key.startsWith(pluginFilter + ':'));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(key => {
        const keyMatch = key.toLowerCase().includes(query);
        const valueMatch = JSON.stringify(storageData[key] || '').toLowerCase().includes(query);
        return keyMatch || valueMatch;
      });
    }

    return filtered;
  };

  const filteredKeys = getFilteredKeys();
  const pluginNamespaces = getPluginNamespaces();

  // Load ALL storage data from StorageAdapter (SQLite/PostgreSQL)
  const loadAllStorageData = async () => {
    setLoadingStorage(true);
    try {
      const data: Record<string, any> = {};
      const keys: string[] = [];

      // Load from StorageAdapter (all app data including settings)
      const storage = pluginManager.getStorage();
      if (storage) {
        const storageKeys = await storage.list();
        for (const key of storageKeys) {
          keys.push(key);
          const value = await storage.get(key);
          data[key] = value;
        }
      }

      setAllStorageKeys(keys);
      setStorageData(data);
      console.log('[Admin] Loaded storage:', {
        totalKeys: keys.length,
        data
      });
    } catch (error) {
      console.error('[Admin] Failed to load storage data:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  // Load all storage on mount
  useEffect(() => {
    loadAllStorageData();
  }, []);

  // Load users from Electron API or PostgreSQL API
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      if (isElectron()) {
        // Real data from Electron SQLite
        const userList = await window.electronAPI.user.list();
        setUsers(userList);
        console.log('[Demo] Loaded users from Electron:', userList);
      } else {
        // Real data from PostgreSQL API
        // Extract base API URL (remove /storage suffix if present)
        const storageUrl = import.meta.env.VITE_STORAGE_API_URL || 'https://api.chaycards.com/api/storage';
        const baseApiUrl = storageUrl.replace(/\/storage$/, '');
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (!token) {
          console.error('[Demo] No auth token found - cannot fetch users');
          setUsers([]);
          return;
        }

        console.log('[Demo] Fetching users from:', `${baseApiUrl}/users`);

        const response = await fetch(`${baseApiUrl}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Demo] HTTP ${response.status} error fetching users:`, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        setUsers(data.users || []);
        console.log('[Demo] Loaded users from PostgreSQL:', data.users);
      }
    } catch (error) {
      console.error('[Demo] Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load users on mount (both Electron and Web)
  useEffect(() => {
    loadUsers();
  }, []);

  // Toggle user card expansion
  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Toggle storage key card expansion
  const toggleStorageKeyExpansion = (key: string) => {
    setExpandedStorageKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Get storage keys for a specific user (Electron only - uses user_id from storage)
  // Note: In Electron, storage adapter returns keys for current user only
  // This is a demo approximation - we can't actually filter by user_id in storage
  const getUserStorageKeys = (userId: string) => {
    // Since we can only access current user's storage, return empty for other users
    // In a real multi-user system, you'd query by user_id from storage table
    return allStorageKeys; // Shows current user's keys as example
  };

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

  const addNote = async () => {
    if (demoDataService && noteTitle.trim()) {
      await demoDataService.addNote(noteTitle, noteContent);
      setNotes(demoDataService.getNotes());
      setNoteTitle('');
      setNoteContent('');
    }
  };

  const deleteNote = async (id: string) => {
    if (demoDataService) {
      await demoDataService.deleteNote(id);
      setNotes(demoDataService.getNotes());
    }
  };

  const clearAllNotes = async () => {
    if (demoDataService) {
      await demoDataService.clearAll();
      setNotes([]);
    }
  };

  const resetDatabase = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL data including settings, notes, and preferences. You will need to complete setup again. Are you sure?')) {
      return;
    }

    try {
      const storage = pluginManager.getStorage();
      if (storage) {
        // Get all keys and delete them
        const keys = await storage.list();
        for (const key of keys) {
          await storage.delete(key);
        }
        console.log('[Admin] Database reset complete');

        // Reload data to show empty state
        await loadAllStorageData();

        // Show success message
        alert('✅ Database reset complete! Please refresh the page to see setup screen.');
      }
    } catch (error) {
      console.error('[Admin] Failed to reset database:', error);
      alert('❌ Failed to reset database. Check console for details.');
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

        {/* Storage Backend Indicator */}
        <div className="mb-4 grid md:grid-cols-2 gap-3">
          <div className={`p-3 border rounded-lg ${
            storageMode === 'local' ? 'bg-success/10 border-success/30' : 'bg-muted/30 border-border'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className={`w-4 h-4 ${storageMode === 'local' ? 'text-success' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium text-foreground">SQLite (Local)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {storageMode === 'local' ? '✓ Currently active' : 'Desktop-only storage'}
            </p>
          </div>
          <div className={`p-3 border rounded-lg ${
            storageMode === 'cloud' ? 'bg-info/10 border-info/30' : 'bg-muted/30 border-border'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Cloud className={`w-4 h-4 ${storageMode === 'cloud' ? 'text-info' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium text-foreground">PostgreSQL (Cloud)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {storageMode === 'cloud' ? '✓ Currently active' : 'Web & cloud storage'}
            </p>
          </div>
        </div>

        {/* Database Admin View - Always Visible */}
        <div className="mb-6 p-4 bg-muted/20 border border-border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Database Admin View</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadAllStorageData}
                variant="outline"
                size="sm"
                disabled={loadingStorage}
              >
                {loadingStorage ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                onClick={() => setShowTableView(!showTableView)}
                variant="outline"
                size="sm"
              >
                {showTableView ? 'Card View' : 'Table View'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-3">
            {/* Plugin Filter */}
            <div className="flex-1">
              <Label htmlFor="plugin-filter" className="text-xs text-muted-foreground mb-1 block">
                Filter by plugin
              </Label>
              <select
                id="plugin-filter"
                value={pluginFilter}
                onChange={(e) => setPluginFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All plugins ({allStorageKeys.length} keys)</option>
                {pluginNamespaces.map(namespace => {
                  const count = allStorageKeys.filter(k => k.startsWith(namespace + ':')).length;
                  return (
                    <option key={namespace} value={namespace}>
                      {namespace} ({count} keys)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search-query" className="text-xs text-muted-foreground mb-1 block">
                Search keys/values
              </Label>
              <Input
                id="search-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-9 text-sm"
              />
            </div>

            {/* Clear Filters */}
            {(pluginFilter !== 'all' || searchQuery) && (
              <Button
                onClick={() => {
                  setPluginFilter('all');
                  setSearchQuery('');
                }}
                variant="ghost"
                size="sm"
                className="mt-5"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Results Count */}
          {(pluginFilter !== 'all' || searchQuery) && (
            <p className="text-xs text-muted-foreground mb-3">
              Showing {filteredKeys.length} of {allStorageKeys.length} keys
            </p>
          )}

          {loadingStorage ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Loading storage data...</p>
            </div>
          ) : allStorageKeys.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">No data in storage</p>
              <p className="text-xs text-muted-foreground">This is unusual - settings should be present</p>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">No matching keys found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : showTableView ? (
            /* Table View - Admin Style - Filtered Storage Data */
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Key</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Value (JSON)</TableHead>
                    <TableHead className="font-bold text-right">Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.map((key) => {
                    const value = storageData[key];
                    const valueStr = JSON.stringify(value, null, 2);
                    const valueType = Array.isArray(value) ? 'Array' : typeof value === 'object' ? 'Object' : typeof value;
                    const byteSize = new Blob([valueStr]).size;

                    return (
                      <TableRow key={key} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-medium max-w-xs">
                          {key}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {valueType}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-md">
                          <pre className="whitespace-pre-wrap break-all">{valueStr}</pre>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {byteSize} bytes
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Card View - Collapsible Storage Keys */
            <div className="space-y-2">
              {filteredKeys.map((key) => {
                const value = storageData[key];
                const valueStr = JSON.stringify(value, null, 2);
                const valueType = Array.isArray(value) ? 'Array' : typeof value === 'object' ? 'Object' : typeof value;
                const byteSize = new Blob([valueStr]).size;
                const isExpanded = expandedStorageKeys.has(key);

                return (
                  <Collapsible
                    key={key}
                    open={isExpanded}
                    onOpenChange={() => toggleStorageKeyExpansion(key)}
                  >
                    <div
                      className={`rounded-lg border-2 transition-all ${
                        isExpanded
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-background/50 hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <CollapsibleTrigger className="w-full p-3 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm mb-1 font-mono truncate">{key}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                {valueType}
                              </span>
                              <span className="text-xs text-muted-foreground">{byteSize} bytes</span>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Value (JSON):</p>
                          <pre className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                            {valueStr}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Total: {allStorageKeys.length} key{allStorageKeys.length !== 1 ? 's' : ''} in <span className="font-mono">{storageMode === 'local' ? 'SQLite' : 'PostgreSQL'}</span> database
            </p>
            <Button
              onClick={resetDatabase}
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Reset Database
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          Add notes below. Data persists across page refreshes using browser storage.
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
      </Card>

      {/* User Management Demo */}
      <Card className="p-6 border-2 rounded-2xl bg-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-info" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">User Management</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {isElectron() ? 'Local user profiles from SQLite database' : 'Cloud user profiles from PostgreSQL database'}
              </p>
            </div>
          </div>
          {users.length > 0 && (
            <Button
              onClick={() => setShowUserTableView(!showUserTableView)}
              variant="outline"
              size="sm"
            >
              {showUserTableView ? 'Card View' : 'Table View'}
            </Button>
          )}
        </div>

        {loadingUsers ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">No user profiles found</p>
            <p className="text-xs text-muted-foreground">
              Create a profile from the profile selection screen
            </p>
          </div>
        ) : showUserTableView ? (
          /* Table View - Users */
          <div>
            <div className="border border-border rounded-lg overflow-hidden mb-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Profile Name</TableHead>
                    <TableHead className="font-bold">Storage Mode</TableHead>
                    <TableHead className="font-bold">Protected</TableHead>
                    <TableHead className="font-bold">Plugins</TableHead>
                    <TableHead className="font-bold">Last Used</TableHead>
                    <TableHead className="font-bold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {user.profileName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.storageMode === 'local' ? 'default' : 'secondary'}>
                          {user.storageMode === 'local' ? (
                            <><HardDrive className="w-3 h-3 mr-1 inline" />SQLite</>
                          ) : (
                            <><Cloud className="w-3 h-3 mr-1 inline" />Cloud</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg" title={user.hasPassword ? 'Password protected' : 'No password'}>
                          {user.hasPassword ? '🔒' : '🔓'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {(user.installedPlugins || []).length} installed
                          </Badge>
                          <Badge variant="default" className="text-xs bg-primary">
                            {(user.enabledPlugins || []).length} active
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(user.lastUsedAt * 1000).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt * 1000).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total: {users.length} user profile{users.length !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={loadUsers}
                variant="outline"
                size="sm"
                disabled={loadingUsers}
              >
                {loadingUsers ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        ) : (
          /* Card View - Collapsible Users */
          <div>
            <div className="space-y-2 mb-3">
              {users.map((user) => {
                const isExpanded = expandedUsers.has(user.id);

                return (
                  <Collapsible
                    key={user.id}
                    open={isExpanded}
                    onOpenChange={() => toggleUserExpansion(user.id)}
                  >
                    <div
                      className={`rounded-lg border-2 transition-all ${
                        isExpanded
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-background/50 hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <CollapsibleTrigger className="w-full p-4 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              user.hasPassword ? 'bg-success/10' : 'bg-muted/30'
                            }`}>
                              <Shield className={`w-5 h-5 ${
                                user.hasPassword ? 'text-success' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground text-sm truncate">
                                {user.profileName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {user.id.substring(0, 8)}...
                              </p>
                            </div>
                            <Badge variant={user.storageMode === 'local' ? 'default' : 'secondary'}>
                              {user.storageMode === 'local' ? 'SQLite' : 'Cloud'}
                            </Badge>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/50">
                          {/* Storage Mode */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                              {user.storageMode === 'local' ? (
                                <HardDrive className="w-4 h-4 text-info" />
                              ) : (
                                <Cloud className="w-4 h-4 text-info" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">Storage Mode</p>
                              <p className="text-xs text-muted-foreground">
                                {user.storageMode === 'local' ? 'Local SQLite database' : 'Cloud PostgreSQL database'}
                              </p>
                            </div>
                          </div>

                          {/* Password Protection */}
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              user.hasPassword ? 'bg-success/10' : 'bg-muted/30'
                            }`}>
                              <Shield className={`w-4 h-4 ${
                                user.hasPassword ? 'text-success' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">Security</p>
                              <p className="text-xs text-muted-foreground">
                                {user.hasPassword ? 'Password protected' : 'No password set'}
                              </p>
                            </div>
                          </div>

                          {/* Last Used */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">Last Used</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(user.lastUsedAt * 1000).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Created At */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-tertiary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">Created</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(user.createdAt * 1000).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Full ID */}
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">User ID</p>
                            <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded block break-all">
                              {user.id}
                            </code>
                          </div>

                          {/* Plugin Configuration */}
                          <div className="pt-2 border-t border-border/50">
                            <div className="space-y-3">
                              {/* Installed Plugins */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-foreground">Installed Plugins</p>
                                  <Badge variant="outline" className="text-xs">
                                    {(user.installedPlugins || []).length} owned
                                  </Badge>
                                </div>
                                {(!user.installedPlugins || user.installedPlugins.length === 0) ? (
                                  <p className="text-xs text-muted-foreground">No plugins installed</p>
                                ) : (
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {user.installedPlugins.map((pluginId: string) => (
                                      <div
                                        key={pluginId}
                                        className="p-2 rounded bg-muted/30 border border-border/50"
                                      >
                                        <code className="text-xs font-mono text-muted-foreground">
                                          {pluginId}
                                        </code>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Enabled Plugins */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-foreground">Enabled Plugins</p>
                                  <Badge variant="default" className="text-xs bg-primary">
                                    {(user.enabledPlugins || []).length} active
                                  </Badge>
                                </div>
                                {(!user.enabledPlugins || user.enabledPlugins.length === 0) ? (
                                  <p className="text-xs text-muted-foreground">No plugins enabled</p>
                                ) : (
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {user.enabledPlugins.map((pluginId: string) => (
                                      <div
                                        key={pluginId}
                                        className="p-2 rounded bg-primary/10 border border-primary/30"
                                      >
                                        <code className="text-xs font-mono text-foreground">
                                          {pluginId}
                                        </code>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total: {users.length} user profile{users.length !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={loadUsers}
                variant="outline"
                size="sm"
                disabled={loadingUsers}
              >
                {loadingUsers ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
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
          {loadedPlugins.map((plugin) => {
            const hasServices = pluginManager.getRegisteredServices().some(s => s.startsWith(`${plugin.id}/`));
            const serviceCount = pluginManager.getRegisteredServices().filter(s => s.startsWith(`${plugin.id}/`)).length;
            const componentCount = pluginManager.getRegisteredComponents().filter(c => c.startsWith(`${plugin.id}/`)).length;

            return (
              <div
                key={plugin.id}
                className="p-4 rounded-xl border-2 border-border bg-background/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => {
                  const services = pluginManager.getRegisteredServices().filter(s => s.startsWith(`${plugin.id}/`));
                  const components = pluginManager.getRegisteredComponents().filter(c => c.startsWith(`${plugin.id}/`));

                  console.group(`🔌 Plugin: ${plugin.name}`);
                  console.log('ID:', plugin.id);
                  console.log('Version:', plugin.version);
                  console.log('Description:', plugin.description);
                  console.log('Dependencies:', plugin.requires || 'None');
                  console.log('\n📦 Services:', services.length > 0 ? services : 'None');
                  services.forEach(serviceName => {
                    const service = pluginManager.getService(serviceName);
                    console.log(`  - ${serviceName}:`, service);
                  });
                  console.log('\n🎨 Components:', components.length > 0 ? components : 'None');
                  console.log('\n📍 Routes:', plugin.routes?.length || 0);
                  if (plugin.routes) {
                    plugin.routes.forEach(route => {
                      console.log(`  - ${route.path} (${route.label})`);
                    });
                  }
                  console.groupEnd();
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{plugin.name}</h3>
                  {hasServices && (
                    <div className="flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded">
                      <Database className="w-3 h-3" />
                      <span>{serviceCount}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{plugin.id}</span>
                  <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                  <span className="text-xs text-muted-foreground">{componentCount} components</span>
                </div>
                <div className="mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to inspect in console →
                </div>
              </div>
            );
          })}
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