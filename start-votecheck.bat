@echo off
cd /d "%~dp0"
where /q node || (echo Node.js is not installed. Download the LTS version from https://nodejs.org and run this file again. & pause & exit /b)
start "" http://localhost:3000
node server.js
pause
