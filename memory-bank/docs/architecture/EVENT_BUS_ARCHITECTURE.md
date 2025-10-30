# Event Bus Architecture

## Overview

The Event Bus is a simple publish-subscribe system that enables plugins to communicate without knowing about each other. It follows the game-mod philosophy - any plugin can listen to or emit any event.

## Core Design Principles

1. **Simple Over Complex** - Just a Map of event names to listener Sets
2. **No Type Safety** - Plugins define their own event contracts
3. **No Validation** - Trust plugins to emit/consume correctly
4. **Synchronous by Default** - Keep it simple, no async complexity
5. **Global Access** - Available through PluginManager

## Event Bus Implementation

```typescript
interface EventBus {
  on(event: string, callback: Function): () => void;
  once(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
  off(event: string, callback: Function): void;
  clear(event?: string): void;
}

class SimpleEventBus implements EventBus {
  private listeners = new Map<string, Set<Function>>();
  
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  once(event: string, callback: Function): void {
    const wrapper = (data: any) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
  
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    
    // Clone to prevent modification during iteration
    const callbackArray = Array.from(callbacks);
    
    for (const callback of callbackArray) {
      try {
        callback(data);
      } catch (error) {
        // Log but don't stop other listeners
        console.error(`Event handler error for '${event}':`, error);
      }
    }
  }
  
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }
  
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
```

## Event Naming Conventions

Plugins should use namespaced event names to avoid collisions:

```
plugin-id:event-name
```

Examples:
- `core.documents:created`
- `core.documents:updated`
- `core.documents:deleted`
- `ai-enhance:analysis-complete`
- `theme-system:theme-changed`

## Common Event Patterns

### 1. CRUD Events
```typescript
// Document plugin emits
eventBus.emit('core.documents:created', { id, title, content });
eventBus.emit('core.documents:updated', { id, changes });
eventBus.emit('core.documents:deleted', { id });

// Analytics plugin listens
eventBus.on('core.documents:created', (doc) => {
  trackEvent('document_created', { id: doc.id });
});
```

### 2. Request/Response Pattern
```typescript
// Plugin requests data
eventBus.emit('core.documents:request-active', { requestId: '123' });

// Document plugin responds
eventBus.on('core.documents:request-active', ({ requestId }) => {
  eventBus.emit('core.documents:response-active', {
    requestId,
    document: getActiveDocument()
  });
});
```

### 3. Global State Changes
```typescript
// Theme change
eventBus.emit('theme-system:theme-changed', {
  from: 'light',
  to: 'dark'
});

// Plugins react
eventBus.on('theme-system:theme-changed', ({ to }) => {
  updateChartColors(to);
});
```

### 4. Plugin Lifecycle Events
```typescript
// System emits
eventBus.emit('plugin:loaded', { pluginId: 'my-plugin' });
eventBus.emit('plugin:unloaded', { pluginId: 'my-plugin' });

// Other plugins can react
eventBus.on('plugin:loaded', ({ pluginId }) => {
  if (pluginId === 'core.documents') {
    enhanceDocuments();
  }
});
```

## Integration with Plugin System

The Event Bus is exposed through PluginManager:

```typescript
class PluginManager {
  private eventBus = new SimpleEventBus();
  
  // Plugins access it
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

// In plugin
onLoad: (manager) => {
  const eventBus = manager.getEventBus();
  
  // Listen for events
  eventBus.on('core.documents:created', handleNewDoc);
  
  // Emit events
  eventBus.emit('my-plugin:initialized');
}
```

## Performance Considerations

1. **Listener Limits** - No built-in limits (trust plugins)
2. **Memory Leaks** - Plugins must clean up in onUnload
3. **Synchronous Execution** - Heavy handlers should defer work
4. **Error Isolation** - One bad listener doesn't break others

## Best Practices for Plugins

1. **Always Namespace Events** - Prevent collisions
2. **Document Your Events** - Other plugins need to know
3. **Clean Up Listeners** - Remove them in onUnload
4. **Handle Missing Data** - Events might have partial data
5. **Don't Assume Order** - Listener order is not guaranteed

## Example: Document Enhancement Flow

```typescript
// 1. User saves document
documentService.save(doc);

// 2. Document plugin emits event
eventBus.emit('core.documents:saved', { 
  id: doc.id, 
  content: doc.content 
});

// 3. Multiple plugins react
// AI plugin generates summary
eventBus.on('core.documents:saved', async ({ id, content }) => {
  const summary = await generateSummary(content);
  eventBus.emit('ai-enhance:summary-generated', { 
    documentId: id, 
    summary 
  });
});

// Analytics plugin tracks
eventBus.on('core.documents:saved', ({ id }) => {
  trackEvent('document_saved', { id });
});

// Backup plugin syncs
eventBus.on('core.documents:saved', ({ id }) => {
  scheduleBackup(id);
});
```

## Testing Event-Driven Plugins

```typescript
describe('MyPlugin', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new SimpleEventBus();
  });
  
  test('reacts to document creation', () => {
    const handler = jest.fn();
    eventBus.on('core.documents:created', handler);
    
    eventBus.emit('core.documents:created', { id: '123' });
    
    expect(handler).toHaveBeenCalledWith({ id: '123' });
  });
});
```

## Future Considerations

1. **Async Events** - Could add `emitAsync` for Promise-based events
2. **Event Priorities** - Could add listener priorities if needed
3. **Event Filtering** - Could add wildcard support ('core.documents:*')
4. **Event History** - Could add event replay for debugging

For now, keep it simple - just synchronous pub/sub that works.