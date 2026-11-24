#!/usr/bin/env bash
# Instalador global reproducible con respaldo y recuperación automática para Antigravity (Linux/macOS, cero cargos).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="${ANTIGRAVITY_PLUGINS_DIR:-$HOME/.gemini/config/plugins}"
DATA_DIR="${ANTIGRAVITY_DATA_DIR:-$HOME/.gemini/antigravity/plugin_data}"
COMPLEMENTOS=(creacion-audiovisual graficos investigacion-profunda)
WITH_DEPS=false
DRY_RUN=false
RESTORE_DIR=""
BACKUP_DIR=""
MODIFIED=false
STAGE_DIR=""
TOUCHED_PLUGINS=()
TOUCHED_RUNTIMES=()

usage() {
  cat <<'EOF'
Uso: bash adaptaciones/instalar-antigravity.sh [--con-dependencias] [--dry-run] [--restaurar <carpeta-respaldo>]

Opciones:
  --con-dependencias          Instala runtimes locales gratuitos con versiones exactas en plugin_data/.
  --dry-run                   Muestra acciones, detecta instalaciones previas y verifica herramientas sin modificar archivos.
  --restaurar <carpeta>       Restaura complementos y runtimes desde un respaldo previo generado por este script.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --con-dependencias) WITH_DEPS=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --restaurar)
      [ $# -ge 2 ] || { echo "Falta la ruta para --restaurar" >&2; exit 2; }
      RESTORE_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción no reconocida: $1" >&2; exit 2 ;;
  esac
done

restore_from_backup() {
  local src="$1"
  [ -d "$src" ] || { echo "La carpeta de respaldo no existe: $src" >&2; return 1; }
  local restored=0
  if [ -d "$src/plugins" ]; then
    mkdir -p "$PLUGINS_DIR"
    for p in "${COMPLEMENTOS[@]}"; do
      if [ -d "$src/plugins/$p" ]; then
        rm -rf "$PLUGINS_DIR/$p"
        cp -a "$src/plugins/$p" "$PLUGINS_DIR/$p"
        echo "[restaurado] plugin $p <- $src/plugins/$p"
        restored=1
      fi
    done
  fi
  if [ -d "$src/runtime" ]; then
    for rel in "graficos/runtime" "creacion-audiovisual/runtime/audiovisual-runtime" "creacion-audiovisual/runtime/py-venv"; do
      if [ -d "$src/runtime/$rel" ]; then
        mkdir -p "$(dirname "$DATA_DIR/$rel")"
        rm -rf "$DATA_DIR/$rel"
        cp -a "$src/runtime/$rel" "$DATA_DIR/$rel"
        echo "[restaurado] runtime $rel <- $src/runtime/$rel"
        restored=1
      fi
    done
  fi
  [ "$restored" -eq 1 ] || echo "[aviso] No se encontraron elementos respaldados dentro de $src"
}

cleanup_stage() {
  if [ -n "$STAGE_DIR" ] && [ -d "$STAGE_DIR" ]; then
    rm -rf "$STAGE_DIR"
  fi
}

rollback_on_error() {
  local code=$?
  trap - ERR
  cleanup_stage
  if [ "$MODIFIED" = true ]; then
    echo "[error] Falló la instalación (código $code). Iniciando recuperación automática..." >&2
    for p in "${TOUCHED_PLUGINS[@]}"; do
      rm -rf "$PLUGINS_DIR/$p"
    done
    for rel in "${TOUCHED_RUNTIMES[@]}"; do
      rm -rf "$DATA_DIR/$rel"
    done
    if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
      restore_from_backup "$BACKUP_DIR" || true
      echo "[rollback] Estado previo restaurado desde: $BACKUP_DIR" >&2
    else
      echo "[rollback] Cambios parciales revertidos (no había instalación previa)." >&2
    fi
  fi
  exit "$code"
}

if [ -n "$RESTORE_DIR" ]; then
  restore_from_backup "$RESTORE_DIR"
  exit 0
fi

echo "Origen:  $SCRIPT_DIR"
echo "Plugins: $PLUGINS_DIR"
echo "Datos:   $DATA_DIR"

if [ "$DRY_RUN" = true ]; then
  for p in "${COMPLEMENTOS[@]}"; do
    [ -f "$SCRIPT_DIR/$p/plugin.json" ] || { echo "Falta $p/plugin.json" >&2; exit 1; }
    if [ -d "$PLUGINS_DIR/$p" ]; then
      echo "[dry-run] Respaldaría instalación existente de $p y actualizaría $PLUGINS_DIR/$p"
    else
      echo "[dry-run] Instalaría $p en $PLUGINS_DIR/$p (sin gemini-extension.json)"
    fi
  done
  command -v node >/dev/null 2>&1 && echo "[ok] node $(node --version)" || echo "[aviso] node no encontrado (se usarán respaldos Python 3)"
  command -v ffmpeg >/dev/null 2>&1 && echo "[ok] ffmpeg disponible" || echo "[aviso] ffmpeg no encontrado (render MP4 pendiente)"
  command -v python3 >/dev/null 2>&1 && echo "[ok] $(python3 --version)" || echo "[aviso] python3 no encontrado"
  exit 0
fi

trap rollback_on_error ERR
trap cleanup_stage EXIT

STAMP="$(date +%Y%m%d-%H%M%S)-$$"
BACKUP_CANDIDATE="$DATA_DIR/.backups/$STAMP"
HAS_EXISTING=false
for p in "${COMPLEMENTOS[@]}"; do
  [ -e "$PLUGINS_DIR/$p" ] && HAS_EXISTING=true
done
if [ "$WITH_DEPS" = true ]; then
  for rel in "graficos/runtime" "creacion-audiovisual/runtime/audiovisual-runtime" "creacion-audiovisual/runtime/py-venv"; do
    [ -e "$DATA_DIR/$rel" ] && HAS_EXISTING=true
  done
fi

if [ "$HAS_EXISTING" = true ]; then
  BACKUP_DIR="$BACKUP_CANDIDATE"
  mkdir -p "$BACKUP_DIR/plugins" "$BACKUP_DIR/runtime"
  for p in "${COMPLEMENTOS[@]}"; do
    if [ -d "$PLUGINS_DIR/$p" ]; then
      cp -a "$PLUGINS_DIR/$p" "$BACKUP_DIR/plugins/$p"
      echo "[respaldo] $p -> $BACKUP_DIR/plugins/$p"
    fi
  done
  if [ "$WITH_DEPS" = true ]; then
    for rel in "graficos/runtime" "creacion-audiovisual/runtime/audiovisual-runtime" "creacion-audiovisual/runtime/py-venv"; do
      if [ -d "$DATA_DIR/$rel" ]; then
        mkdir -p "$(dirname "$BACKUP_DIR/runtime/$rel")"
        cp -a "$DATA_DIR/$rel" "$BACKUP_DIR/runtime/$rel"
        echo "[respaldo] runtime $rel -> $BACKUP_DIR/runtime/$rel"
      fi
    done
  fi
fi

STAGE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/antigravity-stage-XXXXXX")"
for p in "${COMPLEMENTOS[@]}"; do
  [ -f "$SCRIPT_DIR/$p/plugin.json" ] || { echo "Manifiesto faltante: $SCRIPT_DIR/$p/plugin.json" >&2; exit 1; }
  cp -a "$SCRIPT_DIR/$p" "$STAGE_DIR/$p"
  rm -f "$STAGE_DIR/$p/gemini-extension.json" "$STAGE_DIR/$p/requirements-media.txt"
  rm -rf "$STAGE_DIR/$p/runtime"
  find "$STAGE_DIR/$p" -name "__pycache__" -exec rm -rf {} +
  find "$STAGE_DIR/$p" -path "*/scripts/*" -type f -exec chmod 0755 {} + 2>/dev/null || true
done

MODIFIED=true
mkdir -p "$PLUGINS_DIR" "$DATA_DIR"
for p in "${COMPLEMENTOS[@]}"; do
  TOUCHED_PLUGINS+=("$p")
  rm -rf "$PLUGINS_DIR/$p"
  cp -a "$STAGE_DIR/$p" "$PLUGINS_DIR/$p"
  echo "[instalado] $p -> $PLUGINS_DIR/$p"
done

if [ "$WITH_DEPS" = true ]; then
  NODE_BIN="${ANTIGRAVITY_NODE_BIN:-node}"
  NPM_BIN="${ANTIGRAVITY_NPM_BIN:-npm}"
  NPX_BIN="${ANTIGRAVITY_NPX_BIN:-npx}"
  if command -v "$NODE_BIN" >/dev/null 2>&1 && command -v "$NPM_BIN" >/dev/null 2>&1; then
    echo "=== Instalando runtime exacto de Gráficos ==="
    TOUCHED_RUNTIMES+=("graficos/runtime")
    GR_RT="$DATA_DIR/graficos/runtime"
    rm -rf "$GR_RT"
    mkdir -p "$GR_RT"
    cp "$SCRIPT_DIR/graficos/runtime/package.json" "$GR_RT/package.json"
    (cd "$GR_RT" && "$NPM_BIN" install --no-audit --no-fund)

    echo "=== Instalando Playwright 1.65.1 + Chromium ==="
    TOUCHED_RUNTIMES+=("creacion-audiovisual/runtime/audiovisual-runtime")
    CA_RT="$DATA_DIR/creacion-audiovisual/runtime/audiovisual-runtime"
    rm -rf "$CA_RT"
    mkdir -p "$CA_RT"
    cp "$SCRIPT_DIR/creacion-audiovisual/runtime/package.json" "$CA_RT/package.json"
    (cd "$CA_RT" && "$NPM_BIN" install --no-audit --no-fund && "$NPX_BIN" playwright install chromium)
  else
    echo "[aviso] Node.js/npm no disponibles; omitiendo dependencias npm."
  fi

  PY_COMPAT=""
  for cand in python3.12 python3.13 python3.14 python3.11 python3; do
    if command -v "$cand" >/dev/null 2>&1; then
      if "$cand" -c 'import sys; sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,14) else 1)' 2>/dev/null; then
        PY_COMPAT="$cand"
        break
      fi
    fi
  done

  if [ -n "$PY_COMPAT" ]; then
    echo "=== Creando entorno Python multimedia con $PY_COMPAT ==="
    TOUCHED_RUNTIMES+=("creacion-audiovisual/runtime/py-venv")
    PY_VENV="$DATA_DIR/creacion-audiovisual/runtime/py-venv"
    rm -rf "$PY_VENV"
    mkdir -p "$(dirname "$PY_VENV")"
    if command -v uv >/dev/null 2>&1; then
      uv venv --clear --python "$PY_COMPAT" --seed "$PY_VENV"
    else
      "$PY_COMPAT" -m venv "$PY_VENV"
    fi
    "$PY_VENV/bin/pip" install --disable-pip-version-check -r "$SCRIPT_DIR/creacion-audiovisual/requirements-media.txt"
  elif command -v uv >/dev/null 2>&1; then
    echo "=== Creando entorno Python 3.12 vía uv ==="
    TOUCHED_RUNTIMES+=("creacion-audiovisual/runtime/py-venv")
    PY_VENV="$DATA_DIR/creacion-audiovisual/runtime/py-venv"
    rm -rf "$PY_VENV"
    mkdir -p "$(dirname "$PY_VENV")"
    uv venv --clear --python 3.12 --seed "$PY_VENV"
    "$PY_VENV/bin/pip" install --disable-pip-version-check -r "$SCRIPT_DIR/creacion-audiovisual/requirements-media.txt"
  else
    echo "[aviso] Se requiere Python 3.11–3.14 (o uv) para moviepy==2.2.1 y faster-whisper==1.2.1; omitiendo py-venv."
  fi
fi

if [ -n "$BACKUP_DIR" ]; then
  echo "Respaldo previo conservado en: $BACKUP_DIR"
  echo "Para revertir manualmente: bash adaptaciones/instalar-antigravity.sh --restaurar \"$BACKUP_DIR\""
fi
echo "Listo. Reinicia o abre una nueva conversación en Antigravity para usar los complementos."
