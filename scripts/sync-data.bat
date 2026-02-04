@echo off
chcp 65001 > nul
echo ========================================
echo   로컬 DB → Supabase 데이터 동기화
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/3] 환경변수 확인 중...
if "%DATABASE_URL%"=="" (
    echo [오류] DATABASE_URL 환경변수가 설정되지 않았습니다.
    echo .env 파일에서 DATABASE_URL을 설정하거나 환경변수로 지정하세요.
    pause
    exit /b 1
)

echo [2/3] 로컬 데이터 export 중...
call npx tsx scripts/export-local-data.ts

echo.
echo [3/3] Supabase로 데이터 import 중...
call npx tsx scripts/import-to-supabase.ts

echo.
echo [4/4] 데이터 동기화 완료!
echo.
pause
