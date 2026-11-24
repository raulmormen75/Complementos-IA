# Implementación local con Remotion

Antes de instalar, ejecutar o renderizar, confirma que la licencia vigente de Remotion permite el uso local gratuito para la entidad, versión y encargo. Si falta esa confirmación o el motor no puede exportar, aplica la [regla de costos](../SKILL.md) y usa la [ruta sin red](exportacion-sin-red.md) si puedes preparar los fotogramas.

## Base y edición

Remotion utiliza React. HTML se expresa mediante JSX; CSS define composición y estilos; JavaScript/TypeScript controla lógica y valores por fotograma. No es necesario un motor HTML adicional. Se pueden integrar SVG y Three.js con `@remotion/three` y React Three Fiber. Fuente directa: [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals) y [Three](https://www.remotion.dev/docs/three), consulta 19 de octubre de 2026.

Revisar primero `package.json`, lockfile, estructura y habilidades Remotion disponibles. Mantener todos los paquetes `remotion` y `@remotion/*` en la misma versión. Verificar compatibilidad de React, Three.js y Fiber en sus metadatos. No actualizar globalmente por usar esta guía.

El starter adjunto fija versiones para reproducibilidad. Copiarlo a un proyecto nuevo solo con producción autorizada. En un entorno local autorizado con acceso, ejecutar `npm install` la primera vez y conservar el lockfile generado. Después usar `npm ci`. En web, si la instalación o el navegador faltan, seguir la ruta sin red sin repetir descargas. No copiar `node_modules` al complemento ni a una entrega editable. Reutilizar proyectos existentes sin reemplazar sus archivos.

## Tiempo y carga

- Calcular estado desde `useCurrentFrame()` y `useVideoConfig()`. Usar `interpolate`, `spring` y curvas explícitas. No usar relojes autónomos de CSS, `requestAnimationFrame`, `setTimeout`, `Date.now()` o `useFrame` de Fiber para animación renderizada.
- Aleatoriedad con semilla y recursos locales identificados. Esperar fuentes, texturas y datos cuando sea necesario mediante los mecanismos documentados para la versión.
- Dimensionar `ThreeCanvas`; las secuencias dentro del canvas requieren `layout="none"`. No poner elementos HTML dentro de la escena 3D. Superponer HTML fuera del canvas.
- Cada composición y escena editable independiente debe tener un nodo JSX propio. La editabilidad visual depende de los componentes y versión; el código fuente sigue siendo editable aunque Studio no ofrezca un control visual específico.
- Calcular subtítulos sobre audio real. Para audio/video consultar las habilidades multimedia vigentes; no asumir que reproducción en navegador y exportación son idénticas.
- Para Rapier, guarda las posiciones y giros por fotograma antes de montar el video. Para Anime.js, fija la posición de la animación en el tiempo del fotograma. Postprocessing usa la ruta Three.js con WebGL 2. Para PixiJS y Pixi Filters, verifica una muestra de la capa 2D primero. Consulta [la escena portable y su exportador](seleccion-herramientas.md).

## Comprobación

1. Iniciar Studio según la habilidad oficial, mostrar URL real y probar vista previa si el entorno lo permite.
2. Ejecutar validación de tipos y obtener lista real de composiciones.
3. Renderizar fotogramas representativos, transiciones y una prueba corta con las mismas dimensiones y configuración previstas. En 3D comprobar backend de navegador/GPU; no asumir aceleración disponible.
4. Inspeccionar resultados y corregir. Exportar el video final cuando esté solicitado. Comprobar duración, dimensiones, fps, audio y ausencia de frames vacíos o recursos faltantes.
5. Si solo se pudieron revisar imágenes, informar que ritmo y audio no están comprobados. No declarar calidad profesional por pasar compilación.

Comandos del starter, desde su carpeta:

```text
npm install
npm run check
npm run studio
npm run still -- --frame=60
npm run render
```

`still` y `render` escriben en `out/`; revisar que no exista un resultado que deba preservarse. El starter es una demostración silenciosa de cuatro segundos con HTML/CSS/SVG y un objeto Three.js, no una plantilla de mercado ni ejemplo de mezcla sonora.

Fuentes directas: [animación por fotogramas](https://www.remotion.dev/docs/animating-properties), [composiciones](https://www.remotion.dev/docs/composition), [render local](https://www.remotion.dev/docs/render), consultadas el 19 de octubre de 2026. Las decisiones de organización y controles son síntesis propia.
