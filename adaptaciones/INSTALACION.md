# Instalación reproducible y compatibilidad (Windows y Linux)

Guía para instalar globalmente en Antigravity los tres complementos de `adaptaciones/` y sus dependencias locales gratuitas, sin rutas personales, sin claves y sin cargos adicionales.

## 1. Instalación rápida con respaldo y recuperación automática

- **Linux / macOS:**
  ```bash
  bash adaptaciones/instalar-antigravity.sh
  ```
- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1
  ```

Ambos scripts:
1. Instalan `creacion-audiovisual`, `graficos` e `investigacion-profunda` en `~/.gemini/config/plugins/` (`%USERPROFILE%\.gemini\config\plugins\` en Windows), preparando primero una carpeta temporal (`staging`) y omitiendo `gemini-extension.json` en la copia de Antigravity para evitar advertencias multi-herramienta.
2. **Respaldo previo y recuperación automática:** antes de sustituir complementos o runtimes existentes, guardan una copia con marca de tiempo en `plugin_data/.backups/<fecha-hora-pid>/` (fuera de `plugins/` para no interferir con Antigravity). Si ocurre cualquier error durante la copia o instalación de dependencias, revierten automáticamente los cambios parciales y restauran el estado anterior.
3. **Restauración manual:** para volver a un respaldo previo en cualquier momento:
   - Linux/macOS: `bash adaptaciones/instalar-antigravity.sh --restaurar "<ruta-respaldo>"`
   - Windows: `powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1 -Restaurar "<ruta-respaldo>"`

Para instalar además los runtimes locales gratuitos (`plugin_data/`), añade `--con-dependencias` en Linux/macOS o `-ConDependencias` en PowerShell. Usa `--dry-run` / `-DryRun` para inspeccionar sin modificar archivos.

## 2. Versiones exactas de dependencias compatibles (cero cargos)

| Componente | Versión exacta / requisito | Licencia | Uso |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 24.10` LTS (probado `v24.22.3` Linux y `v24.13.0` Windows) | MIT | Scripts `.mjs`, `node:sqlite` en `consultar-sql.mjs`, Remotion y bundles |
| **FFmpeg / FFprobe** | Build estático GPL con `libx264` y `aac` | GPL / LGPL según compilación | `editar-video.mjs`, `exportar-fotogramas.mjs`, `exportar-rebotes.mjs`, Remotion |
| **Python (respaldos base)** | `>= 3.11` (probado `3.12.3` Linux y `3.15.2` Windows) | PSF | Respaldos sin dependencias (`validate-plan.py`, `consultar-sql.py`, `graficos.py`) |
| **Runtime Gráficos (`graficos/runtime/package.json`)** | `@duckdb/duckdb-wasm@1.32.0` + `apache-arrow@17.0.0`, `exceljs@4.4.0`, `@napi-rs/canvas@1.2.0`, `hyparquet@1.33.2`, `hyparquet-compressors@1.1.3`, `chart.js@4.6.2`, `mermaid@12.3.0`, `@deck.gl/core@9.4.2`, `@deck.gl/layers@9.4.2`, `cytoscape@3.35.0`, `pdf-lib@1.17.1`, `esbuild@0.28.2`, `three@0.186.1`, `plotly.js-gl3d-dist-min@4.3.0` | Apache-2.0 / MIT | Importación `.xlsx`, exportación `.png`, Parquet, DuckDB-Wasm, empaquetado de motores y vistas HTML sin red. *Nota: mantener `apache-arrow@17.0.0` con `@duckdb/duckdb-wasm@1.32.0`.* |
| **Playwright + Chromium (`creacion-audiovisual/runtime/package.json`)** | `playwright@1.65.1` + Chromium (`npx playwright install chromium`) | Apache-2.0 | `exportar-rebotes.mjs` (WebGL 2 SwiftShader) y validación visual offline |
| **Remotion Starter** | `remotion@4.0.537` (`assets/remotion-starter/package-lock.json`) | Revisar elegibilidad gratuita | Copia de trabajo fuera del plugin (`npm ci`) para `Estudio` y `DatosEnMovimiento` |
| **Python multimedia (`requirements-media.txt`)** | `moviepy==2.2.1`, `faster-whisper==1.2.1`, `pillow==11.3.0`, `numpy==2.5.5`, `ctranslate2==4.9.1`, `onnxruntime==1.32.0`, `av==19.0.2`, `imageio==2.38.2`, `imageio-ffmpeg==0.8.1` | MIT | Cortes MoviePy 2 y transcripción (`preparar-medios.py`). **Requiere Python 3.11–3.14** (en Python 3.15+ aún faltan wheels para `pillow<12` y `onnxruntime<2`); `faster-whisper` requiere modelo local descargado. |
| **Manim Community (opcional)** | `manim>=0.18` (probado `v0.22.1`) | MIT | `ecuacion_lineal.py` y `operacion.py` (en Linux sin `gcc`/`cairo-dev` puede instalarse vía `conda-forge`/`micromamba`) |

### Notas por sistema operativo

- **Windows PowerShell:** el instalador invoca `npm.cmd` y `npx.cmd` directamente para evitar bloqueos de política de ejecución sobre `npm.ps1`. Si el sistema solo tiene Python 3.15+, el instalador omite `py-venv` con aviso claro y conserva operativos los respaldos Python 3 base y todo el runtime Node.js/Playwright.
- **Linux sin `sudo` para Chromium:** si el sistema base no incluye `libnspr4`, `libnss3` o `libasound2t64` (Ubuntu 24.04), pueden extraerse los paquetes `.deb` oficiales en espacio de usuario (`apt-get download` + `dpkg-deb -x`) y apuntar `LD_LIBRARY_PATH` a esa carpeta antes de ejecutar `exportar-rebotes.mjs` o Remotion.

## 3. Recursos faltantes documentados (no sustituidos ni inventados)

- **Creación audiovisual:** faltan la imagen original del complemento (`assets/creacion-audiovisual.png`) y el paquete wheel original de Sprite Gen (`sprite_gen-3.15.0-py3-none-any.whl` con SHA-256 `a3a712522c757651ae0345d63f52bf6ba597313727657e42a2130520d10cd8d2`). *Nota de verificación:* el asset publicado en el release `v3.15.0` de `aldegad/sprite-gen` tiene un SHA-256 diferente (`eacd1358...`), por lo que no se empaquetó ni sustituyó.
- **Gráficos:** faltan cuatro imágenes originales de marca (dos pares de rutas).
- **Investigación profunda:** se omite la ruta local privada del caso de aceptación en `references/pruebas-aceptacion.md` y no se confirmó el manifiesto original previo.
