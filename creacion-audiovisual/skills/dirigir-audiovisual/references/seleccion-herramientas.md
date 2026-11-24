# Elegir herramientas por escena y etapa

Usa esta guía cuando se produzca o revise una pieza. Registra en el plan de escena lo que debe comunicar, su motor principal, las ayudas que realmente mejoran el resultado y una salida alternativa. Un encargo corto puede usar varias técnicas durante el montaje y una sola por escena.

## Recomendación antes de producir

- Presenta qué técnica usarías para cada necesidad que cambie el resultado. En un boletín económico, por ejemplo, anima una gráfica de comparación con SVG, HTML o Remotion si el entorno lo admite, ilustra vivienda o actividades con GPT Images cuando ayude a entender, y usa mapas o Three.js cuando el lugar o el volumen aporte. Comprueba las opciones con una prueba pequeña y aprovecha varias capacidades complementarias cuando mejoren la pieza. Reserva el montaje de tarjetas estáticas para previsualizar o para un estilo solicitado expresamente.

- Incluye siempre en la consulta inicial de video una pregunta sobre música o ambiente, separada de la voz. Hazla en términos concretos y ofrece el fondo recomendado, la opción de usar audio propio y la opción sin fondo. Por ejemplo: «Para este video de datos del INEGI, te recomiendo un instrumental discreto. ¿Prefieres ese fondo, usar una pista tuya o dejarlo sin fondo?» Si el usuario ya indicó su elección, confírmala sin hacerle repetirla.

- Para cada encargo, propone una ruta y pregunta antes de producir, aun si el formato y la duración ya están definidos. Considera fidelidad visual, composición, narración y herramientas disponibles. Sugiere GPT Images para ilustración editorial, Three.js para cámara y volumen, y SVG o formas nativas para datos y diagramas exactos, cuando corresponda.

- Si es pertinente mostrar un logo de una fuente o marca, pregunta si lo quiere dentro de la misma intervención creativa. Si ya eligió, aplica esa decisión sin volver a preguntar.

- Interpreta el contenido y el material disponible antes de elegir. Distingue grabación, explicación de un proceso, historia, datos, operación matemática, ilustración, escena espacial y simulación. El encargo puede combinar varias de estas rutas.
- Describe la propuesta visual, nombra una o dos herramientas y di qué aportan. Formula una pregunta breve de elección o confirmación. Si hay narración, pregunta en el mismo turno cómo quiere que suene y para qué público, utilizando las decisiones ya conocidas. Si es una revisión, confirma solo la parte que se va a cambiar. Espera la respuesta, salvo que el usuario solicite expresamente avanzar sin consultas.
- Recomienda herramientas operativas en la sesión y con uso permitido por la regla de cero cargos. Si un motor opcional todavía no se puede comprobar, dilo en una frase y ofrece una ruta compatible. Usa una herramienta principal por escena y auxiliares para tareas específicas.
- Ejemplo para datos: «Te recomiendo mostrar cómo cambian las barras mientras avanza la voz. Prepararía las cifras con Gráficos y montaría el video con Remotion. ¿Lo prefieres como gráfica animada o integrado sobre el video que ya grabaste?»
- Ejemplo para un procedimiento: «Para explicar la operación, usaría Manim para que se vea cómo cambia cada término. ¿Lo quieres con voz o con etiquetas breves en pantalla?»

| Momento o necesidad | Ruta preferente | Comprobación |
|---|---|---|
| Idea abierta, dirección de arte o identidad | Define público y propósito, elige estilo y prepara guion, storyboard y un fotograma representativo. Usa imagen nativa incluida cuando haga falta una referencia visual. | Comprueba que arte, texto y ritmo cumplen la intención. |
| Material grabado, música, voz y subtítulos | Montaje, tiempos y capas con Remotion si está disponible y su licencia se ajusta al encargo. Usa FFmpeg y los módulos de edición cuando hagan falta cortes, mezcla o conversión. | Inspecciona cortes, sincronía, niveles, legibilidad y reproducción. |
| Títulos, SVG y gráficas animadas | Conserva SVG editable. Usa Anime.js para secuencias y transiciones controladas por tiempo. Si hay datos, prepara filas y fuentes en Gráficos cuando esté disponible y anima los resultados comprobados. | Prueba el mismo fotograma fuera de secuencia y conserva cifras, unidades y significado. |
| Partículas, capas ilustradas y efectos 2D | PixiJS para capas con muchos elementos. Pixi Filters solo para el efecto elegido, como resplandor o separación cromática. Deja el texto informativo y los datos en capas limpias. | Prueba una toma con y sin el efecto y verifica el costo visual y de rendimiento. |
| Modelos, cámara, luces y materiales 3D | Three.js; WebGL 2 directo para una pieza pequeña que se beneficie de una escena autónoma; WebGPU cuando la ruta probada lo aproveche. | Captura el encuadre difícil y conserva el proyecto editable. |
| Gravedad, choques y rebotes | Rapier calcula la trayectoria. Three.js o la vista 2D la dibuja. Para video, calcula antes las poses y recupera cada fotograma por su número. | Comprueba el contacto, la pérdida de altura y el mismo resultado al saltar o reordenar fotogramas. |
| Resplandor, profundidad o varios efectos 3D | Postprocessing en una escena Three.js WebGL 2. Usa el efecto solo donde sea visible y útil. | Compara color, opacidad y legibilidad al tamaño real. Para una estela, usa posiciones guardadas cuando el efecto deba reproducirse por fotograma. |
| Procedimiento matemático | Manim local cuando pueda renderizar. Para manipular valores en tiempo real, produce una vista de Gráficos. | Contrasta cada paso, unidades y resultado, incluida su versión numerada o visual. |

## Ejecución y entrega

- Usa [la escena de rebotes](../assets/rebotes.html) para detectar motores y probar combinaciones. Abre el archivo en un navegador compatible. El HTML incluye las bibliotecas, opciones de escena y una ruta que reproduce la trayectoria de demostración cuando la simulación no está disponible. Mantén los avisos de [terceros](../assets/Movimiento-LICENCIAS.txt).
- Personaliza forma, gravedad, altura, rebote, duración, paleta, título y procedencia con `node scripts/crear-rebotes.mjs config.json salida.html`. La plantilla valida la configuración y conserva el modo audiovisual. Para una escena distinta, reutiliza los [motores editables y su interfaz](../assets/movimiento-src/README.md) en el proyecto del usuario.
- Si hay un navegador ejecutable por Playwright y FFmpeg local, ejecuta `node scripts/exportar-rebotes.mjs assets/rebotes.html rebotes.mp4`. El script fija las opciones de la muestra audiovisual, lee el tiempo por fotograma y valida la decodificación de H.264. Para otros encargos adopta sus criterios y monta el material real en Remotion o en la ruta de [exportación sin red](exportacion-sin-red.md).
- Una consulta permite diagnosticar. Instala o monta un proyecto solo cuando el encargo lo autorice. En Chat o Work comprueba insumos, escritura, navegador y audio. Usa `node scripts/doctor.mjs <proyecto>` cuando haya carpeta de proyecto. Cambia a una ruta disponible si faltan dependencias y evita exigir descargas para el archivo entregado.
- Cuida continuidad, legibilidad al tamaño final, audio y subtítulos. Si falla una exportación MP4, registra la etapa exacta y conserva el proyecto y las salidas probadas. El dispositivo desde el que se conversa puede usar una sesión remota compatible; comprueba allí el render por separado.
