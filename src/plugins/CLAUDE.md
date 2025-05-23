# Plugins Directory

## Purpose
This directory contains the source code for ChayCards' built-in plugins. These plugins are developed and maintained by the core team but follow the same architecture as community plugins.

## Built-in Plugins
- `documents/` - Document management (notes, markdown, rich text)
- `tasks/` - Task and project management
- `knowledge/` - Spaced repetition and learning

## Plugin Structure
Each plugin follows this structure:
```
plugin-name/
├── manifest.json      # Plugin metadata
├── index.ts          # Entry point
├── components/       # React components
├── api/             # API routes (if any)
├── types/           # TypeScript types
└── README.md        # Documentation
```

## Plugin Manifest
```json
{
  "id": "documents",
  "name": "Documents",
  "version": "1.0.0",
  "description": "Document management plugin",
  "permissions": [
    "storage:read",
    "storage:write",
    "events:emit"
  ],
  "extensionPoints": {
    "documentTypes": {
      "description": "Register new document types"
    }
  },
  "dependencies": {}
}
```

## Key Patterns

### Plugin API Usage
Plugins can only use the exposed Plugin API:
```typescript
export default class DocumentsPlugin {
  constructor(private api: PluginAPI) {}
  
  async onLoad() {
    // Register routes
    this.api.registerRoute('/documents', documentRoutes)
    
    // Listen to events
    this.api.events.on('app:ready', this.initialize)
    
    // Store data
    await this.api.storage.set('config', defaultConfig)
  }
}
```

### Inter-Plugin Communication
```typescript
// Emit events
this.api.events.emit('document:created', { id, title })

// Call other plugins
const tasks = await this.api.plugins.call('tasks.getTasks', { 
  documentId: doc.id 
})
```

### Extension Points
```typescript
// Define extension point
this.api.extensions.define('documentTypes', {
  register: (type: DocumentType) => {
    this.documentTypes.set(type.id, type)
  }
})

// Other plugins extend
api.extensions.extend('documents.documentTypes', {
  id: 'markdown',
  name: 'Markdown Document',
  component: MarkdownEditor
})
```

## Important Notes

### Development Guidelines
- Built-in plugins follow the SAME rules as community plugins
- No special access or privileges
- Must use Plugin API only
- Serve as examples for community

### Testing Approach
- Test as if external plugin
- Mock the Plugin API
- Test in isolation
- Verify permissions

### Distribution
- Built-in plugins are bundled with app
- Still loaded through plugin system
- Can be disabled by users
- Updates with app updates

## Common Tasks

### Creating a Built-in Plugin
1. Create directory structure
2. Write manifest.json
3. Implement plugin class
4. Register with plugin system
5. Add tests

### Adding Features
1. Check if it needs new permissions
2. Update manifest if needed
3. Use only Plugin API
4. Emit events for others

### Debugging
- Use plugin dev tools
- Check permission errors
- Verify event flow
- Test in isolation