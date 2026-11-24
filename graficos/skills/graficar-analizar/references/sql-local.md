# SQL local con Gráficos

Usa SQL cuando una consulta, unión, ventana o control de calidad sea parte del encargo. Para una gráfica simple, conserva el generador estándar. El motor trabaja con los archivos proporcionados en memoria. La ejecución usa SQLite integrado en Node.js 24.10 o posterior y recurre a `sqlite3` de Python si el entorno tiene una versión anterior de Node.js. La opción `--python` permite señalar un ejecutable local comprobado.

## Preparar la consulta

1. Identifica qué representa cada fila, tipos, claves, periodo, unidad y fuente. Al unir tablas comprueba primero la unicidad esperada de las claves y compara conteos antes y después. Indica los filtros y separa datos faltantes y cero.
2. La entrada principal se llama `datos`. Añade CSV, TSV o JSON con `--table nombre=ruta` cuando haga falta. Los JSON pueden ser arreglos o contener `rows`. CSV y TSV conservan el texto, incluidos ceros iniciales. Marca solo las columnas de medida con `--numeric tabla.columna`; una cifra mal formada se informa. Usa `--decimal ,` cuando corresponda.
3. Usa una sola consulta `SELECT` o `WITH`, con uniones, agregaciones, fechas y funciones de ventana como `LAG` y `ROW_NUMBER`. Enumera columnas o asigna alias distintos. Para una consulta extensa usa `--sql-file consulta.sql`. Adjuntar otras bases, cargar extensiones, leer archivos vía SQL y modificar tablas queda fuera de la ruta.

```text
node scripts/consultar-sql.mjs --input ventas.csv --table regiones=regiones.json --numeric datos.importe --sql "SELECT r.region, SUM(d.importe) AS total FROM datos d JOIN regiones r ON d.region_id = r.id GROUP BY r.region ORDER BY total DESC" --out consulta.json
```

La salida JSON conserva columnas, registros, consulta y nombres de archivos. Si quieres generar una gráfica a partir de esa misma salida, pasa `--config grafica.json` con la fuente, unidad y campos de salida `x` y `y`, luego usa el generador habitual `graficos.mjs`. Comprueba cobertura, unidades y una muestra de las cifras antes de entregar la gráfica. El modo base acepta hasta ocho tablas, 64 MiB por archivo y hasta 100,000 registros por tabla y por resultado. Los enteros de salida fuera de la precisión de JavaScript se guardan como texto.

## Parquet y opciones en nube

- Para Parquet o funciones específicas de DuckDB, usa `entradas-avanzadas.mjs` con un entorno local que ya tenga DuckDB-Wasm, Apache Arrow y el decodificador Parquet. La ruta existente prepara una tabla `datos` y acepta un `SELECT` analítico de esa tabla. Consulta [motores locales](motores.md).
- En nube, comprueba los motores disponibles antes de ejecutar. Con Python disponible, indica su ruta con `--python` si la detección automática no lo encuentra. Cuando solo esté disponible la ejecución directa de Python, usa `sqlite3` en memoria con parámetros vinculados y un autorizador de solo lectura para las tablas proporcionadas, y coteja los resultados antes de graficar. Si el entorno no puede ejecutar SQL, entrega la consulta reproducible e indica qué quedó sin ejecutar.
- No necesitas cuenta, conector ni facturación de Google Cloud para estas rutas. SQL local cubre análisis relacional sobre archivos. BigQuery administra datos y consultas en el servicio de Google Cloud. Consulta [SQLite de Node.js](https://nodejs.org/api/sqlite.html) y [entorno gratuito de BigQuery](https://docs.cloud.google.com/bigquery/docs/sandbox).
