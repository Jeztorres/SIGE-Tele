@echo off
title Sistema Telesecundaria Pro
color 0A
echo =========================================================================
echo       INICIANDO SISTEMA DE GESTION Y CONTROL PARA TELESECUNDARIA
echo =========================================================================
echo.
echo [1/3] Iniciando Servidor Local y Base de Datos Escolar...
start "Servidor Telesecundaria" /min node server/server.js

echo [2/3] Iniciando Interfaz Docente (con soporte para Celulares)...
cd client
start "Cliente Web Telesecundaria" /min cmd /c "npm.cmd run dev"
cd ..

echo [3/3] Abriendo aplicacion en el navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =========================================================================
echo   El sistema esta listo y ejecutandose.
echo.
echo   * Para usar en esta computadora: http://localhost:3000
echo   * Para usar desde tu CELULAR o TABLET (en el mismo Wi-Fi):
echo     http://TU-IP-LOCAL:3000
echo =========================================================================
pause
