param(
  [Parameter(Position=0)]
  [string]$BaseRom = '',
  [Parameter(Position=1)]
  [string]$Project = '',
  [string]$RomDir = $(if ($env:ISSSD_ROM_DIR) { $env:ISSSD_ROM_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio\roms' }),
  [string]$ProjectDir = $(if ($env:ISSSD_PROJECT_DIR) { $env:ISSSD_PROJECT_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio' }),
  [string]$RomName = $(if ($env:ISSSD_ROM_NAME) { $env:ISSSD_ROM_NAME } else { 'International Superstar Soccer Deluxe Plus.sfc' }),
  [string]$ProjectName = $(if ($env:ISSSD_PROJECT_NAME) { $env:ISSSD_PROJECT_NAME } else { 'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj' }),
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

function Find-CanonicalPlusRom([string]$Directory,[string]$PreferredName) {
  if (-not (Test-Path $Directory -PathType Container)) { throw "Default ROM directory not found: $Directory" }
  if (-not [string]::IsNullOrWhiteSpace($PreferredName)) {
    $preferred = Join-Path $Directory $PreferredName
    if (Test-Path $preferred -PathType Leaf) {
      $preferredHash = (Get-FileHash -Algorithm SHA256 -Path $preferred).Hash.ToLowerInvariant()
      if ($preferredHash -eq $canonicalPlusSha256) { return [IO.Path]::GetFullPath($preferred) }
    }
  }
  foreach ($candidate in (Get-ChildItem -Path $Directory -File | Where-Object { $_.Extension.ToLowerInvariant() -in @('.sfc','.smc') } | Sort-Object Name)) {
    $hash = (Get-FileHash -Algorithm SHA256 -Path $candidate.FullName).Hash.ToLowerInvariant()
    if ($hash -eq $canonicalPlusSha256) { return $candidate.FullName }
  }
  throw "Canonical Plus ROM was not found in $Directory"
}

function Select-ProjectFile([string]$InitialDirectory,[string]$PreferredName) {
  if (-not (Test-Path $InitialDirectory -PathType Container)) { throw "Default project directory not found: $InitialDirectory" }
  if (-not [string]::IsNullOrWhiteSpace($PreferredName)) {
    $preferred = Join-Path $InitialDirectory $PreferredName
    if (Test-Path $preferred -PathType Leaf) { return [IO.Path]::GetFullPath($preferred) }
  }
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = 'Select ISSSD Studio project'
  $dialog.InitialDirectory = $InitialDirectory
  $dialog.Filter = 'ISSSD Studio Project (*.issdproj)|*.issdproj|All files (*.*)|*.*'
  $dialog.Multiselect = $false
  if (-not [string]::IsNullOrWhiteSpace($PreferredName)) { $dialog.FileName = $PreferredName }
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { throw 'Project selection cancelled.' }
  return $dialog.FileName
}

if ($Limit -lt 1 -or $Limit -gt 500) { throw 'Limit must be between 1 and 500' }
$RomDir = [IO.Path]::GetFullPath($RomDir)
$ProjectDir = [IO.Path]::GetFullPath($ProjectDir)
if ([string]::IsNullOrWhiteSpace($BaseRom)) { $BaseRom = Find-CanonicalPlusRom $RomDir $RomName } else { $BaseRom = Resolve-RelativeInput $BaseRom $RomDir }
if ([string]::IsNullOrWhiteSpace($Project)) { $Project = Select-ProjectFile $ProjectDir $ProjectName } else { $Project = Resolve-RelativeInput $Project $ProjectDir }
foreach ($path in @($BaseRom,$Project)) { if (-not (Test-Path $path -PathType Leaf)) { throw "Input not found: $path" } }
if ([IO.Path]::GetExtension($Project).ToLowerInvariant() -ne '.issdproj') { throw 'Project must use the .issdproj extension' }

Write-Host "ROM base: $BaseRom"
Write-Host "Project: $Project"
$runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$runDir = Join-Path $repoRoot ".tools\mesen-runs\$runId"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

Push-Location $repoRoot
try {
  Write-Host '1/2 Building ONE byte-level isolation ROM (first half of canonical range 0)...'
  $buildOutput = & node 'scripts/build-persisted-patch-bisect-plus.mjs' $BaseRom $Project '--out-dir' $runDir '--start' '0' '--end' '1' '--byte-part' '0' '--byte-parts' '2'
  if ($LASTEXITCODE -ne 0) { throw "Persisted-patch byte isolation build failed with exit code $LASTEXITCODE" }
  $buildOutput | Write-Host
  $summary = ($buildOutput -join "`n") | ConvertFrom-Json
  $generatedRom = [string]$summary.outputPath
  if ([string]::IsNullOrWhiteSpace($generatedRom) -or -not (Test-Path $generatedRom)) { throw "Expected byte-isolation ROM was not created: $generatedRom" }

  $baseReport = Join-Path $runDir 'probe-base.json'
  $generatedReport = Join-Path $runDir 'probe-generated.json'
  $comparison = Join-Path $runDir 'probe-comparison.json'
  $baseLog = Join-Path $runDir 'probe-base.log'
  $generatedLog = Join-Path $runDir 'probe-generated.log'

  Write-Host ''
  Write-Host '2/2 Running emulator liveness diagnostics on that single ROM...'
  & powershell -ExecutionPolicy Bypass -File 'scripts/discover-mesen-cross-rom-windows.ps1' `
    $BaseRom $generatedRom `
    -BaseReport $baseReport `
    -GeneratedReport $generatedReport `
    -Comparison $comparison `
    -BaseLog $baseLog `
    -GeneratedLog $generatedLog `
    -Limit $Limit
  if ($LASTEXITCODE -ne 0) { throw "Cross-ROM emulator test failed with exit code $LASTEXITCODE" }

  Write-Host ''
  Write-Host 'Persisted-patch byte isolation flow completed.'
  Write-Host "Canonical range index: $($summary.byteSelection.sourceRangeIndex)"
  Write-Host "Canonical range PC offset: $($summary.byteSelection.sourceRangeOffset)"
  Write-Host "Canonical range length: $($summary.byteSelection.sourceRangeLength) bytes"
  Write-Host "Selected byte interval inside range: $($summary.byteSelection.startInclusive)..$($summary.byteSelection.endExclusive - 1)"
  Write-Host "Selected persisted bytes: $($summary.selectedBytes)"
  Write-Host "ROM TO TEST MANUALLY: $generatedRom"
} finally { Pop-Location }
