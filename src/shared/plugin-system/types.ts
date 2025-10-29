/**
 * Plugin System Type Definitions
 * Core interfaces for ChayCards plugin architecture
 */

import { ComponentType } from 'react';

export interface Plugin {
  id: string;              // Unique identifier (e.g., 'core.theme')
  name: string;            // Display name
  version: string;         // Semantic version
  description?: string;    // What this plugin does
  author?: string;         // Plugin author

  // Public page compatibility
  publicSafe?: boolean;    // Can run on public pages without user storage (default: false)

  // Dependencies
  requires?: string[];     // Array of plugin IDs this depends on

  // What this plugin provides
  components?: Record<string, ComponentType<any>>;
  routes?: Route[];
  services?: Record<string, any>;

  // Navigation routes for Documents integration
  // Maps component names to route builder functions for standalone mode
  // Used by useNavigation hook to convert component navigation to URLs
  navigationRoutes?: Record<string, (props: Record<string, any>) => string>;

  // Storage schemas (for future use)
  schemas?: Record<string, SchemaDefinition>;
  migrations?: Migration[];

  // Backend configuration (optional)
  backend?: {
    python?: {
      entry: string;        // 'backend/main.py'
      requirements: string; // 'backend/requirements.txt'
    };
  };

  // Lifecycle hooks
  onLoad?: (manager: PluginManager) => void | Promise<void>;
  onPluginsReady?: (manager: PluginManager) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}

export interface Route {
  path: string;
  component: ComponentType<any> | string; // Component or component name
  label?: string;
  icon?: string;
  showInNav?: boolean;
  order?: number;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  order?: number;
}

export interface RegionComponent {
  id: string;
  component: ComponentType<any> | string;
  order?: number;
  props?: Record<string, any>;
}

export interface SchemaDefinition {
  [field: string]: string; // Field type definitions
}

export interface Migration {
  version: number;
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}

/**
 * User-specific plugin preferences for multi-tenant deployments.
 * Stored in user storage at 'core-settings:enabled-plugins'
 */
export interface UserPluginPreferences {
  /** Array of plugin IDs that are enabled for this user */
  enabledPlugins: string[];
  /** Timestamp of last update (for sync purposes) */
  updatedAt: number;
}

// EventBus interface
export interface EventBus {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  once(event: string, handler: (data: any) => void): void;
}

/**
 * FileHandler interface for plugin extensibility
 * Plugins register handlers to provide viewers/editors for specific file types
 */
export interface FileHandler {
  id: string;
  pluginId: string;
  name: string;
  icon: { type: 'emoji' | 'lucide'; emoji?: string; lucide?: string };
  extensions: string[];
  mimeTypes: string[];
  viewerComponent: string; // Namespaced component name
  editorComponent?: string;
  settingsComponent?: string;
  priority: number;
  canHandle?: (file: any) => boolean;

  // Bidirectional sync callbacks (optional)
  onFileUpdated?: (fileId: string, updates: Partial<any>) => Promise<void>;
  onFileDeleted?: (fileId: string) => Promise<void>;
  onFileMoved?: (fileId: string, oldFolderId: string | null, newFolderId: string | null) => Promise<void>;
  onFileRenamed?: (fileId: string, oldName: string, newName: string) => Promise<void>;
}

// PluginManager interface
export interface PluginManager {
  // Component management
  getComponent(name: string): ComponentType<any> | undefined;
  setComponent(name: string, component: ComponentType<any>): void;

  // Service management
  getService(name: string): any;
  setService(name: string, service: any): void;

  // Route management
  addRoute(route: Route): void;
  getAllRoutes(): Route[];

  // Navigation management
  addNavigationItem(item: NavigationItem): void;
  getNavigationItems(): NavigationItem[];

  // Region management for AppShell
  addToRegion(region: string, component: RegionComponent): void;
  getRegionComponents(region: string): RegionComponent[];

  // Plugin retrieval
  getPlugin(pluginId: string): Plugin | undefined;

  // Event bus access
  getEventBus(): EventBus;

  // Storage access
  getStorage(): any; // StorageAdapter | null

  // Plugin loading
  loadPlugin(plugin: Plugin): Promise<void>;
  loadAllPlugins(): Promise<void>;
}