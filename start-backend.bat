@echo off
echo ========================================
echo   Starting FalconBoys Backend Server
echo ========================================
echo.

cd server

echo Checking if backend is already running...
curl -s http://localhost:4000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo.
    echo [91mBackend is already running on port 4000![0m
    echo Kill it first or use a different port.
    echo.
    pause
    exit /b 1
)

echo Starting backend server...
echo.
echo [92mBackend will start on: http://localhost:4000[0m
echo [93mPress Ctrl+C to stop the server[0m
echo.
echo ----------------------------------------
echo.

node server-simple.cjs

pause

