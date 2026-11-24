# Diseñar interfaces para datos

Abre esta guía al crear o rediseñar un tablero, un explorador, un mapa interactivo o una presentación gráfica, o cuando se pida evaluar su diseño. Una consulta numérica o una exportación simple sigue su ruta habitual. Para comprobar cifras, filtros y procedencia, aplica la [guía de inteligencia de negocios](inteligencia-de-negocios.md).

## Elige el recorrido

| Encargo | Qué aplicar |
|---|---|
| Crear o rediseñar | Define quién lo usará, qué pregunta responde y cuál es la primera acción útil. Elige una dirección visual acorde con ese propósito y la identidad indicada. Implementa la vista y comprueba el recorrido. |
| Revisar una interfaz | Intenta una tarea real o usa un escenario representativo autorizado. Señala dónde aparece cada problema, a quién afecta, qué corregir y cómo volver a comprobarlo. Prioriza errores de interpretación, navegación y acceso. Con una captura, limita las conclusiones a lo visible. |
| Unificar varias vistas | Reutiliza tipografía, espaciado, tamaños de controles, estados y significados de color del proyecto. Documenta decisiones reutilizables solo cuando se aplicarán a más de una vista. |
| Revisar textos o accesibilidad | Trabaja sobre los controles, gráficos y estados solicitados. Usa la comprobación funcional de abajo. |
| Investigar con usuarios o preparar entrega a desarrollo | Aplica solo cuando el encargo lo pida. Para investigación, define tareas, público y preguntas, y distingue hallazgos observados de hipótesis. Para desarrollo, entrega especificaciones de componentes, datos, interacciones, estados y pruebas de aceptación acordes con lo implementado. |

## Composición, gráfica y controles

- Si la numeración visible es necesaria, usa enteros desde 1, sin ceros a la izquierda: 1, 2, 3. Para un avance con total usa 1/7, 2/7, 3/7. Omite numeraciones decorativas. Conserva fechas, códigos, identificadores y otras grafías originales que no sean enumeraciones.
- Antes de entregar, comprueba que ningún antetítulo ni recuadro repetido convierta la composición en una plantilla. Conserva los recuadros que cumplan una función identificable y deja que los títulos, el espacio y las gráficas organicen las secciones.

- En todo material basado en una investigación, verifica el diseño, los colores y la familia tipográfica en la fuente original o en su guía oficial. Adapta esos elementos al canal, al tamaño y al público. Si hay varias fuentes, propón la identidad principal según su papel y confirma el criterio si cambia la presentación. Evita atribuir tipografía, colores o recursos que no se pudieron confirmar y conserva una sola familia tipográfica.

- Planifica la imagen de apoyo junto al título, la introducción o una transición de tema donde tenga una función real. Ajusta el encuadre, la posición y el tamaño en escritorio y celular. Conserva el protagonismo de los datos y evita añadir elementos solo para llenar huecos. Aplica [imágenes de apoyo](imagenes-de-apoyo.md).

- Revisa el resultado tal como se verá: muestra una vez las etiquetas, las cifras y los nombres que ya aparezcan en el selector o junto al dato. Los valores de referencia, unidades y fuente deben quedar al alcance sin duplicarlos en bloques contiguos.
- Diseña sobre el ancho real de la entrega. Ajusta columnas, alturas y márgenes antes de dejar un panel vacío. Mueve las notas de método, las unidades o la leyenda al lugar donde sirven, sin crear contenido de relleno. Justifica párrafos de contenido en su ancho disponible. Ajusta saltos y espaciado si aparecen huecos entre palabras, en especial en pantallas estrechas.
- Incluye iconografía funcional también en láminas textuales o estadísticas. Por ejemplo, un icono sencillo para restablecer filtros, uno temático para distinguir una escala o sección y uno de información para una nota metodológica. Conserva símbolos accesibles y comprueba que se distingan al tamaño de salida.
- Usa un logotipo oficial de la fuente institucional, gubernamental o empresarial por defecto cuando su procedencia y uso estén confirmados. Consérvalo sin deformarlo y ubícalo una sola vez como atribución, por ejemplo junto al encabezado. Mantén la atribución escrita que indique el usuario. Evita imágenes de marca que sugieran autoría o aval.

- Elige una sola familia tipográfica legible para todo el contenido editable. Aplícala a títulos, cuerpo, tablas, ejes, leyendas, etiquetas, filtros, botones y referencias. Mantén la misma familia en HTML, SVG, PDF y otras salidas de la pieza cuando el formato lo permita. Usa tamaño, peso, interlineado y espaciado para distinguir funciones. Comprueba el resultado reabierto o exportado. Si el encargo ya fija la familia, úsala también en los nuevos elementos y preserva el arte de los logotipos.

- Empieza por el título principal. Elimina sobreencabezados, antetítulos, etiquetas de categoría y rótulos decorativos situados encima del título principal. Si territorio, fecha o unidad cambian el sentido, intégralos en la introducción, en el encabezado de la gráfica pertinente o en una nota junto a los datos.
- Usa iconos sencillos para una acción o un paso fácil de reconocer. Usa iconos temáticos compuestos únicamente cuando ayuden a entender una sección, relación o idea. Omite los que repiten el texto o solo llenan espacio. Conserva las etiquetas, prueba los iconos en pantallas estrechas y oculta a tecnologías de asistencia los SVG que solo acompañan un texto equivalente.

1. Coloca primero la respuesta o vista que permite decidir. Mantén visibles periodo, unidad, procedencia y filtros que cambian el significado. Usa el detalle para navegar a tablas y registros.
2. Elige la gráfica por la comparación que debe facilitar. Usa una paleta con significado estable, una jerarquía tipográfica clara y espacio suficiente para etiquetas. En resultados que se comparan entre vistas, conserva unidades, escalas comparables y convenciones de color. Un elemento visual interactivo debe comunicar qué hará al activarlo.
3. Usa etiquetas breves y acciones concretas en español de México. El estado sin datos debe distinguir una selección vacía de información ausente. Un error de entrada debe indicar qué corregir e intentar preservar los valores que el usuario ya introdujo.
4. Parte de HTML semántico, CSS local, SVG y los motores disponibles que ya resuelven el encargo. Reserva efectos, transiciones y librerías adicionales para una función visible. En pantallas estrechas, ajusta la jerarquía y el alcance de las vistas para que los controles, etiquetas y descargas sigan utilizables.

## Comprobación funcional y visual

- Abre la interfaz y prueba, según corresponda, el estado inicial, la selección cruzada, el restablecimiento, la ausencia de resultados y una descarga. Compara un total o valor con los registros de origen después de aplicar un filtro.
- Recorre controles con teclado. Comprueba orden y visibilidad del foco, nombres accesibles, activación con teclado y que exista una forma de consultar detalles sin pasar el puntero. Acompaña una gráfica informativa con su tabla, valores o descripción equivalente. Cuando dos series puedan confundirse, añade texto, formas o patrones al color.
- Usa [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) como objetivo. Comprueba al menos 4.5:1 para texto normal, 3:1 para texto grande y 3:1 para componentes y partes gráficas cuya distinción sea necesaria, según el criterio aplicable. Comprueba área táctil, foco, ampliación y reducción de movimiento en los componentes relevantes. Prueba una vista de escritorio y otra estrecha, por ejemplo de 390 px. Revisa a 320 px cuando evalúes el criterio de reflujo, teniendo en cuenta sus excepciones para contenido bidimensional.
- Anota qué se probó y en qué entorno. Una inspección visual o una prueba automatizada parcial respalda únicamente las comprobaciones realizadas. Si no puedes abrir el artefacto, marca la validación funcional pendiente.

La guía adapta prácticas de dirección visual y revisión de interfaces de Anthropic. [Frontend Design](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) · [Design](https://github.com/anthropics/knowledge-work-plugins/tree/main/design)
