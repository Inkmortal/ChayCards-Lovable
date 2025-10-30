# Plugin Registry Pattern

**Category:** Plugins
**Type:** Architecture Pattern
**Triggers:** plugin creation, plugin registration, new plugin, plugin system

## Overview

All plugins use centralized registry pattern via PluginManager. Plugins are auto-discovered from `/src/plugins/` directory with namespaced IDs (author/plugin-name format).

## Plugin Structure

```
/src/plugins/
  └── author-name/
      └── plugin-name/
          ├── index.ts           # Plugin entry point
          ├── CLAUDE.md          # Plugin documentation
          ├── components/        # React components
          ├── services/          # Business logic
          └── types.ts           # TypeScript types
```

## Registration

```typescript
// PluginManager.ts:89
export function registerPlugin(plugin: Plugin) {
  // Auto-discovery via directory structure
  // ID format: "author/plugin-name"
}
```

## Key Implementation Points

**PluginManager.ts:89** - Core registry
**plugin-system/PluginManager.ts** - Service locator pattern
**plugins/core-*/index.ts** - Core plugin examples

## Naming Convention

- Plugin IDs: `author/plugin-name` (e.g., "chaycards/core-flashcards")
- Directory structure matches namespace
- CLAUDE.md required for documentation

## DO NOT

❌ Create plugins outside `/src/plugins/`
❌ Use non-namespaced plugin IDs
❌ Register plugins manually without PluginManager
❌ Create duplicate plugin functionality (search first!)
