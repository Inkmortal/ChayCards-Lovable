@echo off
echo Starting ChayCards Backend Server...
echo.
echo IMPORTANT: Leave this window open while developing
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm run server

pause
