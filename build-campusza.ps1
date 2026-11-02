# Campusza production build (UI + server) — same flow as TakeBuild.
# Produces one deploy folder: Campusza.exe + DLLs + wwwroot SPA + campusza-urls.json
#
# Default output (inside this repo):
#   <repo>\build-out\campusza
#
# Override:
#   .\build-campusza.ps1 -OutDir "D:\aravindan\build\campusza"

#Requires -Version 5.1

param(
    [string]$BackendListen = "",
    [string]$FrontendApiBaseUrl = "",
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $OutDir) {
    $OutDir = Join-Path $root "build-out\campusza"
}

$uiDir = Join-Path $root "school-hub"
$serverProj = Join-Path $root "campusza_server\Campusza\Campusza.csproj"
$prodOut = (New-Item -ItemType Directory -Path $OutDir -Force).FullName
$wwwroot = Join-Path $prodOut "wwwroot"
$urlsPublic = Join-Path $uiDir "public\campusza-urls.json"
$urlsBuild = Join-Path $prodOut "campusza-urls.json"
$urlsProduction = Join-Path $root "campusza-urls.production.json"
$env:CAMPUSZA_BUILD_OUT = $prodOut

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Normalize-FrontendApiBaseUrl([string]$Value) {
    if ($null -eq $Value) { $Value = "" }
    $t = $Value.Trim().TrimEnd("/")
    if (-not $t) { return "" }
    if ($t -match "0\.0\.0\.0|your_public_host|^https?:$") { return "" }
    return $t
}

function Write-UrlsJson([string]$Path, [string]$Listen, [string]$ApiBase) {
    $obj = [ordered]@{
        backendListen      = $Listen.Trim().TrimEnd("/")
        frontendApiBaseUrl = (Normalize-FrontendApiBaseUrl $ApiBase)
    }
    ($obj | ConvertTo-Json -Depth 3) + "`n" | Set-Content -Path $Path -Encoding UTF8
}

function Get-DefaultUrlSettings {
    $listen = "http://0.0.0.0:5052"
    $apiBase = ""
    if (Test-Path $urlsProduction) {
        $prod = Get-Content -Raw -Path $urlsProduction | ConvertFrom-Json
        if ($prod.backendListen) { $listen = [string]$prod.backendListen }
        if ($null -ne $prod.frontendApiBaseUrl) { $apiBase = [string]$prod.frontendApiBaseUrl }
    } elseif (Test-Path $urlsPublic) {
        $pub = Get-Content -Raw -Path $urlsPublic | ConvertFrom-Json
        if ($pub.backendListen) { $listen = [string]$pub.backendListen }
        if ($null -ne $pub.frontendApiBaseUrl) { $apiBase = [string]$pub.frontendApiBaseUrl }
    }
    if ($BackendListen) { $listen = $BackendListen.Trim().TrimEnd("/") }
    if ($PSBoundParameters.ContainsKey("FrontendApiBaseUrl")) {
        $apiBase = if ($null -eq $FrontendApiBaseUrl) { "" } else { $FrontendApiBaseUrl }
    }
    return @{ Listen = $listen; ApiBase = $apiBase }
}

function Sync-UrlsToWwwroot([string]$PublishDir) {
    $src = Join-Path $PublishDir "campusza-urls.json"
    $dest = Join-Path $PublishDir "wwwroot\campusza-urls.json"
    if (Test-Path $src) {
        New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
        Copy-Item -Path $src -Destination $dest -Force
    }
}

function Install-NpmIfNeeded([string]$ProjectPath) {
    if (Test-Path (Join-Path $ProjectPath "node_modules")) { return }
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        if (Test-Path "package-lock.json") { npm ci } else { npm install }
        if (-not $?) { throw "npm install failed" }
    } finally {
        Pop-Location
    }
}

function Stop-CampuszaInFolder([string]$PublishDir) {
    $exePath = Join-Path $PublishDir "Campusza.exe"
    $targetExe = $null
    if (Test-Path $exePath) {
        try { $targetExe = (Resolve-Path -LiteralPath $exePath).Path } catch { }
    }

    foreach ($proc in Get-Process -Name "Campusza" -ErrorAction SilentlyContinue) {
        try {
            $module = $proc.MainModule
            if ($null -eq $module) { continue }
            $running = $module.FileName
            if (-not $running) { continue }
            $runningFull = (Resolve-Path -LiteralPath $running).Path
            if ($targetExe -and $runningFull -ieq $targetExe) {
                Write-Host "Stopping Campusza.exe in $PublishDir (pid $($proc.Id)) ..." -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            }
        } catch {
            # Access denied without elevation — fall back to name below
        }
    }

    $left = Get-Process -Name "Campusza" -ErrorAction SilentlyContinue
    if ($left -and $targetExe) {
        foreach ($p in $left) {
            try {
                if ($p.MainModule.FileName -ieq $targetExe) {
                    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                }
            } catch { }
        }
    }

    Start-Sleep -Seconds 2
}

function Remove-PathWithRetry([string]$Path, [int]$Attempts = 6) {
    if (-not (Test-Path -LiteralPath $Path)) { return }
    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
            return
        } catch {
            Write-Host "Cannot remove (attempt $i/$Attempts): $Path" -ForegroundColor Yellow
            Write-Host "  $($_.Exception.Message)" -ForegroundColor DarkYellow
            Write-Host "  Close Campusza.exe and any File Explorer window open in that folder." -ForegroundColor DarkYellow
            Stop-CampuszaInFolder -PublishDir (Split-Path -Parent $Path)
            if ($Path -like "*\wwwroot") {
                Stop-CampuszaInFolder -PublishDir (Split-Path -Parent (Split-Path -Parent $Path))
            }
            Start-Sleep -Seconds 2
        }
    }
    throw "Folder still locked: $Path"
}

try {
    Set-Location $root
    if (-not (Test-Path $serverProj)) { throw "Missing $serverProj" }

    if (-not (Test-Path $urlsPublic)) {
        $seed = Get-DefaultUrlSettings
        Write-UrlsJson -Path $urlsPublic -Listen $seed.Listen -ApiBase $seed.ApiBase
    }

    Write-Step "Campusza build"
    Write-Host "Repo:   $root" -ForegroundColor DarkGray
    Write-Host "Output: $prodOut" -ForegroundColor DarkGray

    Stop-CampuszaInFolder -PublishDir $prodOut

    Write-Step "Publish API (Release, win-x64)"
    Push-Location (Split-Path -Parent $serverProj)
    try {
        $ErrorActionPreference = "Continue"
        & dotnet publish $serverProj -c Release -r win-x64 -o $prodOut --nologo
        if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed (exit $LASTEXITCODE)" }
    } finally {
        $ErrorActionPreference = "Stop"
        Pop-Location
    }

    Remove-PathWithRetry -Path $wwwroot
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null

    $urlSettings = Get-DefaultUrlSettings
    Write-UrlsJson -Path $urlsBuild -Listen $urlSettings.Listen -ApiBase $urlSettings.ApiBase
    Sync-UrlsToWwwroot -PublishDir $prodOut

    Write-Step "Build UI (Vite → $wwwroot)"
    Install-NpmIfNeeded -ProjectPath $uiDir
    Push-Location $uiDir
    try {
        $ErrorActionPreference = "Continue"
        & npm run build:production
        if ($LASTEXITCODE -ne 0) { throw "UI build failed (exit $LASTEXITCODE)" }
    } finally {
        $ErrorActionPreference = "Stop"
        Pop-Location
    }

    if (-not (Test-Path (Join-Path $wwwroot "index.html"))) {
        throw "Missing wwwroot/index.html after UI build."
    }

    Write-UrlsJson -Path $urlsBuild -Listen $urlSettings.Listen -ApiBase $urlSettings.ApiBase
    Sync-UrlsToWwwroot -PublishDir $prodOut

    $finalUrls = Get-Content -Raw -Path $urlsBuild | ConvertFrom-Json

    @"
@echo off
cd /d "%~dp0"
Campusza.exe
"@ | Set-Content -Path (Join-Path $prodOut "run.cmd") -Encoding ASCII

    Write-Step "Build completed"
    Write-Host "Output: $prodOut" -ForegroundColor Green
    Write-Host "Run:    $prodOut\run.cmd" -ForegroundColor Cyan
    Write-Host "Config: $urlsBuild" -ForegroundColor Cyan
    Write-Host "  backendListen:      $($finalUrls.backendListen)" -ForegroundColor DarkGray
    Write-Host "  frontendApiBaseUrl: $(if ($finalUrls.frontendApiBaseUrl) { $finalUrls.frontendApiBaseUrl } else { '(same host as the page)' })" -ForegroundColor DarkGray
    exit 0
}
catch {
    Write-Host "BUILD FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Set-Location $root
}
