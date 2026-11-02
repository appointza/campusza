# PowerShell script to run the events table migration
# Make sure you have PostgreSQL installed and psql is in your PATH

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Events Table Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for database connection details
$dbHost = Read-Host "Enter PostgreSQL host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Enter PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

$dbName = Read-Host "Enter database name"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    Write-Host "Database name is required!" -ForegroundColor Red
    exit 1
}

$dbUser = Read-Host "Enter PostgreSQL username"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    Write-Host "Username is required!" -ForegroundColor Red
    exit 1
}

$dbPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Creating events table..." -ForegroundColor Yellow

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $dbPasswordPlain

# Run the migration
$sqlFile = Join-Path $PSScriptRoot "create_events_table.sql"
$psqlCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$sqlFile`""

try {
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Events table created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verifying table creation..." -ForegroundColor Yellow
        
        # Verify table exists
        $verifyQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events');"
        $verifyCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c `"$verifyQuery`""
        Invoke-Expression $verifyCommand
        
        Write-Host ""
        Write-Host "Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

