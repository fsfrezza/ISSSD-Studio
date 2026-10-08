param(
  [Parameter(Position=0)]
  [string]$BaseRom = '',
  [Parameter(Position=1)]
  [string]$Project = '',
  [string]$RomDir = $(if ($env:ISSSD_ROM_DIR) { $env:ISSSD_ROM_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio\roms' }),
  [string]$ProjectDir = $(if ($env:ISSSD_PROJECT_DIR) { $env:ISSSD_PROJECT_DIR } else { 'C:\Users\fsfre\Downloads\ISSSD-Studio' }),
  [string]$RomName = $(if ($env:ISSSD_ROM_NAME) { $env:ISSSD_ROM_NAME } else { 'International Superstar Soccer Deluxe Plus.sfc' }),
  [string]$ProjectName = $(if ($env:ISSSD_PROJECT_NAME) { $env:ISSSD_PROJECT_NAME } else { 'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj' })
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

$RomDir = [IO.Path]::GetFullPath($RomDir)
$ProjectDir = [IO.Path]::GetFullPath($ProjectDir)
if ([string]::IsNullOrWhiteSpace($BaseRom)) { $BaseRom = Find-CanonicalPlusRom $RomDir $RomName } else { $BaseRom = Resolve-RelativeInput $BaseRom $RomDir }
if ([string]::IsNullOrWhiteSpace($Project)) { $Project = Join-Path $ProjectDir $ProjectName } else { $Project = Resolve-RelativeInput $Project $ProjectDir }
if (-not (Test-Path $BaseRom -PathType Leaf)) { throw "Input not found: $BaseRom" }
if (-not (Test-Path $Project -PathType Leaf)) { throw "Project not found: $Project" }
if ([IO.Path]::GetExtension($Project).ToLowerInvariant() -ne '.issdproj') { throw 'Project must use the .issdproj extension' }

$outputPath = Join-Path $ProjectDir 'ISSSD-Plus-project-integrity-fixed.sfc'

Write-Host "ROM base: $BaseRom"
Write-Host "Project: $Project"
Write-Host ''
Write-Host 'Generating ONE full project ROM with persisted patches, semantic writers, and Plus player integrity reconciliation.'
Write-Host 'No Mesen probe will run. Manual first-screen/navigation behavior is the validation signal.'

Push-Location $repoRoot
try {
  $buildOutput = & node 'scripts/build-full-plus-project.mjs' $BaseRom $Project '--output' $outputPath
  if ($LASTEXITCODE -ne 0) { throw "Full Plus project build failed with exit code $LASTEXITCODE" }
  $buildOutput | Write-Host
  Write-Host ''
  Write-Host 'ROM TO TEST MANUALLY:'
  Write-Host $outputPath
  Write-Host ''
  Write-Host 'Report: PASSA if it advances normally beyond the first screen; otherwise TRAVA.'
} finally {
  Pop-Location
}
