@echo off
title Sistema Telesecundaria Pro (Modo Escritorio con DeepSeek Nativo)
color 0B
echo =========================================================================
echo   INICIANDO TELESECUNDARIA PRO (APLICACION DE ESCRITORIO CON DEEPSEEK)
echo =========================================================================
echo.
echo [1/3] Iniciando Servidor Local y Base de Datos...
start "Servidor Telesecundaria" /min node server/server.js

echo [2/3] Iniciando Interfaz...
start "Vite Dev" /min cmd /c "cd client && npm.cmd run dev"

echo [3/3] Abriendo Aplicacion de Escritorio con DeepSeek y Google Login...
timeout /t 3 /nobreak >nul
call npx.cmd electron electron-main.js

pause
