---
name: graficar-analizar
description: "Usa Gráficos para consultar datos con SQL local, comprobar indicadores, diseñar y auditar interfaces de tableros y detectar cuándo conviene presentar o comparar información con esquemas, tablas, gráficas, mapas, diagramas o simulaciones. Entrega HTML, SVG editable, Excel, PDF, PNG o datos para video."
---

# Gráficos

Transforma datos o relaciones en una representación verificable. Trabaja en español de México, con el formato y estilo del encargo. Separa hallazgos observados, cálculo, supuesto e interpretación. Explica lo que puede deducirse con las fuentes disponibles.

## Ruta de trabajo en Chat, Work y Codex

1. **Pregunta al inicio de cada encargo.** Detecta automáticamente cómo se puede mostrar o comparar la información. Recomienda un estilo, una representación y una o dos herramientas disponibles, con una razón clara. Haz siempre una pregunta breve de elección o confirmación antes de producir, incluso si ya sabes el tema, el público o el formato. Usa esos datos para adaptar la propuesta sin volver a preguntar lo mismo. Cuando el tema exige investigar primero para poder recomendar una vista, comprueba las fuentes y haz la pregunta antes de convertirlas en material visual. Espera la respuesta. Si el usuario indica expresamente que avances sin preguntas, sigue esa indicación. Consulta [selección por finalidad y etapa](references/seleccion-herramientas.md).
2. **Comprueba los insumos.** Valida fuentes y cálculos. Cuando las cifras sean simuladas, identifica los parámetros y separa resultados del modelo y valores observados. Mantén una sola base verificada para las distintas salidas.
3. **Elige la vista y el motor.** Aplica [selección por finalidad y etapa](references/seleccion-herramientas.md). Elige un motor principal por vista y auxiliares solo cuando aporten interacción, claridad o acabado. Revisa qué puede ejecutar la sesión, conserva salidas accesibles y cambia a la alternativa compatible cuando falle una función.
4. **Prueba y entrega.** Prueba la vista, los controles y los formatos. Entrega datos, unidades y procedencia cuando se reutilicen en Creación audiovisual. Si ese complemento está disponible y el usuario pidió un video, úsalo para montaje y exportación. Distingue resultados verificados y capacidades pendientes.

Para indicadores, diagnóstico de variaciones, calidad de registros, diseño de tableros empresariales y revisión visual, aplica [inteligencia de negocios](references/inteligencia-de-negocios.md). Resuelve el encargo con datos y herramientas locales cuando sea posible. Si el usuario señala un informe real en otro producto, usa su complemento original solo si está disponible, la operación está autorizada y es compatible con la regla de cero créditos de terceros.

## Activar rutas especializadas por necesidad

- **Preparación y consulta.** Usa [SQL local](references/sql-local.md) si el usuario pide SQL o necesita cruzar, agrupar, filtrar o comprobar tablas mediante consultas reproducibles. Identifica esquema y granularidad antes de unir, valida resultados y conserva la consulta. Para operaciones sencillas, usa la ruta base.
- **Diseño de interfaz.** Usa [diseño de tableros y visualizaciones](references/diseno-frontend.md) al crear, mejorar o auditar una interfaz. Actívalo después de verificar los datos, o desde el principio si el encargo ya trae cifras aprobadas. Aplica solo las etapas necesarias. Mantén estilos e identidades aprobadas al corregir una interfaz existente. Omite esta ruta en consultas numéricas o conversiones sin cambios visuales.
- **Encargo mixto.** Primero prepara y verifica los datos. Después diseña la presentación a partir del resultado comprobado. Mantén etiquetas, unidades y filtros coherentes en ambas etapas.

## Verifica antes de graficar

1. Identifica fuente, fecha, variables, unidades, periodo, población, filtros y denominador. Confirma el nivel de cada fila. Revisa duplicados, faltantes, uniones y tipos numéricos. No ocultes exclusiones. Conserva el archivo de origen.
2. Elige modalidad por propósito. Usa tendencia para periodos ordenados, barras para comparaciones, mapa para ubicación, red para relaciones y 3D cuando aporte información espacial. Para comparar escenarios, identifica claramente las entradas hipotéticas. Valida totales y explora hasta los registros que sustentan cada agregado.
3. Si el encargo pide varias salidas, genera todas a partir de un cálculo comprobado y conserva la configuración, los datos usados y su procedencia. Incluye texto alternativo o tabla equivalente en los elementos gráficos y unidades en los ejes.

## Presentaciones informativas y formatos

- Si la numeración visible es necesaria, usa enteros desde 1, sin ceros a la izquierda: 1, 2, 3. Para un avance con total usa 1/7, 2/7, 3/7. Omite numeraciones decorativas. Conserva fechas, códigos, identificadores y otras grafías originales que no sean enumeraciones.

- En todo material basado en una investigación, verifica el diseño, los colores y la familia tipográfica en la fuente original o en su guía oficial. Adapta esos elementos al canal, al tamaño y al público. Si hay varias fuentes, propón la identidad principal según su papel y confirma el criterio si cambia la presentación. Evita atribuir tipografía, colores o recursos que no se pudieron confirmar y conserva una sola familia tipográfica.

- Aplica [imágenes de apoyo con GPT Images](references/imagenes-de-apoyo.md) en cada presentación informativa, estadística o textual. Cuando haya una función visual clara y la herramienta integrada esté disponible, genera e incorpora una imagen alusiva en una posición y tamaño que acompañen la información.

- En toda presentación gráfica, estadística o textual, incorpora iconos con función en secciones, controles o notas pertinentes. Elige sencillos o compuestos según lo que aclaren. Usa iconos selectivos, evita estampar el mismo patrón en todas las secciones y conserva etiquetas.
- Revisa la vista terminada y elimina repeticiones cercanas del mismo nombre, cifra o mensaje. Si un selector ya muestra la entidad elegida, el resultado muestra la tasa y el contexto sin volver a poner su nombre.
- Usa el ancho útil para organizar la presentación y compacta huecos grandes. Justifica los párrafos de contenido al ancho de su columna. Conserva la alineación apropiada de títulos, controles y cifras. Verifica la composición en escritorio y móvil.
- Si la fuente principal es una institución, organismo de gobierno o empresa, incluye por defecto un logotipo oficial comprobado cuando sea apropiado para el uso. Colócalo una sola vez como atribución, sin confundirlo con la marca del autor ni insinuar respaldo. Si no hay un activo verificable o no corresponde usarlo, conserva el nombre de la fuente.

- Prefiere esquemas, secuencias visibles y tablas para organizar información. Usa títulos claros, separación y color con sentido. Usa una sola familia tipográfica en toda la pieza, incluidas las fuentes de datos y notas. Crea jerarquía con tamaño, peso y espaciado. Coloca el título principal primero; omite antetítulos y etiquetas decorativas. Integra el contexto necesario debajo del título o junto a los datos. Emplea recuadros para ejercicios o avisos concretos, iconos sencillos para acciones o pasos que se entiendan mejor con ellos e iconos compuestos para temas o relaciones que ameriten detalle. Conserva el contenido y la identidad aprobados al editar.
- Mantén toda la información visible sin desplegables que oculten secciones o detalles. Cuando se presenten datos con varias variables, ofrece filtros accesibles y opción de restablecerlos. Mantén visibles las unidades, la fuente y el alcance de la selección.
- Si el formato está abierto, pregunta en la misma interacción si prefiere HTML editable o PDF final. Recomienda HTML durante las ediciones. En escritorio, trabaja sobre un sitio local editable cuando tengas acceso a archivos. En web o celular, si no puedes editar esos archivos, entrega un HTML autónomo descargable. Si se pide PDF, prepáralo sobre la presentación final y comprueba cada página. Respeta otros formatos ya solicitados.

## Ejecución autónoma

- Gráficos no depende de Data, Visualize, cuentas de cartografía ni servicios de render. Usa bibliotecas locales permitidas o los ejecutables y recursos instalados en el entorno. Nunca uses claves, saldo, pruebas facturadas, telemetría o APIs externas que consuman créditos.
- Antes de ejecutar en escritorio o nube, comprueba acceso a los archivos, escritura de resultados y disponibilidad del ejecutable. La ruta base usa Node.js 18 o posterior, sin paquetes. El HTML incorpora código y datos, se abre sin red, y permite filtros coordinados, consulta de registros, escenarios lineales, mapa con geometría o coordenadas aportadas, diagramas y una superficie 3D de demostración cuando se solicita.
- Lee [uso y contrato](references/uso.md). Adapta campos, nivel de agregación, precisión y estilo; no copies las cifras del ejemplo a una entrega. Para preparar una salida, ejecuta `node scripts/graficos.mjs --input <archivo> --out <carpeta>` desde esta carpeta, ajusta formatos con `--formats` y verifica los resultados. Los directorios y archivos adjuntos se resuelven según el entorno real.
- Para casos especializados consulta [motores y costos](references/motores.md). Usa [la escena de rebotes](assets/rebotes.html) para comprobar Rapier, Three.js, Postprocessing, Anime.js, PixiJS y Pixi Filters en una simulación con controles. Decide si cada motor aporta a la vista solicitada. Los formatos de datos y el análisis tienen su propia ruta.
- Para pasos de una operación, anima con Manim si está instalado. Consulta [matemáticas](references/matematicas.md). Para un manipulable usa Plotly.js, Three.js o controles HTML y prueba al cambiar un parámetro con valores típicos y extremos.

## Ejecución desde web y celular

- Identifica los archivos y los motores que realmente funcionan en la sesión. Si hay Node.js, usa el flujo completo del complemento. Si la superficie ofrece herramientas nativas de datos o documentos, úsalas para calcular y generar los formatos solicitados cuando la ruta de Node.js falte. Verifica que los resultados se puedan abrir o descargar en la superficie de entrega.
- Cuando no haya ejecución de código, ofrece [Explorador portátil](assets/explorador-portatil.html) para abrir un CSV, TSV o JSON local, explorar los datos con controles táctiles y exportar CSV o SVG. Entrega HTML autónomo siempre que sea viable. Para gráficos 3D, prueba WebGPU y WebGL 2 según el equipo y conserva una vista 2D si ambos faltan.
- Si el pedido requiere SQL avanzado, Manim, una biblioteca local o un archivo que el navegador no pueda generar, entrega los resultados comprobables y el insumo editable para continuar. Cuando esté disponible, usa Remote de Codex para seguir desde el celular en la computadora vinculada. Mantén la regla de cero créditos de terceros.

## Calidad de entrega

- Cuando pidan crear, mejorar o revisar un SVG, usa [el flujo de SVG y revisión visual](references/revision-svg.md). Conserva la relación entre los datos comprobados y la geometría del gráfico. Abre [Revisión SVG](assets/revision-svg.html) para comparar a tamaño real, ensayar una edición y exportar una vista previa sin red.
- Reabre el HTML y prueba un filtro, el detalle, una descarga y una interacción táctil o de teclado. Si se incluye 3D, prueba WebGPU cuando el navegador y la escena lo permitan, WebGL 2 en el recorrido compatible y la opción 2D si ninguna ruta 3D se puede usar.
- En Excel comprueba datos, fórmulas, formatos y edición del gráfico cuando su tipo esté soportado. En PDF, PNG o SVG comprueba texto, proporciones, ejes, leyendas, cortes y contraste. Comprueba que cifras y unidades coincidan entre archivos y que la representación no dependa de una escala engañosa.
- Mantén visibles las restricciones y los resultados no confirmados. Si una ruta especializada no se puede ejecutar, entrega una salida compatible con el encargo y señala lo que queda por validar.
- En auditorías de información, abre las fuentes originales y comprueba todo el contexto necesario. Una fuente citada por el usuario o listada en la configuración indica procedencia; hace falta abrirla y verificarla para confirmar las afirmaciones.
