# Dual Environment Setup Guide

This guide explains how to develop ChayCards using Claude in WSL while testing Electron on Windows.

## Overview

- **WSL**: Run web development server and use Claude for coding
- **Windows**: Test Electron app with native Windows rendering

## Initial Setup

### 1. Windows Setup (Run once from Windows)

Open PowerShell or Command Prompt in the project directory and run:

```cmd
npm run setup:win
```

This creates a separate `node_modules_win` directory for Windows dependencies.

### 2. Update .gitignore

Add to your `.gitignore`:
```
node_modules_win/
```

## Development Workflow

### Step 1: Start Web Dev Server (WSL)

In WSL terminal with Claude:
```bash
npm run dev
```

This starts Vite on http://localhost:5173

### Step 2: Run Electron (Windows)

Option A - Using PowerShell (Recommended):
```powershell
.\run-electron-windows.ps1
```

Option B - Using npm script:
```cmd
npm run electron:win
```

## How It Works

1. **Separate node_modules**: Windows uses `node_modules_win` to avoid conflicts with WSL's `node_modules`
2. **Shared source code**: Both environments use the same `/src` directory
3. **Network connectivity**: Electron on Windows connects to Vite dev server running in WSL via localhost
4. **Hot reload**: Changes in WSL are instantly reflected in the Windows Electron app

## Troubleshooting

### Issue: "Cannot find module" errors in Windows
**Solution**: Run `npm run setup:win` again to reinstall Windows dependencies

### Issue: Electron can't connect to Vite
**Solution**: Ensure Vite is running in WSL and check Windows Firewall settings

### Issue: Different Node versions between WSL and Windows
**Solution**: Use nvm in both environments to sync Node versions

## Benefits

- ✅ Claude can access and test the web interface via MCP in WSL
- ✅ Electron renders with native Windows UI (no WSL rendering issues)
- ✅ Single codebase, dual testing environments
- ✅ Hot reload works across environments
- ✅ No need to install dependencies twice for development

## Notes

- Production builds should still be done in one environment consistently
- The `node_modules_win` directory is only for local Windows testing
- Source code changes in either environment are immediately available to both