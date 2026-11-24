(() => {
  const section = document.getElementById('plotly-seccion');
  const chart = document.getElementById('plotly');
  const layers = window.Plotly;
  if (!section || !chart || !layers) return;
  const safeText = (value) => String(value).replace(/[&<>]/g, (letter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[letter]));
  let selectRegistered = false;
  let surfaceRegistered = false;
  section.hidden = false;
  document.addEventListener('graficos:render', ({ detail: { spec, result } }) => {
    if (spec.surface === 'sine' && !surfaceRegistered) {
      surfaceRegistered = true;
      const stage = document.getElementById('plotly-superficie');
      const amplitude = document.getElementById('amplitud');
      const axes = Array.from({ length: 35 }, (_, index) => -3 + 6 * index / 34);
      stage.hidden = false;
      const renderSurface = () => {
        const factor = Number(amplitude.value);
        const heights = axes.map((y) => axes.map((x) => factor * Math.sin(x) * Math.cos(y)));
        layers.react(stage, [{ type: 'surface', x: axes, y: axes, z: heights, cmin: -2, cmax: 2, showscale: false, colorscale: 'Viridis' }], {
          title: { text: 'Superficie matemática en Plotly.js' }, height: 360, uirevision: 'superficie',
          scene: { zaxis: { range: [-2, 2] } }, margin: { l: 15, r: 15, t: 42, b: 15 },
        }, { responsive: true, displaylogo: false, showLink: false }).catch(() => { stage.hidden = true; });
      };
      amplitude.addEventListener('input', renderSurface);
      renderSurface();
    }
    const mode = spec.chartType === 'line' ? 'lines+markers' : undefined;
    const type = spec.chartType === 'line' ? 'scatter' : 'bar';
    const common = {
      type, mode, x: result.groups.map(({ label }) => safeText(label)),
      customdata: result.groups.map(({ label }) => label),
      hovertemplate: '%{x}<br>%{y}<extra></extra>',
    };
    const traces = [{
      ...common, y: result.groups.map(({ value }) => value),
      marker: { color: '#1755a3' }, name: 'Observado',
    }];
    if (result.percentage) traces.push({
      ...common, y: result.groups.map(({ scenario }) => scenario),
      marker: { color: '#147a69' }, name: 'Escenario hipotético',
    });
    layers.react(chart, traces, {
      xaxis: { automargin: true, title: { text: safeText(spec.x) } },
      yaxis: { automargin: true, title: { text: safeText(spec.unit) } },
      margin: { l: 55, r: 25, t: 42, b: 65 }, height: 410, barmode: 'group',
    }, {
      responsive: true, displaylogo: false, showLink: false,
      modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio'],
      toImageButtonOptions: { format: 'png', filename: 'grafica-plotly' },
    }).then(() => {
      if (selectRegistered) return;
      selectRegistered = true;
      chart.on('plotly_click', (event) => {
        const label = event.points?.[0]?.customdata;
        if (typeof label === 'string') document.dispatchEvent(new CustomEvent('graficos:seleccionar', { detail: { key: spec.x, label } }));
      });
    }).catch(() => {
      const notice = document.createElement('p');
      notice.textContent = 'Plotly.js no pudo dibujar en este navegador. La gráfica principal sigue disponible.';
      chart.replaceChildren(notice);
    });
  });
})();
