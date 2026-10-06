param(
  [Parameter(Mandatory=$true,Position=0)]
  [string]$BaseRom,
  [Parameter(Mandatory=$true,Position=1)]
  [string]$Project,
  [int]$Limit = 20
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

foreach ($path in @($BaseRom,$Project)) {
  if (-not (Test-Path $path)) { throw "Input not found: $path" }
}
if ($Limit -lt 1 -or $Limit -gt 500) { throw 'Limit must be between 1 and 500' }
if ([IO.Path]::GetExtension($Project).ToLowerInvariant() -ne '.issdproj') {
  throw 'Project must use the .issdproj extension'
}

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
