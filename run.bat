@echo off
title NeuroVision - AI Attendance Management System
echo ============================================================
echo Starting NeuroVision Smart AI Attendance System...
echo ============================================================

echo Starting Backend Server on port 5000...
start "NeuroVision Backend" cmd /k "cd server && npm start"

timeout /t 2 /nobreak >nul

echo Starting Frontend on Vite...
start "NeuroVision Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening NeuroVision in your default browser...
start http://localhost:5174/

echo ============================================================
echo NeuroVision is running!
echo Frontend: http://localhost:5174/
echo Backend:  http://localhost:5000/
echo ============================================================
