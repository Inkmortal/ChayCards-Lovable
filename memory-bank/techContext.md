# Tech Context

## Technologies Used

### Core Stack
- **Electron** (v36.2.1) - Desktop application framework
- **React** (v18.3.1) - UI framework
- **TypeScript** (v5.7.3) - Type safety
- **Vite** (v5.4.10) - Build tool and dev server
- **TailwindCSS** (v3.4.17) - Utility-first CSS
- **Express.js** - Backend API server (port 7243)

### Infrastructure
- **Cloudflare Tunnel** - Zero-config HTTPS for local development and production
  - Tunnel: `chaycards-api` (ID: `6c780a88-8816-46f3-8e89-fd866d5006fd`)
  - DNS: `api.chaycards.com` → `localhost:7243`
  - Enables Lovable preview to access local PostgreSQL
  - Production-ready security without certificates
- **PostgreSQL** (v17.2) - Cloud database via Docker Compose (port 5433)
- **SQLite** (better-sqlite3) - Local database for Electron

### UI Libraries
- **shadcn/ui** - Component library
- **Radix UI** - Unstyled accessible components
- **Lucide React** - Icon library
- **React Router** (v7.1.1) - Client-side routing

### Development Tools
- **npm** - Package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **concurrently** - Run multiple processes

### Future Additions (Planned)
- **esbuild** - Plugin compilation
- **JWT** - Authentication
- **Redis** - Caching (cloud)
- **Railway/VPS** - Production Express deployment

## Development Setup

### Prerequisites
- Node.js 16+
- Git
- VS Code (recommended)

### Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd ChayCards-Loveable

# Install dependencies
npm install

# Run development
npm run dev          # Web only
npm run dev:electron # Electron + Web
```

### Project Configuration

#### TypeScript Config
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Path aliases: `@/` maps to `./src/`

#### Vite Config
- React plugin with SWC
- Lovable tagger (dev only)
- Port: 8080
- Path resolution for `@/` alias

#### Tailwind Config
- Content paths configured
- Custom theme extensions supported
- CSS variables for theming

## Technical Constraints

### Platform Differences
1. **Electron Main Process**
   - Uses CommonJS (`.cjs` files)
   - Has Node.js access
   - Manages windows and system

2. **Renderer Process**
   - Uses ES Modules
   - No direct Node.js access
   - Communicates via preload bridge

### Build Constraints
- Must maintain Lovable compatibility
- Keep gptengineer.js script in index.html
- Use lovable-tagger in development

### Security Constraints
- Context isolation enabled
- No node integration in renderer
- Preload script bridges communication
- Plugins must be sandboxed

## Dependencies

### Critical Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^7.1.1",
  "electron": "^36.2.1",
  "@vitejs/plugin-react-swc": "^3.7.3",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.7.3",
  "vite": "^5.4.10"
}
```

### Development Dependencies
- `concurrently` - Parallel process execution
- `electron-builder` - App packaging
- `lovable-tagger` - Component tracking
- `@types/*` - TypeScript definitions

## Tool Usage Patterns

### npm Scripts
```bash
npm run dev          # Start Vite dev server (port 8080)
npm run dev:electron # Start Electron with Vite
npm run electron:win # Run Electron from Windows (see dual env setup)
npm run server       # Start backend API server (port 7243, Windows only)
npm run notion-pm:server    # Start Notion PM sync server (port 3001)
npm run notion-pm:sync      # One-time sync from Notion database
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run build:electron # Build Electron app with electron-builder
npm run build:mobile # Build for Capacitor (iOS/Android)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

**Important: Backend Server Environment**
- `npm run server` MUST run from Windows Command Prompt (not WSL)
- Required for login/authentication to work
- Cloudflare tunnel on Windows routes to Windows localhost:7243
- WSL localhost and Windows localhost are different network namespaces

### Development Workflow
1. **Start Backend (Windows)**: Run `npm run server` from Windows Command Prompt
2. **Start Frontend (WSL)**: Run `npm run dev` from WSL terminal
3. Make changes in `src/`
4. Vite hot-reloads automatically
5. Test in browser at localhost:8080
6. Test login/auth features (requires backend server running)
7. Test in Electron with `npm run dev:electron` (Windows)
8. Check both platforms before committing

**Multi-Terminal Setup:**
- Terminal 1 (Windows): `npm run server` - Backend API on port 7243
- Terminal 2 (WSL): `npm run dev` - Vite dev server on port 8080
- Terminal 3 (Windows, optional): `npm run notion-pm:server` - Notion PM sync on port 3001

### Build Process
1. Vite builds React app to `dist/`
2. Electron Builder packages with `dist/`
3. Output: installable application

### Debugging
- Browser DevTools for web
- Electron DevTools for desktop
- React DevTools extension
- VS Code debugger for backend

## Environment Configuration

### No Environment Variables Needed ✅
The application uses hardcoded production URLs that work in all environments:
- PostgreSQLAdapter: `https://api.chaycards.com/api/storage`
- Works identically in local dev, Lovable preview, and production
- Cloudflare Tunnel routes production URL to local machine during development

### Legacy .env Removed (October 1, 2025)
- Previously used VITE_API_URL for environment-specific URLs
- Removed in favor of single production URL
- Simplifies deployment and eliminates environment-specific bugs

### Platform Detection
```typescript
// Runtime detection, not env-based
const isElectron = window.electronAPI !== undefined
```

### Storage Mode Selection
Users choose storage mode during setup:
- **Local**: SQLite in Electron (offline-first)
- **Sync**: SQLite + cloud sync (planned)
- **Cloud**: PostgreSQL via `https://api.chaycards.com`

### File Storage Architecture

**Files as Entity Properties**: Unified storage system where files attach to entities

#### Core Concept
Files are NOT independent entities - they are **properties attached to data entities**:
```typescript
// Store entity with optional binary files
await storage.set('documents:doc-123',
  { title: 'Q4 Report', tags: ['finance'] },
  { pdf: pdfData, thumbnail: thumbnailData }
);

// Retrieve entity with files
const result = await storage.get('documents:doc-123');
// Returns: { data: { title, tags }, files: { pdf: Uint8Array, thumbnail: Uint8Array } }

// Delete entity (files cascade automatically)
await storage.delete('documents:doc-123');
```

#### Unified API (Phase 1 - To Be Implemented)
- `set(key, data, files?)` - Store entity with optional binary files
- `get(key)` - Returns `{ data, files }` or `null`
- `delete(key)` - Cascades to delete attached files (database enforced)
- `list(prefix?)`, `has(key)`, `clear()` - Unchanged

**Key Benefits**:
- ✅ No orphaned files (CASCADE DELETE enforced by database FK)
- ✅ Atomic operations (entity + files in single transaction)
- ✅ Simpler plugin code (no manual file tracking)
- ✅ User scoping automatic (composite keys prevent cross-user access)

#### Database Schema

**SQLite (Electron)**:
```sql
-- Entity storage (existing)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value TEXT NOT NULL,  -- JSON data
  user_id TEXT NOT NULL,
  PRIMARY KEY (key, user_id)
);

-- File storage (new, with CASCADE DELETE)
CREATE TABLE files (
  storage_key TEXT NOT NULL,     -- FK to storage.key
  field_name TEXT NOT NULL,      -- Arbitrary: pdf, thumbnail, avatar
  hash TEXT NOT NULL,            -- SHA-256 for deduplication
  metadata JSONB,                -- {mimeType, fileName, size}
  user_id TEXT NOT NULL,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);
```

**PostgreSQL (Cloud)**:
```sql
-- Entity storage (existing)
CREATE TABLE storage (
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  user_id UUID NOT NULL,
  PRIMARY KEY (key, user_id)
);

-- File storage (new, with CASCADE DELETE)
CREATE TABLE files (
  storage_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,     -- Binary data inline
  metadata JSONB,
  user_id UUID NOT NULL,
  PRIMARY KEY (storage_key, field_name, user_id),
  FOREIGN KEY (storage_key, user_id)
    REFERENCES storage(key, user_id) ON DELETE CASCADE
);
```

#### Local Strategy (Electron)
- Files in `{userData}/files/` with SHA-256 hash filenames
- Metadata in SQLite `files` table
- Content-based deduplication (same file uploaded twice = one copy on disk)
- **No size limits** (constrained only by disk space)
- Example: `C:\Users\{user}\AppData\Roaming\ChayCards\files\a3f8d9e2b1c4.jpg`

#### Cloud Strategy (PostgreSQL)
- Files stored in BYTEA column (Phase 1)
- **Payment plan quotas**: Free (10MB/100MB), Pro (500MB/10GB), Enterprise (unlimited)
- Testable locally via Docker PostgreSQL
- **Future (Phase 3)**: Migrate BYTEA → S3 (CloudFlare R2, Backblaze B2)

#### Testing Locally
```bash
# PostgreSQL cloud flow
docker-compose up postgres  # localhost:5433
npm run server              # API on localhost:7243
npm run dev                 # Vite on localhost:8080

# Electron local flow
npm run dev                 # WSL: Vite dev server
npm run electron:win        # Windows: Electron app
# Files: %APPDATA%\ChayCards\files\
```

**Complete specification**: `/memory-bank/docs/FILE_STORAGE_SPEC.md`