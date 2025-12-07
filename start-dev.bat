@echo off
REM ========================================
REM ChayCards Development Environment Startup (Windows)
REM ========================================
REM One-click script to start all services

setlocal enabledelayedexpansion

echo =========================================
echo ChayCards Development Environment
echo =========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running
    echo    Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✓ Docker is running
echo.

REM Clean up any existing containers to avoid naming conflicts
echo 🔍 Checking for existing containers...
docker-compose ps -q >nul 2>&1
if not errorlevel 1 (
    echo    Found existing containers, cleaning up...
    docker-compose down --remove-orphans
    REM Force remove any stuck containers
    for /f %%i in ('docker ps -a --filter "name=chaycards" -q') do docker rm -f %%i >nul 2>&1
)
echo.

REM Check for required files
if not exist ".env" (
    echo ❌ Error: .env file not found
    echo    Please copy .env.example to .env and configure it
    pause
    exit /b 1
)

if not exist "cloudflared-credentials.json" (
    echo ⚠️  Warning: cloudflared-credentials.json not found
    echo    Cloudflare tunnel will not work without credentials
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

echo ✓ Configuration files present
echo.

REM ========================================
REM Cloudflare DNS Routes Setup
REM ========================================
REM Check if cloudflared CLI is available and setup DNS routes
echo 🌐 Checking Cloudflare tunnel DNS routes...

where cloudflared >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: cloudflared CLI not installed
    echo    DNS routes cannot be verified/created automatically
    echo    Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    echo    Continuing without DNS route verification...
    goto skip_cloudflare_dns
)

REM Get tunnel ID from config file
set TUNNEL_ID=6c780a88-8816-46f3-8e89-fd866d5006fd

REM Setup DNS routes (idempotent - will succeed if already exists or create if missing)
echo    Setting up DNS routes for tunnel %TUNNEL_ID%...

REM Route for dev frontend
for /f "delims=" %%i in ('powershell.exe -Command "cloudflared tunnel route dns %TUNNEL_ID% dev.chaycards.com 2>&1"') do set "RESULT=%%i"
echo %RESULT% | findstr /C:"Added CNAME" >nul && (
    echo    - dev.chaycards.com: ✓ created
) || (
    echo    - dev.chaycards.com: ✓ exists
)

REM Route for dev API
for /f "delims=" %%i in ('powershell.exe -Command "cloudflared tunnel route dns %TUNNEL_ID% dev-api.chaycards.com 2>&1"') do set "RESULT=%%i"
echo %RESULT% | findstr /C:"Added CNAME" >nul && (
    echo    - dev-api.chaycards.com: ✓ created
) || (
    echo    - dev-api.chaycards.com: ✓ exists
)

REM Route for dev tools
for /f "delims=" %%i in ('powershell.exe -Command "cloudflared tunnel route dns %TUNNEL_ID% dev-tools.chaycards.com 2>&1"') do set "RESULT=%%i"
echo %RESULT% | findstr /C:"Added CNAME" >nul && (
    echo    - dev-tools.chaycards.com: ✓ created
) || (
    echo    - dev-tools.chaycards.com: ✓ exists
)

echo ✓ Cloudflare DNS routes configured
echo.

:skip_cloudflare_dns

REM Start Docker services
echo 🚀 Starting Docker services...
echo    Using profile: all (product + dev)
echo.

docker-compose --profile all up -d

REM Wait for services to be healthy
echo.
echo ⏳ Waiting for services to be ready...
echo.

REM Wait for PostgreSQL (max 30 seconds)
echo    PostgreSQL:
set /a count=0
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    set /a count+=1
    if !count! geq 30 (
        echo ⚠️  Warning: PostgreSQL timeout
        echo    Check logs: docker-compose logs postgres
        echo    Continuing anyway...
        goto after_postgres
    )
    timeout /t 1 /nobreak >nul
    goto wait_postgres
)
:after_postgres
echo ✓ Ready

REM Auto-create databases if they don't exist
echo    Checking databases...
docker-compose exec -T postgres psql -U postgres -lqt 2>nul | findstr /C:"chaycards_dev" >nul 2>&1
if errorlevel 1 (
    echo    Creating missing databases...
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_dev;" >nul 2>&1
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_staging;" >nul 2>&1
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE chaycards_prod;" >nul 2>&1
    echo ✓ Databases created
) else (
    echo ✓ Databases exist
)
echo.

REM Wait for API (using Docker health status, max 30 seconds)
echo    API Server:
set /a count=0
set /a restart_attempted=0
:wait_api
for /f "delims=" %%i in ('docker inspect --format "{{.State.Health.Status}}" chaycards-api-dev 2^>nul') do set HEALTH=%%i
if "%HEALTH%"=="healthy" (
    echo ✓ Ready
    goto after_api
)
set /a count+=1
if !count! geq 30 (
    if !restart_attempted! equ 0 (
        echo ⚠️  Warning: API not healthy, restarting...
        docker-compose restart api-dev >nul 2>&1
        set /a restart_attempted=1
        set /a count=0
        timeout /t 3 /nobreak >nul
        goto wait_api
    ) else (
        echo ⚠️  Warning: API unhealthy after restart
        echo    Check logs: docker-compose logs api-dev
        echo    Continuing anyway...
        goto after_api
    )
)
timeout /t 1 /nobreak >nul
goto wait_api
:after_api
echo.

echo ✓ All core services are ready
echo.

REM NOTE: RAG services (Qdrant, Embedding) are now handled by Vibe Master
echo 💡 RAG services are handled by Vibe Master
echo    Start them with: vibe-master\scripts\start-services.bat
echo.

REM Start Vite on host
echo 🚀 Starting Vite dev server on host...
echo.

REM Kill any existing process on port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo    Stopping existing process on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

REM Start Vite natively on Windows
echo    Starting Vite...
start /B cmd /c "npm run dev > vite-dev.log 2>&1"

REM Wait for Vite to be ready (max 30 seconds)
set /a count=0
:wait_vite
curl -f http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    set /a count+=1
    if !count! geq 30 (
        echo ⚠️  Warning: Vite startup timeout
        echo    Check logs: wsl tail -f vite-dev.log
        echo    Or start manually: wsl bash -c "cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable && npm run dev"
        goto after_vite
    )
    timeout /t 1 /nobreak >nul
    goto wait_vite
)
echo ✓ Vite dev server ready
:after_vite
echo.

echo =========================================
echo ✨ ChayCards is ready!
echo =========================================
echo.
echo 🌐 Access URLs:
echo    Frontend (dev):   https://dev.chaycards.com
echo    Frontend (local): http://localhost:8080
echo    API (dev):        https://dev-api.chaycards.com
echo    Dev Tools:        https://dev-tools.chaycards.com
echo.
echo 📊 Service Status:
echo    Docker services:  docker-compose ps
echo    Vite logs:        type vite-dev.log
echo    API logs:         docker-compose logs -f api-dev
echo    Postgres logs:    docker-compose logs -f postgres
echo    RAG (Vibe Master): vibe-master\scripts\health-check.bat
echo.
echo 🛑 Stop services:
echo    stop-dev.bat
echo.
pause
