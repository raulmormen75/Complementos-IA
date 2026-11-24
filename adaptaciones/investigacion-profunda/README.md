# Investigación profunda · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Desde la raíz del repositorio clonado:

- Antigravity: `agy plugin validate ./adaptaciones/investigacion-profunda` y, si no hay errores, `agy plugin install ./adaptaciones/investigacion-profunda`. Alternativamente, copia la carpeta `skills/investigacion-profunda` a `.agents/skills/` en tu proyecto.
- Gemini CLI: `gemini extensions install ./adaptaciones/investigacion-profunda`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/investigacion-profunda` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Se recuperaron cinco archivos de la habilidad; no se confirmó el manifiesto original ni la versión del complemento. El caso de aceptación omite una ruta de trabajo privada.

Usa búsqueda y apertura de fuentes originales si están disponibles. Si no hay navegador, archivos o revisión visual de páginas, marca los datos afectados NO CONFIRMADO. Si no existen subagentes, aplica pasadas separadas y declara la falta de independencia. Gemini Apps no integra actualmente la función Deep Research con Skills; usa únicamente las herramientas de búsqueda accesibles en la sesión. Mantén el protocolo de verificación y sus límites.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. La activación y ejecución real no se han probado en las plataformas destino.

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
