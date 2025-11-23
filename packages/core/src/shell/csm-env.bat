@echo off
:: Generate a unique temp file path
set "CSM_ENV_TEMP=%TEMP%\csm_env_%RANDOM%.bat"

:: Try to find csm.cmd in the same directory as this script
set "CSM_EXE=csm"
if exist "%~dp0csm.cmd" set "CSM_EXE=%~dp0csm.cmd"

:: Execute csm to generate the environment setting script
call "%CSM_EXE%" load-env --shell batch > "%CSM_ENV_TEMP%"

:: Check if csm failed
if %ERRORLEVEL% NEQ 0 (
    echo Failed to load environment variables via csm.
    if exist "%CSM_ENV_TEMP%" del "%CSM_ENV_TEMP%"
    set "CSM_ENV_TEMP="
    set "CSM_EXE="
    exit /b 1
)

:: Execute the generated script to set variables in the current context
call "%CSM_ENV_TEMP%"

:: Cleanup
if exist "%CSM_ENV_TEMP%" del "%CSM_ENV_TEMP%"
set "CSM_ENV_TEMP="
set "CSM_EXE="
