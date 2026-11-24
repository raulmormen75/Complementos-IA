# Motores locales y costos

Gráficos funciona en base con Node.js y JavaScript en navegador sin red. Elige un motor opcional si aporta una capacidad concreta. No pidas API, cuenta o créditos para dibujar, analizar, exportar o proporcionar mapa base. Mantén el dato dentro de la ejecución local salvo autorización.

| Necesidad | Ruta |
|---|---|
| Barras, tendencia, filtros y detalle | SVG y JavaScript incluidos. Chart.js para un lienzo sencillo o Recharts para componentes React ya disponibles en el proyecto. |
| Interacción científica | Plotly.js local. Si existe la versión empaquetada, `--engines plotly` añade la gráfica interactiva enlazada con los filtros. No requiere Plotly Studio. |
| Mapas con mayor volumen | deck.gl con las geometrías propias y sin proveedor de mapa base. Selecciona una región para filtrar el resto del tablero. Usa un estilo cartográfico adecuado al territorio y añade la atribución de los datos. |
| Diagramas y redes | El diagrama SVG incluido cubre relaciones sencillas. Usa Mermaid local para secuencias o estados, Cytoscape.js para redes grandes o planificadas. |
| Datos tabulares complejos | Usa la [ruta SQL local](sql-local.md) para consultas reproducibles, cruces y agregaciones. Para Parquet, selecciona DuckDB-Wasm cuando el entorno ya lo tenga disponible. El script base usa JavaScript. |
| Excel y PDF | La exportación nativa base genera Office Open XML y PDF. ExcelJS local permite importar hojas. pdf-lib permite incorporar polígonos, imágenes, tipografías o páginas a un PDF existente cuando esté disponible y sea útil. |
| 3D | Para `surface: "sine"`, usa `--engines three` si está incluida la versión empaquetada. Three.js inicia WebGPU y comprueba su ruta WebGL 2. Si ambas fallan, se mantiene la proyección 2D. Para otra función o escena adapta la plantilla de Three.js y prueba el entorno real. |

El repositorio puede incluir los motores opcionales minificados con sus licencias y atribuciones. Sus archivos no se cargan en un tablero básico. La ruta de [selección por finalidad](seleccion-herramientas.md) incluye Rapier (Apache 2.0), Postprocessing (Zlib) y Anime.js, PixiJS y Pixi Filters (MIT). Las licencias de datos, modelos, tipografías y mapas se revisan por separado.

La preparación reproducible usa Three.js 0.186.1, plotly.js-gl3d-dist-min 4.3.0 y esbuild 0.28.2 en una carpeta de preparación local con `node_modules`. Desde la habilidad, `node scripts/empaquetar-motores.mjs <carpeta-de-preparacion>` reconstruye solo los dos archivos empaquetados y sus avisos de licencia. El complemento instalado no ejecuta este paso ni descarga dependencias al generar un resultado.

## Uso de bibliotecas adicionales

Cuando el entorno disponga de una carpeta local con `node_modules`, pasa esa carpeta como `--runtime`. Los programas trabajan con archivos locales y no requieren cuentas, claves ni mapas alojados. Consulta `--help` para cada entrada.

```text
node scripts/entradas-avanzadas.mjs --runtime <carpeta-local> --input base.csv --config esquema.json --out datos.json --sql "SELECT categoria, SUM(valor) AS total FROM datos GROUP BY categoria"
node scripts/vista-especializada.mjs --runtime <carpeta-local> --mode chartjs --input datos.json --out grafica.html
node scripts/vista-especializada.mjs --runtime <carpeta-local> --mode deckgl --input datos.json --out mapa.html
node scripts/vista-especializada.mjs --runtime <carpeta-local> --mode mermaid --diagram diagrama.mmd --out diagrama.html
node scripts/vista-especializada.mjs --runtime <carpeta-local> --mode cytoscape --input datos.json --out red.html
```

Para CSV prepara `@duckdb/duckdb-wasm` con el módulo `apache-arrow` que trae como dependencia. Para Parquet añade `hyparquet` y, según la compresión, `hyparquet-compressors`. Para Excel usa `exceljs`. Para las vistas prepara `esbuild` y el motor seleccionado (`chart.js`, `@deck.gl/core` y `@deck.gl/layers`, `mermaid` o `cytoscape`). Las vistas resultantes incorporan el código y los datos. Si el entorno en nube carece de estas bibliotecas, la ruta base ya incluida sigue entregando tableros, mapas, diagramas, Excel, PDF y SVG.

Fuentes primarias: [Plotly.js](https://plotly.com/javascript/is-plotly-free/), [deck.gl](https://deck.gl/docs/get-started/using-with-map), [DuckDB-Wasm](https://github.com/duckdb/duckdb-wasm), [ExcelJS](https://github.com/exceljs/exceljs), [pdf-lib](https://pdf-lib.js.org/), [Three.js](https://threejs.org/docs/pages/WebGPURenderer.html), [Manim](https://github.com/ManimCommunity/manim).
