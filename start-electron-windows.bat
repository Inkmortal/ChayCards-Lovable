@echo off
title ChayCards Electron Launcher

echo ========================================
echo ChayCards - Starting Electron
echo ========================================
echo.

:: Check if Vite dev server is running
echo Checking Vite dev server...
curl -s http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Vite dev server not running!
    echo Please run "npm run dev" in WSL first.
    echo.
    pause
    exit /b 1
)
echo Vite: RUNNING on port 8080
echo.

:: Check Electron and better-sqlite3 versions
echo Checking installed versions...
for /f "tokens=*" %%i in ('node -p "require('./node_modules/electron/package.json').version"') do set ELECTRON_VERSION=%%i
echo Electron version: %ELECTRON_VERSION%

:: Check if better-sqlite3 needs rebuilding for Electron
if not exist ".electron-rebuilt" (
    echo.
    echo ===========================================
    echo First-time setup: Rebuilding native modules
    echo ===========================================
    echo.

    :: Activate conda environment to get Python in PATH
    call C:\Users\danhc\miniconda3\condabin\conda.bat activate base

    :: Verify Python is available
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python not found even after conda activation!
        pause
        exit /b 1
    )

    :: Delete old build to force clean rebuild
    echo Cleaning old better-sqlite3 build...
    if exist "node_modules\better-sqlite3\build" (
        rmdir /s /q "node_modules\better-sqlite3\build"
    )

    :: Install electron-rebuild if not present
    if not exist "node_modules\@electron\rebuild" (
        echo Installing @electron/rebuild...
        call npm install --save-dev @electron/rebuild
        if errorlevel 1 (
            echo ERROR: Failed to install electron-rebuild!
            pause
            exit /b 1
        )
    )

    :: Rebuild better-sqlite3 for Electron with explicit version
    echo.
    echo Rebuilding better-sqlite3 for Electron %ELECTRON_VERSION%...
    call npx electron-rebuild -f -w better-sqlite3 --version %ELECTRON_VERSION%
    if errorlevel 1 (
        echo ERROR: Failed to rebuild better-sqlite3!
        pause
        exit /b 1
    )

    :: Create marker file to skip rebuild next time
    echo. > .electron-rebuilt
    echo.
    echo ===========================================
    echo Setup complete! Launching Electron...
    echo ===========================================
    echo.
)

:: Set environment
set ELECTRON_DEV_URL=http://localhost:8080
set NODE_ENV=development

:: Launch Electron from node_modules (not node_modules_win)
echo Launching Electron %ELECTRON_VERSION% from node_modules...
node_modules\.bin\electron.cmd .

echo.
echo Electron closed.
pause
