@echo off
chcp 65001 > nul
echo ========================================
echo   KIOSK CRM 전체 배포 (데이터 + 코드)
echo ========================================
echo.

cd /d "%~dp0.."

echo [단계 1] 로컬 데이터를 Supabase로 동기화할까요?
set /p SYNC_DATA="데이터 동기화 (Y/N)? "
if /i "%SYNC_DATA%"=="Y" (
    if "%DATABASE_URL%"=="" (
        echo [오류] DATABASE_URL 환경변수가 설정되지 않았습니다.
        echo .env 파일에서 DATABASE_URL을 설정하거나 환경변수로 지정하세요.
        pause
        exit /b 1
    )
    echo.
    echo 로컬 데이터 export 중...
    call npx tsx scripts/export-local-data.ts

    echo.
    echo Supabase로 데이터 import 중...
    call npx tsx scripts/import-to-supabase.ts
    echo.
)

echo.
echo [단계 2] 코드 배포
echo.

git status
echo.

set /p DO_DEPLOY="변경사항을 배포할까요? (Y/N)? "
if /i "%DO_DEPLOY%"=="Y" (
    git add .

    set /p COMMIT_MSG="커밋 메시지: "
    if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update

    git commit -m "%COMMIT_MSG%"
    git push origin main

    echo.
    echo ========================================
    echo   배포 완료!
    echo ========================================
    echo   Vercel 대시보드: https://vercel.com/kc-gai/kiosk-crm
    echo   사이트: https://kiosk-crm.vercel.app
    echo ========================================
)

echo.
pause
