@echo off
REM Batch script to start both frontend and backend with port cleanup
echo Starting Real time location tracking system for pets...

REM Start backend in background
echo Starting backend server...
start "Backend Server" /min cmd /c "cd backend && npm run start:dev"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend server...
set BROWSER=chrome
npm run dev

