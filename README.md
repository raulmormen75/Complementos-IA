# Complementos IA

Repositorio público de Raul para respaldar y adaptar complementos de IA, con cero cargos adicionales.

| Complemento | Respaldo de ChatGPT | Adaptación 0.1.0 |
| --- | --- | --- |
| Creación audiovisual | [Estado](creacion-audiovisual/RESPALDO.md) | [Antigravity y Gemini](adaptaciones/creacion-audiovisual/README.md) |
| Gráficos | [Estado](graficos/RESPALDO.md) | [Antigravity y Gemini](adaptaciones/graficos/README.md) |
| Investigación profunda | [Estado](investigacion-profunda/RESPALDO.md) | [Antigravity y Gemini](adaptaciones/investigacion-profunda/README.md) |

## Instalación en Antigravity (Windows y Linux)

Consulta la [guía de instalación reproducible y versiones compatibles](adaptaciones/INSTALACION.md) y el [registro de pruebas realizadas](adaptaciones/PRUEBAS.md):

- **Linux / macOS:** `bash adaptaciones/instalar-antigravity.sh` (añade `--con-dependencias` para preparar Node/Python locales en `plugin_data/`).
- **Windows (PowerShell):** `powershell -ExecutionPolicy Bypass -File adaptaciones\instalar-antigravity.ps1` (añade `-ConDependencias` para preparar runtimes locales gratuitos).

También puedes clonar el repositorio o usar cada adaptación manualmente con Antigravity, Gemini CLI o Gemini Apps. No se modificaron los respaldos originales de ChatGPT ni sus avisos.

## Licencia

[Propuesta de licencia MIT](LICENCIA-PROPUESTA.md) para las contribuciones originales de Raul; no se aplica automáticamente hasta que el titular confirme los términos. Las dependencias mantienen sus propias licencias y avisos. No se concede una licencia de terceros por el hecho de publicarlas aquí.
