@echo off
REM Batch script to run the events table migration
REM Make sure you have PostgreSQL installed and psql is in your PATH

echo ========================================
echo Events Table Migration Script
echo ========================================
echo.

REM Prompt for database connection details
set /p DB_HOST="Enter PostgreSQL host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter PostgreSQL port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Enter database name: "
if "%DB_NAME%"=="" (
    echo Database name is required!
    pause
    exit /b 1
)

set /p DB_USER="Enter PostgreSQL username: "
if "%DB_USER%"=="" (
    echo Username is required!
    pause
    exit /b 1
)

set /p DB_PASSWORD="Enter PostgreSQL password: "
if "%DB_PASSWORD%"=="" (
    echo Password is required!
    pause
    exit /b 1
)

echo.
echo Creating events table...

REM Set PGPASSWORD environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Run the migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%SCRIPT_DIR%create_events_table.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Events table created successfully!
    echo.
    echo Verifying table creation...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events');"
    echo.
    echo Migration completed successfully!
) else (
    echo.
    echo [ERROR] Migration failed. Please check the error messages above.
    pause
    exit /b 1
)

REM Clear password from environment
set PGPASSWORD=

echo.
pause

