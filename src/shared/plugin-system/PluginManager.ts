/**
 * PluginManager - Core plugin system management
 * Handles plugin loading, dependency resolution, and service/component registry
 */

import { ComponentType } from 'react';
import semver from 'semver';
import type {
  Plugin,
  Route,
  NavigationItem,
  RegionComponent,
  PluginManager as IPluginManager,
  UserPluginPreferences
} from './types';
import { EventBus } from './EventBus';
import { getStorageManager } from '../storage/StorageManager';
import { isPublicPage } from '@/utils/routeUtils';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { CORE_PLUGINS, isCorePlugin, buildPluginStorageKey, STORAGE_KEYS } from '../constants';
import { isWeb } from '@/utils/platform';

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

  // Wave-based parallel loading state
  private failedPlugins = new Set<string>();       // Track failed plugin IDs
  private waveTimings = new Map<number, number>(); // Wave index → load time (ms)

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
    // Check for collision
    if (this.components.has(name)) {
      console.error(
        `🚨 COMPONENT COLLISION: '${name}' is already registered!\n` +
        `This indicates a duplicate plugin ID or namespace conflict.\n` +
        `The previous component will be overwritten.`
      );
      if (import.meta.env.DEV) {
        console.trace('Component collision stack trace:');
      }
    }

    this.components.set(name, component);
    this.eventBus.emit('component:registered', { name, component });
  }

  // Service management
  getService(name: string): any {
    return this.services.get(name);
  }

  setService(name: string, service: any): void {
    // Check for collision
    if (this.services.has(name)) {
      console.error(
        `🚨 SERVICE COLLISION: '${name}' is already registered!\n` +
        `This indicates a duplicate plugin ID or namespace conflict.\n` +
        `The previous service will be overwritten.`
      );
      if (import.meta.env.DEV) {
        console.trace('Service collision stack trace:');
      }
    }

    this.services.set(name, service);
    this.eventBus.emit('service:registered', { name, service });
  }

  /**
   * Find services matching a pattern (regex or string).
   * Returns array of service info including full name, plugin ID, and service name.
   */
  findServices(pattern: string | RegExp): Array<{
    fullName: string;
    pluginId: string;
    serviceName: string;
  }> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const results: Array<{ fullName: string; pluginId: string; serviceName: string }> = [];

    for (const [fullName, _] of this.services) {
      if (regex.test(fullName)) {
        // Split pluginId/serviceName (handle author/plugin/serviceName format)
        const parts = fullName.split('/');
        if (parts.length >= 2) {
          // For 'author/plugin/service' format
          const pluginId = parts.length === 3 ? `${parts[0]}/${parts[1]}` : parts[0];
          const serviceName = parts.length === 3 ? parts[2] : parts[1];
          results.push({ fullName, pluginId, serviceName });
        }
      }
    }

    return results;
  }

  /**
   * Check if a specific service exists for a plugin.
   */
  hasService(pluginId: string, serviceName: string): boolean {
    return this.services.has(`${pluginId}/${serviceName}`);
  }

  /**
   * Get all services registered by a specific plugin.
   * Returns object mapping service names to service instances.
   */
  getPluginServices(pluginId: string): Record<string, any> {
    const services: Record<string, any> = {};

    for (const [fullName, service] of this.services) {
      if (fullName.startsWith(`${pluginId}/`)) {
        const serviceName = fullName.substring(pluginId.length + 1);
        services[serviceName] = service;
      }
    }

    return services;
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

  // Plugin retrieval - access loaded plugin metadata
  getPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  // Event bus access
  getEventBus(): EventBus {
    return this.eventBus;
  }

  // Storage access (returns null on public pages or if not initialized)
  getStorage(): StorageAdapter | null {
    // Check if we're on a public page - no storage needed
    if (isPublicPage()) {
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
    const settingsService = this.getService('chaycards/core-settings/settingsService');
    if (!settingsService) {
      throw new Error('SettingsService not found. core-settings plugin must load first.');
    }

    // Check if we're on a public page - if so, skip storage initialization entirely
    // Public pages don't need user data (local or cloud)
    if (isPublicPage()) {
      console.log('[PluginManager] On public page - skipping storage initialization (no user data needed)');
      return;
    }

    // Determine storage mode from platform (no user choice - automatic)
    // Web → always cloud (PostgreSQL via API)
    // Electron → always local (SQLite via IPC)
    const storageMode = isWeb() ? 'cloud' : 'local';

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

  /**
   * Get user's plugin preferences from users table.
   * Returns default (all discovered plugins enabled) if no preferences stored.
   * Core plugins are ALWAYS enabled regardless of user preferences.
   */
  private async getUserPluginPreferences(discoveredPlugins: Plugin[]): Promise<UserPluginPreferences> {
    // If storage not available (public page or not initialized), return all plugins enabled
    if (!this.storageInitialized) {
      return {
        enabledPlugins: discoveredPlugins.map(p => p.id),
        updatedAt: Date.now()
      };
    }

    try {
      if (isWeb()) {
        // Web mode: Fetch from PostgreSQL users table via API
        const storageUrl = import.meta.env.VITE_STORAGE_API_URL || 'https://api.chaycards.com/api/storage';
        const baseApiUrl = storageUrl.replace(/\/storage$/, '');
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (!token) {
          console.warn('[PluginManager] No auth token - returning all plugins enabled');
          return {
            enabledPlugins: discoveredPlugins.map(p => p.id),
            updatedAt: Date.now()
          };
        }

        const response = await fetch(`${baseApiUrl}/users/me/plugins`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // User not found - return defaults
            console.warn('[PluginManager] User not found in database - returning all plugins enabled');
            return {
              enabledPlugins: discoveredPlugins.map(p => p.id),
              updatedAt: Date.now()
            };
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[PluginManager] Loaded plugin preferences from users table:', data);

        return {
          enabledPlugins: data.enabledPlugins || [],
          updatedAt: Date.now()
        };
      } else {
        // Electron mode: Fetch from SQLite users table
        const lastProfileId = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID);

        if (!lastProfileId) {
          console.warn('[PluginManager] No active profile - returning all plugins enabled');
          return {
            enabledPlugins: discoveredPlugins.map(p => p.id),
            updatedAt: Date.now()
          };
        }

        const prefs = await window.electronAPI.user.getPluginPreferences(lastProfileId);

        if (!prefs) {
          console.warn('[PluginManager] Profile not found - returning all plugins enabled');
          return {
            enabledPlugins: discoveredPlugins.map(p => p.id),
            updatedAt: Date.now()
          };
        }

        console.log('[PluginManager] Loaded plugin preferences from SQLite:', prefs);
        return {
          enabledPlugins: prefs.enabledPlugins || [],
          updatedAt: Date.now()
        };
      }
    } catch (error) {
      console.error('[PluginManager] Failed to load plugin preferences, using defaults:', error);
      return {
        enabledPlugins: discoveredPlugins.map(p => p.id),
        updatedAt: Date.now()
      };
    }
  }

  /**
   * Reset plugin manager state (for public→authenticated transitions)
   * Clears all loaded plugins, components, services, and routes
   * Should be called when transitioning from public to authenticated pages
   */
  resetPlugins(): void {
    console.log('[PluginManager] Resetting plugin state for authenticated context...');

    // Clear all registries
    this.loadedPlugins.clear();
    this.components.clear();
    this.services.clear();
    this.routes.clear();
    this.navigationItems = [];
    this.regions.clear();

    // Reset storage flag so it reinitializes
    this.storageInitialized = false;
    this.storageAdapter = null;
  }

  /**
   * Filter plugins based on user preferences.
   * Core plugins are ALWAYS included regardless of preferences.
   */
  private filterByUserPreferences(plugins: Plugin[], preferences: UserPluginPreferences): Plugin[] {
    return plugins.filter(plugin => {
      // Core plugins ALWAYS load (cannot be disabled)
      if (isCorePlugin(plugin.id)) {
        return true;
      }

      // Optional plugins: check user preferences
      return preferences.enabledPlugins.includes(plugin.id);
    });
  }

  /**
   * Validate plugin dependencies with version checking.
   * Returns errors (blocks loading) and warnings (logs but continues).
   */
  private async validateDependencies(plugin: Plugin): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle OLD format (requires array) - for backward compatibility during migration
    if (plugin.requires) {
      for (const depId of plugin.requires) {
        // Check if dependency failed to load
        if (this.failedPlugins.has(depId)) {
          errors.push(
            `Plugin ${plugin.id} requires ${depId}, which failed to load. ` +
            `Cannot proceed with loading ${plugin.id}.`
          );
          continue;
        }

        const dep = this.loadedPlugins.get(depId);
        if (!dep) {
          errors.push(`Missing required plugin: ${depId}`);
        }
      }
    }

    // Handle NEW format (dependencies object with version constraints)
    if (plugin.dependencies) {
      // Check REQUIRES (hard dependencies - blocks loading)
      if (plugin.dependencies.requires) {
        for (const [depId, versionRange] of Object.entries(plugin.dependencies.requires)) {
          // Check if dependency failed to load
          if (this.failedPlugins.has(depId)) {
            errors.push(
              `Plugin ${plugin.id} requires ${depId}, which failed to load. ` +
              `Cannot proceed with loading ${plugin.id}.`
            );
            continue;
          }

          const dep = this.loadedPlugins.get(depId);

          if (!dep) {
            errors.push(`Missing required plugin: ${depId}`);
          } else if (!semver.satisfies(dep.version, versionRange)) {
            errors.push(
              `Version mismatch: ${plugin.id} requires ${depId}@${versionRange}, ` +
              `but ${dep.version} is installed`
            );
          }
        }
      }

      // Check RECOMMENDS (soft dependencies - warns only, continues loading)
      if (plugin.dependencies.recommends) {
        for (const [depId, versionRange] of Object.entries(plugin.dependencies.recommends)) {
          const dep = this.loadedPlugins.get(depId);

          if (!dep) {
            // Not installed - that's OK for recommended dependencies
            console.log(`📦 ${plugin.id}: Recommended plugin ${depId} not available`);
          } else if (!semver.satisfies(dep.version, versionRange)) {
            // Installed but wrong version - warn
            warnings.push(
              `⚠️ ${plugin.id} recommends ${depId}@${versionRange}, ` +
              `but ${dep.version} is installed. Some features may not work properly.`
            );
          } else {
            // Perfect match!
            console.log(`✨ ${plugin.id}: Enhanced with ${depId}@${dep.version}`);
          }
        }
      }
    }

    return { errors, warnings };
  }

  // Plugin loading with dependency resolution
  async loadPlugin(plugin: Plugin): Promise<void> {
    // Check if already loaded
    if (this.loadedPlugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already loaded`);
      return;
    }

    // Validate dependencies (both old and new format)
    const { errors, warnings } = await this.validateDependencies(plugin);

    // Errors block loading
    if (errors.length > 0) {
      const errorMessage = `Cannot load plugin ${plugin.id}:\n${errors.join('\n')}`;
      console.error(`[PluginManager] ❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Warnings log but allow loading to continue
    warnings.forEach(warning => {
      console.warn(`[PluginManager] ${warning}`);
    });

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
      // { eager: false } enables HMR for individual plugin changes
      const pluginModules = import.meta.glob('../../plugins/*/index.ts', { eager: false });

      console.log('Discovered plugins:', Object.keys(pluginModules));

      // Enable HMR for plugin modules in development
      if (import.meta.hot) {
        import.meta.hot.accept(Object.keys(pluginModules), async (newModules) => {
          console.log('[HMR] Plugin modules updated, reloading...');
          // Reload all plugins to pick up changes
          await this.reloadAllPlugins();
        });
      }

      // Load all plugin modules
      const discoveredPlugins: Plugin[] = [];
      for (const [path, importFn] of Object.entries(pluginModules)) {
        try {
          const module = await importFn() as { default: Plugin };
          if (module.default) {
            discoveredPlugins.push(module.default);
          } else {
            console.warn(`Plugin at ${path} has no default export`);
          }
        } catch (error) {
          console.error(`[PluginManager] ❌ CRITICAL: Failed to import plugin from ${path}`);
          console.error(`[PluginManager] This plugin will be skipped and any plugins depending on it will fail.`);
          console.error(`[PluginManager] Error details:`, error);
        }
      }

      console.log(`[PluginManager] Discovered ${discoveredPlugins.length} plugins:`, discoveredPlugins.map(p => p.id));

      // Get user plugin preferences (storage-based filtering)
      // Note: This is called BEFORE storage is initialized, so it will return all plugins enabled by default
      // After storage initializes, subsequent calls will respect user preferences
      const preferences = await this.getUserPluginPreferences(discoveredPlugins);
      console.log(`[PluginManager] User plugin preferences:`, preferences);

      // Filter plugins based on user preferences (core plugins ALWAYS included)
      const plugins = this.filterByUserPreferences(discoveredPlugins, preferences);
      console.log(`[PluginManager] Filtered to ${plugins.length} plugins (${CORE_PLUGINS.length} core + ${plugins.length - CORE_PLUGINS.length} optional):`, plugins.map(p => p.id));

      // Validate all required dependencies were successfully imported
      const pluginIds = new Set(plugins.map(p => p.id));
      const missingDeps: Array<{ plugin: string; missing: string[] }> = [];

      for (const plugin of plugins) {
        if (plugin.requires && plugin.requires.length > 0) {
          const missing = plugin.requires.filter(depId => !pluginIds.has(depId));
          if (missing.length > 0) {
            missingDeps.push({ plugin: plugin.id, missing });
          }
        }
      }

      if (missingDeps.length > 0) {
        console.error('[PluginManager] Dependency validation failed:');
        missingDeps.forEach(({ plugin, missing }) => {
          console.error(`  - ${plugin} requires: [${missing.join(', ')}]`);
        });
        throw new Error(
          `Cannot load plugins due to missing dependencies. ` +
          `${missingDeps.length} plugin(s) have unmet requirements. ` +
          `Check console for import errors.`
        );
      }

      // Compute loading waves for parallel loading
      const totalStartTime = performance.now();
      const waves = this.computeLoadingWaves(plugins);
      console.log(`[PluginManager] Loading ${waves.length} waves:`,
                  waves.map((w, i) => `Wave ${i}: [${w.map(p => p.id).join(', ')}]`));

      // Load Wave 0 (core-settings special case)
      if (waves[0].length !== 1 || waves[0][0].id !== 'chaycards/core-settings') {
        throw new Error('Wave 0 must contain only chaycards/core-settings plugin');
      }

      const wave0StartTime = performance.now();
      await this.loadPlugin(waves[0][0]);
      const wave0EndTime = performance.now();
      console.log(`[PluginManager] Wave 0 complete (${(wave0EndTime - wave0StartTime).toFixed(2)}ms)`);

      // Initialize storage (synchronization point between Wave 0 and Wave 1)
      const storageStartTime = performance.now();
      await this.initializeStorage();
      const storageEndTime = performance.now();
      console.log(`[PluginManager] Storage initialized (${(storageEndTime - storageStartTime).toFixed(2)}ms)`);

      // Load remaining waves in parallel
      const allFailedPlugins: string[] = [];

      for (let i = 1; i < waves.length; i++) {
        const wave = waves[i];
        console.log(`[PluginManager] Loading Wave ${i}: [${wave.map(p => p.id).join(', ')}]`);

        const waveStartTime = performance.now();
        const failedInWave = await this.loadWave(wave);
        const waveEndTime = performance.now();

        allFailedPlugins.push(...failedInWave);

        const waveDuration = waveEndTime - waveStartTime;
        this.waveTimings.set(i, waveDuration);

        console.log(`[PluginManager] Wave ${i} complete (${waveDuration.toFixed(2)}ms)`);

        if (failedInWave.length > 0) {
          console.warn(`[PluginManager] Wave ${i} had ${failedInWave.length} failures:`, failedInWave);
        }
      }

      // Report results
      const totalEndTime = performance.now();
      const totalDuration = totalEndTime - totalStartTime;

      const successCount = plugins.length - allFailedPlugins.length;
      console.log(`[PluginManager] ✅ Loaded ${successCount}/${plugins.length} plugins in ${totalDuration.toFixed(2)}ms`);

      if (allFailedPlugins.length > 0) {
        console.warn(`[PluginManager] ❌ Failed plugins (${allFailedPlugins.length}):`, allFailedPlugins);
      }

      // Log wave timing breakdown
      console.log(`[PluginManager] Wave breakdown:`,
                  Array.from(this.waveTimings.entries())
                       .map(([wave, time]) => `Wave ${wave}: ${time.toFixed(2)}ms`).join(', '));

      this.eventBus.emit('plugins:all-loaded', { count: successCount });

      // Call onPluginsReady hooks after all plugins loaded
      for (const plugin of plugins) {
        // Skip failed plugins
        if (this.failedPlugins.has(plugin.id)) {
          continue;
        }

        if (plugin.onPluginsReady) {
          try {
            await plugin.onPluginsReady(this);
          } catch (error) {
            console.error(`[PluginManager] onPluginsReady failed for ${plugin.id}:`, error);
          }
        }
      }

      // Apply localStorage theme after all theme plugins have loaded
      const themeService = this.getService('chaycards/core-theme/themeService');
      if (themeService) {
        await themeService.applyLocalStorageTheme();
      }

    } catch (error) {
      console.error('Failed to load plugins:', error);
      throw error;
    }
  }

  // Load only public-safe plugins (for anonymous users on public pages)
  async loadPublicSafePlugins(): Promise<void> {
    try {
      console.log('[PluginManager] Loading public-safe plugins for anonymous user...');

      // Use Vite's glob import to discover all plugins
      const pluginModules = import.meta.glob('../../plugins/*/index.ts', { eager: false });

      // Load and filter for publicSafe plugins
      const plugins: Plugin[] = [];
      for (const [path, importFn] of Object.entries(pluginModules)) {
        try {
          const module = await importFn() as { default: Plugin };
          if (module.default?.publicSafe) {
            plugins.push(module.default);
            console.log(`[PluginManager] Discovered public-safe plugin: ${module.default.id}`);
          }
        } catch (error) {
          console.error(`Failed to import plugin from ${path}:`, error);
        }
      }

      // Sort by dependencies to ensure correct load order
      const sortedPlugins = this.sortPluginsByDependencies(plugins);

      // Load plugins in dependency order
      for (const plugin of sortedPlugins) {
        await this.loadPlugin(plugin);
      }

      console.log(`[PluginManager] Loaded ${sortedPlugins.length} public-safe plugins successfully`);

      // Call onPluginsReady hooks after all plugins loaded
      console.log('[PluginManager] Calling onPluginsReady hooks...');
      for (const plugin of sortedPlugins) {
        if (plugin.onPluginsReady) {
          try {
            await plugin.onPluginsReady(this);
            console.log(`[PluginManager] onPluginsReady called for ${plugin.id}`);
          } catch (error) {
            console.error(`[PluginManager] onPluginsReady failed for ${plugin.id}:`, error);
          }
        }
      }

      // Apply localStorage theme after all theme plugins have loaded
      const themeService = this.getService('chaycards/core-theme/themeService');
      if (themeService) {
        console.log('[PluginManager] Applying localStorage theme after all plugins loaded...');
        await themeService.applyLocalStorageTheme();
        console.log('[PluginManager] Available themes:', await themeService.getAvailableThemes());
        console.log('[PluginManager] Current theme:', themeService.getCurrentTheme());
      }

      this.eventBus.emit('plugins:public-safe-loaded', { count: sortedPlugins.length });

    } catch (error) {
      console.error('Failed to load public-safe plugins:', error);
      throw error;
    }
  }

  // Reload all plugins (used for HMR)
  private async reloadAllPlugins(): Promise<void> {
    console.log('[HMR] Reloading all plugins...');

    // Get current plugin IDs to reload
    const pluginIds = Array.from(this.loadedPlugins.keys());

    // Unload all plugins (in reverse dependency order)
    for (const pluginId of pluginIds.reverse()) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`[HMR] Failed to unload plugin ${pluginId}:`, error);
      }
    }

    // Clear registries to prevent stale references
    this.components.clear();
    this.services.clear();
    this.routes.clear();
    this.navigationItems = [];
    this.regions.clear();

    // Re-import plugin modules (fresh from disk)
    const pluginModules = import.meta.glob('../../plugins/*/index.ts', { eager: false });
    const plugins: Plugin[] = [];

    for (const [path, importFn] of Object.entries(pluginModules)) {
      try {
        const module = await importFn() as { default: Plugin };
        if (module.default) {
          plugins.push(module.default);
        }
      } catch (error) {
        console.error(`[HMR] Failed to re-import plugin from ${path}:`, error);
      }
    }

    // Sort and reload
    const sortedPlugins = this.sortPluginsByDependencies(plugins);

    // Load core-settings first
    const coreSettings = sortedPlugins.find(p => p.id === 'chaycards/core-settings');
    if (coreSettings) {
      await this.loadPlugin(coreSettings);

      // Re-initialize storage if needed
      if (!this.storageInitialized) {
        await this.initializeStorage();
      }
    }

    // Load remaining plugins
    for (const plugin of sortedPlugins) {
      if (plugin.id !== 'chaycards/core-settings') {
        await this.loadPlugin(plugin);
      }
    }

    console.log('[HMR] Plugins reloaded successfully');
    this.eventBus.emit('plugins:reloaded');
  }

  // Unload a plugin (for testing or dynamic plugin management)
  async unloadPlugin(pluginId: string): Promise<void> {
    console.trace(`[PluginManager] 🔥 UNLOAD CALLED FOR: ${pluginId}`);
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

      // Remove plugin's routes
      const routesToRemove: string[] = [];
      this.routes.forEach((route, path) => {
        if (route.component?.startsWith(`${pluginId}/`)) {
          routesToRemove.push(path);
        }
      });
      routesToRemove.forEach(path => this.routes.delete(path));

      // Remove plugin's navigation items
      this.navigationItems = this.navigationItems.filter(
        item => !routesToRemove.includes(item.path)
      );

      // Remove plugin's region components
      this.regions.forEach((components, region) => {
        this.regions.set(
          region,
          components.filter(comp => {
            // Check the component namespace (the actual registered component name)
            const componentName = typeof comp.component === 'string' ? comp.component : comp.id;
            return !componentName.startsWith(`${pluginId}/`);
          })
        );
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
  public sortPluginsByDependencies(plugins: Plugin[]): Plugin[] {
    // Helper: Get all dependency IDs (supports both old and new formats)
    const getDependencyIds = (plugin: Plugin): string[] => {
      const deps: string[] = [];

      // Old format: requires array
      if (plugin.requires && plugin.requires.length > 0) {
        deps.push(...plugin.requires);
      }

      // New format: dependencies.requires object
      if (plugin.dependencies?.requires) {
        deps.push(...Object.keys(plugin.dependencies.requires));
      }

      return deps;
    };

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

      // Visit dependencies first (both old and new formats)
      const depIds = getDependencyIds(plugin);
      for (const depId of depIds) {
        const dep = plugins.find(p => p.id === depId);
        if (dep) {
          visit(dep);
        } else {
          console.warn(`Plugin ${plugin.id} requires ${depId}, but it's not found`);
        }
      }

      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };

    plugins.forEach(visit);
    return sorted;
  }

  /**
   * Compute loading waves for parallel plugin loading.
   * Plugins in the same wave can load concurrently.
   *
   * Wave 0: core-settings (special case - must load before storage init)
   * Wave N: Plugins whose dependencies all loaded in Wave N-1 or earlier
   *
   * @param plugins - Plugins to group into waves
   * @returns Array of waves, each wave is array of plugins that can load in parallel
   */
  private computeLoadingWaves(plugins: Plugin[]): Plugin[][] {
    // Helper: Get all dependency IDs (supports both old and new formats)
    const getDependencyIds = (plugin: Plugin): string[] => {
      const deps: string[] = [];

      // Old format: requires array
      if (plugin.requires && plugin.requires.length > 0) {
        deps.push(...plugin.requires);
      }

      // New format: dependencies.requires object
      if (plugin.dependencies?.requires) {
        deps.push(...Object.keys(plugin.dependencies.requires));
      }

      return deps;
    };

    // Use existing topological sort (guarantees dependency order)
    const sorted = this.sortPluginsByDependencies(plugins);

    // Build dependency depth map (how many "hops" from zero-dependency plugins)
    const depthMap = new Map<string, number>();

    for (const plugin of sorted) {
      if (plugin.id === 'chaycards/core-settings') {
        // Special case: core-settings is Wave 0 (must load before storage init)
        depthMap.set(plugin.id, 0);
      } else {
        const depIds = getDependencyIds(plugin);

        if (depIds.length === 0) {
          // Zero dependencies = Wave 1 (after storage init)
          depthMap.set(plugin.id, 1);
        } else {
          // Depth = max(dependency depths) + 1
          const maxDepDepth = Math.max(
            ...depIds.map(depId => depthMap.get(depId) ?? 0)
          );
          depthMap.set(plugin.id, maxDepDepth + 1);
        }
      }
    }

    // Group plugins by depth (wave index)
    const maxDepth = Math.max(...Array.from(depthMap.values()));
    const waves: Plugin[][] = [];

    for (let depth = 0; depth <= maxDepth; depth++) {
      const wavePlugins = sorted.filter(p => depthMap.get(p.id) === depth);
      if (wavePlugins.length > 0) {
        waves.push(wavePlugins);
      }
    }

    return waves;
  }

  /**
   * Load all plugins in a wave concurrently.
   * Uses Promise.allSettled to prevent one failure from blocking others.
   *
   * @param wave - Array of plugins to load in parallel
   * @returns Array of failed plugin IDs
   */
  private async loadWave(wave: Plugin[]): Promise<string[]> {
    const failedInWave: string[] = [];

    // Load all plugins in wave concurrently
    const results = await Promise.allSettled(
      wave.map(plugin => this.loadPlugin(plugin))
    );

    // Track failures
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        const pluginId = wave[idx].id;
        console.error(`[PluginManager] Plugin ${pluginId} failed to load:`, result.reason);

        // Mark as failed so dependents skip
        this.failedPlugins.add(pluginId);
        failedInWave.push(pluginId);
      }
    });

    return failedInWave;
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