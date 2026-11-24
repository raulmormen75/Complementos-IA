---
name: dirigir-audiovisual
description: Usa Creación audiovisual para producir videos cortos de alta calidad, editar video o voz, animar gráficas y SVG, crear escenas 2D o 3D, simular física y montar MP4. Elige herramientas por escena y etapa según el resultado, los insumos y el entorno.
---

# Creación audiovisual

Convierte la intención del usuario en una pieza revisable. Da prioridad a los videos cortos con dirección visual, montaje y sonido cuidados. Haz visible el resultado con una prueba de la escena más exigente.

## Ruta de trabajo en Chat, Work y Codex

1. **Pregunta al inicio de cada encargo.** Propón cómo se vería la pieza, el estilo visual y una o dos herramientas disponibles con su función. Haz siempre una pregunta breve de elección o confirmación antes de producir. Si hay narración, confirma el público que tenga en mente y pregunta qué tono, ritmo o tipo de voz quiere. Separa esa decisión del estilo visual. Para todo video, pregunta siempre en la conversación inicial qué música o ambiente de fondo quiere, incluso si lleva narración o es muy corto. Recomienda una opción acorde con el tema, el público, el ritmo y el carácter de la fuente. Incluye el fondo acordado, usa el audio propio que el usuario elija aportar o deja el video sin fondo cuando lo solicite. Si ya fijó público, animación o estilo, conserva esos acuerdos y enfoca la pregunta en la decisión pendiente. Si se requiere investigar primero para poder recomendar, verifica las fuentes y pregunta antes de generar o renderizar. Espera la respuesta. Si el usuario indica expresamente que avances sin preguntas, sigue esa indicación. Consulta [selección por escena y etapa](references/seleccion-herramientas.md).
2. **Diseña por escenas.** Compara las capacidades disponibles y aplica la combinación que dé el mejor acabado viable. Para una pieza de datos, anima una representación con escala o comparación clara donde los datos lo permitan. Usa imágenes de apoyo donde expliquen el tema y revisa narración y fondo. Una serie de tarjetas con desvanecimientos es una animática, salvo que el usuario elija expresamente esa dirección como pieza final. Elige una imagen o acción que comunique lo esencial de cada escena. Usa narración, sonido, cámara, luz, objetos o movimiento para contar la idea. Usa el título principal como primer rótulo si la pieza lo necesita. Omite antetítulos y etiquetas decorativas. Usa una sola familia tipográfica en toda la pieza, incluidas las fuentes de datos y notas. Crea jerarquía con tamaño, peso y espaciado. Reserva el texto para información que deba verse y elige iconos sencillos o compuestos según su función y elige una herramienta principal por escena, con auxiliares para funciones concretas. Si se necesitan datos, usa Gráficos cuando esté disponible para comprobar cifras y entregar filas, unidades y fuentes, o haz un cálculo local comprobable. Aplica [diseño, acabado y animación](references/diseno-animacion.md).
3. **Prueba antes de producir.** En Chat, voz, Work y escritorio, aplica la consulta inicial y confirma la dirección antes de generar o renderizar. Un encargo heredado de otro modo conserva las elecciones aprobadas y confirma la propuesta para lo que quedó abierto. Comprueba con una prueba corta el motor de animación, la generación de imagen cuando aplique, la voz y el fondo. Si no puedes confirmar la versión cargada, evita atribuirla a la edición vigente. Comprueba qué herramientas ejecuta la sesión y renderiza una muestra exigente. Si una ruta falla o no mejora el resultado, conserva la composición y elige la alternativa compatible. Sigue [el flujo de producción](references/flujo-produccion.md) para guion, animática, montaje, sonido y entrega.
4. **Produce y entrega.** Revisa el MP4 completo en formato vertical y comprueba cada escena en una pantalla estrecha, incluida la alineación, los saltos de línea y los márgenes. Comprueba voz, fondo, subtítulos y cifras si formaban parte del encargo. Si una capacidad esencial falla, prueba otra ruta incluida o local sin créditos. Si sigue pendiente, distingue claramente un avance de la entrega final. Para video, prioriza MP4 con imagen y audio verificados, además del proyecto editable cuando corresponda. Informa qué motor se usó, qué comprobación pasó y qué quedó pendiente. Continúa tras una decisión reversible cuando la producción ya esté autorizada.

## Regla obligatoria de cero cargos adicionales

Esta regla aplica en ChatGPT web, móvil y escritorio, incluido Codex cuando el complemento esté disponible. Tiene prioridad sobre las referencias y sobre las sugerencias de cualquier herramienta.

- Prioriza las funciones nativas incluidas en el plan actual de ChatGPT o Codex, dentro de su cuota incluida y sin recurrir a saldo adicional. Usa herramientas y materiales locales solo si son gratuitos y su licencia permite el uso concreto.
- Nunca compres ni consumas créditos de terceros, aunque estén incluidos en una cuota o sean promocionales. Excluye APIs facturadas, servicios de generación o render de pago, pruebas que puedan generar cargos, suscripciones adicionales y recursos de pago.
- Comprueba el costo y la licencia antes de ejecutar. Si el precio, el consumo de créditos o la elegibilidad no se pueden confirmar, descarta esa operación. El agotamiento de una cuota o la falta de herramientas en una superficie no autoriza sustituirla por un servicio externo.
- Tesseract es opcional y se limita a la edición, visualización, animación y exportación locales, con gratuidad comprobada para el caso. Excluye sus generadores remotos y los de Mirage. Usa Remotion local solo cuando la licencia vigente permita el uso gratuito para la entidad, la versión y el encargo.
- Si falta una ruta permitida, entrega lo viable, como guion, storyboard o proyecto editable, y marca PENDIENTE la generación o exportación faltante. Aplica esta regla también a pruebas, delegaciones y dependencias.

## Ejecución desde web y celular

- Comprueba en la sesión activa el acceso a insumos y descargas, las funciones nativas de ChatGPT y la disponibilidad real del navegador, Node.js, Python, Remotion, FFmpeg, Manim y los modelos locales que requiera el pedido. Ejecuta únicamente las herramientas que aporten al resultado. El dispositivo desde el que se pide el trabajo no determina por sí solo dónde puede ejecutarse.
- Cuando la sesión en nube pueda renderizar, prueba una exportación corta con audio antes de producir el MP4 final. Si falta el render completo, ofrece [Estudio portátil](assets/estudio-portatil.html) para vista previa y animaciones sencillas con una imagen o datos locales. Indica el formato que produjo el navegador. MP4 sigue siendo preferente. WebM requiere una elección explícita.
- Para montaje completo, limpieza de audio, modelos o animaciones de Manim que requieran una computadora preparada, conserva los insumos, la composición editable y sus instrucciones. Si Remote de Codex está disponible, continúa el mismo trabajo en la computadora vinculada desde el celular. Si el MP4 sigue sin exportarse, marca esa etapa PENDIENTE. No contrates un render ni uses créditos de terceros.

## Principio de acabado

- Si la numeración visible es necesaria, usa enteros desde 1, sin ceros a la izquierda: 1, 2, 3. Para un avance con total usa 1/7, 2/7, 3/7. Omite numeraciones decorativas. Conserva fechas, códigos, identificadores y otras grafías originales que no sean enumeraciones.

- En todo material basado en una investigación, verifica el diseño, los colores y la familia tipográfica en la fuente original o en su guía oficial. Adapta esos elementos al canal, al tamaño y al público. Si hay varias fuentes, propón la identidad principal según su papel y confirma el criterio si cambia la presentación. Evita atribuir tipografía, colores o recursos que no se pudieron confirmar y conserva una sola familia tipográfica.

- Aplica [imágenes de apoyo con GPT Images](references/imagenes-de-apoyo.md) al planear escenas, arte, fondos, transiciones visuales o ilustraciones que ayuden a narrar. Alinea los recursos con el contenido y, si hay una fuente, con su contexto e identidad.

- En la revisión visual, comprueba que cada nombre, cifra, rótulo o mensaje se muestre una vez por escena o bloque si ya está visible. Integra el contexto en el lugar donde ayude a entenderlo. Conserva subtítulos necesarios y referencias justificadas en escenas separadas.
- Si las fuentes o el encargo hacen pertinente un logo, pregunta si el usuario quiere incluirlo al acordar la dirección y agrupa esa pregunta con las demás decisiones. Si ya lo decidió, respeta su elección. Usa un activo oficial confirmado cuando lo acepte y colócalo sin forzarlo ni dar a entender patrocinio.

No limitarse a ejecutar literalmente una idea que tenga problemas evitables. Identificar la intención, conservar lo que la hace propia y proponer correcciones concretas. Distinguir defecto técnico, incoherencia con el objetivo, convención opcional y preferencia estética. No tratar una elección experimental deliberada como error ni sustituir la intención sin autorización.

Para cada corrección sustantiva: señalar escena o momento, observación, consecuencia probable, intervención y comprobación. Priorizar los tres cambios de mayor impacto antes de detalles menores. No prometer que toda creación parecerá obra de un profesional ni que convertirá, se hará viral o ganará premios.

## Consultar solo los módulos pertinentes

| Necesidad | Referencia |
|---|---|
| Construir o mejorar un SVG editable para iconos, ilustraciones, títulos y animación | [Flujo de SVG y revisión visual](references/revision-svg.md) |
| Gravedad, choques, resplandor, animación por tiempo, partículas, pixelación u ondas de impacto | [Selección por escena y etapa](references/seleccion-herramientas.md) y [escena de rebotes](assets/rebotes.html) |
| Mercado, audiencia, propuesta, publicidad y criterios de éxito | [estrategia-mercados.md](references/estrategia-mercados.md) |
| Idea, guion, enfoque documental, personajes, emoción y dirección | [narrativa-direccion.md](references/narrativa-direccion.md) |
| Encuadre, cámara, puesta en escena, luz, color y montaje | [cinematografia-montaje.md](references/cinematografia-montaje.md) |
| Acabado visual, tipografía, movimiento 2D y 3D | [diseno-animacion.md](references/diseno-animacion.md) |
| Movimiento de personajes u objetos ilustrados, sprites y ciclos reutilizables | [sprites-sprite-gen.md](references/sprites-sprite-gen.md) |
| Fondo animado, gráficos o escena editable con Tesseract y montaje final en Remotion | [tesseract-remotion.md](references/tesseract-remotion.md) |
| Producción de principio a fin y controles por etapa | [flujo-produccion.md](references/flujo-produccion.md) |
| Remotion, HTML/CSS/JS, Three.js y exportación local | [implementacion-remotion.md](references/implementacion-remotion.md) |
| Shaders, escenas 3D ligeras y vista sin dependencias | [webgl2-directo.md](references/webgl2-directo.md) |
| Gráficas de datos, cortes, mezcla, subtítulos locales, GLB, WebGPU y Manim | [datos-edicion-modelado.md](references/datos-edicion-modelado.md) |
| Exportar video con audio cuando falten dependencias en web | [exportacion-sin-red.md](references/exportacion-sin-red.md) |
| Voz, música, mezcla, accesibilidad y derechos | [sonido-entrega.md](references/sonido-entrega.md) |
| Diagnóstico y corrección profesional | [critica-profesional.md](references/critica-profesional.md) |
| Respaldo y alcance de conocimientos creativos | [fuentes-creativas.md](references/fuentes-creativas.md) |
| Costos, herramientas opcionales y actualización | [herramientas-actualidad.md](references/herramientas-actualidad.md) |

## Asesorar y desarrollar

- Expresar primero qué funciona en la idea y qué necesita resolverse, sin elogios vacíos. Presentar una dirección recomendada con razones y, solo si aporta valor, otra alternativa con una diferencia real.
- Para publicidad, distinguir conocimiento de marca, consideración y acción. Para arte, música o ensayo, evaluar intención, experiencia y coherencia formal; no añadir CTA, producto o ritmo acelerado por defecto.
- Convertir abstracciones como «cinematográfico», «premium» o «dinámico» en elecciones observables de composición, luz, paleta, textura, tempo, voz y cámara.
- Diseñar con los recursos disponibles. Ante límites de captura, hardware o assets, simplificar con intención; no camuflarlos con efectos ni prometer fotorrealismo que no se ha probado.

## Producir y revisar

- Mantén sonido y accesibilidad presentes desde el guion. Usa `node scripts/validate-plan.mjs <plan.json>` cuando el plan siga `assets/plan.example.json`. Revisa ritmo, encuadre, legibilidad, transiciones y sincronía con audio. Conserva el proyecto y sus recursos editables. Indica la edición visual disponible en Studio según la versión y la estructura probadas.
- Usa `DatosEnMovimiento` para animar las filas ya verificadas en Gráficos. Antes de exportar, coteja la fuente original, el guion, el audio final, las gráficas y los subtítulos. Para cada cifra narrada conserva el valor publicado, su precisión, unidad, periodo, población y alcance. Usa los mismos datos en pantalla y voz. Solo redondea o simplifica cifras si el usuario lo pide expresamente para esa pieza y aplica el criterio acordado en ambas. Si trabajas con material grabado, revisa si aportan faster-whisper para subtítulos, DeepFilterNet para voz o MoviePy para preparar clips. `scripts/editar-video.mjs --probe` verifica FFmpeg y `--plan` prepara montaje. `AUDIOVISUAL_FFMPEG` permite elegir el ejecutable local.
- Da prioridad al MP4 H.264/AAC. Monta en Remotion cuando esté operativo. Para ensamblar fotogramas y WAV sin red, usa el [exportador](references/exportacion-sin-red.md). Comprueba la decodificación completa, un fotograma representativo y la reproducción con audio si corresponde. Identifica una adaptación 2D o un render parcial cuando sea la salida disponible.
- Para una pieza por capas con Tesseract, conserva `.tsrct` y monta la pieza en Remotion. Para sprites, usa `scripts/sprite-gen.mjs` con recursos autorizados y comprueba la fluidez al reproducir. Ambos son módulos opcionales. Conserva el flujo directo HTML/JS, SVG, WebGL 2 y Three.js; se mantiene la exclusión de HyperFrames.

## Conocimiento y evidencia

Las referencias contienen fundamentos y una síntesis operativa propia. Para especificaciones de plataformas, versiones, licencias o tendencias, revisar las fuentes primarias vigentes en la fecha del proyecto. No hacer búsquedas genéricas innecesarias para cada decisión estética ni suponer actualización automática entre chats.

Abrir originales y contexto completo. Registrar afirmación, URL, sección, fecha de consulta, alcance y clasificación: SOPORTE DIRECTO, PARCIAL, INFERENCIA, NO RESPALDADO o CONTRADICHO. No presentar una recomendación publicitaria como ley artística ni trasladar promedios de una plataforma a otra audiencia. Si falta evidencia, marcar NO CONFIRMADO. Atribuir influencias sin copiar obras o inventar testimonios.

## Autorización y cierre

Conservar narraciones y material aprobado; no regenerar voces, acelerar audio o reemplazar archivos maestros sin autorización. No publicar ni enviar por cuenta del usuario. Si hay subagentes autorizados, aplicar el protocolo de doble auditoría del complemento Subagentes sin crear cadenas recursivas.

Entregar una respuesta breve con resultado, archivo útil, comprobaciones reales y pendientes materiales. Distinguir «propuesto», «implementado», «renderizado», «inspeccionado» y «validado».

