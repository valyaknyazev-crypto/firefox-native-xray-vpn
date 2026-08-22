$ErrorActionPreference = "SilentlyContinue"

Write-Host "=========================================="
Write-Host " Native Daemon Uninstaller for Firefox VPN"
Write-Host "=========================================="
Write-Host ""

$AppDir = "$env:APPDATA\VPNProxyDaemon"

Write-Host "[1/3] Removing Firefox Registry Keys..."
$RegistryPath = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.vpn.daemon.core"
if (Test-Path $RegistryPath) {
    Remove-Item -Path $RegistryPath -Force -Recurse
    Write-Host "  -> Registry key removed." -ForegroundColor Green
} else {
    Write-Host "  -> Registry key not found, skipping." -ForegroundColor Yellow
}

Write-Host "[2/3] Stopping running Daemon/Xray processes..."
# Kill xray if it's running from our folder
Get-Process -Name "xray" | Where-Object { $_.Path -like "$AppDir\*" } | Stop-Process -Force
# Kill node if it's running our daemon.js
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -match "daemon.js" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Host "  -> Processes stopped (if any were running)." -ForegroundColor Green

Write-Host "[3/3] Deleting Application Files..."
if (Test-Path -Path $AppDir) {
    Remove-Item -Path $AppDir -Recurse -Force
    Write-Host "  -> $AppDir removed." -ForegroundColor Green
} else {
    Write-Host "  -> $AppDir not found, skipping." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================="
Write-Host " Uninstallation Complete! "
Write-Host "=========================================="
Write-Host "The Native Daemon has been completely removed from your system."
Write-Host "Firefox will no longer be able to connect to the VPN proxy."
