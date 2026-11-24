# Gráficas animadas, edición de grabaciones, modelado y matemáticas

Carga solo las herramientas que pida el encargo. No instales paquetes ni bajes modelos durante la producción en web. En escritorio puedes preparar dependencias gratuitas y elegibles por adelantado, según la autorización disponible. En ningún entorno se usan créditos, APIs de transcripción, render ni alojamiento pagados de terceros.

## Datos compartidos y composición editable

El intercambio con Gráficos es un JSON local UTF-8 con esta forma. `x` y `y` nombran columnas presentes en las filas. `y` es numérica, `source` identifica la procedencia y `unit` la unidad. Usa de 1 a 14 categorías únicas, ya agregadas si procede. Conserva los filtros de la tabla de origen y acláralos junto a la fuente si se aplicaron.

```json
{"title":"Comparación","source":"Datos de ejemplo","unit":"Observaciones","x":"grupo","y":"conteo","rows":[{"grupo":"A","conteo":12},{"grupo":"B","conteo":8}]}
```

La composición `DatosEnMovimiento` en `assets/remotion-starter/` usa **Recharts** como motor preferente, muestra unidad y fuente y admite valores positivos y negativos. Desactiva su animación interna y controla la escena con `useCurrentFrame()`. La misma plantilla incluye respaldo SVG mediante `"chartEngine": "svg"` para elegir el dibujo directo si la vista Recharts presenta incompatibilidades. El paquete de la plantilla necesita sus dependencias preparadas por adelantado. En ambos casos compara los valores finales contra el JSON de Gráficos. Los datos del ejemplo son sintéticos.

Pasa un archivo JSON de propiedades a Remotion. Su campo `chart` contiene el JSON de Gráficos sin modificar. Los campos de medios apuntan a archivos locales dentro de `public/`. Las duraciones y los tiempos se expresan en segundos.

```json
{"chart":{"title":"Comparación","source":"Datos de ejemplo","unit":"Observaciones","x":"grupo","y":"conteo","rows":[{"grupo":"A","conteo":12}]},"chartSeconds":7,"clip":{"file":"material.mp4","seconds":4,"offset":2,"volume":0},"mathScene":{"file":"ecuacion.mp4","seconds":6},"narration":"voz.wav","captions":[{"start":0,"end":3,"text":"Comparamos las observaciones por grupo."}],"model":"pieza.glb","modelSeconds":5,"render3d":"webgl2"}
```

```powershell
npm run check
npm run render:datos -- --props=ruta-props.json --gl=angle
```

Reserva `--gl=angle` para una configuración comprobada. Prueba `--gl=swangle` como render gráfico por software si la GPU no funciona. El resultado sigue siendo pendiente hasta decodificar el video y comprobar fotogramas, audio y sincronización. Si el proyecto necesita más de 14 categorías, divide la explicación en escenas, deja explícita cualquier selección y conserva la escala cuando corresponda.

## Edición y exportación MP4

Prioriza MP4 H.264/AAC. `editar-video.mjs` recorta y normaliza varios clips, mezcla los audios elegidos y adjunta una pista SRT opcional. `audio: true` requiere que ese clip tenga pista de audio. Verifica la decodificación completa y deja el archivo de salida sin sobrescribir un nombre existente. Para texto visible siempre, usa las entradas `captions` de Remotion y revisa su sincronización.

```powershell
node scripts/editar-video.mjs --probe --ffmpeg "C:/ruta/ffmpeg.exe"
node scripts/editar-video.mjs --plan montaje.json --ffmpeg "C:/ruta/ffmpeg.exe"
```

También puedes configurar `AUDIOVISUAL_FFMPEG` en la sesión. Si un FFmpeg compatible ya está en PATH, omite el argumento. Ejemplo de plan con rutas relativas a ese archivo:

```json
{"width":1280,"height":720,"fps":30,"clips":[{"file":"entrada.mp4","start":0.5,"seconds":4,"audio":true},{"file":"grafica.mp4","start":0,"seconds":5}],"narration":"voz.wav","subtitles":"voz.srt","output":"entrega.mp4"}
```

El script `preparar-medios.py` ofrece tres rutas opcionales para herramientas MIT, sin instalar ni descargar.

| Necesidad | Ejecución con un Python que ya tenga la dependencia |
|---|---|
| Voz a SRT y tiempos de Remotion | `python scripts/preparar-medios.py subtitular voz.wav --model carpeta-local --ffmpeg ruta-local --output voz.srt --json tiempos.json` |
| Limpieza de narración | `python scripts/preparar-medios.py limpiar-voz voz.wav --model carpeta-local --output voz-limpia.wav` |
| Cortes con MoviePy 2 | `python scripts/preparar-medios.py montar-python --ffmpeg C:/ruta/ffmpeg.exe --clip fuente.mp4 1 5 --output corte.mp4` |

`subtitular` usa faster-whisper local y `limpiar-voz` usa DeepFilterNet con modelo y checkpoints locales. Revisa nombres, cifras, tiempos y la pérdida de voz después de la limpieza. Mantén el original como insumo. Si no puedes exportar MP4, conserva el proyecto y marca esa exportación PENDIENTE. Cualquier salida AVI sigue la política de aceptación de la ruta sin red.

Si tienes el ejecutable autónomo oficial de DeepFilterNet, puedes llevar a cabo la limpieza sin la biblioteca Python. La utilidad prepara un WAV mono de 48 kHz con FFmpeg y compensa la latencia de filtrado.

```powershell
python scripts/preparar-medios.py limpiar-voz voz.wav --executable C:/ruta/deep-filter.exe --ffmpeg C:/ruta/ffmpeg.exe --output voz-limpia.wav
```

## Modelo 3D y WebGPU

Three.js acepta un GLB local o un perfil que se extruye con `geometry: {points, depth}`. El script de la plantilla crea un GLB reutilizable cuando la entrada es un perfil `{"points":[[0,0],[2,0],[1,1]],"depth":0.4}`. Para piezas basadas en medidas puede crear STL con JSCAD si `@jscad/modeling` y `@jscad/stl-serializer` ya están presentes en el proyecto. El STL está destinado al flujo de modelado, el GLB a la escena en Remotion.

```powershell
npm run modelar -- figura.json figura.glb
npm run modelar -- medidas.json pieza.stl
```

El archivo de medidas acepta `{"parts":[{"type":"box","size":[20,30,5]},{"type":"cylinder","radius":6,"height":9,"translate":[0,0,5]}]}`. Declara las unidades del proyecto por separado.

Elige `render3d: "webgpu"` si una muestra real renderiza con `ThreeWebGPUCanvas`. En ausencia de WebGPU la integración de Three.js puede usar WebGL 2 para operaciones compatibles. Verifica el respaldo con `render3d: "webgl2"` si el resultado está vacío, cambian los materiales o hay efectos exclusivos de WebGPU. El HTML WebGL 2 directo del paquete sigue disponible como proyecto independiente. Fuentes primarias: [Remotion WebGPU](https://www.remotion.dev/docs/three-webgpu-canvas), [GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html), [JSCAD](https://github.com/jscad/OpenJSCAD.org).

## Animación matemática

El ejemplo `assets/manim/ecuacion_lineal.py` prepara y anima una ecuación lineal. Introduce el mismo cambio en ambos lados y verifica la solución como fracción exacta. Se ejecuta con Manim Community instalado. Esta escena usa texto vectorial y evita requerir LaTeX para producir la muestra.

```powershell
$env:MANIM_EQUATION='{"a":2,"b":3,"c":9}'
python -m manim render -qm assets/manim/ecuacion_lineal.py EcuacionLineal
```

Copia el MP4 al área `public/` de Remotion y úsalo como `mathScene`, o intégralo en el montaje local. Si se necesitan controles interactivos, conserva con Gráficos la vista Plotly.js o Three.js y genera el video con los estados que mejor expliquen el procedimiento.
