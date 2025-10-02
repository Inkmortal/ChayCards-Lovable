# Cloudflare Tunnel Setup for ChayCards

## Overview
This document describes the production-ready cloud storage infrastructure using Cloudflare Tunnel to provide secure HTTPS access to a local PostgreSQL database during development.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Any Frontend Environment                 │
│  (Local Dev / Lovable Preview / Production)     │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS Request
                 │ https://api.chaycards.com/api/storage
                 ▼
┌─────────────────────────────────────────────────┐
│           Cloudflare Tunnel                      │
│  Tunnel: chaycards-api                           │
│  ID: 6c780a88-8816-46f3-8e89-fd866d5006fd       │
│  - Zero-config HTTPS                             │
│  - Bypasses firewall/NAT                         │
│  - Production-ready security                     │
└────────────────┬────────────────────────────────┘
                 │
                 │ Tunneled to localhost:7243
                 ▼
┌─────────────────────────────────────────────────┐
│         Express API Server (Port 7243)           │
│  - REST API with JSONB support                   │
│  - CORS for all environments                     │
│  - Comprehensive logging                         │
└────────────────┬────────────────────────────────┘
                 │
                 │ Storage Operations
                 ▼
┌─────────────────────────────────────────────────┐
│      PostgreSQL Database (Port 5433)             │
│  - Docker Compose managed                        │
│  - JSONB key-value storage                       │
└─────────────────────────────────────────────────┘
```

## Components

### 1. Cloudflare Tunnel
- **Name**: `chaycards-api`
- **Tunnel ID**: `6c780a88-8816-46f3-8e89-fd866d5006fd`
- **DNS**: `api.chaycards.com` → `localhost:7243`
- **Benefits**:
  - Zero-config HTTPS (no certificates needed)
  - Bypasses firewalls and NAT
  - Production-ready security
  - Same URL works everywhere

### 2. Express API Server
- **Port**: 7243 (uncommon port for basic security)
- **Endpoints**:
  - `GET /api/storage/:key` - Get value
  - `POST /api/storage` - Set value
  - `DELETE /api/storage/:key` - Delete value
  - `GET /api/storage` - List all keys
  - `POST /api/storage/clear` - Clear all data
  - `GET /api/storage/has/:key` - Check if key exists
- **Features**:
  - Full JSONB support
  - Comprehensive CORS configuration
  - Request/response logging
  - Error handling with proper HTTP codes

### 3. CORS Configuration
Configured to allow requests from:
- **Lovable domains**: `*.lovable.app`, `*.lovable.dev`, `*.lovableproject.com`
- **Production domains**: `chaycards.com`, `app.chaycards.com`
- **Development**: `http://localhost:8080`

**Critical Implementation**:
```javascript
// CORRECT: Use callback(null, false) to reject
cors({
  origin: function(origin, callback) {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // NOT: callback(new Error(...))
    }
  }
})
```

### 4. PostgreSQLAdapter
- **Hardcoded URL**: `https://api.chaycards.com/api/storage`
- **No environment variables needed**
- **Works everywhere**: Local dev, Lovable preview, production
- **Comprehensive logging** for debugging

## Key Benefits

### 1. Simplified Development
- No environment-specific configuration
- No `.env` files needed
- Same URL works in all environments
- Lovable preview can access local database

### 2. Production-Ready
- HTTPS without certificate management
- Same code works in dev/preview/production
- Ready to deploy to VPS/Railway (just deploy Express)
- No breaking changes needed for CI/CD

### 3. Security
- Cloudflare provides enterprise-grade security
- No exposed ports on local machine
- CORS properly configured
- Uncommon port (7243) adds obscurity

### 4. Developer Experience
- Instant HTTPS for local development
- No firewall configuration needed
- No ngrok/localtunnel complexity
- Clean, simple architecture

## Important Learnings

### CORS Error Handling
**WRONG**:
```javascript
if (!allowedOrigins.includes(origin)) {
  callback(new Error('Not allowed by CORS')); // Crashes requests!
}
```

**CORRECT**:
```javascript
if (!allowedOrigins.includes(origin)) {
  callback(null, false); // Properly rejects
}
```

### Cloudflare Tunnel Benefits
- Zero-config HTTPS (no certificates to manage)
- Bypasses firewall/NAT issues
- Production-ready security out of the box
- Persistent DNS configuration
- Free for personal use

### Hardcoded Production URLs
- Simplifies deployment
- Eliminates environment-specific bugs
- Same code everywhere (dev/preview/production)
- Works when Cloudflare routes to local machine

## Setup Instructions

### 1. Install Cloudflare Tunnel
```bash
# Download cloudflared
# Windows: Download from Cloudflare website
# Linux: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create chaycards-api

# Configure DNS
cloudflared tunnel route dns chaycards-api api.chaycards.com

# Create config file (config.yml)
tunnel: 6c780a88-8816-46f3-8e89-fd866d5006fd
credentials-file: /path/to/credentials.json

ingress:
  - hostname: api.chaycards.com
    service: http://localhost:7243
  - service: http_status:404
```

### 2. Start Services
```bash
# Terminal 1: Start PostgreSQL
cd server
docker-compose up -d

# Terminal 2: Start Express
npm install
node index.js

# Terminal 3: Start Cloudflare Tunnel
cloudflared tunnel run chaycards-api

# Terminal 4: Start Frontend
npm run dev
```

### 3. Test
```bash
# Test local API
curl http://localhost:7243/api/storage

# Test through tunnel
curl https://api.chaycards.com/api/storage
```

## Future Deployment

When deploying to production:
1. Deploy Express to VPS/Railway/Heroku
2. Update Cloudflare Tunnel to point to production server
3. Or remove tunnel and point DNS directly to VPS
4. No code changes needed - same URL works!

## Files Modified (October 1, 2025)

- `/server/index.js` - Port 7243, fixed CORS callback
- `/src/shared/storage/PostgreSQLAdapter.ts` - Hardcoded URL, added logging
- `/vite.config.ts` - Removed proxy (no longer needed)
- `.env` - Removed (no longer needed)

## Troubleshooting

### CORS Errors
- Check origin is in allowedOrigins list in `server/index.js`
- Verify callback uses `callback(null, false)` not error throwing
- Check Express logs for rejected origins

### Connection Errors
- Verify Cloudflare tunnel is running
- Check Express is listening on port 7243
- Verify PostgreSQL is running (port 5433)
- Check PostgreSQLAdapter logging for details

### Database Errors
- Verify PostgreSQL container is running: `docker ps`
- Check connection string in `server/index.js`
- Verify credentials match `server/.env.example`

## Conclusion

This infrastructure provides a production-ready foundation that:
- Works identically in all environments
- Eliminates configuration complexity
- Provides enterprise-grade security
- Enables seamless development-to-production flow
- Supports current Lovable preview needs
- Ready for future CI/CD deployment
