# Instalación reproducible y compatibilidad (Windows y Linux)

Guía para instalar globalmente en Antigravity los tres complementos de `adaptaciones/` y sus dependencias locales gratuitas, sin rutas personales, sin claves y sin cargos adicionales.

## 1. Instalación rápida de los complementos en Antigravity

- **Linux / macOS:**
  ```bash
  bash adaptaciones/instalar-antigravity.sh
  ```
- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1
  ```

Ambos scripts instalan `creacion-audiovisual`, `graficos` e `investigacion-profunda` en `~/.gemini/config/plugins/` (`%USERPROFILE%\.gemini\config\plugins\` en Windows), omitiendo `gemini-extension.json` en la copia de Antigravity para evitar advertencias multi-herramienta y conservando intacto el repositorio original.

Para instalar además los runtimes locales gratuitos (`plugin_data/`), añade `--con-dependencias` en Linux/macOS o `-ConDependencias` en PowerShell.

## 2. Versiones de dependencias compatibles (cero cargos)

| Componente | Requisito / Versión verificada | Licencia | Uso |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 24.10` LTS (probado `v24.22.3`) | MIT | Scripts `.mjs`, `node:sqlite` en `consultar-sql.mjs`, Remotion y bundles |
| **FFmpeg / FFprobe** | Build estático GPL con `libx264` y `aac` | GPL / LGPL según compilación | `editar-video.mjs`, `exportar-fotogramas.mjs`, `exportar-rebotes.mjs`, Remotion |
| **Python** | `>= 3.11` (probado `3.12.3`) | PSF | Respaldos sin dependencias (`validate-plan.py`, `consultar-sql.py`, `graficos.py`) y `preparar-medios.py` |
| **Runtime Gráficos (`graficos/runtime/package.json`)** | `@duckdb/duckdb-wasm` **`1.32.0`** + `apache-arrow` **`^17.0.0`** (`17.0.0`) | Apache-2.0 | SQL avanzado sobre CSV/TSV/Parquet (`entradas-avanzadas.mjs`). *No usar `apache-arrow` 21.x ni prereleases `1.33.x` con `1.32.0`.* |
| **Excel / PNG / Vistas (`graficos`)** | `exceljs@^4.4.0`, `@napi-rs/canvas@^1.2.0`, `hyparquet@^1.33.2`, `hyparquet-compressors@^1.1.3`, `chart.js@^4.6.2`, `mermaid@^12.3.0`, `@deck.gl/core@^9.4.2`, `@deck.gl/layers@^9.4.2`, `cytoscape@^3.35.0`, `pdf-lib@^1.17.1`, `esbuild@0.28.2`, `three@0.186.1`, `plotly.js-gl3d-dist-min@4.3.0` | MIT | Importación `.xlsx`, exportación `.png`, Parquet, empaquetado de motores y vistas HTML sin red |
| **Playwright + Chromium** | `playwright@^1.65.1` + Chromium (`npx playwright install chromium`) | Apache-2.0 | `exportar-rebotes.mjs` (WebGL 2 SwiftShader) y validación visual offline |
| **Remotion Starter** | `remotion@4.0.537` (`assets/remotion-starter/package-lock.json`) | Revisar elegibilidad gratuita | Copia de trabajo fuera del plugin (`npm ci`) para `Estudio` y `DatosEnMovimiento` |
| **Python multimedia (`requirements-media.txt`)** | `moviepy>=2.0.0,<3` (`2.2.1`), `faster-whisper>=1.2.0,<2` (`1.2.1`), `pillow<12`, `numpy>=1.25.0,<3` | MIT | Cortes MoviePy 2 (`preparar-medios.py`); `faster-whisper` requiere modelo local descargado |
| **Manim Community (opcional)** | `manim>=0.18` (probado `v0.22.1`) | MIT | `ecuacion_lineal.py` y `operacion.py` (en Linux sin `gcc`/`cairo-dev` puede instalarse vía `conda-forge`/`micromamba`) |

### Nota sobre Linux sin `sudo` para Chromium

Si el sistema base no incluye `libnspr4`, `libnss3` o `libasound2t64` (Ubuntu 24.04), pueden extraerse los paquetes `.deb` oficiales en espacio de usuario (`apt-get download` + `dpkg-deb -x`) y apuntar `LD_LIBRARY_PATH` a esa carpeta antes de ejecutar `exportar-rebotes.mjs` o Remotion.

## 3. Recursos faltantes documentados (no sustituidos ni inventados)

- **Creación audiovisual:** faltan la imagen original del complemento (`assets/creacion-audiovisual.png`) y el paquete wheel original de Sprite Gen (`sprite_gen-3.15.0-py3-none-any.whl` con SHA-256 `a3a712522c757651ae0345d63f52bf6ba597313727657e42a2130520d10cd8d2`). *Nota de verificación:* el asset publicado en el release `v3.15.0` de `aldegad/sprite-gen` tiene un SHA-256 diferente (`eacd1358...`), por lo que no se empaquetó ni sustituyó.
- **Gráficos:** faltan cuatro imágenes originales de marca (dos pares de rutas).
- **Investigación profunda:** se omite la ruta local privada del caso de aceptación en `references/pruebas-aceptacion.md` y no se confirmó el manifiesto original previo.
