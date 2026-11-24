# Elegir herramientas por finalidad y etapa

Clasifica la solicitud por su contenido, estructura y objetivo. Usa texto, pasos, opciones, periodos, variables, territorio, relaciones, operaciones y parámetros como señales. Un documento narrativo puede necesitar un esquema; una tabla con varias variables puede necesitar un tablero con filtros. Una aclaración breve que no mejora con una vista se resuelve directamente.

## Pregunta y recomendación

- Como primer paso de cada encargo, recomienda una representación, un estilo y una o dos herramientas disponibles. Pregunta para elegir o confirmar la propuesta y espera la respuesta antes de producir. Cuando aún debas investigar para poder recomendar con fundamento, pregunta al cerrar la investigación y antes de presentar una pieza. Si el usuario ya especificó algo, incorpóralo en tu recomendación sin repetir la pregunta. Agrupa forma, interacción y formato según corresponda. Solo omite la pregunta si el usuario pide expresamente avanzar sin consultas.
- Elige primero por lo que el resultado debe comunicar. Comprueba disponibilidad en la sesión y facilidad de apertura en el destino. Recomienda cada motor opcional que esté operativo. Para un motor sin confirmar, indica la condición y ofrece una opción incluida. Usa una ruta principal por vista y agrega herramientas solo para tareas concretas; verifica interacción, cálculo y salida sin cuentas ni créditos de terceros.
- «Para explicar los cuatro pasos te recomiendo un esquema en HTML con SVG editable. ¿Lo quieres así o prefieres una tabla comparativa? Lo dejaría en HTML para editarlo. ¿Te sirve ese formato o ya necesitas el PDF final?»
- «Como quieres comparar por periodo, región y producto, te recomiendo un tablero HTML con filtros. Usaría Plotly.js si quieres explorar puntos y tendencias. ¿Prefieres ese tablero o una tabla con los mismos filtros?»

## Inventario para decidir

| Encargo | Herramientas y criterio |
|---|---|
| Explicar, ordenar o comparar | HTML, CSS, JavaScript, tabla y SVG editable como base, con revisión visual. Mermaid para procesos y secuencias más complejos, Cytoscape.js para redes. |
| Comparar valores o explorar datos | Tabla o gráfica SVG y JavaScript como base. Plotly.js para interacción científica, Chart.js si conviene trabajar en un lienzo, Recharts si el proyecto ya usa React. Explorador portátil si solo se puede usar el navegador. Incluye filtros para datos con varias variables e incorpora un control para restablecerlos. |
| Consultar datos | SQLite local para SQL, DuckDB-Wasm para cruces avanzados y Parquet cuando esté disponible, ExcelJS para importar hojas. Las prácticas de Data y Power BI ayudan a comprobar indicadores, totales y registros. Aplica acciones visuales inspiradas en Tableau cuando ayuden a explorar. BigQuery guía el tipo de consulta, que se realiza con los motores locales. |
| Mostrar información territorial | SVG con geometría y fuente reales, o deck.gl para más capas y volumen. |
| Explicar matemáticas y espacio | Manim para una operación animada paso a paso. Plotly.js para explorar una función. Three.js para una escena o superficie 3D; prueba WebGPU y WebGL 2 y ofrece vista 2D de respaldo. |
| Animar o simular | Anime.js para animación por pasos, Rapier para física, PixiJS para capas 2D, Pixi Filters para efectos ilustrativos y Postprocessing para efectos 3D que no afecten la interpretación. |
| Dar forma visual y entregar | Aplica la guía basada en Frontend Design y Design para tipografía, jerarquía, controles y accesibilidad. Usa los exportadores propios según el pedido y pdf-lib para ampliar un PDF existente si está disponible. |


| Finalidad | Ruta preferente | Comprobación |
|---|---|---|
| Validar y resumir datos | Ruta base local; DuckDB-Wasm disponible para cruces complejos. Reutiliza los resultados calculados en la tabla, la gráfica y los archivos. | Confirma unidades, filtros, errores, agregados y procedencia. |
| Comparar o presentar resultados | SVG editable y tabla. Añade Plotly.js cuando la interacción científica aportará valor. Para Excel o PDF usa el exportador correspondiente. | Comprueba escala, etiquetas, totales y coincidencia entre formatos. |
| Mostrar territorio, relaciones o secuencias | Mapa con geometría y fuente real; SVG, Mermaid o Cytoscape.js para diagramas según su complejidad. Anime.js permite controlar pasos, pausas y regreso al punto previo. | Prueba límites, conexiones y cambios visuales sin alterar datos. |
| Muchas capas o elementos en movimiento 2D | PixiJS como vista opcional. Pixi Filters solo sobre capas ilustrativas. Conserva una vista o exportación con etiquetas, valores y geometría verificables. | Prueba toque, teclado y comportamiento en una pantalla estrecha. |
| Escena matemática o espacial | Three.js con respaldo 2D; Manim cuando importe el desarrollo animado de un procedimiento. Postprocessing se reserva para ilustraciones 3D con WebGL 2. | Contrasta la geometría y evita aplicar efectos a ejes, escalas o colores que codifican datos. |
| Gravedad y colisiones | Rapier con controles y parámetros visibles. Three.js o vista 2D representan los resultados. El archivo identifica el origen como simulación. | Cambia gravedad o restitución, reinicia y verifica un resultado. Indica si la vista reproduce una trayectoria precalculada. |
| Resultado para video | Entrega filas, unidades, fuente, SVG y la configuración gráfica que correspondan a Creación audiovisual. | Verifica que cifras y escalas coincidan en la salida animada. |

## Uso en local, web y celular

- Abre [la escena de rebotes](../assets/rebotes.html). Prueba controles, reinicio, alternativas gráficas, datos y motores disponibles. El archivo HTML lleva las bibliotecas y sus [avisos](../assets/Movimiento-LICENCIAS.txt). No requiere cuentas, CDN ni servicios de cobro al abrirlo.
- Para otra demostración de rebotes usa `node scripts/crear-rebotes.mjs config.json salida.html`. Valida forma, gravedad, altura, rebote, duración, paleta, título y procedencia. Para nuevos diagramas o simulaciones se pueden reutilizar los [motores editables](../assets/movimiento-src/README.md) desde Node.js y el navegador.
- Usa WebGL 2 para la vista con Postprocessing. Si el visor restringe WebGL o WebAssembly, ofrece las opciones compatibles. Identifica en pantalla cuándo reproduce una trayectoria preparada y conserva la tabla y la representación 2D.
- Mantén la ruta base, Excel, PDF, PNG y SVG disponibles según el encargo. Añade motores solo a resultados que los usan. Cuando el modelo pueda continuar, verifica la descarga o apertura antes de declarar que la salida es utilizable.
