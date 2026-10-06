param(
  [string]$RomDir = $(if ($env:ISSSD_ROM_DIR) { $env:ISSSD_ROM_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio\roms' }),
  [string]$ProjectDir = $(if ($env:ISSSD_PROJECT_DIR) { $env:ISSSD_PROJECT_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio' }),
  [string]$RomName = $(if ($env:ISSSD_ROM_NAME) { $env:ISSSD_ROM_NAME } else { 'International Superstar Soccer Deluxe Plus.sfc' }),
  [string]$ProjectName = $(if ($env:ISSSD_PROJECT_NAME) { $env:ISSSD_PROJECT_NAME } else { 'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj' })
)

$ErrorActionPreference = 'Stop'
$expectedRomSize = 2097152
$expectedRomSha256 = 'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a'

$RomDir = [IO.Path]::GetFullPath($RomDir)
$ProjectDir = [IO.Path]::GetFullPath($ProjectDir)
$romPath = Join-Path $RomDir $RomName
$projectPath = Join-Path $ProjectDir $ProjectName

Write-Host 'ISSSD Studio Windows defaults precheck'
Write-Host "ROM directory: $RomDir"
Write-Host "ROM filename:  $RomName"
Write-Host "Project dir:   $ProjectDir"
Write-Host "Project name:  $ProjectName"
Write-Host ''

if (-not (Test-Path $RomDir -PathType Container)) {
  throw "ROM directory not found: $RomDir"
}
if (-not (Test-Path $ProjectDir -PathType Container)) {
  throw "Project directory not found: $ProjectDir"
}
if (-not (Test-Path $romPath -PathType Leaf)) {
  throw "Default ROM file not found: $romPath"
}
if (-not (Test-Path $projectPath -PathType Leaf)) {
  throw "Default project file not found: $projectPath"
}
if ([IO.Path]::GetExtension($projectPath).ToLowerInvariant() -ne '.issdproj') {
  throw "Default project does not use .issdproj: $projectPath"
}

$romFile = Get-Item $romPath
if ($romFile.Length -ne $expectedRomSize) {
  throw "ROM size mismatch. Expected $expectedRomSize bytes, got $($romFile.Length): $romPath"
}
$actualSha = (Get-FileHash -Algorithm SHA256 -Path $romPath).Hash.ToLowerInvariant()
if ($actualSha -ne $expectedRomSha256) {
  throw "ROM SHA-256 mismatch. Expected $expectedRomSha256, got ${actualSha}: $romPath"
}

Write-Host 'PASS: default ROM and project structure is valid.'
Write-Host "ROM:     $romPath"
Write-Host "Project: $projectPath"
Write-Host "ROM SHA-256: $actualSha"
