# Production Build Script for Campusza
# This script builds and publishes the application for production deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campusza Production Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Stop"

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $scriptPath "Campusza\Campusza.csproj"
$publishPath = Join-Path $scriptPath "publish"

# Clean previous publish
if (Test-Path $publishPath) {
    Write-Host "Cleaning previous publish folder..." -ForegroundColor Yellow
    Remove-Item -Path $publishPath -Recurse -Force
}

# Restore packages
Write-Host "Restoring NuGet packages..." -ForegroundColor Green
dotnet restore $projectPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "Package restore failed!" -ForegroundColor Red
    exit 1
}

# Build in Release mode
Write-Host ""
Write-Host "Building project in Release mode..." -ForegroundColor Green
dotnet build $projectPath -c Release --no-restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Publish for production
Write-Host ""
Write-Host "Publishing application for production..." -ForegroundColor Green
dotnet publish $projectPath -c Release -o $publishPath --no-build --self-contained false
if ($LASTEXITCODE -ne 0) {
    Write-Host "Publish failed!" -ForegroundColor Red
    exit 1
}

# Display publish information
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Publish location: $publishPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the published files in the 'publish' folder" -ForegroundColor White
Write-Host "2. Ensure appsettings.json has production configuration" -ForegroundColor White
Write-Host "3. Deploy the contents of the 'publish' folder to your server" -ForegroundColor White
Write-Host "4. Make sure .NET 6.0 Runtime is installed on the target server" -ForegroundColor White
Write-Host ""

