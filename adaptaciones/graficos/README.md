# Gráficos · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Consulta también la [guía reproducible de instalación](../INSTALACION.md) y los [resultados de pruebas](../PRUEBAS.md).

Desde la raíz del repositorio clonado:

- Antigravity (instalador reproducible): `bash adaptaciones/instalar-antigravity.sh` (Linux/macOS) o `powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1` (Windows). Manualmente: `agy plugin validate ./adaptaciones/graficos` y `agy plugin install ./adaptaciones/graficos`, o copia `skills/graficar-analizar` a `.agents/skills/` (o `~/.gemini/config/plugins/`).
- Gemini CLI: `gemini extensions install ./adaptaciones/graficos`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/graficar-analizar` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Faltan cuatro imágenes originales de marca (dos pares de rutas). Los motores de Plotly y Three.js y el HTML de rebotes ya se recuperaron.

Usa análisis de datos, HTML/SVG, Python o Node.js cuando estén realmente disponibles. Si falta Node.js, `scripts/graficos.py` y `scripts/consultar-sql.py` ofrecen respaldo portátil sin paquetes externos; con Node.js `>= 24.10` y `runtime/package.json` (`@duckdb/duckdb-wasm@1.32.0` + `apache-arrow@17.0.0`, `exceljs`, `@napi-rs/canvas`) funcionan la importación Excel, PNG, SQL y vistas avanzadas offline. No asumas GPT Images, Remote de Codex, conectores ni un visor integrado.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. Las pruebas reales en Antigravity (Ubuntu WSL2) están documentadas en [PRUEBAS.md](../PRUEBAS.md).

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
