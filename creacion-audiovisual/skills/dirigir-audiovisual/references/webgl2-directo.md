# Elegir WebGL 2 directo o Three.js

Aplica la [regla de cero cargos adicionales](../SKILL.md) en local y en nube. WebGL 2 es una función del navegador. El ejemplo incluido usa JavaScript y GLSL, sin APIs externas, paquetes, CDN, cuentas ni créditos de terceros. El entorno necesita un navegador con contexto WebGL 2 para ejecutarlo. La entrega como HTML no implica que la vista previa de ChatGPT permita ejecutar scripts o gráficos 3D.

| Si la escena requiere | Ruta preferida |
|---|---|
| Shaders a medida, partículas procedurales, superficies, efectos ópticos o geometría simple | WebGL 2 directo con GLSL ES 3.00 |
| Modelos glTF, materiales, luces, cámaras, jerarquías o animación compleja | Three.js y los paquetes ya disponibles, con compatibilidad y licencia comprobadas |
| Montaje con audio, transiciones y salida final | Remotion cuando sea elegible y esté operativo, o la [exportación sin red](exportacion-sin-red.md) si ya puedes capturar fotogramas |

Si ambas rutas resuelven el encargo, conserva la herramienta existente o elige la más simple de mantener. Un shader también puede integrarse en Three.js cuando se necesita el resto de su escena. Si WebGL 2 no abre, Three.js con WebGLRenderer tampoco resuelve por sí solo la falta del contexto. Evalúa un prerender autorizado o una adaptación 2D apropiada y explica cualquier diferencia.

## Vista interactiva y exportación

1. Usa [el ejemplo HTML](../assets/webgl2-starter/index.html) como referencia. Abre el archivo en un navegador compatible. Prueba que se obtenga el contexto, se enlacen los shaders y aparezca la geometría real. Verifica en escritorio y móvil cuando el proyecto se destine a ambas pantallas.
2. Distingue la reproducción interactiva del render de video. Calcula el estado de la escena desde el número de fotograma y los fps. El ejemplo ofrece `window.webgl2Scene.renderFrame(frame, fps)` y `captureFrame(frame, fps)`, que devuelve PNG como URL de datos.
3. Comprueba fotogramas del inicio, de un cambio de acción y del final. Para usar el [exportador sin red](exportacion-sin-red.md), obtén JPEG baseline de tres componentes o PPM P6 con herramientas ya disponibles. PNG es útil como vista o recurso para Remotion, y requiere conversión para ese exportador. Usa el audio autorizado del proyecto en el montaje.
4. Si la sesión no dispone de navegador compatible, entrega el HTML autónomo o el proyecto editable y marca PENDIENTE la captura o exportación. No recurras a servicios de terceros para suplir la falta del motor.

Referencias. [Especificación WebGL 2 de Khronos](https://registry.khronos.org/webgl/specs/2.0.0/) y [WebGLRenderer de Three.js](https://threejs.org/docs/pages/WebGLRenderer.html).
