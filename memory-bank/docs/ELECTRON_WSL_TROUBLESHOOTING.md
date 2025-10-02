# Electron + WSL Development Setup - Troubleshooting Guide

## Overview

ChayCards uses a dual-environment setup:
- **WSL (Linux)**: Runs Vite dev server, handles all code development
- **Windows**: Runs Electron for proper native UI rendering

This setup requires careful management of native Node modules.

## The Critical Rule

**ALWAYS run `npm install` from Windows Command Prompt, NEVER from WSL!**

## How It Works

### Single node_modules Strategy (Current - CORRECT ✅)

```
node_modules/
├── (JavaScript/TypeScript source files)  ← WSL Vite reads these
├── better-sqlite3/
│   └── build/Release/
│       └── better_sqlite3.node           ← Windows binary (Electron uses this)
├── electron/
│   ├── dist/electron.exe                 ← Windows Electron
│   └── path.txt                          ← Points to electron.exe
└── .bin/
    └── electron.cmd                      ← Windows batch wrapper
```

**Why this works:**
- WSL Vite only reads `.js`, `.ts`, `.json` files (platform-agnostic)
- Windows Electron uses `.node` binaries and `.exe` files (Windows-specific)
- They don't conflict because they access different file types!

### Old Broken Approach (DO NOT USE ❌)

Having separate `node_modules_win/` caused version mismatches and ABI incompatibility.

## Common Errors and Solutions

### Error: "NODE_MODULE_VERSION mismatch"

```
Error: The module 'better_sqlite3.node' was compiled against a different Node.js version using
NODE_MODULE_VERSION 135. This version of Node.js requires NODE_MODULE_VERSION 139.
```

**Root Cause:** better-sqlite3 was compiled for wrong Electron version

**Solution:**
1. Delete `.electron-rebuilt` marker:
   ```bash
   rm .electron-rebuilt
   ```

2. Run from Windows:
   ```cmd
   rmdir /s /q node_modules\better-sqlite3\build
   npx electron-rebuild -f -w better-sqlite3 --version 38.2.0
   ```

3. The batch script will now rebuild on next run

### Error: "Cannot find module 'better-sqlite3'"

**Root Cause:** better-sqlite3 not installed or symlink broken

**Solution:**
1. From Windows Command Prompt:
   ```cmd
   npm install better-sqlite3
   ```

2. Delete old rebuild marker:
   ```cmd
   del .electron-rebuilt
   ```

3. Run `start-electron-windows.bat`

### Error: "electron.cmd is not recognized"

**Root Cause:** Electron not properly installed in node_modules

**Solution:**
1. Check if electron exists:
   ```cmd
   dir node_modules\electron
   ```

2. If missing or broken, reinstall from Windows:
   ```cmd
   npm install electron
   ```

3. Verify `node_modules\electron\path.txt` exists and contains `electron.exe`

### Error: "no such column: user_id" (SQLite)

**Root Cause:** Old database schema from before user authentication was added

**Solution:**
1. Delete old database from WSL:
   ```bash
   cmd.exe /c "del /q %APPDATA%\chaycards\storage.db"
   ```

2. Recreate with correct schema:
   ```bash
   sqlite3 "/mnt/c/Users/danhc/AppData/Roaming/chaycards/storage.db" << 'EOF'
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     profile_name TEXT NOT NULL,
     has_password INTEGER DEFAULT 0,
     password_hash TEXT,
     created_at INTEGER DEFAULT (strftime('%s', 'now'))
   );

   CREATE TABLE storage (
     key TEXT NOT NULL,
     value TEXT NOT NULL,
     user_id TEXT NOT NULL,
     updated_at INTEGER DEFAULT (strftime('%s', 'now')),
     PRIMARY KEY (key, user_id),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );

   CREATE INDEX idx_storage_user_id ON storage(user_id);
   EOF
   ```

## Batch Script Breakdown

### start-electron-windows.bat

```bat
# 1. Check Vite is running
curl -s http://localhost:8080

# 2. Show Electron version (debugging aid)
node -p "require('./node_modules/electron/package.json').version"

# 3. Rebuild better-sqlite3 if needed (first run only)
if not exist ".electron-rebuilt" (
    # Delete old build
    rmdir /s /q "node_modules\better-sqlite3\build"

    # Rebuild with EXPLICIT version flag (critical!)
    npx electron-rebuild -f -w better-sqlite3 --version %ELECTRON_VERSION%

    # Create marker to skip next time
    echo. > .electron-rebuilt
)

# 4. Launch Electron from node_modules
node_modules\.bin\electron.cmd .
```

**Key Points:**
- Deletes old build before rebuild (ensures clean compilation)
- Passes `--version` explicitly (fixes auto-detection failures in dual environment)
- Uses `node_modules\.bin\electron.cmd` (NO node_modules_win references!)

## Development Workflow

### Setting Up (First Time)

1. **Install dependencies from Windows:**
   ```cmd
   cd C:\Users\danhc\Documents\Projects\ChayCards-Lovable
   npm install
   ```

2. **Start Vite dev server from WSL:**
   ```bash
   npm run dev
   ```

3. **Launch Electron from Windows:**
   ```cmd
   start-electron-windows.bat
   ```

### Daily Development

1. **WSL Terminal:** Keep `npm run dev` running
2. **Windows:** Run `start-electron-windows.bat` when testing

### Adding New Dependencies

**ALWAYS from Windows Command Prompt:**
```cmd
npm install <package-name>
```

If the package has native modules (like better-sqlite3):
1. Delete `.electron-rebuilt`
2. Run batch script (will rebuild automatically)

## Debugging Tips

### Check Electron Version
```cmd
node -p "require('./node_modules/electron/package.json').version"
```

### Check better-sqlite3 Build
```cmd
dir node_modules\better-sqlite3\build\Release
```
Should show `better_sqlite3.node` file

### Check Electron Path
```cmd
type node_modules\electron\path.txt
```
Should output: `electron.exe`

### View SQLite Database Location
Electron database is at:
```
%APPDATA%\chaycards\storage.db
```
Or in full path:
```
C:\Users\danhc\AppData\Roaming\chaycards\storage.db
```

### Verify Database Schema
From WSL:
```bash
sqlite3 "/mnt/c/Users/danhc/AppData/Roaming/chaycards/storage.db" ".schema"
```

## Prevention Checklist

- [ ] ✅ Run `npm install` from Windows Command Prompt
- [ ] ✅ Check Electron version matches in package.json
- [ ] ✅ Delete `.electron-rebuilt` when changing Electron version
- [ ] ✅ Verify `start-electron-windows.bat` uses `node_modules\.bin\electron.cmd`
- [ ] ✅ Keep WSL Vite dev server running on port 8080
- [ ] ✅ Never hardcode database migrations in main.cjs
- [ ] ✅ Use bash/sqlite3 commands for manual database fixes

## Understanding ABI Versions

**What is ABI (Application Binary Interface)?**
- Number that identifies Node.js native module compatibility
- Different Node.js versions have different ABIs
- Native modules (`.node` files) must match the EXACT ABI

**Electron's ABI:**
- Electron embeds its own Node.js version
- Electron 36.9.3 → Node.js with ABI 135
- Electron 38.2.0 → Node.js with ABI 139
- **Critical:** Must rebuild native modules for Electron's specific ABI!

**Why electron-rebuild exists:**
- Regular `npm install` compiles for system Node.js ABI
- Electron needs modules compiled for its embedded Node.js ABI
- `electron-rebuild` recompiles modules using Electron's headers

**The --version flag importance:**
In dual WSL/Windows environments, electron-rebuild's auto-detection can fail. Always pass explicit version:
```bash
npx electron-rebuild -f -w better-sqlite3 --version 38.2.0
```

## Quick Reference

### Working Setup (Current)
```
✅ Single node_modules (Windows-compiled)
✅ npm install from Windows
✅ Vite from WSL
✅ Electron from Windows
✅ Batch script with --version flag
```

### Broken Setups (Avoid)
```
❌ npm install from WSL (Linux binaries)
❌ Dual node_modules + node_modules_win (version mismatch)
❌ electron-rebuild without --version flag (auto-detection fails)
❌ Hardcoded database migrations (runs on every launch)
```

## When All Else Fails

**Nuclear Option - Complete Reset:**

1. Delete everything:
   ```cmd
   rmdir /s /q node_modules
   del package-lock.json
   del .electron-rebuilt
   del %APPDATA%\chaycards\storage.db
   ```

2. Fresh install from Windows:
   ```cmd
   npm install
   ```

3. Start Vite from WSL:
   ```bash
   npm run dev
   ```

4. Run Electron from Windows:
   ```cmd
   start-electron-windows.bat
   ```

This ensures everything is in a known-good state.
