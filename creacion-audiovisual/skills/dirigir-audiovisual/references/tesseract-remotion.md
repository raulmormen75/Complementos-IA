# Escenas de Tesseract en Remotion

Usa esta ruta cuando el usuario elija Tesseract o una escena editable por capas y fotogramas clave facilite revisiones posteriores. Sirve para fondos con cámara, luz y partículas, gráficos en movimiento y escenas 3D que convenga editar de manera independiente. Para una pieza que ya se resuelve con la animación de Remotion, conserva un solo montaje. El encargo decide dónde animar los personajes. Los sprites siguen su ruta propia cuando aportan movimiento cuadro por cuadro.

Aplica la [regla de cero cargos adicionales](../SKILL.md). Limita Tesseract a edición, visualización, animación y exportación locales con gratuidad comprobada. Excluye las operaciones remotas de Tesseract o Mirage, incluidos generadores y procesamiento por créditos.

## Preparar y probar

1. Define guion, encuadre, ritmo y función de cada capa. Distingue el fondo o gráfico de Tesseract de los gestos, personajes, diálogo, transiciones y mezcla que se integrarán en el montaje. Fija dimensiones, fotogramas por segundo y duración antes de exportar.
2. Carga la guía del complemento oficial de Tesseract correspondiente a la tarea. Para animación por capas usa la de gráficos en movimiento. Para 3D o edición de metraje usa la guía específica. Comprueba la versión del motor local `tsrct` con `--version` y compárala con la que pide la guía instalada. Si falta, sigue el procedimiento oficial de descarga y verificación de la huella solo si la preparación y el uso previsto son gratuitos y están autorizados. El motor y sus bibliotecas se preparan por separado de Creación audiovisual.
3. Crea y guarda el `.tsrct` con sus medios empaquetados. Revisa el proyecto con el visor o un fotograma renderizado. Exporta un tramo corto con la cámara y los elementos animados. Confirma las dimensiones y la cadencia reales del archivo con un analizador de medios antes de exportar la escena completa. En la prueba de Windows el ajuste de resolución del exportador produjo una altura diferente de la esperada.
4. Para un fondo opaco, importa el MP4 como recurso local en Remotion y ajusta su colocación en la línea de tiempo. Si el proyecto necesita transparencia, consulta los formatos con alfa admitidos por las versiones de ambos motores y comprueba un fotograma sobre fondos claros y oscuros. La conversión H.264 de este módulo se reserva para material opaco.
5. Si el entorno carece de Tesseract o del render local, entrega el material editable que sea viable y señala qué exportación queda pendiente. Si Remotion local es elegible para uso gratuito, una composición íntegra allí puede servir de alternativa. Sin una opción permitida, entrega el material viable y marca PENDIENTE la exportación. [Configuración oficial de Tesseract para Codex](https://mirage.app/tesseract/codex)

## Si Remotion no puede extraer fotogramas de un fondo opaco

Prueba el archivo original y confirma dimensiones, fps y duración. Si el importador falla al buscar fotogramas, conserva el original y convierte una copia a H.264 con cadencia constante y sin cuadros B. Este ejemplo se comprobó con un fondo de 30 fps sin audio propio. Ajusta la cadencia y el intervalo de cuadros clave al proyecto. Conserva y sincroniza aparte el audio de la fuente si forma parte del montaje.

```text
ffmpeg -i fondo-tesseract.mp4 -an -r 30 -pix_fmt yuv420p -c:v libx264 -crf 15 -g 30 -bf 0 -movflags +faststart fondo-compatible.mp4
```

Vuelve a probar la importación y comprueba resolución, cadencia, número de fotogramas y duración de la copia. Conserva la mejor resolución del original que funcione en el montaje. Usa la conversión solo para corregir una incompatibilidad observada.

## Revisión y entrega

- En la animática, comprueba que cada acción se entienda en orden y que el encuadre cambie cuando un gesto necesita espacio. En la revisión, inspecciona la preparación, el punto de contacto y la reacción. Si dos elementos compiten en un rostro o una mano, cambia su posición o el encuadre antes de añadir más efectos. Revisa en reproducción y a la escala de destino.
- Exporta el montaje final en Remotion. Comprueba dimensiones, cadencia, duración de video y audio, decodificación y sincronía. Si se exige una duración exacta y la pista codificada alarga el contenedor, comprueba la diferencia con metadatos y ajusta la presentación a la duración del video. En la prueba funcionó remultiplexar el video de Remotion sin recodificarlo y codificar AAC desde la mezcla WAV de duración exacta. Vuelve a medir ambas pistas.
- Entrega el video y, cuando corresponda, el `.tsrct`, el proyecto Remotion y los medios necesarios para reproducirlo. Indica qué trabajo hizo cada herramienta y cualquier límite de la revisión. Registra por separado la validación del proyecto Tesseract y la del video final.

## Prueba de referencia

En «Una paleta para mi calaverita», Tesseract 0.5.0 animó la plaza ilustrada, el acercamiento, las velas y las partículas. Remotion 4.0.537 compuso los peatones, las miradas, el intercambio de la paleta, las lágrimas y el abrazo con diálogo en pantalla y música original. El fondo se convirtió a una copia compatible después de un error de extracción de fotogramas. El video final verificado quedó en 1280 × 720, 30 fps, 450 fotogramas y 15.000 segundos con AAC estéreo. Esta prueba cubre el flujo local en Windows con un fondo opaco.
