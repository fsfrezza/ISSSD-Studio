param(
  [Parameter(Mandatory=$true,Position=0)]
  [string]$Rom,
  [string]$Report = 'probe.json',
  [string]$Ranked = 'probe-ranked.json',
  [int]$Limit = 20
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pathFile = Join-Path $repoRoot '.tools\mesen\mesen-path.txt'

if (-not (Test-Path $Rom)) {
  throw "ROM not found: $Rom"
}
if ($Limit -lt 1 -or $Limit -gt 500) {
  throw "Limit must be between 1 and 500"
}

if (-not (Test-Path $pathFile)) {
  Write-Host 'Mesen is not installed locally. Running verified setup first...'
  & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'setup-mesen-windows.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Mesen setup failed' }
}

Push-Location $repoRoot
try {
  Write-Host 'Running WRAM probe...'
  & node 'scripts/mesen-smoke.mjs' '--mode' 'probe' $Rom '--report' $Report
  if ($LASTEXITCODE -ne 0) { throw "Probe failed with exit code $LASTEXITCODE" }

  Write-Host 'Ranking state-like WRAM candidates...'
  & node 'scripts/analyze-mesen-probe.mjs' $Report '--limit' $Limit '--out' $Ranked
  if ($LASTEXITCODE -ne 0) { throw "Probe analysis failed with exit code $LASTEXITCODE" }

  Write-Host ''
  Write-Host 'State discovery completed.'
  Write-Host "Raw report: $((Resolve-Path $Report).Path)"
  Write-Host "Ranked report: $((Resolve-Path $Ranked).Path)"
} finally {
  Pop-Location
}
