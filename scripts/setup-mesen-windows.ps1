$ErrorActionPreference = 'Stop'

$version = '2.1.1'
$expectedSha256 = '23ccc2bc060b663c68dad3a8c5d6da7d23a50f872d04f135bafa2b04ff7d5cbe'
$url = "https://github.com/SourMesen/Mesen2/releases/download/$version/Mesen_${version}_Windows.zip"
$repoRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $repoRoot '.tools'
$mesenDir = Join-Path $toolsDir 'mesen'
$zipPath = Join-Path $toolsDir "Mesen_${version}_Windows.zip"

New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

Write-Host "Downloading Mesen $version from the official GitHub release..."
Invoke-WebRequest -Uri $url -OutFile $zipPath

$actualSha256 = (Get-FileHash -Algorithm SHA256 -Path $zipPath).Hash.ToLowerInvariant()
if ($actualSha256 -ne $expectedSha256) {
  Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
  throw "Mesen SHA-256 mismatch. Expected $expectedSha256 but got $actualSha256"
}

if (Test-Path $mesenDir) {
  Remove-Item -Recurse -Force $mesenDir
}
New-Item -ItemType Directory -Force -Path $mesenDir | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $mesenDir -Force
Remove-Item -Force $zipPath

$exe = Get-ChildItem -Path $mesenDir -Filter 'Mesen.exe' -File -Recurse | Select-Object -First 1
if (-not $exe) {
  throw "Mesen.exe was not found after extraction to $mesenDir"
}

$pathFile = Join-Path $mesenDir 'mesen-path.txt'
Set-Content -Path $pathFile -Value $exe.FullName -Encoding UTF8

$documents = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)
$documentsSettings = Join-Path $documents 'Mesen2\settings.json'
$portableSettings = Join-Path $exe.DirectoryName 'settings.json'

Write-Host "Mesen installed and verified:"
Write-Host $exe.FullName
Write-Host "SHA-256: $expectedSha256"
Write-Host "The emulator remains local under .tools/ and is not committed to Git."
Write-Host ''
Write-Host 'First-run note:'
Write-Host 'Mesen 2.1.1 must be initialized once before --testRunner can run headlessly.'
Write-Host 'If neither settings file exists, run Mesen once, complete its initial configuration, close it, and then run the ISSSD emulator test.'
Write-Host "Portable settings: $portableSettings"
Write-Host "Documents settings: $documentsSettings"
