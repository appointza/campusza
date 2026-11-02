@echo off
echo =====================================================
echo RUN IMAGES MIGRATION SCRIPT
echo Add images_json column to OrganisationLocation table
echo =====================================================
echo.

echo 🔄 Running images migration...
echo.

REM Update the connection string with your actual database details
psql -h localhost -p 5432 -U postgres -d appointza -f add_images_to_organisationlocation.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Images migration completed successfully!
    echo 📋 Added columns:
    echo    - images_json (JSONB, default: [])
    echo    - attributes_json (JSONB, default: {})
) else (
    echo.
    echo ❌ Migration failed!
    echo 💡 Please check your database connection and run manually:
    echo    psql -h localhost -p 5432 -U postgres -d appointza -f add_images_to_organisationlocation.sql
)

echo.
pause
