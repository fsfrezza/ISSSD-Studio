param(
  [Parameter(Position=0)]
  [string]$BaseRom = '',
  [Parameter(Position=1)]
  [string]$Project = '',
  [string]$RomDir = $(if ($env:ISSSD_ROM_DIR) { $env:ISSSD_ROM_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio\roms' }),
  [string]$ProjectDir = $(if ($env:ISSSD_PROJECT_DIR) { $env:ISSSD_PROJECT_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio' }),
  [int]$Limit = 20
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$canonicalPlusSha256 = 'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a'

function Resolve-RelativeInput([string]$Value,[string]$DefaultDir) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
  if ([IO.Path]::IsPathRooted($Value)) { return [IO.Path]::GetFullPath($Value) }
  return [IO.Path]::GetFullPath((Join-Path $DefaultDir $Value))
}

function Find-CanonicalPlusRom([string]$Directory) {
  if (-not (Test-Path $Directory -PathType Container)) {
    throw "Default ROM directory not found: $Directory. Use -RomDir, -BaseRom, or ISSSD_ROM_DIR to change it."
  }
  $candidates = Get-ChildItem -Path $Directory -File | Where-Object {
    $_.Extension.ToLowerInvariant() -in @('.sfc','.smc')
  } | Sort-Object Name
  foreach ($candidate in $candidates) {
    $hash = (Get-FileHash -Algorithm SHA256 -Path $candidate.FullName).Hash.ToLowerInvariant()
    if ($hash -eq $canonicalPlusSha256) { return $candidate.FullName }
  }
  throw "Canonical Plus ROM was not found in $Directory. Expected SHA-256: $canonicalPlusSha256. Use -BaseRom or -RomDir to change the location."
}

function Select-ProjectFile([string]$InitialDirectory) {
  if (-not (Test-Path $InitialDirectory -PathType Container)) {
    throw "Default project directory not found: $InitialDirectory. Use -ProjectDir, -Project, or ISSSD_PROJECT_DIR to change it."
  }
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = 'Select ISSSD Studio project'
  $dialog.InitialDirectory = $InitialDirectory
  $dialog.Filter = 'ISSSD Studio Project (*.issdproj)|*.issdproj|All files (*.*)|*.*'
  $dialog.Multiselect = $false
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    throw 'Project selection cancelled.'
  }
  return $dialog.FileName
}

if ($Limit -lt 1 -or $Limit -gt 500) { throw 'Limit must be between 1 and 500' }

$RomDir = [IO.Path]::GetFullPath($RomDir)
$ProjectDir = [IO.Path]::GetFullPath($ProjectDir)

if ([string]::IsNullOrWhiteSpace($BaseRom)) {
  Write-Host "Locating canonical Plus ROM in: $RomDir"
  $BaseRom = Find-CanonicalPlusRom $RomDir
} else {
  $BaseRom = Resolve-RelativeInput $BaseRom $RomDir
}

if ([string]::IsNullOrWhiteSpace($Project)) {
  Write-Host "Opening project selector in: $ProjectDir"
  $Project = Select-ProjectFile $ProjectDir
} else {
  $Project = Resolve-RelativeInput $Project $ProjectDir
}

foreach ($path in @($BaseRom,$Project)) {
  if (-not (Test-Path $path -PathType Leaf)) { throw "Input not found: $path" }
}
if ([IO.Path]::GetExtension($Project).ToLowerInvariant() -ne '.issdproj') {
  throw 'Project must use the .issdproj extension'
}

Write-Host "ROM base: $BaseRom"
Write-Host "Project: $Project"
Write-Host "ROM directory default: $RomDir"
Write-Host "Project directory default: $ProjectDir"

$runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$runDir = Join-Path $repoRoot ".tools\mesen-runs\$runId"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$projectStem = [IO.Path]::GetFileNameWithoutExtension($Project)
$generatedRom = Join-Path $runDir "$projectStem-verified.sfc"
$baseReport = Join-Path $runDir 'probe-base.json'
$generatedReport = Join-Path $runDir 'probe-generated.json'
$comparison = Join-Path $runDir 'probe-comparison.json'

Push-Location $repoRoot
try {
  Write-Host '1/2 Building project through the deterministic Plus core...'
  & node 'scripts/verify-real-plus-project.mjs' $BaseRom $Project '--out-dir' $runDir
  if ($LASTEXITCODE -ne 0) { throw "Project build verification failed with exit code $LASTEXITCODE" }
  if (-not (Test-Path $generatedRom)) { throw "Expected generated ROM was not created: $generatedRom" }

  Write-Host ''
  Write-Host '2/2 Running cross-ROM emulator state discovery...'
  & powershell -ExecutionPolicy Bypass -File 'scripts/discover-mesen-cross-rom-windows.ps1' `
    $BaseRom $generatedRom `
    -BaseReport $baseReport `
    -GeneratedReport $generatedReport `
    -Comparison $comparison `
    -Limit $Limit
  if ($LASTEXITCODE -ne 0) { throw "Cross-ROM emulator test failed with exit code $LASTEXITCODE" }

  Write-Host ''
  Write-Host 'Plus project emulator regression flow completed.'
  Write-Host "Run directory: $runDir"
  Write-Host "Generated ROM: $generatedRom"
  Write-Host "WRAM comparison: $comparison"
} finally {
  Pop-Location
}
