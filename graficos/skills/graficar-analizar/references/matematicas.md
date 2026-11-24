# Matemáticas

Define la variable, dominio, unidades, pasos y razón de cada transformación. Distingue figura ilustrativa, construcción geométrica a escala y simulación. Para una gráfica de datos mantén la fuente y las unidades. Para una función indica dominio y parámetros.

- Para una operación animada adapta `assets/manim/operacion.py`. Usa Manim Community instalado y comprueba el archivo generado de principio a fin. El ejemplo usa texto vectorial para funcionar sin una instalación adicional de LaTeX. Si el trabajo necesita notación más compleja, usa MathTex con un entorno LaTeX local.
- Para una figura fija usa una salida PNG de Manim o SVG cuando la ruta permita conservar trazos y texto. Para una página, integra el MP4 y conserva los controles de la demostración como parte del HTML.
- Si la persona debe manipular los datos, usa Plotly.js o Three.js cuando estén operativos. En la plantilla base puede ajustar amplitud y giro de la función. Verifica el comportamiento en los extremos, cambios de signo, unidades y valores por defecto.

```powershell
manim render -qm assets/manim/operacion.py OperacionPasoAPaso
```

Entrega el archivo editable de la escena y conserva por separado cualquier audio o tipografía que tenga su propia licencia.
