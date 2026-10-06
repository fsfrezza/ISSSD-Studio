param(
  [Parameter(Mandatory=$true,Position=0)]
  [string]$BaseRom,
  [Parameter(Mandatory=$true,Position=1)]
  [string]$GeneratedRom,
  [string]$BaseReport = 'probe-base.json',
  [string]$GeneratedReport = 'probe-generated.json',
  [string]$Comparison = 'probe-comparison.json',
  [int]$Limit = 20
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pathFile = Join-Path $repoRoot '.tools\mesen\mesen-path.txt'

foreach ($path in @($BaseRom,$GeneratedRom)) {
  if (-not (Test-Path $path)) { throw "ROM not found: $path" }
}
if ($Limit -lt 1 -or $Limit -gt 500) { throw 'Limit must be between 1 and 500' }

if (-not (Test-Path $pathFile)) {
  Write-Host 'Mesen is not installed locally. Running verified setup first...'
  & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'setup-mesen-windows.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Mesen setup failed' }
}

Push-Location $repoRoot
try {
  Write-Host 'Running WRAM probe on canonical/base ROM...'
  & node 'scripts/mesen-smoke.mjs' '--mode' 'probe' $BaseRom '--report' $BaseReport
  if ($LASTEXITCODE -ne 0) { throw "Base probe failed with exit code $LASTEXITCODE" }

  Write-Host 'Running WRAM probe on generated ROM...'
  & node 'scripts/mesen-smoke.mjs' '--mode' 'probe' $GeneratedRom '--report' $GeneratedReport
  if ($LASTEXITCODE -ne 0) { throw "Generated probe failed with exit code $LASTEXITCODE" }

  Write-Host 'Comparing cross-ROM WRAM behavior...'
  & node 'scripts/compare-mesen-probes.mjs' $BaseReport $GeneratedReport '--limit' $Limit '--out' $Comparison
  if ($LASTEXITCODE -ne 0) { throw "Probe comparison failed with exit code $LASTEXITCODE" }

  Write-Host ''
  Write-Host 'Cross-ROM state discovery completed.'
  Write-Host "Base report: $((Resolve-Path $BaseReport).Path)"
  Write-Host "Generated report: $((Resolve-Path $GeneratedReport).Path)"
  Write-Host "Comparison: $((Resolve-Path $Comparison).Path)"
} finally {
  Pop-Location
}
