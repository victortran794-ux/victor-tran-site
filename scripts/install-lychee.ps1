$ErrorActionPreference = "Stop"

$version = "0.24.2"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolDir = Join-Path $root ".tools\lychee"
$zipPath = Join-Path $env:TEMP "lychee-$version-windows.zip"
$downloadUrl = "https://github.com/lycheeverse/lychee/releases/download/lychee-v$version/lychee-x86_64-pc-windows-msvc.zip"

New-Item -ItemType Directory -Force -Path $toolDir | Out-Null

Write-Host "Downloading lychee $version..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

$extractDir = Join-Path $env:TEMP "lychee-$version"
if (Test-Path $extractDir) {
  Remove-Item -Recurse -Force -Path $extractDir
}
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
Expand-Archive -Force -Path $zipPath -DestinationPath $extractDir

$exe = Get-ChildItem -Path $extractDir -Recurse -Filter "lychee.exe" | Select-Object -First 1
if (-not $exe) {
  throw "Could not find lychee.exe in downloaded archive."
}

Copy-Item -Force -Path $exe.FullName -Destination (Join-Path $toolDir "lychee.exe")
Remove-Item -Force -Path $zipPath
Remove-Item -Recurse -Force -Path $extractDir

& (Join-Path $toolDir "lychee.exe") --version
Write-Host "Installed lychee to $toolDir"
