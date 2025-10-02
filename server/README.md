# ChayCards Storage API Server

PostgreSQL-backed REST API for cloud storage testing and production.

## Overview

This server provides a REST API for key-value storage using PostgreSQL with native JSONB support. It's designed for both local development testing and production deployment.

**Database:** PostgreSQL 15 with JSONB
**API Port:** 3101 (uncommon port to avoid conflicts)
**PostgreSQL Port:** 5433 (mapped from container's 5432)

## Quick Start

### 1. Start PostgreSQL (via Docker)

```bash
cd server
docker-compose up -d
```

This starts PostgreSQL on port 5433 with:
- Database: `chaycards`
- Username: `postgres`
- Password: `dev`

### 2. Install Dependencies

```bash
npm install
```

### 3. Start API Server

```bash
npm start
```

Server will start on `http://localhost:3101`

### 4. Start Everything Together

From root directory:
```bash
npm run dev:full
```

This starts both the frontend (port 8080) and backend (port 3101).

## API Endpoints

### Health Check
```http
GET /api/health
```

Returns server status and database info.

**Response:**
```json
{
  "status": "ok",
  "database": "PostgreSQL",
  "keys": 0,
  "timestamp": 1234567890
}
```

### Get Value
```http
GET /api/storage/:key
```

Retrieve value for a key. Returns null if key doesn't exist.

**Response:**
```json
{
  "value": { "any": "javascript object" }
}
```

### Set Value
```http
PUT /api/storage/:key
Content-Type: application/json

{
  "value": { "any": "javascript object" }
}
```

Store a value for a key. Automatically converts JavaScript objects to JSONB.

**Response:**
```json
{
  "success": true
}
```

### Delete Value
```http
DELETE /api/storage/:key
```

Remove a key and its value.

**Response:**
```json
{
  "success": true,
  "deleted": true
}
```

### List Keys
```http
GET /api/storage?prefix=optional-prefix
```

List all keys, optionally filtered by prefix.

**Response:**
```json
{
  "keys": ["key1", "key2"],
  "count": 2
}
```

### Clear All
```http
DELETE /api/storage
```

Remove all keys and values.

**Response:**
```json
{
  "success": true,
  "cleared": 5
}
```

## Database Schema

```sql
CREATE TABLE storage (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## Configuration

Environment variables (optional):

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:dev@localhost:5433/chaycards

# API server port
PORT=3101

# CORS allowed origins (comma-separated)
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

Create a `.env` file in the `server/` directory (see `.env.example`).

## PostgreSQL Features

### Native JSONB Support
- Automatic conversion between JavaScript objects and JSONB
- No need for JSON.stringify/parse
- Better performance than TEXT storage
- Supports indexing and querying (future)

### Example:
```javascript
// Frontend sends:
{ value: { user: "john", settings: { theme: "dark" } } }

// Stored in PostgreSQL as JSONB automatically
// Retrieved as JavaScript object automatically
```

### Connection Pooling
- Built-in connection pooling via `pg` library
- Handles multiple concurrent requests efficiently
- Production-ready out of the box

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3101/api/health

# Set a value
curl -X PUT http://localhost:3101/api/storage/test-key \
  -H "Content-Type: application/json" \
  -d '{"value":{"foo":"bar"}}'

# Get a value
curl http://localhost:3101/api/storage/test-key

# List keys
curl http://localhost:3101/api/storage

# List with prefix
curl http://localhost:3101/api/storage?prefix=test

# Delete a key
curl -X DELETE http://localhost:3101/api/storage/test-key

# Clear all
curl -X DELETE http://localhost:3101/api/storage
```

## Architecture

```
┌──────────────────────┐
│   Frontend (React)   │
│  PostgreSQLAdapter   │
└──────────┬───────────┘
           │ HTTP
           ▼
┌──────────────────────┐
│   Express Server     │
│   Port: 3101         │
│   /api/storage/*     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  PostgreSQL 15       │
│  Port: 5433          │
│  JSONB + Pooling     │
└──────────────────────┘
```

## Docker Management

### Start PostgreSQL
```bash
docker-compose up -d
```

### Stop PostgreSQL
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Reset Database
```bash
docker-compose down -v  # Removes volumes
docker-compose up -d
```

### Connect to PostgreSQL
```bash
docker exec -it chaycards-postgres psql -U postgres -d chaycards
```

Then run SQL commands:
```sql
\dt                    -- List tables
SELECT * FROM storage; -- View all data
\q                     -- Quit
```

## Production Deployment

### Environment Variables

Set these on your hosting platform:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3101
CORS_ORIGIN=https://yourdomain.com
```

### Recommended Hosts

- **Railway** - Easy PostgreSQL setup
- **Render** - Free tier available
- **Fly.io** - Global deployment
- **AWS** - Lambda + RDS

### Migration from Development

1. Backend code is production-ready as-is
2. Just change `DATABASE_URL` to your production PostgreSQL
3. Update `CORS_ORIGIN` to your frontend URL
4. Deploy!

No code changes needed - only configuration.

## Troubleshooting

### Port 3101 already in use
```bash
# Find and kill the process
lsof -i :3101
kill -9 <PID>
```

### Port 5433 already in use
```bash
# Check what's using it
lsof -i :5433

# Change the port in docker-compose.yml
ports:
  - "5434:5432"  # Use 5434 instead

# Update DATABASE_URL
DATABASE_URL=postgresql://postgres:dev@localhost:5434/chaycards
```

### Can't connect to PostgreSQL
```bash
# Check if container is running
docker ps

# Check logs
docker-compose logs

# Restart
docker-compose restart
```

### Database connection errors
```bash
# Wait for PostgreSQL to be ready
docker-compose ps

# Look for "healthy" status
# If "starting", wait a few seconds and try again
```

## Security Notes

**Current (Development):**
- ❌ No authentication
- ❌ Simple CORS (localhost only)
- ❌ Default credentials (dev/dev)

**For Production:**
- ✅ Add JWT authentication middleware
- ✅ Use strong database credentials
- ✅ Restrict CORS to your domain
- ✅ Use HTTPS only
- ✅ Add rate limiting
- ✅ Enable SSL for database connection