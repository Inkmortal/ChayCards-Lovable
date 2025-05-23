# Server Directory

## Purpose
This directory contains the Express.js backend that serves as the API for ChayCards. The SAME code runs both locally (in Electron) and in the cloud, just with different storage adapters.

## Structure
- `routes/` - API endpoint definitions
- `middleware/` - Express middleware (auth, validation, etc)
- `interfaces/` - TypeScript interfaces for contracts
- `app.ts` - Express app factory function

## Key Patterns

### Express App Factory
```typescript
// app.ts
export function createApp(storage: IStorage, config?: AppConfig) {
  const app = express()
  // Setup middleware
  // Setup routes with injected storage
  return app
}
```

### Storage Abstraction
Routes should NEVER know if they're running locally or in cloud:
```typescript
// routes/documents.ts
export function createDocumentRoutes(storage: IStorage) {
  router.get('/:id', async (req, res) => {
    const doc = await storage.get('documents', req.params.id)
    res.json(doc)
  })
}
```

### How It's Used

**In Electron (local):**
```typescript
// electron/main.js starts this
import { createApp } from '../src/server/app'
import { LocalStorage } from '../src/shared/storage/LocalStorage'

const app = createApp(new LocalStorage())
app.listen(3001) // Local port
```

**In Cloud:**
```typescript
// cloud/server.ts
import { createApp } from '../src/server/app'
import { CloudStorage } from '../src/shared/storage/CloudStorage'

const app = createApp(new CloudStorage())
app.listen(process.env.PORT)
```

## Important Notes

### Shared Code Only
- This directory contains NO platform-specific code
- Storage implementations live in `shared/storage/`
- Use dependency injection for platform differences

### API Design
- RESTful endpoints
- Consistent error handling
- Validate all inputs
- Use TypeScript types

### Plugin Considerations
- Plugins can register their own routes
- Use middleware for plugin permission checking
- Namespace plugin routes (e.g., `/api/plugins/markdown/...`)

## Common Tasks

### Adding a New Route
1. Create route file in `routes/`
2. Define TypeScript interfaces in `interfaces/`
3. Inject storage dependency
4. Add to app.ts route setup

### Adding Middleware
1. Create in `middleware/`
2. Apply globally or to specific routes
3. Handle errors gracefully
4. Pass data via res.locals

### Error Handling
```typescript
// Consistent error format
res.status(400).json({
  error: 'ValidationError',
  message: 'Title is required',
  field: 'title'
})
```