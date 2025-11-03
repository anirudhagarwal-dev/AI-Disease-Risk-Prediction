@echo off
cls
echo ========================================
echo   FalconBoys Backend Server
echo ========================================
echo.
echo Starting backend on http://localhost:4000
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

cd server
node server-simple.cjs

pause

