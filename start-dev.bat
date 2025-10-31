@echo off
REM Cross-platform startup script (Windows)
REM Starts all ChayCards Docker services

echo 🚀 Starting ChayCards development environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker is not running. Please start Docker Desktop first.
  pause
  exit /b 1
)

REM Check if .env exists
if not exist .env (
  echo ⚠️  No .env file found. Copying from .env.example...
  copy .env.example .env >nul
  echo ✓ Created .env file. Please edit it with your API keys.
  echo.
)

REM Check for Cloudflare tunnel credentials
if not exist cloudflared-credentials.json (
  echo ⚠️  cloudflared-credentials.json not found
  echo    API will not be accessible at api.chaycards.com
  echo    Copy cloudflared-credentials.json.example and add your credentials
  echo.
)

REM Start all services
echo Starting Docker services...
docker-compose --profile all up -d

echo.
echo ✨ All services started!
echo.
echo 📊 Service URLs:
echo   PostgreSQL:     localhost:5433
echo   Express API:    http://localhost:3101
echo   Qdrant:         http://localhost:6333
echo   Embedding:      http://localhost:8765
echo   Notion PM:      http://localhost:3001
echo   Public API:     https://api.chaycards.com (via Cloudflare tunnel)
echo.
echo 💡 Commands:
echo   npm run dev              # Start Vite dev server
echo   npm run check:services   # Health check all services
echo   npm run logs             # Interactive log viewer
echo   npm run docker:ui        # Lazydocker TUI (recommended)
echo   npm run stop             # Stop all services
echo.
pause
