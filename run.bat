@echo off
chcp 65001 > nul
title MindNote 데스크톱 앱

cd /d "C:\MM"

if not exist "dist" (
    echo [안내] 최초 빌드를 진행합니다...
    call npm run build
)

echo ========================================================
echo   🌟 MindNote 데스크톱 전용 창을 실행합니다!
echo ========================================================
echo.

start "" npx electron .
exit
