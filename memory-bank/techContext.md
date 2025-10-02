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
npm run dev          # Start Vite dev server
npm run dev:electron # Start Electron with Vite
npm run build        # Build for production
npm run preview      # Preview production build
```

### Development Workflow
1. Make changes in `src/`
2. Vite hot-reloads automatically
3. Test in browser at localhost:8080
4. Test in Electron with `npm run dev:electron`
5. Check both platforms before committing

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