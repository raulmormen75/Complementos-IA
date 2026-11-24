# Ilustraciones animadas con sprite-gen

Módulo opcional incorporado el 5 de noviembre de 2026. Usarlo cuando el encargo requiera movimiento dentro de una ilustración: personajes, objetos, gestos o ciclos reutilizables para explicaciones educativas, visualizaciones narrativas y piezas audiovisuales. Elegirlo por la necesidad del proyecto, sin restringirlo a videojuegos ni aplicarlo a todo video. Para títulos, gráficos o movimientos sencillos de elementos completos, usar los recursos habituales de Remotion cuando sean suficientes.

## Alcance y acceso

- El modelo de imágenes o video produce las poses o el movimiento. Sprite-gen prepara las solicitudes, extrae, limpia, encuadra y organiza fotogramas y metadatos. Una transición entre imágenes estáticas de escenas diferentes no demuestra animación del personaje.
- El complemento incluye el motor Python sprite-gen 3.15.0 en un wheel portable, su LICENSE y NOTICE originales. No incluye Python, Pillow, NumPy, modelos, binarios RIFE ni herramientas de video. `setup` instala el wheel y resuelve sus dependencias en un entorno aislado; necesita Python 3.11+ y normalmente conexión a PyPI. El montaje Remotion mantiene sus requisitos existentes.
- Para generar fotogramas, usar únicamente una función nativa incluida de ChatGPT o Codex, sin saldo adicional, o partir de imágenes aportadas. Usar sprite-gen para procesamiento local conforme a la [regla de costos](../SKILL.md). El nombre de un complemento GPT Images no acredita qué modelo ejecutó la herramienta; no atribuirle un identificador que no haya mostrado. Si falta acceso, deja la generación PENDIENTE. No uses `gen-set` ni otro comando para enviar trabajo a proveedores externos.
- No necesita MCP. En una superficie sin ejecución de archivos, continuar con guion, storyboard y especificación del movimiento. Marcar la ejecución y exportación PENDIENTES; no suponer acceso al equipo desde Work web.

## Preparar y encontrar el motor

Resolver las rutas desde la ubicación real de esta habilidad. Los comandos siguientes se ejecutan desde su carpeta, nunca desde una ruta de usuario fija. El script requiere Node.js, ya utilizado por el complemento.

```text
node scripts/sprite-gen.mjs doctor
node scripts/sprite-gen.mjs setup
node scripts/sprite-gen.mjs run -- --help
```

`doctor` solo comprueba. `setup` crea un entorno versionado fuera de la caché del complemento: en Windows, bajo `AppData/Local/CreacionAudiovisual/sprite-gen/3.15.0` del perfil del usuario; en otros sistemas, bajo la carpeta de datos del usuario. En Windows se deriva del perfil para evitar que una variable temporal redirigida cambie la ubicación sin advertirlo. No cambia PATH ni instala paquetes globales. Puede indicarse `--python <ejecutable>` o `--runtime-dir <carpeta>` antes de `--`. La variable `CREACION_AUDIOVISUAL_SPRITE_HOME` también permite elegir el runtime. `run` no instala por su cuenta y transmite el código de salida del motor.

Instalar cuando haga falta para una producción autorizada y respetar los permisos reales del entorno. Un encargo de asesoría no exige preparar el runtime. Si existe un entorno incompleto o de otra versión, el script lo conserva: inspeccionar y corregirlo o elegir otra carpeta, sin borrar archivos desconocidos. No copiar un `.venv` entre equipos o después de cambiar rutas.

## Producir un movimiento

1. Definir con el usuario o inferir del encargo la acción, el estilo y el formato. Reutilizar la ilustración aceptada y conservar identidad, manos, objetos y proporciones. Para una primera prueba, elegir un gesto breve y una cantidad moderada de fotogramas; no prometer fluidez por aumentar la velocidad.
2. Crear una carpeta de trabajo del proyecto fuera del complemento. Ejecutar `prepare` con la base y un `request.json` que contenga estados, fotogramas, fps, bucle, celdas, márgenes y ajuste. Consultar `prepare --help` de la versión incluida antes de construir opciones. Para ilustración pintada, mantener remuestreo suave y desactivar el procesamiento pixel-art mediante las opciones reales del motor.
3. Usar el prompt y la guía que produjo `prepare`, junto con la base aceptada, en la herramienta de imágenes. Pedir una secuencia del mismo gesto, con cambios de postura relacionados. Para transparencia, solicitar alfa real cuando lo admita la herramienta; conservar el fondo de separación indicado si ese es el flujo elegido. Registrar cualquier adaptación del prompt, referencias adicionales y proveedor realmente utilizado en `qa-notes.md`. Guardar la fila generada en `raw/<estado>.png`, conforme al request. Este intercambio manual no se presenta como una ejecución de `gen-set`.
4. Ejecutar el extractor canónico del motor. No sustituirlo por recortes de igual anchura ni arreglar anatomía inventando píxeles mediante código. Si hay poses superpuestas, pérdida de elementos o cambios de identidad, corregir la generación en lugar de ocultarlos con encuadres o tiempos.
5. Componer el atlas y la vista previa; inspeccionar informes, todos los fotogramas y la reproducción completa, incluido el empalme final. El éxito de extracción no prueba calidad de movimiento. Documentar el veredicto como `pass`, `best-effort` o `experimental` y explicar los límites materiales. Conservar la curación aprobada al exportar; consumir el atlas y su `manifest.json` finales, no reconstruir una selección desde fotogramas descartados.

Ejemplo de procesamiento, con rutas del proyecto como argumentos:

```text
node scripts/sprite-gen.mjs run -- prepare --out-dir <run> --character-id <id> --base-image <base.png> --request <request.json>
node scripts/sprite-gen.mjs run -- extract --run-dir <run>
node scripts/sprite-gen.mjs run -- compose-atlas --run-dir <run>
node scripts/sprite-gen.mjs run -- compose-gif --run-dir <run> --out-dir <run/previews>
node scripts/sprite-gen.mjs run -- inspect --run-dir <run>
```

El flujo desde video se limita a procesar material aportado con herramientas locales verificadas como gratuitas para el encargo. Si exige generación remota, una dependencia de pago o créditos de terceros, deja esa etapa PENDIENTE.

## Integrar en Remotion

El atlas PNG y `manifest.json.frame_layout` contienen los rectángulos definitivos. No deducir una cuadrícula por transparencia ni asumir que todas las acciones tienen la misma duración. Leer fotogramas, fps, duración por fotograma y condición de bucle del estado elegido.

Calcular el tiempo desde `useCurrentFrame()` y `useVideoConfig()`. Resolver el fotograma activo con sus duraciones acumuladas; aplicar módulo solo si el estado es cíclico y sostener el último fotograma de una acción no cíclica. Recortar el rectángulo correspondiente en un contenedor del tamaño de celda, manteniendo su escala y anclaje. El cambio de fotograma representa el movimiento de la ilustración; la composición conserva el texto y los demás elementos según el guion.

No copiar el reloj CSS de una vista HTML a un render Remotion. Usar `Img` y recursos locales con carga controlada; la selección temporal debe depender del fotograma de la composición, no de `setInterval`, un GIF autónomo ni del tiempo de reloj. Revisar fotogramas en el inicio, cambios de pose y límite del bucle; renderizar y reproducir una prueba corta antes de la entrega audiovisual.

Entregar el video solicitado y el proyecto editable. Añadir GIF, WebP o atlas solo si son útiles al encargo; no convertir una solicitud de sprites en una aplicación o videojuego. Sprite-gen prepara recursos, Remotion sigue siendo el motor final de las piezas audiovisuales.

## Cambio de SSD o equipo

Respaldar el ZIP del complemento y, por separado, los proyectos y sus assets en otra unidad o ubicación elegida por el usuario. Instalar el complemento en el equipo nuevo, preparar Python y Node.js y ejecutar `doctor`/`setup` para reconstruir las dependencias. El paquete no contiene sesiones, credenciales, historial de Codex ni los proyectos creados en otros chats. La copia local del ZIP no acredita respaldo externo ni actualización de la cuenta.

Fuentes originales del motor: [repositorio](https://github.com/aldegad/sprite-gen), [flujo de filas](https://github.com/aldegad/sprite-gen/blob/main/docs/atlas-workflow.md), [contrato del run](https://github.com/aldegad/sprite-gen/blob/main/docs/run-contract.md) y [revisión del movimiento](https://github.com/aldegad/sprite-gen/blob/main/docs/qa-motion.md). La compatibilidad, distribución y comportamiento se contrastaron con el código 3.15.0 incluido; revisar cambios antes de sustituirlo por otra versión. La integración y el script de instalación son propios del complemento.
