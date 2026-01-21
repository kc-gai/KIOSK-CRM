@echo off
chcp 65001 > nul
echo ========================================
echo   로컬 DB → Supabase 데이터 동기화
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/3] 로컬 데이터 export 중...
call npx tsx scripts/export-local-data.ts

echo.
echo [2/3] Supabase로 데이터 import 중...
set DATABASE_URL=postgresql://postgres.vqvndrcmmwnffmavofyo:1004Suisen%%21%%21@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
call npx tsx scripts/import-to-supabase.ts

echo.
echo [3/3] 데이터 동기화 완료!
echo.
pause
