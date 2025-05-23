# Plugin System Implementation

This directory contains the core plugin system for ChayCards.

## Overview

The plugin system allows developers to extend, modify, or replace any part of ChayCards - including UI components, services, and data models. It follows a simple, game-modding inspired approach where everything is public and replaceable.

## Key Components

- **PluginRegistry**: Central registry managing all plugins, components, and services
- **PluginLoader**: Handles loading plugins in dependency order
- **PluginManager**: High-level API for plugin operations
- **Plugin Types**: TypeScript interfaces and types

## Architecture

Plugins can:
- Replace or wrap any UI component
- Extend or replace any service
- Add new routes and pages
- Modify data models
- Communicate via shared registry

## Documentation

For complete documentation, see: `/memory-bank/docs/PLUGIN_SYSTEM.md`

## Quick Example

```typescript
const MyPlugin: Plugin = {
  id: 'my-plugin',
  requires: ['core.documents'],
  
  onLoad: (registry) => {
    // Get original component
    const Original = registry.getComponent('DocumentCard');
    
    // Enhance it
    const Enhanced = (props) => (
      <>
        <MyFeature />
        <Original {...props} />
      </>
    );
    
    // Replace in registry
    registry.setComponent('DocumentCard', Enhanced);
  }
};
```