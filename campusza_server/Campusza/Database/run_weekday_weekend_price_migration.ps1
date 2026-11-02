# PowerShell script to run weekday/weekend price migration
# Usage: .\run_weekday_weekend_price_migration.ps1

Write-Host "Running weekday/weekend price migration..." -ForegroundColor Green

# Read database connection details from appsettings.json or set them here
$connectionString = Read-Host "Enter PostgreSQL connection string (e.g., Host=localhost;Database=yourdb;Username=user;Password=pass)"

if ([string]::IsNullOrWhiteSpace($connectionString)) {
    Write-Host "Connection string is required!" -ForegroundColor Red
    exit 1
}

$sqlFile = Join-Path $PSScriptRoot "add_weekday_weekend_price_to_organisationservices.sql"
$sqlContent = Get-Content $sqlFile -Raw

try {
    # Using psql command line tool
    Write-Host "Executing migration SQL..." -ForegroundColor Yellow
    
    # If you have psql in PATH, uncomment and modify this:
    # $env:PGPASSWORD = "yourpassword"
    # psql -h localhost -U youruser -d yourdb -f $sqlFile
    
    # Alternative: Use .NET/Npgsql if available
    Write-Host "Please run the SQL file manually using your PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "  psql -h localhost -U youruser -d yourdb -f $sqlFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or copy and paste the SQL from: $sqlFile" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Migration instructions provided above." -ForegroundColor Green

