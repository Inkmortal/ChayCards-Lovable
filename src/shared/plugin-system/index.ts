/**
 * Plugin System Entry Point
 * Exports all plugin system components
 */

export { PluginManager } from './PluginManager';
export { EventBus } from './EventBus';
export type {
  Plugin,
  Route,
  NavigationItem,
  RegionComponent,
  SchemaDefinition,
  Migration,
  EventBus as IEventBus,
  PluginManager as IPluginManager
} from './types';