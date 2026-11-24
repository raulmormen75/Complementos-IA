# Exportar sin descargas

## Antes de producir

Usa esta ruta cuando se pida un video y Remotion no pueda exportar en el entorno actual. Respeta la [regla de cero cargos adicionales](../SKILL.md). El exportador usa módulos estándar de Node.js. Solo usa FFmpeg si ya está instalado, resulta compatible y su uso está permitido. No descargues paquetes, códecs ni navegadores como parte de esta ruta.

```text
node scripts/exportar-fotogramas.mjs --probe
```

`mp4: true` detecta H.264 y AAC. Confirma la capacidad con una muestra real corta antes de producir todos los fotogramas. Si el script está en otra ubicación, invócalo desde la ruta de esta habilidad. Si el host permite escribir archivos pero no expone el script como ruta, materializa el archivo incluido dentro del proyecto y ejecútalo allí. Conserva el código fuente de los fotogramas y los medios aprobados.

## Preparar material real

1. Fija dimensiones, fps, duración, escenas y audio desde el guion o la composición aprobada. Construye los fotogramas de la pieza usando herramientas ya presentes, como Pillow, un navegador apto para capturas, recursos prerenderizados o dibujo RGB con Node.js. Comprueba primero tres momentos del movimiento. El exportador une fotogramas, no ejecuta JSX, escenas 3D ni animación de personajes por sí mismo.
2. Guarda una secuencia continua `frame-000000.jpg`, `frame-000001.jpg`, etc., en JPEG baseline de tres componentes, o `frame-000000.ppm`, etc., en PPM binario P6 RGB de 8 bits con encabezado sin comentarios. Usa dimensiones constantes, un máximo de 1920 píxeles por lado y 2073600 píxeles totales. Para MP4 usa dimensiones pares. El ejemplo [crear-muestra.mjs](../assets/exportacion-sin-red/crear-muestra.mjs) muestra cómo escribir PPM y WAV con Node.js. Sus imágenes y sonido sirven solo para una prueba técnica.
3. Si el encargo incluye voz o música, mezcla las pistas autorizadas en un WAV PCM de 16 bits, mono o estéreo, con 8000 a 48000 Hz y duración igual a la secuencia. No recortes, aceleres ni sustituyas narración aprobada sin autorización. Si hace falta música original, puedes componerla y sintetizarla localmente cuando sea adecuado. Si la pista pedida sigue pendiente, informa si la exportación omite ese componente.

## Exportar y verificar

```text
node scripts/exportar-fotogramas.mjs <carpeta-de-fotogramas> 24 <salida.mp4> <mezcla.wav>
node scripts/exportar-fotogramas.mjs <carpeta-de-fotogramas> 24 <salida.avi> <mezcla.wav>
```

Omite el argumento WAV solo cuando la salida deba ser silenciosa o para una prueba identificada como tal. AVI usa MJPEG si los fotogramas son JPEG y video RGB sin comprimir si son PPM. Prefiere JPEG para piezas largas. El AVI se limita a 256 MiB. Si AVI es el único formato ejecutable y no cumple el encargo, identifícalo como alternativa y mantén pendiente la conversión solicitada. Usa MP4 para entrega cuando exista una ruta compatible.

Comprueba que el archivo esté accesible, que los fotogramas correspondan al inicio, acción decisiva y final, y que duración, dimensiones, fps y pistas coincidan con el encargo. Si están disponibles, usa FFprobe o un reproductor para abrir el archivo y comprueba la reproducción y sincronía. Distingue esos controles de los metadatos que devuelve el script. Entrega el video mediante enlace descargable junto al editable cuando corresponda. Si solo hubo una prueba de archivo o no se pudo escuchar el audio, dilo con precisión.

Referencia técnica del contenedor AVI y sus pistas. [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/directshow/avi-riff-file-reference)
