# Creación audiovisual · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Desde la raíz del repositorio clonado:

- Antigravity: `agy plugin validate ./adaptaciones/creacion-audiovisual` y, si no hay errores, `agy plugin install ./adaptaciones/creacion-audiovisual`. Alternativamente, copia la carpeta `skills/dirigir-audiovisual` a `.agents/skills/` en tu proyecto.
- Gemini CLI: `gemini extensions install ./adaptaciones/creacion-audiovisual`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/dirigir-audiovisual` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Faltan la imagen original del complemento y el paquete wheel de Sprite Gen; no uses Sprite Gen sin obtenerlo de una fuente autorizada. La versión original del complemento no se confirmó.

Conserva la dirección por escena y la prueba de render. Usa FFmpeg, Node.js, Python, Blender, Manim o Remotion únicamente si están instalados y su uso es gratuito y permitido. Tesseract y Remote de Codex no se presuponen disponibles. Si Gemini chat no puede renderizar video, entrega un guion técnico o código editable y marca el render PENDIENTE; no simules haberlo generado.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. La activación y ejecución real no se han probado en las plataformas destino.

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
