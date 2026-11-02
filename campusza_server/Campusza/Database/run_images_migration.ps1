# =====================================================
# RUN IMAGES MIGRATION SCRIPT
# PowerShell script to add images_json column to database
# =====================================================

Write-Host "🔄 Running images migration for OrganisationLocation table..." -ForegroundColor Yellow

# Database connection parameters (same info as Npgsql: Host=...;Port=...;Database=...;Username=...;Password=...)
# psql does not accept a .NET connection string with -d; use -h/-p/-U/-d or a postgresql:// URI.
$pgHost = "43.205.255.163"
$pgPort = "5432"
$pgDatabase = "campusza"
$pgUser = "postgres"
$pgPassword = "abc123"

try {
    $migrationFile = Join-Path $PSScriptRoot "add_images_to_organisationlocation.sql"
    if (-not (Test-Path $migrationFile)) {
        throw "Migration file not found: $migrationFile"
    }
    $env:PGPASSWORD = $pgPassword
    & psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase -f $migrationFile
    if ($LASTEXITCODE -ne 0) { throw "psql exited with code $LASTEXITCODE" }
    
    Write-Host "✅ Images migration completed successfully!" -ForegroundColor Green
    Write-Host "📋 Added columns:" -ForegroundColor Cyan
    Write-Host "   - images_json (JSONB, default: [])" -ForegroundColor White
    Write-Host "   - attributes_json (JSONB, default: {})" -ForegroundColor White
}
catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Please check your database connection and run the SQL manually:" -ForegroundColor Yellow
    Write-Host "   psql -h HOST -p 5432 -U USER -d DATABASE -f add_images_to_organisationlocation.sql" -ForegroundColor White
}

Write-Host "`n🔧 Manual execution example:" -ForegroundColor Yellow
Write-Host '$env:PGPASSWORD = "<password>"; psql -h HOST -p 5432 -U postgres -d campusza -f add_images_to_organisationlocation.sql' -ForegroundColor White
