# Quick check that production (or local) is running the current Campusza API.
param(
    [string]$BaseUrl = "https://campusza.com"
)

$BaseUrl = $BaseUrl.TrimEnd("/")

Write-Host "Checking $BaseUrl ..." -ForegroundColor Cyan

try {
    $version = Invoke-RestMethod -Uri "$BaseUrl/api/campusza/version" -Method Get -TimeoutSec 15
    Write-Host "OK version:" -ForegroundColor Green
    $version | ConvertTo-Json -Depth 4
    if ($version.product -ne "Campusza") {
        Write-Host "WARN: product is not Campusza — wrong binary may be deployed." -ForegroundColor Yellow
        exit 1
    }
    if (-not $version.api.GetAdminDashboardPage) {
        Write-Host "WARN: API surface missing GetAdminDashboardPage." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "FAIL: /api/campusza/version — $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Deploy full publish folder (Campusza.dll), not wwwroot only. See DEPLOY.md" -ForegroundColor Yellow
    exit 1
}

$body = '{"item":{"organizationid":"1"}}'
try {
    Invoke-WebRequest -Uri "$BaseUrl/api/campusza/page/GetAdminDashboardPage" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15 | Out-Null
    Write-Host "OK GetAdminDashboardPage (page)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "FAIL: GetAdminDashboardPage 404 — old API still running." -ForegroundColor Red
        exit 1
    }
    Write-Host "GetAdminDashboardPage: $($_.Exception.Message) (may be org/auth — not 404)" -ForegroundColor Yellow
}

Write-Host "Done." -ForegroundColor Green
