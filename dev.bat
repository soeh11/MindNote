@echo off
chcp 65001 > nul
title MindNote 개발 모드

cd /d "C:\MM"

echo MindNote 개발 모드(핫 리로드)를 실행합니다...
call npm run start
