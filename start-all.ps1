# PowerShell script to start both frontend and backend
Write-Host "Starting Real time location tracking system for pets..." -ForegroundColor Cyan

# Function to kill process on port
function Kill-Port {
    param([int]$Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Killed process $pid using port $Port" -ForegroundColor Green
            } catch {
                # Process might already be dead
            }
        }
        Start-Sleep -Seconds 1
    }
}

# Start backend in background
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendScript = @"
cd '$PSScriptRoot\backend'
npm run start:dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Minimized

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Set-Location $PSScriptRoot

# Set environment variables for frontend
$env:BROWSER = "chrome"
npm run dev

