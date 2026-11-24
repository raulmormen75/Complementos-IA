# Instalador global reproducible para Antigravity en Windows 10/11 (cero cargos adicionales).
[CmdletBinding()]
param(
  [switch]$ConDependencias,
  [switch]$DryRun,
  [string]$PluginsDir = (Join-Path $env:USERPROFILE ".gemini\config\plugins"),
  [string]$DataDir = (Join-Path $env:USERPROFILE ".gemini\antigravity\plugin_data")
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Complementos = @("creacion-audiovisual", "graficos", "investigacion-profunda")

Write-Host "Origen:  $ScriptDir"
Write-Host "Plugins: $PluginsDir"
Write-Host "Datos:   $DataDir"

if ($DryRun) {
  foreach ($p in $Complementos) {
    $manifest = Join-Path (Join-Path $ScriptDir $p) "plugin.json"
    if (-not (Test-Path $manifest)) { throw "Falta $manifest" }
    Write-Host "[dry-run] Instalaría $p en $(Join-Path $PluginsDir $p) (sin gemini-extension.json)"
  }
  if (Get-Command node -ErrorAction SilentlyContinue) { Write-Host "[ok] node $(node --version)" } else { Write-Host "[aviso] node no encontrado (se usarán respaldos Python 3)" }
  if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Write-Host "[ok] ffmpeg disponible" } else { Write-Host "[aviso] ffmpeg no encontrado (render MP4 pendiente)" }
  if (Get-Command py -ErrorAction SilentlyContinue) { Write-Host "[ok] $(py -3 --version)" } elseif (Get-Command python -ErrorAction SilentlyContinue) { Write-Host "[ok] $(python --version)" } else { Write-Host "[aviso] Python 3 no encontrado" }
  return
}

New-Item -ItemType Directory -Force -Path $PluginsDir, $DataDir | Out-Null
foreach ($p in $Complementos) {
  $src = Join-Path $ScriptDir $p
  $dst = Join-Path $PluginsDir $p
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Recurse -Force $src $dst
  $extJson = Join-Path $dst "gemini-extension.json"
  if (Test-Path $extJson) { Remove-Item -Force $extJson }
  $rtDir = Join-Path $dst "runtime"
  if (Test-Path $rtDir) { Remove-Item -Recurse -Force $rtDir }
  Get-ChildItem -Path $dst -Directory -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
  Write-Host "[instalado] $p -> $dst"
}

if ($ConDependencias) {
  $hasNode = Get-Command node -ErrorAction SilentlyContinue
  $hasNpm = Get-Command npm -ErrorAction SilentlyContinue
  if ($hasNode -and $hasNpm) {
    Write-Host "=== Instalando runtime gratuito de Gráficos ==="
    $grRt = Join-Path $DataDir "graficos\runtime"
    New-Item -ItemType Directory -Force -Path $grRt | Out-Null
    Copy-Item -Force (Join-Path $ScriptDir "graficos\runtime\package.json") (Join-Path $grRt "package.json")
    Push-Location $grRt
    try { npm install --no-audit --no-fund } finally { Pop-Location }

    Write-Host "=== Instalando Playwright + Chromium para Creación audiovisual ==="
    $caRt = Join-Path $DataDir "creacion-audiovisual\runtime\audiovisual-runtime"
    New-Item -ItemType Directory -Force -Path $caRt | Out-Null
    Push-Location $caRt
    try {
      if (-not (Test-Path "package.json")) { npm init -y | Out-Null }
      npm install --no-audit --no-fund playwright
      npx playwright install chromium
    } finally { Pop-Location }
  } else {
    Write-Warning "Node.js/npm no disponibles; se omiten dependencias npm."
  }

  $pyCmd = $null
  $pyArgs = @()
  if (Get-Command py -ErrorAction SilentlyContinue) { $pyCmd = "py"; $pyArgs = @("-3") }
  elseif (Get-Command python -ErrorAction SilentlyContinue) { $pyCmd = "python" }

  if ($pyCmd) {
    Write-Host "=== Creando entorno Python multimedia ==="
    $venvDir = Join-Path $DataDir "creacion-audiovisual\runtime\py-venv"
    & $pyCmd @pyArgs -m venv $venvDir
    $pipExe = Join-Path $venvDir "Scripts\pip.exe"
    & $pipExe install --disable-pip-version-check -r (Join-Path $ScriptDir "creacion-audiovisual\requirements-media.txt")
  } else {
    Write-Warning "Python 3 no disponible; se omite entorno Python."
  }
}

Write-Host "Listo. Reinicia o abre una nueva conversación en Antigravity para usar los complementos."
