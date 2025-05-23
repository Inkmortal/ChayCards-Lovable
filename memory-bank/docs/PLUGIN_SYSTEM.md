# Plugin System Architecture

## Overview

ChayCards uses a simple, powerful plugin system inspired by game modding communities. Plugins can extend, modify, or completely replace any part of the application - UI components, services, data models, and routes.

## Core Principles

1. **Everything is Public** - All components, services, and routes are accessible
2. **Everything is Replaceable** - Any plugin can override any component
3. **Simple Over Safe** - Developer freedom over protection
4. **Community Compatibility** - Let users figure out what works together

## Plugin Structure

```typescript
interface Plugin {
  id: string;              // Unique identifier (e.g., 'core.documents')
  name: string;            // Display name
  version: string;         // Semantic version
  description?: string;    // What this plugin does
  author?: string;         // Plugin author
  
  // Dependencies
  requires?: string[];     // Array of plugin IDs this depends on
  
  // What this plugin provides
  components?: Record<string, React.ComponentType>;
  routes?: Route[];
  services?: Record<string, any>;
  
  // Lifecycle hooks
  onLoad?: (registry: PluginRegistry) => void;
  onUnload?: () => void;
}
```

## Plugin Registry

The central registry that manages all plugins:

```typescript
class PluginRegistry {
  private components = new Map<string, React.ComponentType>();
  private routes = new Map<string, Route>();
  private services = new Map<string, any>();
  
  // Get/Set components
  getComponent(name: string): React.ComponentType | undefined {
    return this.components.get(name);
  }
  
  setComponent(name: string, component: React.ComponentType): void {
    this.components.set(name, component);
  }
  
  // Get/Set services
  getService(name: string): any {
    return this.services.get(name);
  }
  
  setService(name: string, service: any): void {
    this.services.set(name, service);
  }
  
  // Get all routes for React Router
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }
}
```

## Plugin Loading

Plugins are loaded in dependency order:

```typescript
function loadPlugins(plugins: Plugin[]): PluginRegistry {
  const loaded = new Set<string>();
  const registry = new PluginRegistry();
  
  function load(plugin: Plugin) {
    if (loaded.has(plugin.id)) return;
    
    // Load dependencies first
    plugin.requires?.forEach(depId => {
      const dep = plugins.find(p => p.id === depId);
      if (dep) load(dep);
    });
    
    // Register components
    Object.entries(plugin.components || {}).forEach(([name, component]) => {
      registry.setComponent(name, component);
    });
    
    // Register services
    Object.entries(plugin.services || {}).forEach(([name, service]) => {
      registry.setService(name, service);
    });
    
    // Register routes
    plugin.routes?.forEach(route => {
      registry.setRoute(route.path, route);
    });
    
    // Call plugin's onLoad hook
    plugin.onLoad?.(registry);
    
    loaded.add(plugin.id);
  }
  
  plugins.forEach(load);
  return registry;
}
```

## Extension Patterns

### 1. Component Wrapping

Enhance existing components by wrapping them:

```typescript
const EnhancedDocumentsPlugin: Plugin = {
  id: 'enhanced-documents',
  requires: ['core.documents'],
  
  onLoad: (registry) => {
    // Get the original component
    const OriginalDocumentCard = registry.getComponent('DocumentCard');
    
    // Create enhanced version
    const EnhancedDocumentCard = (props) => (
      <div className="enhanced-wrapper">
        <AITagBar documentId={props.doc.id} />
        <OriginalDocumentCard {...props} />
        <AnalyticsBar stats={getStats(props.doc.id)} />
      </div>
    );
    
    // Replace in registry
    registry.setComponent('DocumentCard', EnhancedDocumentCard);
  }
};
```

### 2. Service Extension

Extend functionality by wrapping services:

```typescript
const AnalyticsPlugin: Plugin = {
  id: 'analytics',
  requires: ['core.documents'],
  
  onLoad: (registry) => {
    const docService = registry.getService('documentService');
    const originalSave = docService.save;
    
    // Wrap save method to add analytics
    docService.save = async (doc) => {
      const result = await originalSave(doc);
      trackEvent('document.saved', { 
        id: doc.id, 
        wordCount: doc.content.length 
      });
      return result;
    };
  }
};
```

### 3. Complete Replacement

Replace entire components with new implementations:

```typescript
const KanbanDocumentsPlugin: Plugin = {
  id: 'kanban-documents',
  requires: ['core.documents'],
  
  components: {
    'DocumentList': KanbanDocumentView  // Completely new component
  }
};
```

### 4. Data Model Extension

Add new fields to existing data models:

```typescript
const DocumentMetadataPlugin: Plugin = {
  id: 'document-metadata',
  requires: ['core.documents'],
  
  onLoad: (registry) => {
    const docService = registry.getService('documentService');
    const originalCreate = docService.create;
    
    docService.create = async (doc) => {
      const enhanced = {
        ...doc,
        metadata: {
          wordCount: countWords(doc.content),
          readingTime: calculateReadingTime(doc.content),
          language: detectLanguage(doc.content),
          sentiment: analyzeSentiment(doc.content)
        }
      };
      return originalCreate(enhanced);
    };
  }
};
```

## Core Plugins

ChayCards ships with these core plugins:

### 1. Documents Plugin (`core.documents`)
```typescript
{
  id: 'core.documents',
  components: {
    'DocumentList': DocumentList,
    'DocumentCard': DocumentCard,
    'DocumentEditor': DocumentEditor,
    'DocumentSearch': DocumentSearch
  },
  services: {
    'documentService': new DocumentService()
  },
  routes: [
    { path: '/documents', component: 'DocumentList' },
    { path: '/documents/:id', component: 'DocumentEditor' }
  ]
}
```

### 2. Tasks Plugin (`core.tasks`)
```typescript
{
  id: 'core.tasks',
  components: {
    'TaskList': TaskList,
    'TaskCard': TaskCard,
    'TaskBoard': TaskBoard
  },
  services: {
    'taskService': new TaskService()
  },
  routes: [
    { path: '/tasks', component: 'TaskBoard' }
  ]
}
```

### 3. Knowledge Plugin (`core.knowledge`)
```typescript
{
  id: 'core.knowledge',
  components: {
    'FlashcardView': FlashcardView,
    'KnowledgeGraph': KnowledgeGraph,
    'StudySession': StudySession
  },
  services: {
    'knowledgeService': new KnowledgeService()
  },
  routes: [
    { path: '/flashcards', component: 'FlashcardView' },
    { path: '/knowledge-graph', component: 'KnowledgeGraph' }
  ]
}
```

## Plugin Manifest

Each plugin should have a manifest file (`plugin.json`):

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Adds awesome features to ChayCards",
  "author": "Plugin Developer",
  "main": "index.js",
  "requires": {
    "core.documents": "^1.0.0",
    "core.tasks": "^1.0.0"
  }
}
```

## Best Practices

1. **Namespace Components**: Use dotted names for sub-components
   ```typescript
   'DocumentList.Header', 'DocumentList.Item', 'DocumentList.Footer'
   ```

2. **Preserve Original Functionality**: When wrapping, call the original
   ```typescript
   const Original = registry.getComponent('DocumentCard');
   return <div><Extra /><Original {...props} /></div>;
   ```

3. **Version Compatibility**: Specify compatible versions in manifest
   ```json
   "requires": {
     "core.documents": "^1.0.0"  // Works with 1.x.x
   }
   ```

4. **Export Types**: Help other developers extend your plugin
   ```typescript
   export interface DocumentCardProps {
     doc: Document;
     onEdit?: (id: string) => void;
   }
   ```

5. **Clean Unload**: Implement onUnload to clean up
   ```typescript
   onUnload: () => {
     // Remove event listeners, restore originals, etc.
   }
   ```

## Example: Building a Plugin

Here's a complete example of a plugin that adds AI features to documents:

```typescript
// ai-documents-plugin/index.ts
import { Plugin } from '@chaycards/plugin-sdk';
import { AITagBar } from './components/AITagBar';
import { AIService } from './services/AIService';

export const AIDocumentsPlugin: Plugin = {
  id: 'ai-documents',
  name: 'AI Document Enhancement',
  version: '1.0.0',
  requires: ['core.documents'],
  
  services: {
    'aiService': new AIService()
  },
  
  onLoad: (registry) => {
    // Enhance document cards
    const OriginalCard = registry.getComponent('DocumentCard');
    const EnhancedCard = (props) => (
      <>
        <AITagBar documentId={props.doc.id} />
        <OriginalCard {...props} />
      </>
    );
    registry.setComponent('DocumentCard', EnhancedCard);
    
    // Add AI analysis to document creation
    const docService = registry.getService('documentService');
    const originalCreate = docService.create;
    
    docService.create = async (doc) => {
      const aiService = registry.getService('aiService');
      const enhanced = {
        ...doc,
        aiTags: await aiService.generateTags(doc.content),
        summary: await aiService.generateSummary(doc.content)
      };
      return originalCreate(enhanced);
    };
  }
};
```

## FAQ

**Q: What if two plugins modify the same component?**
A: Last one loaded wins. Users can control load order in settings.

**Q: How do I debug plugin conflicts?**
A: Plugin DevTools will show what modified what, in what order.

**Q: Can plugins break the app?**
A: Yes, just like game mods. Users accept this when installing plugins.

**Q: How do I distribute my plugin?**
A: Package as npm module or zip file. Will have marketplace later.

**Q: Can I charge for my plugin?**
A: Yes, plugins are your IP. Marketplace will support paid plugins.