# Investigación profunda · Adaptación 0.1.0

Paquete preliminar para Antigravity y Gemini CLI; también incluye una habilidad que puede importarse en Gemini Apps. La versión 0.1.0 corresponde a la adaptación, no al complemento original.

## Instalación local

Consulta también la [guía reproducible de instalación](../INSTALACION.md) y los [resultados de pruebas](../PRUEBAS.md).

Desde la raíz del repositorio clonado:

- Antigravity (instalador reproducible): `bash adaptaciones/instalar-antigravity.sh` (Linux/macOS) o `powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1` (Windows). Manualmente: `agy plugin validate ./adaptaciones/investigacion-profunda` y `agy plugin install ./adaptaciones/investigacion-profunda`, o copia `skills/investigacion-profunda` a `.agents/skills/` (o `~/.gemini/config/plugins/`).
- Gemini CLI: `gemini extensions install ./adaptaciones/investigacion-profunda`. Reinicia la sesión y consulta `/skills list`.
- Gemini Apps: abre Personalizar > Habilidades > Crear > Subir archivos, y selecciona la carpeta `skills/investigacion-profunda` de esta adaptación. Si rechaza determinados formatos, conserva SKILL.md y las referencias aceptadas. No equivale a un entorno de ejecución local.

## Estado y límites

Se recuperaron cinco archivos de la habilidad; no se confirmó el manifiesto original ni la versión del complemento. El caso de aceptación omite una ruta de trabajo privada.

Usa búsqueda y apertura de fuentes originales si están disponibles. En Antigravity, no delegues búsqueda web al subagente `research` (sin red); usa `search_web`, `browser` (para verificación visual) y `self`/`define_subagent` (para auditoría independiente). Si no hay navegador, archivos o revisión visual de páginas, marca los datos afectados NO CONFIRMADO. Gemini Apps no integra actualmente la función Deep Research con Skills; usa únicamente las herramientas de búsqueda accesibles en la sesión.

Sin cargos adicionales: no se incluyen claves, servidores remotos, créditos, instalaciones automáticas ni servicios de pago. Comprueba las licencias de cada dependencia. Las pruebas con subagente auditor y verificación visual en vivo en Antigravity están documentadas en [PRUEBAS.md](../PRUEBAS.md).

Fuentes: https://antigravity.google/docs/build-plugins/ · https://geminicli.com/docs/extensions/reference/ · https://support.google.com/gemini/answer/18560919
