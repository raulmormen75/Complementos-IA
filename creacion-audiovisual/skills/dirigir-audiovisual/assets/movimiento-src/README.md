# Motores de movimiento

Código fuente para las demostraciones editables de Creación audiovisual y Gráficos. No usa red al ejecutar los motores. Requiere WebGL 2 para Three.js y WebAssembly y descompresión gzip para Rapier. Si una sesión de ChatGPT restringe el acceso a estas capacidades, la comprobación gráfica debe hacerse en un navegador compatible.

## Reconstrucción

1. En esta carpeta, ejecutar `npm ci --ignore-scripts --no-audit --no-fund` una vez. La descarga inicial usa el registro de npm. Con los paquetes en caché se puede repetir con `--offline`.
2. Ejecutar `npm run build`. Genera cuatro scripts minificados en `dist/`, sus avisos originales y un resumen de tamaño. Para el HTML final se incorporan los scripts una vez, con los avisos al lado. Por separado o juntos, los scripts sirven sin CDN.
3. Ejecutar `npm test` con Playwright y Chromium instalados. `CODEX_QA_PLAYWRIGHT` permite indicar un módulo Playwright existente. `CODEX_QA_EDGE` permite elegir el ejecutable del navegador. Se prueban escritorio y un tamaño móvil simulado sin conexión.

## Interfaz del navegador

Cada script añade solo una función a `globalThis.MovimientoRuntime`. También se puede importar su fuente como módulo en un proyecto de npm.

| Script | Función | Uso |
| --- | --- | --- |
| `physics.js` | `await bakePhysics({fps, frames, gravity, restitution, height, radius, shape})` | Devuelve `{fps, frames}` sin dibujar. Cada fotograma incluye `position`, `quaternion` e `impact`. El fotograma inicial es 0 y el tiempo es `frame / fps`. El cubo usa `radius` como semilado. |
| `three-scene.js` | `createThreeScene(canvas, {postprocessing, radius, shape, colors})` | Renderiza con `render(frame, {physics, pose, bloom, trails, camera})`, proyecta puntos con `project({x,y,z})`, cambia tamaño con `resize(width,height)` y libera recursos con `dispose()`. |
| `animation.js` | `createMotionTimeline(target, {durationMs})` | `seek(ms)` actualiza y devuelve la pose, con `elastic`, `squash`, `yaw` y `flash`. Terminar con `dispose()`. |
| `pixi-layer.js` | `await createPixiLayer(canvas, {filters})` | Pinta una capa transparente con `render(frame, {pose, filters, intensity, anchor, phase})`. El anclaje se expresa como fracción del área. Admite `resize(width,height)` y `dispose()`. |

Rapier precalcula posiciones y contactos con pasos fijos. Three.js dibuja el estado del fotograma pedido, incluidas las estelas de las posiciones anteriores. Anime.js cambia por tiempo solicitado y PixiJS dibuja solo bajo demanda. Postprocessing y Pixi Filters se pueden activar por separado.

El empaquetado comprime el binario oficial de Rapier con gzip. Requiere `wasm-unsafe-eval` para WebAssembly cuando se usa una política de contenido. PixiJS incluye su mecanismo oficial para evitar evaluar funciones generadas. Las licencias del software y sus dependencias incluidas están en `dist/LICENCIAS-MOVIMIENTO.txt`.
