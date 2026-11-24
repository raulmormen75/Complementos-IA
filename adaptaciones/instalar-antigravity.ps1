# Instalador global reproducible con respaldo y recuperación automática para Antigravity en Windows 10/11 (cero cargos).
[CmdletBinding()]
param(
  [switch]$ConDependencias,
  [switch]$DryRun,
  [string]$Restaurar = "",
  [string]$PluginsDir = (Join-Path $env:USERPROFILE ".gemini\config\plugins"),
  [string]$DataDir = (Join-Path $env:USERPROFILE ".gemini\antigravity\plugin_data")
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Complementos = @("creacion-audiovisual", "graficos", "investigacion-profunda")
$RuntimeRelPaths = @(
  "graficos\runtime",
  "creacion-audiovisual\runtime\audiovisual-runtime",
  "creacion-audiovisual\runtime\py-venv"
)

function Invoke-CheckedCommand {
  param([string]$FilePath, [string[]]$Arguments)
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Falló el comando '$FilePath $($Arguments -join ' ')' con código de salida $LASTEXITCODE."
  }
}

function Restore-FromBackup {
  param([string]$BackupPath)
  if (-not (Test-Path $BackupPath)) {
    throw "La carpeta de respaldo no existe: $BackupPath"
  }
  $restored = $false
  $bPlugins = Join-Path $BackupPath "plugins"
  if (Test-Path $bPlugins) {
    New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null
    foreach ($p in $Complementos) {
      $src = Join-Path $bPlugins $p
      if (Test-Path $src) {
        $dst = Join-Path $PluginsDir $p
        if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
        Copy-Item -Recurse -Force $src $dst
        Write-Host "[restaurado] plugin $p <- $src"
        $restored = $true
      }
    }
  }
  $bRuntime = Join-Path $BackupPath "runtime"
  if (Test-Path $bRuntime) {
    foreach ($rel in $RuntimeRelPaths) {
      $src = Join-Path $bRuntime $rel
      if (Test-Path $src) {
        $dst = Join-Path $DataDir $rel
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
        if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
        Copy-Item -Recurse -Force $src $dst
        Write-Host "[restaurado] runtime $rel <- $src"
        $restored = $true
      }
    }
  }
  if (-not $restored) {
    Write-Warning "No se encontraron elementos respaldados dentro de $BackupPath"
  }
}

function Find-CompatiblePython {
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    if (Get-Command py -ErrorAction SilentlyContinue) {
      foreach ($ver in @("-3.12", "-3.13", "-3.14", "-3.11")) {
        $exe = & py $ver -c "import sys; print(sys.executable)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $exe) {
          return @{ Cmd = ($exe | Select-Object -First 1).Trim(); Version = $ver.TrimStart("-") }
        }
      }
    }
    foreach ($cand in @("python", "python3")) {
      $cmd = Get-Command $cand -ErrorAction SilentlyContinue
      if ($cmd) {
        $ok = & $cmd.Source -c "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}'); sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,14) else 1)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $ok) {
          return @{ Cmd = $cmd.Source; Version = ($ok | Select-Object -First 1).Trim() }
        }
      }
    }
    return $null
  } finally {
    $ErrorActionPreference = $prevEAP
  }
}

if ($Restaurar) {
  Restore-FromBackup -BackupPath $Restaurar
  return
}

Write-Host "Origen:  $ScriptDir"
Write-Host "Plugins: $PluginsDir"
Write-Host "Datos:   $DataDir"

if ($DryRun) {
  foreach ($p in $Complementos) {
    $manifest = Join-Path (Join-Path $ScriptDir $p) "plugin.json"
    if (-not (Test-Path $manifest)) { throw "Falta $manifest" }
    $dst = Join-Path $PluginsDir $p
    if (Test-Path $dst) {
      Write-Host "[dry-run] Respaldaría instalación existente de $p y actualizaría $dst"
    } else {
      Write-Host "[dry-run] Instalaría $p en $dst (sin gemini-extension.json)"
    }
  }
  if (Get-Command node -ErrorAction SilentlyContinue) { Write-Host "[ok] node $(node --version)" } else { Write-Host "[aviso] node no encontrado (se usarán respaldos Python 3)" }
  if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Write-Host "[ok] ffmpeg disponible" } else { Write-Host "[aviso] ffmpeg no encontrado (render MP4 pendiente)" }
  $pyCompat = Find-CompatiblePython
  if ($pyCompat) {
    Write-Host "[ok] Python $($pyCompat.Version) compatible para multimedia ($($pyCompat.Cmd))"
  } else {
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      if (Get-Command py -ErrorAction SilentlyContinue) {
        $pyV = (& py -3 --version 2>&1 | Select-Object -First 1)
        Write-Host "[aviso] $pyV detectado (respaldos Python 3 funcionan; moviepy/faster-whisper requieren Python 3.11-3.14)"
      } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $pyV = (& python --version 2>&1 | Select-Object -First 1)
        Write-Host "[aviso] $pyV detectado (respaldos Python 3 funcionan; moviepy/faster-whisper requieren Python 3.11-3.14)"
      } else {
        Write-Host "[aviso] Python 3 no encontrado"
      }
    } finally {
      $ErrorActionPreference = $prevEAP
    }
  }
  return
}

$hasExisting = $false
foreach ($p in $Complementos) {
  if (Test-Path (Join-Path $PluginsDir $p)) { $hasExisting = $true }
}
if ($ConDependencias) {
  foreach ($rel in $RuntimeRelPaths) {
    if (Test-Path (Join-Path $DataDir $rel)) { $hasExisting = $true }
  }
}

$BackupDir = ""
if ($hasExisting) {
  $stamp = (Get-Date -Format "yyyyMMdd-HHmmss") + "-" + $PID
  $BackupDir = Join-Path $DataDir (".backups\" + $stamp)
  New-Item -ItemType Directory -Force -Path (Join-Path $BackupDir "plugins"), (Join-Path $BackupDir "runtime") | Out-Null
  foreach ($p in $Complementos) {
    $src = Join-Path $PluginsDir $p
    if (Test-Path $src) {
      $dst = Join-Path (Join-Path $BackupDir "plugins") $p
      Copy-Item -Recurse -Force $src $dst
      Write-Host "[respaldo] $p -> $dst"
    }
  }
  if ($ConDependencias) {
    foreach ($rel in $RuntimeRelPaths) {
      $src = Join-Path $DataDir $rel
      if (Test-Path $src) {
        $dst = Join-Path (Join-Path $BackupDir "runtime") $rel
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
        Copy-Item -Recurse -Force $src $dst
        Write-Host "[respaldo] runtime $rel -> $dst"
      }
    }
  }
}

$StageDir = Join-Path ([System.IO.Path]::GetTempPath()) ("antigravity-stage-" + [Guid]::NewGuid().ToString("N"))
$touchedPlugins = New-Object System.Collections.Generic.List[string]
$touchedRuntimes = New-Object System.Collections.Generic.List[string]
$modified = $false

try {
  New-Item -ItemType Directory -Force -Path $StageDir | Out-Null
  foreach ($p in $Complementos) {
    $src = Join-Path $ScriptDir $p
    if (-not (Test-Path (Join-Path $src "plugin.json"))) {
      throw "Manifiesto faltante en $src"
    }
    $stg = Join-Path $StageDir $p
    Copy-Item -Recurse -Force $src $stg
    foreach ($extra in @("gemini-extension.json", "requirements-media.txt", "runtime")) {
      $ep = Join-Path $stg $extra
      if (Test-Path $ep) { Remove-Item -Recurse -Force $ep }
    }
    Get-ChildItem -Path $stg -Directory -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
  }

  $modified = $true
  New-Item -ItemType Directory -Force -Path $PluginsDir, $DataDir | Out-Null
  foreach ($p in $Complementos) {
    $touchedPlugins.Add($p)
    $dst = Join-Path $PluginsDir $p
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item -Recurse -Force (Join-Path $StageDir $p) $dst
    Write-Host "[instalado] $p -> $dst"
  }

  if ($ConDependencias) {
    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCmd) { $nodeCmd = Get-Command node -ErrorAction SilentlyContinue }
    $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npmCmd) { $npmCmd = Get-Command npm -ErrorAction SilentlyContinue }
    $npxCmd = Get-Command npx.cmd -ErrorAction SilentlyContinue
    if (-not $npxCmd) { $npxCmd = Get-Command npx -ErrorAction SilentlyContinue }

    if ($nodeCmd -and $npmCmd -and $npxCmd) {
      Write-Host "=== Instalando runtime exacto de Gráficos ==="
      $touchedRuntimes.Add("graficos\runtime")
      $grRt = Join-Path $DataDir "graficos\runtime"
      if (Test-Path $grRt) { Remove-Item -Recurse -Force $grRt }
      New-Item -ItemType Directory -Force -Path $grRt | Out-Null
      Copy-Item -Force (Join-Path $ScriptDir "graficos\runtime\package.json") (Join-Path $grRt "package.json")
      Push-Location $grRt
      try {
        Invoke-CheckedCommand -FilePath $npmCmd.Source -Arguments @("install", "--no-audit", "--no-fund")
      } finally { Pop-Location }

      Write-Host "=== Instalando Playwright 1.65.1 + Chromium ==="
      $touchedRuntimes.Add("creacion-audiovisual\runtime\audiovisual-runtime")
      $caRt = Join-Path $DataDir "creacion-audiovisual\runtime\audiovisual-runtime"
      if (Test-Path $caRt) { Remove-Item -Recurse -Force $caRt }
      New-Item -ItemType Directory -Force -Path $caRt | Out-Null
      Copy-Item -Force (Join-Path $ScriptDir "creacion-audiovisual\runtime\package.json") (Join-Path $caRt "package.json")
      Push-Location $caRt
      try {
        Invoke-CheckedCommand -FilePath $npmCmd.Source -Arguments @("install", "--no-audit", "--no-fund")
        Invoke-CheckedCommand -FilePath $npxCmd.Source -Arguments @("playwright", "install", "chromium")
      } finally { Pop-Location }
    } else {
      Write-Warning "Node.js/npm no disponibles; se omiten dependencias npm."
    }

    $pyCompat = Find-CompatiblePython
    $uvCmd = Get-Command uv -ErrorAction SilentlyContinue
    if ($pyCompat -or $uvCmd) {
      Write-Host "=== Creando entorno Python multimedia ==="
      $touchedRuntimes.Add("creacion-audiovisual\runtime\py-venv")
      $venvDir = Join-Path $DataDir "creacion-audiovisual\runtime\py-venv"
      if (Test-Path $venvDir) { Remove-Item -Recurse -Force $venvDir }
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $venvDir) | Out-Null
      if ($uvCmd -and -not $pyCompat) {
        Invoke-CheckedCommand -FilePath $uvCmd.Source -Arguments @("venv", "--clear", "--python", "3.12", "--seed", $venvDir)
      } else {
        Invoke-CheckedCommand -FilePath $pyCompat.Cmd -Arguments @("-m", "venv", $venvDir)
      }
      $pipExe = Join-Path $venvDir "Scripts\pip.exe"
      Invoke-CheckedCommand -FilePath $pipExe -Arguments @("install", "--disable-pip-version-check", "-r", (Join-Path $ScriptDir "creacion-audiovisual\requirements-media.txt"))
    } else {
      Write-Warning "No se encontró Python 3.11-3.14 (ni uv); se omite py-venv (moviepy==2.2.1 y faster-whisper==1.2.1 aún no tienen wheels para Python 3.15+). Los respaldos Python base siguen disponibles."
    }
  }
} catch {
  Write-Warning "Error durante la instalación: $($_.Exception.Message)"
  if ($modified) {
    foreach ($p in $touchedPlugins) {
      $dst = Join-Path $PluginsDir $p
      if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    }
    foreach ($rel in $touchedRuntimes) {
      $dst = Join-Path $DataDir $rel
      if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    }
    if ($BackupDir -and (Test-Path $BackupDir)) {
      Restore-FromBackup -BackupPath $BackupDir
      Write-Warning "[rollback] Estado previo restaurado desde: $BackupDir"
    } else {
      Write-Warning "[rollback] Cambios parciales revertidos (no había instalación previa)."
    }
  }
  throw
} finally {
  if (Test-Path $StageDir) { Remove-Item -Recurse -Force $StageDir }
}

if ($BackupDir) {
  Write-Host "Respaldo previo conservado en: $BackupDir"
  Write-Host "Para revertir manualmente: powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1 -Restaurar `"$BackupDir`""
}
Write-Host "Listo. Reinicia o abre una nueva conversación en Antigravity para usar los complementos."
