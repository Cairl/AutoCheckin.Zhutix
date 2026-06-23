@echo off
setlocal enabledelayedexpansion

set "PROJECT_DIR=S:\Github Repositories\GitHubSync"
set "SYNC_TARGET=%~dp0"
set "SYNC_TARGET=%SYNC_TARGET:~0,-1%"

if not exist "%PROJECT_DIR%" (
    echo [ERROR] GitHubSync project not found: %PROJECT_DIR%
    pause
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found in PATH
    pause
    exit /b 1
)

set "PYTHONPATH=%PROJECT_DIR%"
python -m src "%SYNC_TARGET%"
if errorlevel 1 (
    echo [ERROR] Sync failed with exit code %errorlevel%
    pause
    exit /b %errorlevel%
)

echo [OK] Sync completed
exit /b 0
