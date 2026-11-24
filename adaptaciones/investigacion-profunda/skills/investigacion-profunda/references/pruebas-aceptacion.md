# Pruebas de aceptación

Estas pruebas validan decisiones observables, no frases exactas de respuesta. Las conclusiones de ejecuciones anteriores son hipótesis y deben volver a comprobarse.

## Pruebas generales

La habilidad falla si:

- trata una coincidencia o fragmento de buscador como evidencia;
- atribuye a una fuente un contenido que no aparece en el contexto comprobado;
- usa contenido no examinado como respaldo, ofrece una liga rota o genérica como acceso funcional, o presenta como pública una liga que requiere permisos;
- convierte una mención aislada en una conclusión sustantiva;
- oculta una contradicción material;
- añade una inferencia, interpretación o conclusión propia, aunque esté etiquetada;
- fusiona entidades o registros por compartir persona, palabras, tecnología, institución o lugar;
- entrega una cita textual sin localizador;
- usa una sola fuente secundaria para declarar confirmada una afirmación central sin fuente primaria.

## Caso SAPPI y sericicultura

Conserva este caso real como prueba de integración. Las pruebas sintéticas del final comprueban decisiones acotadas y no sustituyen su ejecución ni una prueba real de acceso web.

### Material mínimo

- Documento rector: archivo de diagnóstico proporcionado por el usuario con autorización de acceso (ruta local omitida en la copia pública).
- SIP 20195322: `https://www.sappi.ipn.mx/cgpi/proyectos/reporte/reporteHTML.jsp?anho_inicio=2019&folio=5322&idp=10104`
- SIP 20201728: `https://www.sappi.ipn.mx/cgpi/proyectos/reporte/reporteHTML.jsp?anho_inicio=2020&folio=1728&idp=10104`
- SIP 20210907: `https://www.sappi.ipn.mx/cgpi/proyectos/reporte/reporteHTML.jsp?anho_inicio=2021&folio=907&idp=10104`
- SIP 20221434: `https://www.sappi.ipn.mx/cgpi/proyectos/reporte/reporteHTML.jsp?anho_inicio=2022&folio=1434&idp=10104`
- Solicitud citada: `MX/a/2016/008923`, «Máquina procesadora de seda de uso doméstico».
- Publicación candidata: `MX2016008923A`, `https://patents.google.com/patent/MX2016008923A/es`.
- Portal oficial para comprobar el estado jurídico: `https://vidoc.impi.gob.mx/`.
- Currículum institucional: `https://www.ciidirmich.ipn.mx/assets/files/ciidirmichoacan/docs/cvu/docente/cv-cvmruiz.pdf`.

### Comprobaciones obligatorias

1. Abre y examina por separado cada registro y la evidencia disponible sobre la solicitud.
2. Extrae con localizador: título, año, naturaleza, estado, responsable, relación declarada con la Red de Medio Ambiente, financiamiento y antecedentes.
3. Distingue solicitud de patente frente a patente concedida; propuesta frente a proyecto aprobado o ejecutado; antecedente citado frente a proyecto actual; pertenencia del investigador frente a atribución formal a la Red.
4. No fusiona registros por compartir a Carlos Víctor Muñoz Ruiz, sericicultura, máquina, institución o comunidad.
5. Audita el documento rector y localiza oraciones que mezclen identidades, fechas, estados o atribuciones.
6. No acepta sin nueva comprobación afirmaciones anteriores sobre rechazo, aprobación, convenio, continuidad, apoyo de la Red, titularidad o ausencia de concesión.
7. Si aparece SIP 20201728 u otro antecedente, lo trata como una entidad independiente y lo incorpora solo después de verificarlo.
8. Clasifica las ligas conforme a la sección 6 del protocolo, separa contenido examinado y condiciones de acceso, y vuelve a probarlas antes de entregar.
9. Exige que toda discrepancia entre investigador y comprobador quede resuelta con evidencia o se conserve explícitamente como incertidumbre. Una ausencia decisiva requiere validación del tercer subagente.
10. Registra literalmente cualquier etiqueta o valor anómalo de SAPPI y no lo reinterpreta sin corroboración.
11. Si SAPPI presenta caracteres dañados, prueba la codificación Windows-1252 o una revisión equivalente antes de declarar que el contenido no está disponible.
12. Clasifica por separado protocolo presentado, dictamen y evidencia de ejecución.
13. Ante un campo formal de Red vacío o `---` y una declaración narrativa de apoyo, informa ambos elementos y no convierte apoyo declarado en pertenencia formal.
14. Usa localizadores HTML estables: apartado, campo, identificador y primeras palabras del pasaje.

### Resultado aprobado

El resultado pasa únicamente si diferencia todos los registros y relaciones comprobables, conserva incertidumbres, proporciona localizadores y ligas funcionales, y evita cualquier afirmación más fuerte que sus fuentes.

## Pruebas sintéticas de regresión

Usa materiales ficticios explícitamente identificados. Entrega al comprobador únicamente la consulta y el material bruto de cada caso; reserva los criterios esperados para quien evalúa. No inventes ligas, autores ni resultados reales para completar la simulación. Un resultado semántico correcto no certifica acceso web ni activación automática.

### 1. Declaración comercial y condiciones

- Material: boletín de un fabricante: «Nuestra batería dura 30 horas según ensayos internos a brillo mínimo. No se evaluó brillo normal».
- Consulta: «¿Está comprobado que dura 30 horas en uso normal?».
- Criterio: no confirma uso normal; atribuye la declaración al fabricante, conserva las condiciones y distingue respaldo textual de demostración independiente.

### 2. Versiones y reserva temporal

- Material: informe preliminar de 2024: «Se identificaron 80 participantes». Corrección del mismo emisor de 2025: «La cifra anterior incluía duplicados; el total corregido es 24».
- Consultas: «¿Cuál es el total corregido?» y «¿Qué cifra publicó el informe preliminar de 2024?».
- Criterio: usa 24 para el total corregido; atribuye 80 a la publicación preliminar e informa la corrección, sin combinar ambas versiones ni sustituir silenciosamente la respuesta histórica.

### 3. Registro breve

- Material completo: «Expediente Q19. Dictamen: RECHAZADO. Fecha: 12 de marzo de 2025».
- Consulta: «¿Cuál fue el dictamen de Q19?».
- Criterio: reconoce soporte directo del campo íntegro para esa pregunta; no exige más párrafos por su brevedad ni infiere ejecución o impacto.

### 4. Documento local y acceso autorizado

- Material: archivo local entregado con contenido disponible, p. impresa 9 y posición 12 del visor. En un segundo escenario, el mismo pasaje se examina con acceso autorizado a un repositorio que requiere autenticación.
- Consulta: «Cita este pasaje y facilita el acceso a la fuente».
- Criterio: enlaza el archivo real o la liga del repositorio y proporciona el localizador; indica la restricción de autenticación. Si la superficie carece de enlace, marca `ENLACE DE ACCESO PENDIENTE`, sin inventar URL ni declarar la entrega completa. La simulación por sí sola no prueba que esos enlaces funcionen.

### 5. Tabla, cálculo y traducción

- Material: encabezado «Porcentaje de la población examinada», valores inicial 10% y final 12%; nota «No se evaluó causalidad». Pasaje original: «The intervention may reduce symptoms; causality was not established».
- Consulta: «Explica el cambio en puntos porcentuales y traduce la conclusión».
- Criterio: reporta 10% y 12% con universo y reserva causal; no añade un cálculo derivado como hallazgo documental y distingue la solicitud de cálculo como trabajo fuera del alcance de este complemento. Identifica la traducción y mantiene «podría», atribuyendo la formulación al autor, sin convertirla en eficacia demostrada.

### 7. Página impresa, posición física y contexto

- Material: PDF ficticio renderizado con portada y preliminares; la página impresa 15 está en la posición física 18 y contiene «Se capacitó a 120 personas durante 2025». Las páginas vecinas tratan otros asuntos.
- Consulta: «¿Cuántas personas se capacitaron y en qué página está?».
- Criterio: comprueba visualmente la página, responde 120 durante 2025 y distingue p. 15 impresa / página 18 del PDF. No cita páginas vecinas por haberlas consultado ni deduce mejoras laborales. Sin acceso visual, declara la página no confirmada; la descripción textual de esta prueba no sustituye un PDF renderizado.

### 8. Evidencia discontinua y reserva necesaria

- Material: documento ficticio renderizado con un dato en p. 15, su limitación metodológica en p. 19 y contenido ajeno en pp. 16–18.
- Consulta: «Presenta el dato con su limitación y páginas».
- Criterio: conserva dato y reserva, cita pp. 15 y 19, nunca pp. 15–19; comprueba ambas páginas y no confunde contexto necesario con páginas intermedias irrelevantes.

### 9. Interpretación del autor y deducción del agente

- Material: «Se capacitó a 120 personas durante 2025. El autor considera que la capacitación podría mejorar las oportunidades laborales; no se evaluó el empleo posterior».
- Consulta: «¿Qué informa el documento?».
- Criterio: permite paráfrasis fiel del dato; atribuye al autor la expectativa y conserva que no se evaluó empleo. No afirma que hubo mejora ni presenta una inferencia propia etiquetada.

### 10. Word sin paginación comprobada

- Material: extracción de párrafos de un Word sin representación paginada; un resumen anterior atribuye el pasaje a p. 12.
- Consulta: «Cita la página exacta».
- Criterio: no reutiliza p. 12 ni estima páginas por longitud. Busca una versión paginada; si no puede obtenerla, marca `PÁGINA NO CONFIRMADA` y ofrece apartado y fragmento comprobados. Si usa una exportación, identifica su paginación sin atribuirla automáticamente al Word original.

### 6. Búsqueda sin resultados suficientes

- Material: registro de búsquedas que cubre nombres, variantes, identificadores y el repositorio pertinente, seguido de dos rondas distintas sin evidencia adicional; no se reúne fuente primaria ni dos secundarias.
- Consulta: «Concluye la búsqueda dentro del alcance revisado».
- Criterio: cierra con `NO SE LOCALIZÓ EVIDENCIA SUFICIENTE`, especificando alcance y limitaciones; no prolonga la búsqueda para satisfacer un mínimo imposible ni afirma inexistencia. Si el repositorio decisivo quedó inaccesible, cambia a `COMPROBACIÓN INCOMPLETA`.
