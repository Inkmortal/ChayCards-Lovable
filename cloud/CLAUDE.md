# Cloud Directory

## Purpose
This directory contains cloud-specific deployment configurations and entry points. Code here ONLY runs in cloud deployments, never locally or in Electron.

## Structure
- `server.ts` - Cloud server entry point
- `Dockerfile` - Container configuration
- Configuration files for deployment

## Key Differences from Local

### Storage Implementation
```typescript
// cloud/server.ts
import { CloudStorage } from '../src/shared/storage/CloudStorage'
import { createApp } from '../src/server/app'

const storage = new CloudStorage({
  postgres: process.env.DATABASE_URL,
  s3: process.env.S3_BUCKET
})

const app = createApp(storage)
```

### Additional Services
- Redis for caching
- S3 for file storage  
- PostgreSQL for data
- CDN for plugin delivery
- Queue service for background jobs

### Scaling Considerations
```typescript
// Horizontal scaling ready
app.listen(process.env.PORT || 3000, '0.0.0.0')

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: process.env.APP_VERSION })
})
```

## Deployment Strategy

### Environment Variables
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://...
REDIS_URL=redis://...
S3_BUCKET=chaycards-storage
JWT_SECRET=...
API_KEY=...
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "cloud/server.js"]
```

### Cloud Services
- **Compute**: AWS ECS / Google Cloud Run / Railway
- **Database**: Managed PostgreSQL
- **Storage**: S3-compatible object storage
- **CDN**: CloudFlare for static assets
- **Monitoring**: DataDog / New Relic

## Important Notes

### No Local Code
- Don't import Electron-specific code
- No file system operations
- Use cloud services for everything
- Stateless application design

### Security
- API authentication required
- Rate limiting implemented
- CORS properly configured
- Secrets in environment only

### Performance
- Cache everything possible
- Use CDN for plugins
- Database connection pooling
- Optimize for cold starts

## Common Tasks

### Adding Cloud Service
1. Add client library to package.json
2. Configure in server.ts
3. Add environment variables
4. Update deployment docs

### Monitoring
```typescript
// Structured logging
logger.info('User action', {
  userId: user.id,
  action: 'create_document',
  duration: responseTime
})

// Metrics
metrics.increment('api.requests', {
  endpoint: req.path,
  status: res.statusCode
})
```

### Database Migrations
```bash
# Run on deployment
npm run migrate:up

# Rollback if needed
npm run migrate:down
```

## Deployment Checklist
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] CDN cache invalidated
- [ ] Health checks passing