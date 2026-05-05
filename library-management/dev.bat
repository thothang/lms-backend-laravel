@echo off
echo ============================================
echo   LIBRARY MANAGEMENT - LOCAL DEV SERVER
echo   Production (Docker) se KHONG bi anh huong!
echo ============================================
echo.

REM === Override cac bien moi truong cho LOCAL ===
set APP_ENV=local
set APP_DEBUG=true
set APP_URL=http://localhost:8000

REM Database is retrieved from .env (Supabase)

REM Frontend local URL
set FRONTEND_URL=http://localhost:5173

REM CORS cho phep frontend local truy cap
set CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000,http://localhost:3000

REM Public callback URL cho SePay (local)
set PUBLIC_CALLBACK_URL=http://localhost:8000

echo [OK] APP_ENV     = %APP_ENV%
echo [OK] APP_URL     = %APP_URL%
echo [OK] DB_HOST     = %DB_HOST%
echo [OK] FRONTEND    = %FRONTEND_URL%
echo.
echo Dang khoi dong Laravel dev server...
echo.

php artisan serve
