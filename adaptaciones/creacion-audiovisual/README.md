# Creación audiovisual · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Consulta también la [guía reproducible de instalación](../INSTALACION.md) y los [resultados de pruebas](../PRUEBAS.md).

Desde la raíz del repositorio clonado:

- Antigravity (instalador reproducible): `bash adaptaciones/instalar-antigravity.sh` (Linux/macOS) o `powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1` (Windows). Manualmente: `agy plugin validate ./adaptaciones/creacion-audiovisual` y `agy plugin install ./adaptaciones/creacion-audiovisual`, o copia `skills/dirigir-audiovisual` a `.agents/skills/` (o `~/.gemini/config/plugins/`).
- Gemini CLI: `gemini extensions install ./adaptaciones/creacion-audiovisual`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/dirigir-audiovisual` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Faltan la imagen original del complemento y el paquete wheel de Sprite Gen (`sprite_gen-3.15.0-py3-none-any.whl` con SHA-256 `a3a71252...`; no uses Sprite Gen sin obtener el archivo exacto de una fuente autorizada). La versión original del complemento no se confirmó.

Conserva la dirección por escena y la prueba de render. Usa FFmpeg, Node.js, Python, Blender, Manim o Remotion únicamente si están instalados y su uso es gratuito y permitido. Si falta Node.js, `scripts/validate-plan.py` ofrece validación portátil en Python 3. Tesseract y Remote de Codex no se presuponen disponibles. Si Gemini chat no puede renderizar video, entrega un guion técnico o código editable y marca el render PENDIENTE; no simules haberlo generado.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. Las pruebas de activación, validación, FFmpeg, Playwright WebGL2, Remotion, MoviePy 2 y Manim en Antigravity (Ubuntu WSL2) están documentadas en [PRUEBAS.md](../PRUEBAS.md).

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
