param(
  [Parameter(Mandatory=$true,Position=0)]
  [string]$BaseRom,
  [Parameter(Mandatory=$true,Position=1)]
  [string]$GeneratedRom,
  [string]$BaseReport = 'probe-base.json',
  [string]$GeneratedReport = 'probe-generated.json',
  [string]$Comparison = 'probe-comparison.json',
  [string]$BaseLog = 'probe-base.log',
  [string]$GeneratedLog = 'probe-generated.log',
  [int]$Limit = 20
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pathFile = Join-Path $repoRoot '.tools\mesen\mesen-path.txt'

function Assert-MesenInitialized([string]$MesenExe) {
  $portableSettings = Join-Path (Split-Path -Parent $MesenExe) 'settings.json'
  $documents = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)
  $documentsSettings = Join-Path $documents 'Mesen2\settings.json'

  if ((Test-Path $portableSettings -PathType Leaf) -or (Test-Path $documentsSettings -PathType Leaf)) {
    return
  }

  throw @"
Mesen first-run setup is incomplete.
Mesen 2.1.1 opens its graphical configuration before it honors --testRunner when settings.json does not exist.
Run Mesen once, complete its initial configuration, close Mesen, then repeat this command.
Mesen: $MesenExe
Expected settings in either:
  $portableSettings
  $documentsSettings
"@
}

function Show-ProbeFailure([string]$Label,[string]$LogPath,[int]$ExitCode) {
  Write-Host ''
  Write-Host "$Label probe failed with exit code $ExitCode" -ForegroundColor Red
  if (Test-Path $LogPath -PathType Leaf) {
    $fullLogPath = [IO.Path]::GetFullPath($LogPath)
    Write-Host "Diagnostic log: $fullLogPath"
    Write-Host '--- diagnostic tail ---'
    Get-Content -Path $LogPath -Tail 80 | ForEach-Object { Write-Host $_ }
    Write-Host '--- end diagnostic tail ---'

    $interesting = Get-Content -Path $LogPath | Where-Object {
      $_ -match 'ISSSD_PROBE_HEARTBEAT|ISSSD_PROBE_STAGE|ISSSD_PROBE_PASS|^FAIL:|Mesen exit code:|Suppressed .*uninitialized-memory warnings'
    }
    Write-Host 'PROBE FAILURE SUMMARY:' -ForegroundColor Yellow
    if ($interesting) {
      $interesting | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
    } else {
      Write-Host '(no probe heartbeat/stage/pass markers were recorded)'
    }
    Write-Host "PROBE LOG PATH: $fullLogPath"
  } else {
    Write-Host "Diagnostic log was not created: $LogPath"
    Write-Host 'PROBE FAILURE SUMMARY: diagnostic log missing' -ForegroundColor Yellow
  }
}

foreach ($path in @($BaseRom,$GeneratedRom)) {
  if (-not (Test-Path $path)) { throw "ROM not found: $path" }
}
if ($Limit -lt 1 -or $Limit -gt 500) { throw 'Limit must be between 1 and 500' }

if (-not (Test-Path $pathFile)) {
  Write-Host 'Mesen is not installed locally. Running verified setup first...'
  & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'setup-mesen-windows.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Mesen setup failed' }
}

$mesenExe = (Get-Content -Raw -Path $pathFile).Trim().TrimStart([char]0xFEFF)
if (-not (Test-Path $mesenExe -PathType Leaf)) { throw "Mesen executable not found: $mesenExe" }
Assert-MesenInitialized $mesenExe

Push-Location $repoRoot
try {
  Write-Host 'Running WRAM probe on canonical/base ROM...'
  & node 'scripts/mesen-smoke.mjs' '--mode' 'probe' $BaseRom '--report' $BaseReport '--log' $BaseLog
  if ($LASTEXITCODE -ne 0) {
    $code = $LASTEXITCODE
    Show-ProbeFailure 'Base' $BaseLog $code
    throw "Base probe failed with exit code $code"
  }

  Write-Host 'Running WRAM probe on generated ROM...'
  & node 'scripts/mesen-smoke.mjs' '--mode' 'probe' $GeneratedRom '--report' $GeneratedReport '--log' $GeneratedLog
  if ($LASTEXITCODE -ne 0) {
    $code = $LASTEXITCODE
    Show-ProbeFailure 'Generated' $GeneratedLog $code
    throw "Generated probe failed with exit code $code"
  }

  Write-Host 'Comparing cross-ROM WRAM behavior...'
  & node 'scripts/compare-mesen-probes.mjs' $BaseReport $GeneratedReport '--limit' $Limit '--out' $Comparison
  if ($LASTEXITCODE -ne 0) { throw "Probe comparison failed with exit code $LASTEXITCODE" }

  Write-Host ''
  Write-Host 'Cross-ROM state discovery completed.'
  Write-Host "Base report: $((Resolve-Path $BaseReport).Path)"
  Write-Host "Generated report: $((Resolve-Path $GeneratedReport).Path)"
  Write-Host "Comparison: $((Resolve-Path $Comparison).Path)"
  Write-Host "Base diagnostic log: $((Resolve-Path $BaseLog).Path)"
  Write-Host "Generated diagnostic log: $((Resolve-Path $GeneratedLog).Path)"
} finally {
  Pop-Location
}
