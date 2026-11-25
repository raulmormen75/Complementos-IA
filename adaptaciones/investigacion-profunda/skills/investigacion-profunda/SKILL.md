---
name: investigacion-profunda
description: Investigar, buscar, consultar, verificar, comprobar, contrastar o auditar información y redactar contenido sustentado en fuentes. Actívala automáticamente cuando una tarea requiera localizar o usar información externa, comprobar documentos o ligas, distinguir registros relacionados, validar afirmaciones o generar contenido factual con citas. No la uses para creación puramente imaginativa ni para transformar texto sin verificar hechos, salvo petición expresa.
---

## Compatibilidad con Antigravity y Gemini

Esta adaptación conserva el procedimiento original. Las menciones a ChatGPT, Codex o herramientas específicas se entienden como capacidades opcionales, no como requisitos de esta plataforma. Utiliza solo funciones incluidas en la cuenta y recursos locales autorizados; no contrates servicios, no consumas créditos de terceros y no actives facturación. Si no puedes confirmar el costo o la licencia, omite la operación. No inventes herramientas, resultados ni pruebas.

Usa búsqueda y apertura de fuentes originales si están disponibles. Si no hay navegador, archivos o revisión visual de páginas, marca los datos afectados NO CONFIRMADO. Si no existen subagentes, aplica pasadas separadas y declara la falta de independencia. Gemini Apps no integra actualmente la función Deep Research con Skills; usa únicamente las herramientas de búsqueda accesibles en la sesión. Mantén el protocolo de verificación y sus límites.

**Mapeo operativo en Antigravity:**
- **Búsqueda y apertura de fuentes:** usa `search_web` y lectura directa (`curl`/Python o `read_file` para documentos locales). **No** delegues búsquedas web al subagente integrado `research`, porque en Antigravity se ejecuta en un sandbox sin acceso a red.
- **Comprobación visual de páginas, PDFs y ligas (sección 7.1):** delega la inspección visual en el subagente integrado `browser` (`invoke_subagent` con `TypeName: "browser"`) cuando esté disponible.
- **Comprobación independiente y validación de ausencia:** usa `invoke_subagent` (con `TypeName: "self"`, o un subagente definido con `define_subagent` y `EnableWriteTools: false` para auditoría de archivos locales) entregando únicamente la pregunta, las fuentes y los artefactos sin la conclusión esperada.

**Recursos pendientes:** Se recuperaron cinco archivos de la habilidad; no se confirmó el manifiesto original ni la versión del complemento. El caso de aceptación omite una ruta de trabajo privada.


# Investigación profunda

## Resultado obligatorio

Entrega cero afirmaciones presentadas como verificadas sin respaldo comprobable. Si una afirmación no puede comprobarse, indícala como `NO CONFIRMADO`; no completes vacíos con suposiciones.

Ofrece únicamente información respaldada por las fuentes, mediante citas, traducciones o paráfrasis fieles. No añadas interpretaciones, inferencias, explicaciones causales ni conclusiones propias, aunque se etiqueten como tales. Las interpretaciones de los autores se presentan atribuidas y con sus reservas, no como hechos demostrados. Comprueba visualmente cada página citada conforme a la sección 7.1 del protocolo; distingue páginas de evidencia de páginas consultadas solo como contexto.

Las palabras buscadas, fragmentos de resultados, índices, resúmenes y coincidencias sirven solo para localizar fuentes candidatas. Nunca bastan como evidencia. Abre la fuente original y comprueba su contenido antes de citarla o utilizarla.

## Aplicar el protocolo

1. Delimita la pregunta y separa internamente las afirmaciones que necesitan evidencia.
2. Prioriza fuentes primarias. Usa fuentes secundarias únicamente bajo las reglas del protocolo.
3. Abre cada fuente original con la herramienta más adecuada. Prefiere conectores, bases, servicios o interfaces especializados cuando permitan revisar mejor el contenido. Usa Navegador cuando esté disponible y sea necesario para páginas interactivas, contenido dinámico, acceso visual o comprobación de ligas. Si no puedes abrir el contenido atribuido, no lo declares verificado.
4. Revisa contexto suficiente, alcance, método, restricciones, contradicciones, estado y relación real con la consulta. Una mención aislada no convierte una fuente en pertinente.
5. Contrasta cada afirmación con la evidencia, evalúa si la fuente puede acreditar el hecho y comprueba la versión pertinente. Conserva fuerza, temporalidad, atribución y reservas.
6. Vuelve a abrir todas las ligas decisivas inmediatamente antes de entregar.
7. Responde de forma proporcional. Mantén la auditoría interna, pero muestra una respuesta breve con sustento decisivo, citas cercanas y referencias finales; no muestres matrices salvo petición expresa.

Revisa [protocolo-verificacion.md](references/protocolo-verificacion.md) en toda tarea basada en fuentes.

Revisa [formato-tecnopoli.md](references/formato-tecnopoli.md) cuando la respuesta incluya citas o referencias. Aplica sus reglas como estándar bibliográfico personalizado del usuario, sin trasladar la identidad institucional de TecnóPoli a otros ámbitos.

Revisa [coordinacion-subagentes.md](references/coordinacion-subagentes.md) cuando la investigación sea compleja, extensa, divisible o no produzca información puntual.

Revisa [pruebas-aceptacion.md](references/pruebas-aceptacion.md) únicamente al validar o actualizar esta habilidad. No cargues casos de prueba durante una investigación ordinaria.

## Límites

- Respeta cualquier conjunto de fuentes fijado por el usuario. No amplíes la búsqueda si se indicó trabajar únicamente con ese material.
- No inventes fuentes, autores, fechas, páginas, identificadores, citas, ligas ni resultados.
- Distingue contenido comprobado y acceso público. Una fuente examinada mediante acceso autorizado puede respaldar una afirmación con su restricción declarada. Nunca uses contenido no examinado como evidencia comprobada ni presentes una liga rota como acceso funcional.
- No conviertas intención en ejecución, propuesta en proyecto aprobado, solicitud en derecho concedido, pertenencia personal en atribución institucional, asociación en causalidad ni antecedente en resultado actual.
- No prometas ausencia absoluta de errores. Aplica el criterio verificable de cero afirmaciones declaradas comprobadas sin evidencia suficiente.
