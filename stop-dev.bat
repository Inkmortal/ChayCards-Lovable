@echo off
REM ChayCards Development Environment - Stop Script (Windows)
REM Stops all Docker services and kills orphaned processes

setlocal enabledelayedexpansion

echo ========================================
echo ChayCards - Stop Development Services
echo ========================================
echo.

REM Parse arguments
set REMOVE_VOLUMES=0
if "%1"=="--volumes" set REMOVE_VOLUMES=1
if "%1"=="-v" set REMOVE_VOLUMES=1
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)

echo [1/4] Stopping Docker containers...
echo.

if %REMOVE_VOLUMES%==1 (
    echo Stopping containers and removing volumes...
    docker-compose down --volumes
) else (
    docker-compose down
)

if errorlevel 1 (
    echo [WARNING] Docker Compose encountered an error
) else (
    echo [OK] Docker containers stopped
)
echo.

echo [2/4] Killing orphaned processes on ports...
echo.

REM Stop Vite via PID file first
wsl bash -c "[ -f .vite.pid ] && kill \$(cat .vite.pid) 2>/dev/null || true && rm -f .vite.pid" 2>nul

REM Stop Embedding Watcher via PID file
wsl bash -c "[ -f .embedding-watcher.pid ] && kill \$(cat .embedding-watcher.pid) 2>/dev/null || true && rm -f .embedding-watcher.pid" 2>nul
echo [OK] Stopped Embedding Watcher

REM Kill any remaining process on port 8080 (only host-exposed service)
call :kill_port 8080 "Vite Dev Server"

REM Note: Docker services don't expose ports to host anymore

echo.
echo [3/4] Killing Electron processes...
echo.

tasklist /FI "IMAGENAME eq electron.exe" 2>nul | find /I "electron.exe" >nul
if not errorlevel 1 (
    taskkill /F /IM electron.exe >nul 2>&1
    echo [OK] Killed Electron processes
) else (
    echo [SKIP] No Electron processes running
)

echo.
echo [4/4] Cleanup complete
echo.

echo ========================================
echo All services stopped successfully!
echo ========================================
echo.

if %REMOVE_VOLUMES%==1 (
    echo [NOTE] Docker volumes have been removed
    echo       All database data has been wiped
    echo.
)

exit /b 0

REM Function to kill process on a specific port
:kill_port
set PORT=%1
set SERVICE=%~2

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
    set PID=%%a
    if not "!PID!"=="0" (
        tasklist /FI "PID eq !PID!" 2>nul | find "!PID!" >nul
        if not errorlevel 1 (
            taskkill /F /PID !PID! >nul 2>&1
            echo [OK] Killed %SERVICE% ^(port %PORT%, PID !PID!^)
            goto :kill_port_done
        )
    )
)
echo [SKIP] No process on port %PORT% ^(%SERVICE%^)
:kill_port_done
exit /b 0

:show_help
echo Usage: stop-dev.bat [OPTIONS]
echo.
echo Stop all ChayCards development services and processes
echo.
echo Options:
echo   --volumes, -v    Remove Docker volumes (wipes all data)
echo   --help, -h       Show this help message
echo.
echo Examples:
echo   stop-dev.bat              Stop services, keep data
echo   stop-dev.bat --volumes    Stop services and wipe data
echo.
exit /b 0
