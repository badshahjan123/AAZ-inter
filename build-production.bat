@echo off
echo ========================================
echo AAZ International - Production Build
echo ========================================
echo.

cd frontend

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Building for production...
call npm run build

echo.
echo [3/3] Build complete!
echo.
echo Deploy the 'frontend/dist' folder to Netlify
echo.
pause
