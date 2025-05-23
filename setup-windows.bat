@echo off
echo Setting up Windows environment for Electron...

REM Create separate node_modules for Windows
if not exist node_modules_win (
    echo Creating Windows-specific node_modules directory...
    mkdir node_modules_win
)

REM Copy package.json to temporary location
copy package.json package-win.json

REM Install dependencies in Windows environment
echo Installing dependencies for Windows...
npm install --prefix . --modules-folder node_modules_win

echo Windows setup complete!
echo.
echo To run Electron from Windows:
echo   npm run electron:win
echo.
echo To run web dev server from WSL:
echo   npm run dev
pause