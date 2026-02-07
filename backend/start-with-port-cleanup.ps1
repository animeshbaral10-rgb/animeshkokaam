# PowerShell script to start backend with automatic port cleanup
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
            return $true
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
                        Write-Host "✅ Killed process $pid using port $Port" -ForegroundColor Green
                    }
                }
                Start-Sleep -Seconds 1
                return $true
            }
        } catch {
            # Ignore errors
        }
    }
    return $false
}

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
npm run start:dev

