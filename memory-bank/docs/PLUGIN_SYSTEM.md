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
  
  // Storage schemas
  schemas?: Record<string, SchemaDefinition>;
  migrations?: Migration[];
  
  // Lifecycle hooks
  onLoad?: (registry: PluginRegistry) => void;
  onUnload?: () => void;
}
```

## Plugin System Architecture

The plugin system consists of two main components:

### Plugin Registry
The low-level data store that holds all plugin assets:

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

### Plugin Manager
The high-level orchestrator that manages plugins and provides the main API:

```typescript
class PluginManager {
  private static instance: PluginManager;
  private registry: PluginRegistry;
  private navigationItems: NavigationItem[] = [];
  private regions: Map<string, RegionComponent[]> = new Map();
  
  // Singleton access
  static getInstance(): PluginManager {
    if (!this.instance) this.instance = new PluginManager();
    return this.instance;
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
  
  // Delegate to registry for components/services
  getComponent(name: string): React.ComponentType | undefined {
    return this.registry.getComponent(name);
  }
  
  setComponent(name: string, component: React.ComponentType): void {
    this.registry.setComponent(name, component);
  }
}
```

## Plugin Loading

Plugins are loaded in dependency order by the PluginManager:

```typescript
function loadPlugins(plugins: Plugin[]): void {
  const manager = PluginManager.getInstance();
  const loaded = new Set<string>();
  
  function load(plugin: Plugin) {
    if (loaded.has(plugin.id)) return;
    
    // Load dependencies first
    plugin.requires?.forEach(depId => {
      const dep = plugins.find(p => p.id === depId);
      if (dep) load(dep);
    });
    
    // Register components with namespace
    Object.entries(plugin.components || {}).forEach(([name, component]) => {
      const namespacedName = `${plugin.id}/${name}`;
      manager.setComponent(namespacedName, component);
    });
    
    // Register services with namespace
    Object.entries(plugin.services || {}).forEach(([name, service]) => {
      const namespacedName = `${plugin.id}/${name}`;
      manager.setService(namespacedName, service);
    });
    
    // Register routes and navigation
    plugin.routes?.forEach(route => {
      manager.addRoute(route);
      if (route.showInNav) {
        manager.addNavigationItem({
          path: route.path,
          label: route.label,
          icon: route.icon,
          order: route.order || 50
        });
      }
    });
    
    // Call plugin's onLoad hook with manager
    plugin.onLoad?.(manager);
    
    loaded.add(plugin.id);
  }
  
  plugins.forEach(load);
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

## Storage Patterns

### Each Plugin Owns Its Storage

Plugins should store their data in separate tables/collections, not modify core plugin schemas:

```typescript
export const AIEnhancePlugin: Plugin = {
  id: 'ai-enhance',
  requires: ['core.documents'],
  
  // Define own storage schema
  schemas: {
    'ai_document_metadata': {
      documentId: 'string',      // Reference to core.documents
      summary: 'text',
      tags: 'json',
      sentiment: 'string',
      readingTime: 'number',
      generatedAt: 'timestamp'
    }
  },
  
  services: {
    'aiService': new AIService()
  },
  
  onLoad: (manager) => {
    const docService = manager.getService('core.documents/documentService');
    const aiService = manager.getService('ai-enhance/aiService');
    
    // Enhance document retrieval with AI data
    const originalGet = docService.get;
    docService.get = async (id) => {
      const [doc, aiData] = await Promise.all([
        originalGet(id),
        aiService.getMetadata(id)
      ]);
      
      // Merge enhancement data
      return {
        ...doc,
        ai: aiData
      };
    };
    
    // Generate AI data on save
    const originalSave = docService.save;
    docService.save = async (doc) => {
      const result = await originalSave(doc);
      
      // Async generate AI metadata
      aiService.generateAndSaveMetadata(doc.id, doc.content)
        .catch(err => console.error('AI generation failed:', err));
      
      return result;
    };
  }
};
```

### Why Separate Storage?

1. **Schema Independence** - Core plugins can evolve without breaking enhancers
2. **Clean Uninstall** - Remove plugin = remove its tables
3. **Performance** - Load enhancement data only when needed
4. **Data Integrity** - Plugin failures don't corrupt core data
5. **Version Control** - Each plugin manages its own migrations

### Storage Patterns for Mini-Apps

For plugins that are complete applications:

```typescript
export const ProjectManagementPlugin: Plugin = {
  id: 'project-management',
  
  // Multiple related schemas
  schemas: {
    'projects': {
      id: 'uuid',
      name: 'string',
      description: 'text',
      status: 'string',
      createdAt: 'timestamp'
    },
    'project_tasks': {
      id: 'uuid',
      projectId: 'uuid',
      title: 'string',
      completed: 'boolean'
    },
    'project_members': {
      projectId: 'uuid',
      userId: 'string',
      role: 'string'
    }
  },
  
  // Only expose key components for enhancement
  components: {
    'ProjectList': ProjectList,        // Public
    'ProjectCard': ProjectCard,        // Public
    'ProjectDashboard': ProjectDashboard  // Public
    // Dozens of internal components NOT registered
  }
};
```

### Lazy Loading Enhancement Data

For performance, enhancement data should be loaded on demand:

```typescript
// In a wrapped component
const EnhancedDocumentCard = (props) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Only load AI data when expanded
  useEffect(() => {
    if (props.expanded && !aiData) {
      setLoading(true);
      aiService.getMetadata(props.doc.id)
        .then(setAiData)
        .finally(() => setLoading(false));
    }
  }, [props.expanded, props.doc.id]);
  
  return (
    <>
      <OriginalDocumentCard {...props} />
      {props.expanded && (
        <AIMetadataPanel data={aiData} loading={loading} />
      )}
    </>
  );
};
```

### Migration Support

Plugins handle their own schema migrations:

```typescript
export const AnalyticsPlugin: Plugin = {
  id: 'analytics',
  
  migrations: [
    {
      version: 1,
      up: async (db) => {
        await db.createTable('analytics_events', {
          id: 'uuid PRIMARY KEY',
          resourceType: 'VARCHAR(50)',
          resourceId: 'VARCHAR(255)',
          eventType: 'VARCHAR(50)',
          timestamp: 'TIMESTAMP'
        });
      }
    },
    {
      version: 2,
      up: async (db) => {
        await db.addColumn('analytics_events', 'metadata', 'JSON');
      }
    }
  ]
};
```

### Best Practices for Plugin Storage

1. **Use Reference IDs** - Store foreign keys to link with core data
2. **Namespace Tables** - Prefix with plugin ID to avoid collisions
3. **Handle Missing Data** - Core data might exist without enhancement data
4. **Async Enhancement** - Don't block core operations for enhancement features
5. **Cache Strategically** - Cache merged data if performance requires it

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
    { 
      path: '/documents', 
      component: 'core.documents/DocumentList',
      label: 'Documents',
      icon: 'FileText',
      showInNav: true,
      order: 10
    },
    { 
      path: '/documents/:id', 
      component: 'core.documents/DocumentEditor',
      showInNav: false
    }
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
    { 
      path: '/tasks', 
      component: 'core.tasks/TaskBoard',
      label: 'Tasks',
      icon: 'CheckSquare',
      showInNav: true,
      order: 20
    }
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
    { 
      path: '/flashcards', 
      component: 'core.knowledge/FlashcardView',
      label: 'Flashcards',
      icon: 'Brain',
      showInNav: true,
      order: 30
    },
    { 
      path: '/knowledge-graph', 
      component: 'core.knowledge/KnowledgeGraph',
      showInNav: false
    }
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

## Plugin Management

Since everything is a plugin, even plugin management itself can be implemented as a plugin:

### Core Plugin Manager Plugin
A built-in plugin that provides:

```typescript
const PluginManagerPlugin: Plugin = {
  id: 'core.plugin-manager',
  name: 'Plugin Manager',
  
  routes: [{
    path: '/settings/plugins',
    component: 'core.plugin-manager/PluginSettings',
    label: 'Manage Plugins',
    icon: 'Settings',
    showInNav: true,
    order: 100
  }],
  
  onLoad: (manager) => {
    // Override navigation ordering
    const originalGetNav = manager.getNavigationItems.bind(manager);
    manager.getNavigationItems = () => {
      const items = originalGetNav();
      return sortByUserPreferences(items);
    };
    
    // Add plugin management UI to settings
    manager.addToRegion('settings', {
      id: 'plugin-list',
      component: 'core.plugin-manager/PluginList',
      order: 10
    });
  }
};
```

This plugin could provide:
- Drag-and-drop navigation reordering
- Enable/disable plugins
- Plugin load order configuration
- Per-plugin settings
- Plugin conflict detection

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

**Q: Can plugins manage other plugins?**
A: Yes! Even plugin management is a plugin. Users can install alternative plugin managers.