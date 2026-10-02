@echo off
chcp 65001 > nul
title MindNote 설치 프로그램(.exe) 빌드

cd /d "C:\MM"

echo ========================================================
echo   📦 MindNote Windows 설치형 실행 파일(.exe) 빌드 시작
echo ========================================================
echo.

if not exist "node_modules" (
    echo [안내] 패키지를 먼저 설치합니다...
    call npm install
)

echo [1/2] 프론트엔드 빌드 중...
call npm run build

echo [2/2] Electron 설치 프로그램(.exe) 패키징 중...
call npx electron-builder --win

echo.
echo ========================================================
echo   🎉 빌드 완료! C:\MM\release 폴더를 확인해주세요.
echo ========================================================
pause
