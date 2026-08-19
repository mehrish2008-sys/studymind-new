@echo off
cd /d "%~dp0"
echo.
echo StudyMind is starting...
echo.
if not exist node_modules (
  echo Installing dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Please send a screenshot of this window before changing anything.
    pause
    exit /b 1
  )
)
call npm run dev
pause
