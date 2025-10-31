@echo off
REM ChayCards Docker Log Viewer - Interactive Menu (Windows)

echo ========================================
echo ChayCards Docker Logs
echo ========================================
echo.
echo 1) View all logs (follow live)
echo 2) View all logs (last 100 lines)
echo 3) API logs (port 3101)
echo 4) PostgreSQL logs (port 5433)
echo 5) Qdrant logs (ports 6333-6334)
echo 6) Embedding server logs (port 8765)
echo 7) Notion PM logs (port 3001)
echo 8) Cloudflare tunnel logs
echo 9) Errors only (all services)
echo 10) Warnings and errors only
echo 0) Exit
echo.
set /p choice="Choose option: "

if "%choice%"=="1" (
    echo Following all logs... ^(Ctrl+C to exit^)
    docker-compose logs -f --timestamps
    goto :end
)
if "%choice%"=="2" (
    echo Last 100 lines from all services:
    docker-compose logs --tail=100 --timestamps
    goto :end
)
if "%choice%"=="3" (
    echo Following API logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-api
    goto :end
)
if "%choice%"=="4" (
    echo Following PostgreSQL logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-postgres
    goto :end
)
if "%choice%"=="5" (
    echo Following Qdrant logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-qdrant
    goto :end
)
if "%choice%"=="6" (
    echo Following Embedding server logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-embedding
    goto :end
)
if "%choice%"=="7" (
    echo Following Notion PM logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-notion-pm
    goto :end
)
if "%choice%"=="8" (
    echo Following Cloudflare tunnel logs... ^(Ctrl+C to exit^)
    docker logs -f chaycards-cloudflared
    goto :end
)
if "%choice%"=="9" (
    echo Errors from all services:
    docker-compose logs 2^>^&1 | findstr /I /R "error fail fatal exception"
    goto :end
)
if "%choice%"=="10" (
    echo Warnings and errors from all services:
    docker-compose logs 2^>^&1 | findstr /I /R "error warn fail fatal exception"
    goto :end
)
if "%choice%"=="0" (
    echo Exiting...
    exit /b 0
)

echo Invalid option
exit /b 1

:end
pause
