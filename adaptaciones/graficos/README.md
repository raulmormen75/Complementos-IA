# Gráficos · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Desde la raíz del repositorio clonado:

- Antigravity: `agy plugin validate ./adaptaciones/graficos` y, si no hay errores, `agy plugin install ./adaptaciones/graficos`. Alternativamente, copia la carpeta `skills/graficar-analizar` a `.agents/skills/` en tu proyecto.
- Gemini CLI: `gemini extensions install ./adaptaciones/graficos`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/graficar-analizar` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Faltan cuatro imágenes originales de marca (dos pares de rutas). Los motores de Plotly y Three.js y el HTML de rebotes ya se recuperaron.

Usa análisis de datos, HTML/SVG, Python o Node.js cuando estén realmente disponibles. No asumas GPT Images, Remote de Codex, conectores ni un visor integrado. Si no hay ejecución, entrega código, datos y especificación editable, nunca declares una gráfica renderizada o validada sin probarla.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. La activación y ejecución real no se han probado en las plataformas destino.

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
