@echo off
chcp 65001 > nul
echo ========================================
echo   KIOSK CRM 자동 배포 스크립트
echo ========================================
echo.

REM 현재 디렉토리 저장
cd /d "%~dp0.."

echo [1/5] 코드 변경사항 확인...
git status

echo.
echo [2/5] 변경사항 스테이징...
git add .

echo.
set /p COMMIT_MSG="커밋 메시지를 입력하세요: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update

echo.
echo [3/5] 커밋 생성...
git commit -m "%COMMIT_MSG%"

echo.
echo [4/5] GitHub에 푸시...
git push origin main

echo.
echo [5/5] 배포 완료!
echo.
echo Vercel이 자동으로 배포를 시작합니다.
echo 배포 상태 확인: https://vercel.com/kc-gai/kiosk-crm
echo 사이트 확인: https://kiosk-crm.vercel.app
echo.
pause
