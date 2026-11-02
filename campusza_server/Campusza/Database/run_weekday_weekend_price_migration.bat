@echo off
echo Running weekday/weekend price migration...
echo.
echo Please run the SQL file using one of these methods:
echo.
echo Method 1 - Using psql command line:
echo   psql -h localhost -U your_username -d your_database -f add_weekday_weekend_price_to_organisationservices.sql
echo.
echo Method 2 - Using pgAdmin or another PostgreSQL client:
echo   Open the file: add_weekday_weekend_price_to_organisationservices.sql
echo   Execute it against your database
echo.
echo Method 3 - Using SQL directly:
echo   Copy the SQL from add_weekday_weekend_price_to_organisationservices.sql
echo   Paste and execute in your database client
echo.
pause

