# Resultados de pruebas realizadas (24 de noviembre de 2026)

Registro de comprobaciones reales ejecutadas en Antigravity sobre **Linux** (Ubuntu 24.04.5 LTS `x86_64`, WSL2) y **Windows 11 nativo** (PowerShell 5.1), con cero cargos adicionales y cero servicios de pago.

## 1. Activación y conformidad en Antigravity

- **Descubrimiento global (`GetAllPlugins`):** los tres complementos quedaron registrados como globales y habilitados (`isGlobal: true`, `disabled: false`) en `~/.gemini/config/plugins/`:
  - `creacion-audiovisual` → habilidad `dirigir-audiovisual` (`description`: 248 caracteres)
  - `graficos` → habilidad `graficar-analizar` (`description`: 301 caracteres)
  - `investigacion-profunda` → habilidad `investigacion-profunda` (`description`: 462 caracteres)
- **Validación estructural:** nombres `kebab-case` consistentes con carpetas, enlaces relativos verificados sin roturas, `suggestedPrompts` (3 por complemento) y `keywords` añadidos en `plugin.json`.

## 2. Pruebas de instaladores, respaldo y recuperación

| Plataforma | Prueba | Resultado observado |
| :--- | :--- | :--- |
| **Linux** (`instalar-antigravity.sh`) | `--dry-run`, fallo simulado en `--con-dependencias` (`ANTIGRAVITY_NPM_BIN=/bin/false`), instalación limpia y `--restaurar` | Detectó instalación previa, revirtió cambios parciales ante error (`exit 1`) restaurando `graficos/PREV.txt`, e instaló y restauró respaldos correctamente. |
| **Windows 11 nativo** (`instalar-antigravity.ps1`) | `-DryRun`, rollback real ante error previo (`NativeCommandError` de `py` antes del ajuste), `-ConDependencias` (`npm.cmd`/`npx.cmd` `11.6.2`) y `-Restaurar` | Respaldó `graficos` previo, instaló los 3 complementos sin `gemini-extension.json`, instaló las dependencias exactas (`381` paquetes de Gráficos + `playwright@1.65.1` + Chromium `159.0.8154.6`), revirtió correctamente en fallo y restauró marcador `WIN_PREV_OK` con `-Restaurar`. |

## 3. Pruebas de Creación audiovisual

| Prueba | Herramienta / Script | Entorno y resultado observado |
| :--- | :--- | :--- |
| Validación de plan JSON (Node y Python) | `validate-plan.mjs` / `validate-plan.py` | **Linux (Node `v24.22.3` / Python `3.12.3`) y Windows 11 (Node `v24.13.0` / Python `3.15.2`):** `valid: true` en `plan.example.json`; código `1` en JSON inválido. |
| Diagnóstico de proyecto y FFmpeg | `doctor.mjs`, `editar-video.mjs --probe`, `exportar-fotogramas.mjs --probe` | **Linux:** Node `v24.22.3`, `remotionVersionsMatch: true`, `mp4: true` (`libx264`, `aac`). *(En Windows de prueba no había `ffmpeg` en `PATH`.)* |
| Exportación sin red (PPM + WAV → MP4) | `crear-muestra.mjs` + `exportar-fotogramas.mjs` + `ffprobe` | **Linux:** MP4 H.264/AAC `320×180`, 12 fps, 2.0 s, 24 cuadros, pista AAC `16000 Hz`. |
| Escena física/3D WebGL 2 → MP4 | `exportar-rebotes.mjs` (`Playwright` + `Chromium` SwiftShader) | **Linux:** MP4 H.264 `1280×720`, 30 fps, 15 cuadros (`rapier`, `three`, `animation`, `pixi`), `pageErrors: 0`, `outsideRequests: 0`. |
| Edición y mezcla multipista | `editar-video.mjs --plan` | **Linux:** MP4 H.264/AAC `640×360`, 2.208 s, `decodingVerified: true`. |
| Corte con MoviePy 2 | `preparar-medios.py montar-python` (`moviepy 2.2.1`) | **Linux:** MP4 H.264/AAC de `0.8 s` verificado con `ffprobe`. |
| Renderizado Remotion `4.0.537` | `npm run check` + `remotion render` (`--gl=swangle`) | **Linux:** composiciones `Estudio` (`120.4 kB`) y `DatosEnMovimiento` (`22.9 kB`) en MP4 H.264 `1280×720`. |
| Animación matemática Manim | `manim v0.22.1` (`assets/manim/ecuacion_lineal.py`) | **Linux:** `EcuacionLineal.mp4` (`854×480` H.264, `7.8 s`). |
| Extrusión 3D GLB | `npm run modelar` (`scripts/modelar.mjs`) | **Linux:** archivo binario `glTF` válido (`1892 B`). |

## 4. Pruebas de Gráficos

| Prueba | Herramienta / Script | Entorno y resultado observado |
| :--- | :--- | :--- |
| Paquete completo + PNG + Plotly/Three | `graficos.mjs` + `@napi-rs/canvas@1.2.0` | **Linux y Windows 11:** 9 archivos generados (`panel.html`, `datos.xlsx`, `resumen.pdf`, `grafica.svg`, `diagrama.svg`, `datos.csv`, `analisis.json`, `escena.json` y `grafica.png` `1920×920` RGBA). |
| Respaldo portátil en Python 3 | `graficos.py` + `consultar-sql.py` | **Linux (`3.12.3`) y Windows 11 (`3.15.2`):** 8 archivos generados sin Node.js y consulta `sqlite3` con UTF-8 correcto y bloqueo de `DROP TABLE` (`exit 2`). |
| Importación de Excel (`.xlsx`) | `entradas-avanzadas.mjs --sheet Datos` (`exceljs@4.4.0`) | **Linux y Windows 11:** importación correcta de `datos.xlsx` (`6` filas). |
| SQL avanzado DuckDB-Wasm | `entradas-avanzadas.mjs` (`@duckdb/duckdb-wasm@1.32.0` + `apache-arrow@17.0.0`) | **Linux y Windows 11:** consulta `SUM(consumo)` sobre CSV ejecutada (`3` filas agregadas: Norte `39`, Poniente `31`, Sur `21`). |
| SQLite nativo Node.js 24 | `consultar-sql.mjs` (`node:sqlite`) | **Linux (`v24.22.3`) y Windows 11 (`v24.13.0`):** `motor: "SQLite de Node.js"`, `3` filas agregadas exactas. |
| Vistas especializadas y apertura offline | `vista-especializada.mjs` + `empaquetar-motores.mjs` + Playwright sin red | **Linux:** generados y abiertos sin errores `panel.html`, `chartjs`, `mermaid`, `cytoscape`, `deckgl` y `explorador-portatil.html`. **Windows 11:** generada vista `chartjs` y abierto `panel.html` en Chromium (`total: 91`). |
| Animación matemática Manim | `manim v0.22.1` (`assets/manim/operacion.py`) | **Linux:** `OperacionPasoAPaso.mp4` (`854×480` H.264, `17.8 s`). |

## 5. Pruebas de Investigación profunda

| Prueba | Mecanismo en Antigravity | Resultado observado |
| :--- | :--- | :--- |
| Auditoría independiente sobre casos sintéticos | Subagente `self` (`references/pruebas-aceptacion.md` casos 1, 8 y 9) | Rechazó extrapolación comercial (`NO CONFIRMADO`), citó páginas discontinuas `pp. 15 y 19` (y señaló `PÁGINA NO CONFIRMADA` visual) y separó expectativa del autor de hechos demostrados. |
| Comprobación visual en vivo y segunda opinión | `search_web` + subagente `browser` (`https://patents.google.com/patent/MX2016008923A/es`, HTTP 200) + subagente auditor `self` sobre captura PNG | El verificador independiente inspeccionó visualmente la captura, distinguió presentación/publicación (`MX2016008923A`) de concesión de patente (`NO CONFIRMADO`), degradó el fragmento de buscador a `SOPORTE LIMITADO` y documentó el truncamiento visual inferior de la página. |

## 6. Limitaciones pendientes

- **Compatibilidad de Python 3.15+ en Windows:** en el entorno Windows probado (`Python 3.15.2`), `moviepy==2.2.1` (`pillow<12`) y `faster-whisper==1.2.1` (`onnxruntime<2`) aún no tienen wheels binarios para `cp315`; el entorno multimedia requiere Python 3.11–3.14 (o `uv`). Los respaldos Python 3 base (`validate-plan.py`, `consultar-sql.py`, `graficos.py`) sí operan en `3.15.2`.
- **No instalados / sin pesos locales:** `ffmpeg` en el sistema Windows probado, Blender, DeepFilterNet (`df`), JSCAD (`@jscad/modeling` / `@jscad/stl-serializer`), LaTeX y modelos locales descargados para `faster-whisper`. Tampoco se probó `entradas-avanzadas.mjs` con un archivo `.parquet` de entrada (aunque `hyparquet@1.33.2` quedó fijado).
- **Recursos originales faltantes (sin sustituir):** imagen original y wheel exacto de `sprite-gen` (`creacion-audiovisual`), 4 imágenes de marca (`graficos`) y ruta local privada (`investigacion-profunda`).
- **Plataforma:** en Antigravity el subagente integrado `research` opera sin red (mapeado a `search_web` + `browser` + `self`), y páginas que bloquean clientes HTTP directos (`403`/CAPTCHA) requieren verificación mediante `browser`.
