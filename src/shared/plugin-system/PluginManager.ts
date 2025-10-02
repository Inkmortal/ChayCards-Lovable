/**
 * PluginManager - Core plugin system management
 * Handles plugin loading, dependency resolution, and service/component registry
 */

import { ComponentType } from 'react';
import type {
  Plugin,
  Route,
  NavigationItem,
  RegionComponent,
  PluginManager as IPluginManager
} from './types';
import { EventBus } from './EventBus';
import { getStorageManager } from '../storage/StorageManager';
import type { StorageAdapter } from '../storage/StorageAdapter';

export class PluginManager implements IPluginManager {
  private static instance: PluginManager;

  // Storage - simple Maps, no separate Registry needed
  private components = new Map<string, ComponentType<any>>();
  private services = new Map<string, any>();
  private routes = new Map<string, Route>();

  // Plugin management
  private loadedPlugins = new Map<string, Plugin>();
  private eventBus = new EventBus();

  // UI management
  private navigationItems: NavigationItem[] = [];
  private regions = new Map<string, RegionComponent[]>();

  // Storage system
  private storageManager = getStorageManager();
  private storageInitialized = false;

  // Singleton access
  static getInstance(): PluginManager {
    if (!this.instance) {
      this.instance = new PluginManager();
    }
    return this.instance;
  }

  // Component management
  getComponent(name: string): ComponentType<any> | undefined {
    return this.components.get(name);
  }

  setComponent(name: string, component: ComponentType<any>): void {
    this.components.set(name, component);
    this.eventBus.emit('component:registered', { name, component });
  }

  // Service management
  getService(name: string): any {
    return this.services.get(name);
  }

  setService(name: string, service: any): void {
    this.services.set(name, service);
    this.eventBus.emit('service:registered', { name, service });
  }

  // Route management
  addRoute(route: Route): void {
    this.routes.set(route.path, route);
  }

  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  // Navigation management
  addNavigationItem(item: NavigationItem): void {
    this.navigationItems.push(item);
    this.sortNavigationItems();
  }

  getNavigationItems(): NavigationItem[] {
    return [...this.navigationItems];
  }

  // Region management for AppShell
  addToRegion(region: string, component: RegionComponent): void {
    if (!this.regions.has(region)) {
      this.regions.set(region, []);
    }
    this.regions.get(region)!.push(component);
    this.sortRegionComponents(region);
  }

  getRegionComponents(region: string): RegionComponent[] {
    return this.regions.get(region) || [];
  }

  // Event bus access
  getEventBus(): EventBus {
    return this.eventBus;
  }

  // Storage access (returns null on public pages or if not initialized)
  getStorage(): StorageAdapter | null {
    // Check if we're on a public page - no storage needed
    const isPublicPage = ['/', '/login', '/register', '/setup'].some(path =>
      window.location.pathname === path || window.location.pathname.startsWith(path + '/')
    );

    if (isPublicPage) {
      return null; // Public pages don't need storage
    }

    if (!this.storageInitialized) {
      console.warn('[PluginManager] Storage not initialized - returning null');
      return null;
    }

    return this.storageManager.getAdapter();
  }

  // Initialize storage (called after core-settings loads)
  async initializeStorage(): Promise<void> {
    const settingsService = this.getService('core-settings/settingsService');
    if (!settingsService) {
      throw new Error('SettingsService not found. core-settings plugin must load first.');
    }

    const storageMode = settingsService.getStorageMode();

    // Check if we're on a public page - if so, skip storage initialization entirely
    // Public pages don't need user data (local or cloud)
    const isPublicPage = ['/', '/login', '/register', '/setup'].some(path =>
      window.location.pathname === path || window.location.pathname.startsWith(path + '/')
    );

    if (isPublicPage) {
      console.log('[PluginManager] On public page - skipping storage initialization (no user data needed)');
      return;
    }

    await this.storageManager.initialize(storageMode);
    this.storageInitialized = true;

    // Pass storage adapter to SettingsService so it can load from proper storage
    const storage = this.storageManager.getAdapter();
    await settingsService.setStorage(storage);

    console.log('[PluginManager] Storage initialized with mode:', storageMode);
    this.eventBus.emit('storage:ready', { storageMode });
  }

  // Check if storage is ready
  isStorageReady(): boolean {
    return this.storageInitialized;
  }

  // Plugin loading with dependency resolution
  async loadPlugin(plugin: Plugin): Promise<void> {
    // Check if already loaded
    if (this.loadedPlugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already loaded`);
      return;
    }

    // Load dependencies first
    if (plugin.requires) {
      for (const depId of plugin.requires) {
        const dep = this.loadedPlugins.get(depId);
        if (!dep) {
          throw new Error(`Plugin ${plugin.id} requires ${depId}, but it's not loaded`);
        }
      }
    }

    try {
      // Register components with namespace
      if (plugin.components) {
        Object.entries(plugin.components).forEach(([name, component]) => {
          const namespacedName = `${plugin.id}/${name}`;
          this.setComponent(namespacedName, component);
        });
      }

      // Register services with namespace
      if (plugin.services) {
        Object.entries(plugin.services).forEach(([name, service]) => {
          const namespacedName = `${plugin.id}/${name}`;
          this.setService(namespacedName, service);
        });
      }

      // Register routes and navigation
      if (plugin.routes) {
        plugin.routes.forEach(route => {
          this.addRoute(route);
          if (route.showInNav) {
            this.addNavigationItem({
              path: route.path,
              label: route.label || route.path,
              icon: route.icon,
              order: route.order || 50
            });
          }
        });
      }

      // Call plugin's onLoad hook
      if (plugin.onLoad) {
        await plugin.onLoad(this);
      }

      // Mark as loaded
      this.loadedPlugins.set(plugin.id, plugin);

      console.log(`Plugin ${plugin.id} loaded successfully`);
      this.eventBus.emit('plugin:loaded', { plugin });

    } catch (error) {
      console.error(`Failed to load plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  // Load all plugins using Vite glob imports
  async loadAllPlugins(): Promise<void> {
    try {
      // Use Vite's glob import to discover plugins
      const pluginModules = import.meta.glob('../../plugins/*/index.ts');

      console.log('Discovered plugins:', Object.keys(pluginModules));

      // Load all plugin modules
      const plugins: Plugin[] = [];
      for (const [path, importFn] of Object.entries(pluginModules)) {
        try {
          const module = await importFn() as { default: Plugin };
          if (module.default) {
            plugins.push(module.default);
          } else {
            console.warn(`Plugin at ${path} has no default export`);
          }
        } catch (error) {
          console.error(`Failed to import plugin from ${path}:`, error);
        }
      }

      // Sort plugins by dependency order and load them
      const sortedPlugins = this.sortPluginsByDependencies(plugins);

      // Load core-settings first
      const coreSettings = sortedPlugins.find(p => p.id === 'core-settings');
      if (coreSettings) {
        await this.loadPlugin(coreSettings);

        // Initialize storage after core-settings loads but before other plugins
        await this.initializeStorage();
        console.log('Storage initialized after core-settings');
      }

      // Load remaining plugins
      for (const plugin of sortedPlugins) {
        if (plugin.id !== 'core-settings') {
          await this.loadPlugin(plugin);
        }
      }

      console.log(`Loaded ${sortedPlugins.length} plugins successfully`);
      this.eventBus.emit('plugins:all-loaded', { count: sortedPlugins.length });

    } catch (error) {
      console.error('Failed to load plugins:', error);
      throw error;
    }
  }

  // Unload a plugin (for testing or dynamic plugin management)
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not loaded`);
      return;
    }

    try {
      // Call plugin's onUnload hook
      if (plugin.onUnload) {
        await plugin.onUnload();
      }

      // Remove plugin's components and services
      this.components.forEach((_, name) => {
        if (name.startsWith(`${pluginId}/`)) {
          this.components.delete(name);
        }
      });

      this.services.forEach((_, name) => {
        if (name.startsWith(`${pluginId}/`)) {
          this.services.delete(name);
        }
      });

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);

      console.log(`Plugin ${pluginId} unloaded successfully`);
      this.eventBus.emit('plugin:unloaded', { pluginId });

    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  // Sort plugins by dependencies (topological sort)
  private sortPluginsByDependencies(plugins: Plugin[]): Plugin[] {
    const sorted: Plugin[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (plugin: Plugin) => {
      if (visiting.has(plugin.id)) {
        throw new Error(`Circular dependency detected involving plugin ${plugin.id}`);
      }

      if (visited.has(plugin.id)) {
        return;
      }

      visiting.add(plugin.id);

      // Visit dependencies first
      if (plugin.requires) {
        for (const depId of plugin.requires) {
          const dep = plugins.find(p => p.id === depId);
          if (dep) {
            visit(dep);
          } else {
            console.warn(`Plugin ${plugin.id} requires ${depId}, but it's not found`);
          }
        }
      }

      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };

    plugins.forEach(visit);
    return sorted;
  }

  private sortNavigationItems(): void {
    this.navigationItems.sort((a, b) => (a.order || 50) - (b.order || 50));
  }

  private sortRegionComponents(region: string): void {
    const components = this.regions.get(region);
    if (components) {
      components.sort((a, b) => (a.order || 50) - (b.order || 50));
    }
  }

  // Debug methods
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getRegisteredComponents(): string[] {
    return Array.from(this.components.keys());
  }

  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}