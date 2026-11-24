#!/usr/bin/env bash
# Instalador global reproducible para Antigravity en Linux y macOS (cero cargos adicionales).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="${ANTIGRAVITY_PLUGINS_DIR:-$HOME/.gemini/config/plugins}"
DATA_DIR="${ANTIGRAVITY_DATA_DIR:-$HOME/.gemini/antigravity/plugin_data}"
WITH_DEPS=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --con-dependencias) WITH_DEPS=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      cat <<'EOF'
Uso: bash adaptaciones/instalar-antigravity.sh [--con-dependencias] [--dry-run]

Opciones:
  --con-dependencias  Instala runtimes locales gratuitos en plugin_data/ (requiere node/npm y/o python3).
  --dry-run           Muestra acciones y verifica herramientas sin copiar archivos ni instalar paquetes.
EOF
      exit 0
      ;;
    *)
      echo "Opción no reconocida: $arg" >&2
      exit 2
      ;;
  esac
done

echo "Origen:  $SCRIPT_DIR"
echo "Plugins: $PLUGINS_DIR"
echo "Datos:   $DATA_DIR"

if [ "$DRY_RUN" = true ]; then
  for p in creacion-audiovisual graficos investigacion-profunda; do
    [ -f "$SCRIPT_DIR/$p/plugin.json" ] || { echo "Falta $p/plugin.json" >&2; exit 1; }
    echo "[dry-run] Instalaría $p en $PLUGINS_DIR/$p (sin gemini-extension.json)"
  done
  command -v node >/dev/null 2>&1 && echo "[ok] node $(node --version)" || echo "[aviso] node no encontrado (se usarán respaldos Python 3)"
  command -v ffmpeg >/dev/null 2>&1 && echo "[ok] ffmpeg disponible" || echo "[aviso] ffmpeg no encontrado (render MP4 pendiente)"
  command -v python3 >/dev/null 2>&1 && echo "[ok] $(python3 --version)" || echo "[aviso] python3 no encontrado"
  exit 0
fi

mkdir -p "$PLUGINS_DIR" "$DATA_DIR"
for p in creacion-audiovisual graficos investigacion-profunda; do
  rm -rf "$PLUGINS_DIR/$p"
  cp -r "$SCRIPT_DIR/$p" "$PLUGINS_DIR/$p"
  rm -f "$PLUGINS_DIR/$p/gemini-extension.json"
  rm -rf "$PLUGINS_DIR/$p/runtime"
  find "$PLUGINS_DIR/$p" -name "__pycache__" -exec rm -rf {} +
  find "$PLUGINS_DIR/$p" -path "*/scripts/*" -type f -exec chmod 0755 {} + 2>/dev/null || true
  echo "[instalado] $p -> $PLUGINS_DIR/$p"
done

if [ "$WITH_DEPS" = true ]; then
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "=== Instalando runtime gratuito de Gráficos ==="
    GR_RT="$DATA_DIR/graficos/runtime"
    mkdir -p "$GR_RT"
    cp "$SCRIPT_DIR/graficos/runtime/package.json" "$GR_RT/package.json"
    (cd "$GR_RT" && npm install --no-audit --no-fund)

    echo "=== Instalando Playwright + Chromium para Creación audiovisual ==="
    CA_RT="$DATA_DIR/creacion-audiovisual/runtime"
    mkdir -p "$CA_RT/audiovisual-runtime"
    if [ ! -f "$CA_RT/audiovisual-runtime/package.json" ]; then
      (cd "$CA_RT/audiovisual-runtime" && npm init -y >/dev/null)
    fi
    (cd "$CA_RT/audiovisual-runtime" && npm install --no-audit --no-fund playwright && npx playwright install chromium)
  else
    echo "[aviso] Node.js/npm no disponibles; omitiendo dependencias npm."
  fi

  if command -v python3 >/dev/null 2>&1; then
    echo "=== Creando entorno Python multimedia ==="
    CA_RT="$DATA_DIR/creacion-audiovisual/runtime"
    mkdir -p "$CA_RT"
    if command -v uv >/dev/null 2>&1; then
      uv venv --clear --python python3 --seed "$CA_RT/py-venv"
    else
      python3 -m venv "$CA_RT/py-venv"
    fi
    "$CA_RT/py-venv/bin/pip" install --disable-pip-version-check -r "$SCRIPT_DIR/creacion-audiovisual/requirements-media.txt"
  else
    echo "[aviso] python3 no disponible; omitiendo entorno Python."
  fi
fi

echo "Listo. Reinicia o abre una nueva conversación en Antigravity para usar los complementos."
