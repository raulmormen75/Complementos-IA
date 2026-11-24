# Uso y contrato de datos

Trabaja con el script `scripts/graficos.mjs` y Node.js 18 o posterior. Desde la raíz de la habilidad:

```powershell
node scripts/graficos.mjs --input assets/ejemplos/datos.json --out resultados
```

## Preparar datos

El JSON principal contiene `title`, `source`, `unit`, `x` (dimensión), `y` (variable numérica) y `rows` (objetos planos). Los recuentos y las cifras usados son de ejemplo.

```json
{
  "title": "Volumen medido por región",
  "source": "Datos simulados, noviembre de 2026",
  "unit": "m³",
  "x": "region",
  "y": "volumen",
  "chartType": "bar",
  "filters": ["periodo"],
  "rows": [{"region": "Norte", "volumen": 12, "periodo": "2026"}]
}
```

- Lee también un arreglo de objetos JSON, CSV, TSV o XLSX con `--config configuracion.json` para separar los metadatos del archivo principal. CSV y TSV requieren encabezados en la primera fila. Para XLSX indica `--sheet Nombre` y usa ExcelJS local. Se usan valores almacenados en las fórmulas del libro, sin recalcularlas. Si no hay resultado almacenado debe obtenerse desde la fuente antes del análisis.
- Indica `chartType: "line"` cuando las categorías tengan orden temporal. La plantilla ordena etiquetas de forma alfanumérica, por lo que conviene usar periodos ISO para las series por fecha.
- Usa `filters` para los filtros cruzados, `decimal: ","` si el valor viene con coma decimal y `delimiter` para elegir separador si el CSV lo requiere. El lector no borra filas repetidas. El informe señala los duplicados exactos y las filas sin valor numérico válido. Revisa si representan observaciones legítimas.
- Para mapa de puntos define `latitude` y `longitude` como nombres de las columnas. Para polígonos agrega `locations` (GeoJSON FeatureCollection) o usa `--geojson archivo.geojson`. Usa coordenadas geográficas en orden longitud, latitud. `geoKey` indica el campo de la geometría que coincide con `region` de la tabla. La opción autónoma representa geometrías locales en una proyección esquemática. Usa un motor geográfico y una proyección apropiados si el mapa requiere medir o comparar áreas.
- Para relaciones simples agrega `edges: [{"from":"Origen","to":"Destino"}]` o pares `source`, `target`. La plantilla muestra hasta 48 nodos e indica cuántos hay en total.
- Agrega `surface: "sine"` para la superficie matemática de ejemplo. El control de amplitud cambia la función y el control de giro cambia la vista. La ruta 2D proyecta una malla 3D sin depender de la tarjeta gráfica.

## Elegir salidas

Usa `--formats html,xlsx,pdf,svg,json,csv` o selecciona solo las necesarias. Abre `panel.html` en un navegador. Puedes filtrar desde la gráfica o el mapa, inspeccionar registros, ajustar una variación hipotética y descargar CSV filtrado, SVG o PNG. En el HTML, la vista de tabla muestra como máximo 100 filas, mientras que el CSV filtrado las conserva todas. Los datos están dentro del HTML y quedan accesibles a quien reciba el archivo.

El PDF incluye un resumen con gráfica de barras, cifras, fuente y valores de todos los grupos. El XLSX incluye las hojas Datos, Resumen y Metodología. El gráfico nativo de Resumen referencia las fórmulas y cambia cuando se editan valores del rango existente. Regenera el archivo si cambia el rango o aparecen categorías nuevas.

`analisis.json` conserva el cálculo base, los recuentos, la fuente y las exclusiones. `escena.json` reutiliza el mismo contrato para una gráfica animada de Creación audiovisual. El CSV protege las cadenas que una hoja podría tratar como fórmulas. Para preservar exactamente los valores textuales usa el XLSX o el JSON fuente.

El HTML permite guardar PNG con texto desde el navegador. Para automatizar ese formato con `--formats png` usa el rasterizador local `@napi-rs/canvas`. Si está instalado en otro proyecto, indica la ruta a su módulo con `--raster`.

## Validar

Comprueba filtros y exclusiones contra la tabla original, selecciona una región o categoría y compara cifras en HTML, Excel y PDF. Si se incluye gráfica nativa, modifica temporalmente un valor en una copia del libro y comprueba que se actualice la serie. Verifica el PDF renderizado y compara el número de páginas. Para un gráfico de líneas, revisa el orden y la separación temporal.
