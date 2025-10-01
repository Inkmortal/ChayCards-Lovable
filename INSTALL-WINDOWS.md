# Windows Setup Instructions

Run these commands from **Windows PowerShell** in the project directory:

## Step 1: Configure npm to use your Python installation

```powershell
# Find where Python is installed
where python

# Then configure npm to use it (use the path from the command above)
npm config set python "C:\Users\danhc\AppData\Local\Programs\Python\Python312\python.exe"

# Verify it's set
npm config get python
```

## Step 2: Install Visual Studio Build Tools (if not already installed)

Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

During installation, select:
- ✅ Desktop development with C++

OR use this shortcut:
```powershell
npm install --global --production windows-build-tools
```
(This might fail but it's okay if you have Visual Studio Build Tools already)

## Step 3: Run the Windows setup

```powershell
.\start-electron-windows.bat
```

This will install node_modules_win with better-sqlite3 compiled for Windows.
