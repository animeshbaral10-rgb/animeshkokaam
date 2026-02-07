# PowerShell script to start backend in background with port cleanup
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Function to kill process on port
function Kill-Port {
    param([int]$Port)
    try {
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
    } catch {
        # Fallback method using netstat
        try {
            $output = netstat -ano | findstr ":$Port"
            if ($output) {
                $pids = $output | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
                foreach ($pid in $pids) {
                    if ($pid -match '^\d+$') {
                        taskkill /PID $pid /F 2>$null
                    }
                }
                Start-Sleep -Seconds 1
            }
        } catch {
            # Ignore errors
        }
    }
}

# Start backend in background
$backendScript = @"
cd '$scriptPath'
npm run start:dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Minimized

Write-Host "Backend server started in background. Check the minimized PowerShell window." -ForegroundColor Green

