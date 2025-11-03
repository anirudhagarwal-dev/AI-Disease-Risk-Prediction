# FalconBoys Backend Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting FalconBoys Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ Backend is already running on port 4000!" -ForegroundColor Red
    Write-Host "   Kill it first or use a different port." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
catch {
    Write-Host "✓ Port 4000 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend will start on: http://localhost:4000" -ForegroundColor Green
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Change to server directory and start
Set-Location server
node server-simple.cjs

