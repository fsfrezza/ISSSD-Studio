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
if ([string]::IsNullOrWhiteSpace($BaseRom)) { $BaseRom = Find-CanonicalPlusRom $RomDir $RomName } else { $BaseRom = Resolve-RelativeInput $BaseRom $RomDir }
if (-not (Test-Path $BaseRom -PathType Leaf)) { throw "Input not found: $BaseRom" }

Write-Host "ROM base: $BaseRom"
Write-Host ''
Write-Host 'Static analysis: tracing every plausible reference to Plus data in PC 0x78B8-0x78EF / SNES $80:F8B8-$80:F8EF.'
Write-Host 'The upstream USA disassembly marks $80:F828-$80:FF8F as free bytes, so this block is Plus-specific infrastructure.'
Write-Host 'No ROM will be generated.'

Push-Location $repoRoot
try {
  $inspectionOutput = & node 'scripts/inspect-plus-f8-references.mjs' $BaseRom
  if ($LASTEXITCODE -ne 0) { throw "Plus F8 reference inspection failed with exit code $LASTEXITCODE" }
  $inspectionOutput | Write-Host
  Write-Host ''
  Write-Host 'NO ROM GENERATED. Copy the JSON block above back into the chat.'
} finally {
  Pop-Location
}
