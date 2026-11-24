# Herramientas, costos y vigencia

Consulta inicial: 19 de octubre de 2026. El complemento no se actualiza solo ni instala todas las herramientas. Cargar e investigar únicamente lo pertinente al encargo. La selección siguiente es una propuesta de integración, no una certificación de que cada aplicación esté instalada o se haya probado aquí.

Aplica la regla de cero cargos adicionales de la [habilidad principal](../SKILL.md) en cualquier superficie. Verifica que cada función nativa esté incluida y que cualquier herramienta local permita el uso gratuito. Descarta rutas con costo o consumo de créditos incierto.

## Núcleo

| Función | Opción | Condición |
|---|---|---|
| Dirección y código | Codex y este complemento | Usa únicamente funciones nativas dentro de la cuota incluida, sin recurrir a saldo adicional |
| Montaje programado y exportación | Remotion local | Confirmar licencia gratuita aplicable. Si no se confirma, deja el render pendiente |
| Diseño 2D | HTML/JSX, CSS, SVG | Código y recursos propios; fuentes externas requieren licencia |
| Escenas 3D | WebGL 2 directo o Three.js con React Three Fiber y `@remotion/three` cuando proceda | Elegir por escena según [WebGL 2 directo o Three.js](webgl2-directo.md). Comprobar el contexto gráfico |

La licencia Remotion consultada permite uso gratuito a individuos, organizaciones con fines de lucro de hasta tres empleados, organizaciones sin fines de lucro y evaluación no comercial; fuera de elegibilidad requiere licencia empresarial. Revisar [texto original](https://github.com/remotion-dev/remotion/blob/main/packages/core/LICENSE.md), «Eligibility» y «Company License», y el archivo de licencia de la versión instalada. SOPORTE DIRECTO al corte de consulta. No asumir que un empleado individual equivale a toda una institución. La documentación anuncia un cambio futuro en 5.0, por lo que esa versión exige nueva comprobación.

## Recursos opcionales

Estas páginas son puntos de entrada oficiales para evaluación por necesidad. Antes de instalar, verificar versión, licencia y plataforma actuales; no están empaquetados ni se requieren para el starter.

| Necesidad | Candidato local | Aplicación prevista |
|---|---|---|
| Modelado, rigging, animación de personajes o simulación compleja | [Blender](https://www.blender.org/) | Crear assets/planos y ensamblar la entrega en Remotion; no fingir que geometría básica equivale a un personaje terminado |
| Mezcla y limpieza de audio | [Audacity](https://www.audacityteam.org/) | Procesar recursos autorizados y reimportar sin cambiar la voz aprobada arbitrariamente |
| Inspección y conversión multimedia | [FFmpeg](https://ffmpeg.org/) | Examinar duración, formatos, niveles y conversiones; licencia depende de compilación y códecs |
| Vectores propios | [Inkscape](https://inkscape.org/) | Preparar SVG; comprobar tipografía y exportación |
| Transcripción local | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Borrador de subtítulos; revisar nombres, cifras, tiempos y licencia del modelo |
| Voz sintética local opcional | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) | Evaluar idioma y voz disponibles; no prometer calidad uniforme ni clonar identidad sin autorización |

No sustituir una herramienta funcional existente por una nueva solo por estar de moda. Si la opción local no alcanza calidad o rendimiento, explicar el límite y proponer simplificar el diseño o usar material aportado por el usuario. Excluye servicios de pago, créditos de terceros y pruebas con posibles cargos.

## Actualidad con propósito

1. Separar fundamentos relativamente estables de hechos cambiantes: algoritmos, especificaciones sociales, versiones, precios, licencias y disponibilidad.
2. Para un mercado concreto, revisar fuentes originales del canal, referencias recientes elegidas por su pertinencia y resultados reales del usuario cuando existan. Una tendencia observada no es una recomendación automática.
3. Documentar qué se verificó, fecha y alcance. Si no hay acceso, señalar NO CONFIRMADO y evitar afirmaciones de vigencia.
4. Adaptar conocimiento al presupuesto, público, país/idioma y objetivo. Proponer pruebas comparables cuando se busque optimizar resultados; no presentar opiniones como datos.

## Color y 3D

[Three.js, Color Management](https://threejs.org/manual/pages/color-management.html), «Roles of color spaces» y «Common mistakes», revisado el 19 de octubre de 2026, distingue entradas de color y datos, cálculo en Linear-sRGB y salida apropiada. SOPORTE DIRECTO técnico. Aplicación propia: comprobar configuración de color antes de compensar un render oscuro únicamente aumentando luces; no trasladar propiedades de versiones antiguas sin verificar.
