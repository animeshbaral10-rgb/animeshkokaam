@echo off
REM Batch script to start backend in background
cd /d %~dp0
start "Backend Server" /min cmd /c "npm run start:dev"
echo Backend server started in background window.

