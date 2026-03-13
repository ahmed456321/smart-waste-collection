@echo off
title Smart Waste GLOBAL Launcher
echo [1/3] Cleaning up active connections...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %%a 2>nul

echo [2/3] Starting Backend Server...
start /b node backend/server.js

echo [3/3] SECURING GLOBAL BRIDGE...
echo ---------------------------------------------------
echo 🚨 IMPORTANT: COPY THE LINK THAT STARTS WITH https://
echo ---------------------------------------------------
ssh -p 443 -R 0:127.0.0.1:5000 a.pinggy.io
pause
