# Coordinación y comprobación independiente

## Cuándo delegar

- En una consulta sencilla y puntual, el agente principal investiga y comprueba directamente.
- En una investigación compleja, extensa o divisible, usa como mínimo un subagente investigador y otro comprobador independiente.
- Si no aparece información puntual o la ausencia es decisiva, despliega un tercer subagente para validar la falta de evidencia mediante consultas, variantes y fuentes diferentes.
- Si no existen suficientes espacios simultáneos, ejecuta las funciones en secuencia: primero investigación, después comprobación y al final validación de ausencia. La falta temporal de un espacio no elimina ninguna función obligatoria.
- Si la superficie no ofrece subagentes, el agente principal realiza pasadas separadas de investigación, comprobación y, cuando corresponda, validación de ausencia. Informa que la independencia quedó limitada; no simula dictámenes de agentes inexistentes. Una prueba que exija comprobadores independientes permanece `COMPROBACIÓN INCOMPLETA`, aunque una consulta ordinaria puede concluir si el agente principal verificó directamente evidencia suficiente.

## Contratos de salida

El subagente investigador debe devolver por cada afirmación:

- fuente original y tipo de fuente;
- liga directa;
- localizador exacto;
- página impresa y posición física comprobadas visualmente, versión examinada y pasaje que respalda cada afirmación; páginas de contexto registradas por separado; `PÁGINA NO CONFIRMADA` si falta esa comprobación;
- fragmento breve o síntesis fiel del pasaje completo;
- contexto revisado;
- clasificación del respaldo y calidad de la evidencia para acreditar el hecho;
- versión o fecha pertinente, limitaciones, condiciones de acceso, contenido efectivamente examinado y contradicciones.

El comprobador recibe la pregunta, las fuentes y los artefactos indispensables, pero no la conclusión esperada. Debe abrir de nuevo las fuentes decisivas y señalar cualquier afirmación que amplíe, mezcle o deforme la evidencia.

Todos los roles excluyen inferencias, interpretaciones y conclusiones propias de la entrega. Admiten citas, traducciones y paráfrasis fieles; las interpretaciones de autores se atribuyen expresamente. El comprobador y el agente principal contrastan cada página citada visualmente con su pasaje conforme a la sección 7.1 del protocolo; no aceptan una página solo porque otro agente la indique.

El validador de ausencia debe probar términos alternativos, siglas, nombres completos, identificadores, periodos y repositorios plausibles. Su resultado significa `NO SE LOCALIZÓ EVIDENCIA SUFICIENTE`, nunca inexistencia absoluta.

## Control de tiempo y salida degradada

- Define un alcance y un límite finito de trabajo para cada función. Un intervalo es una ronda completa con una consulta sustancialmente distinta y, cuando exista, una familia de fuentes diferente. Detén la exploración tras dos intervalos consecutivos sin evidencia nueva relevante una vez revisadas las variantes y fuentes razonablemente pertinentes, o al alcanzar el límite acordado. El cierre no exige encontrar evidencia positiva.
- Para confirmar una afirmación central, exige una fuente primaria pertinente con calidad suficiente o, si no se localiza, documenta la búsqueda primaria y contrasta con dos fuentes secundarias independientes, hasta un máximo de tres por afirmación. Este umbral de confirmación no es requisito para cerrar una búsqueda infructuosa.
- Para informar ausencia de evidencia, revisa además el registro, repositorio o autoridad que razonablemente debería contener el dato, cuando exista. Delimita consultas, repositorios, periodo y restricciones examinados. Entrega `NO SE LOCALIZÓ EVIDENCIA SUFICIENTE` si la exploración pertinente concluyó; usa `COMPROBACIÓN INCOMPLETA` si faltó una comprobación decisiva por acceso, tiempo o herramientas. Ninguno de esos estados prueba inexistencia absoluta.
- Si un subagente no termina dentro del límite, conserva su evidencia útil, identifica la función inconclusa y marca como fallido cualquier criterio que dependiera de su dictamen.
- No mantengas esperas indefinidas. Entrega un resultado degradado con estados `COMPROBACIÓN INCOMPLETA` o `NO CONFIRMADO` y explica la limitación.
- Una prueba de aceptación no puede aprobarse sin el dictamen completo de las funciones exigidas.

## Responsabilidad del agente principal

- Integra una sola respuesta y resuelve discrepancias.
- Abre y comprueba directamente las fuentes que sostienen cifras, fechas, estados, atribuciones, recomendaciones y conclusiones centrales.
- No incorpora una conclusión sin fuente y localizador verificables.
- Comprueba que fuentes supuestamente independientes no deriven del mismo comunicado o despacho.
- Mantiene la respuesta final breve aunque la comprobación interna sea extensa.
