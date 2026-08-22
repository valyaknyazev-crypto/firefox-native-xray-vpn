$ErrorActionPreference = "Stop"
$AppDir = "$env:APPDATA\VPNProxyDaemon"

New-Item -Path $AppDir -ItemType Directory -Force | Out-Null

Write-Host "[1/4] Copying xray.exe and daemon.js from local build..."
Copy-Item -Path "build\xray.exe" -Destination "$AppDir\xray.exe" -Force
Copy-Item -Path "src-daemon\daemon.js" -Destination "$AppDir\daemon.js" -Force
Write-Host "  -> Done"

Write-Host "[2/4] Writing daemon.bat..."
$NodePath = "node"
$bat = "@echo off`r`n`"$NodePath`" `"%~dp0daemon.js`"`r`n"
[System.IO.File]::WriteAllText("$AppDir\daemon.bat", $bat, (New-Object System.Text.UTF8Encoding($False)))
Write-Host "  -> Done"

Write-Host "[3/4] Writing manifest.json..."
$escaped = $AppDir.Replace('\', '\\')
$manifest = @"
{
  "name": "com.vpn.daemon.core",
  "description": "VPN Native Daemon",
  "path": "$escaped\\daemon.bat",
  "type": "stdio",
  "allowed_extensions": [ "vpnproxy@antigravity.dev" ]
}
"@
[System.IO.File]::WriteAllText("$AppDir\manifest.json", $manifest, (New-Object System.Text.UTF8Encoding($False)))
Write-Host "  -> Done"

Write-Host "[4/4] Registering with Firefox..."
$regPath = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.vpn.daemon.core"
if (-Not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
New-ItemProperty -Path $regPath -Name "(Default)" -Value "$AppDir\manifest.json" -Force | Out-Null
Write-Host "  -> Done"

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Installed to: $AppDir"
