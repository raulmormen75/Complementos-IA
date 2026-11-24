# Inteligencia de negocios con Gráficos

Elige la tarea según la decisión del usuario. Aplica las prácticas a datos autorizados, exportaciones estructuradas o archivos locales. Conserva la fuente, los resultados y el formato editable pertinente.

| Encargo | Ruta |
|---|---|
| Definir un indicador | Documenta la pregunta, propósito, fórmula, unidad, población, granularidad, periodo, filtros, exclusiones, fuente, frecuencia y denominador. Si hay meta confirmada, indica si un valor mayor o menor representa mejora. Separa meta, observado y proyección. |
| Comparar periodos o investigar un cambio | Verifica cobertura y equivalencia de periodos, unidades y población. Usa la utilidad de comparación local cuando corresponda. Desglosa por una dimensión solo si es útil y sus categorías son comparables. Reporta cambios observados, cobertura y límites. Las contribuciones aritméticas identifican diferencias por grupo. Una explicación causal necesita evidencia adicional. |
| Auditar calidad y modelo | Comprueba granularidad, claves, campos obligatorios, filas duplicadas, valores faltantes, vigencia y cobertura temporal. Si unes tablas, verifica unicidad en el lado esperado y reconcilia los conteos y totales antes y después. Define la relación antes de mezclar niveles de detalle. Distingue cero, ausencia y supresión. |
| Diseñar un tablero | Ubica primero los indicadores necesarios para la decisión. Elige barras para comparaciones, líneas para series temporales, dispersión para relaciones, mapas para ubicación y tablas para detalle. Define qué vistas responden a cada filtro y proporciona un regreso fácil a la vista general. Comprueba escalas, unidades, colores, etiquetas, teclado, ancho móvil y estados sin datos. |
| Revisar una gráfica existente | Inspecciona el archivo completo. Prioriza errores de datos y de escala, después jerarquía, contraste, etiquetas y acciones. Identifica la página o vista y especifica cómo probar cada corrección. Si solo hay una captura, limita la revisión a lo visible. |

## Ejecutar y entregar

- Usa el tablero HTML local para explorar filtros vinculados, navegar a los registros y descargar sus datos o una comprobación JSON con fuente, unidad, filtros, cobertura, total observado y escenario hipotético. Los registros descargados incorporan los filtros de la vista. La comprobación se genera al descargarla y no requiere conexión.
- Para comparar dos periodos desde un JSON del contrato de Gráficos, consulta `node scripts/comparar-kpi.mjs --help`. La salida analítica conserva sus supuestos. Usa el JSON para gráficas generado por la utilidad como entrada del generador habitual cuando la descomposición sea válida.
- Elige HTML, Excel, PDF, SVG o CSV según el uso. Recalcula una muestra, prueba una selección y reconcilia la evidencia. Si los archivos congelan un periodo, identifica ese corte.
- En nube o móvil, comprueba si la sesión puede ejecutar el flujo local o generar archivos con recursos incluidos. Si solo se dispone de navegador, usa un tablero HTML ya generado o el explorador portátil. Verifica el resultado antes de afirmar que quedó comprobado.

## Alcance de los productos de origen

El flujo propio toma prácticas de métricas y validación de Data, procedencia y detalle en Power BI, y diseño y acciones de Tableau. Los archivos locales se generan sin licencias o cuentas de estos servicios. Para abrir un informe real, editar archivos nativos, publicar, cambiar permisos o configurar actualizaciones, comprueba las capacidades y condiciones del producto correspondiente. Mantén privados los datos. Tableau Public hace visibles en Internet los libros que se publican allí.

[Interacciones de Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-reports-visual-interactions) · [Licencias del servicio Power BI](https://learn.microsoft.com/en-us/power-bi/fundamentals/service-features-license-type) · [Acciones de Tableau](https://help.tableau.com/current/pro/desktop/en-us/actions.htm) · [Preguntas sobre Tableau Public](https://help.tableau.com/current/pro/desktop/en-us/public_faq.htm)
