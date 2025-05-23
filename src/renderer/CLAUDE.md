# Renderer Directory

## Purpose
This directory contains all frontend code that runs in the browser or Electron renderer process. It's the React application that users interact with.

## Structure
- `components/` - Reusable UI components
- `pages/` - Route-level components
- `hooks/` - Custom React hooks
- `contexts/` - React contexts for global state
- `layouts/` - Page layout wrappers
- `plugin-host/` - System for rendering plugins

## Key Patterns

### Component Organization
- Use shadcn/ui components from `components/ui/`
- Build composite components on top of primitives
- Keep components focused and single-purpose

### State Management
- Local state with useState for component-specific data
- Context for cross-component state
- Platform service for system-level operations

### Routing
- React Router for navigation
- Pages are like "built-in plugins"
- Each major feature gets its own route

## Important Notes

### Platform Independence
- This code runs in BOTH Electron and web browser
- Always use PlatformService for platform-specific features
- Never import Node.js modules directly

### Plugin Considerations
- Pages in this directory are "built-in plugins"
- Community plugins will be loaded dynamically
- Use the plugin-host system for rendering external plugins

### Styling
- Use TailwindCSS utilities
- Follow shadcn/ui patterns for consistency
- Support both light and dark themes

## Common Tasks

### Adding a New Page
1. Create component in `pages/`
2. Add route in `App.tsx`
3. Add navigation link if needed

### Creating a Component
1. Check if shadcn/ui has it first
2. Create in appropriate subfolder
3. Export from index file
4. Add TypeScript types

### Using Platform Features
```typescript
import { platformService } from '@/shared/services/PlatformService'

// Same API works everywhere
platformService.showNotification('Title', 'Message')
```