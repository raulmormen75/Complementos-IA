import { analyze, chartSvg, escapeMarkup, finiteMetric, formatNumber, labelOf, numericSum } from './model.mjs';

export function csvText(columns, rows) {
  const csvValue = (value, checkFormula = true) => {
    let string = String(value ?? '');
    if (checkFormula && typeof value === 'string' && /^[\t\r\n ]*[=+\-@]/.test(string)) string = "'" + string;
    return '"' + string.replace(/"/g, '""') + '"';
  };
  return '\ufeff' + [
    columns.map((column) => csvValue(column)).join(','),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(',')),
  ].join('\r\n') + '\r\n';
}

export function mapSvg(spec, tableRows, selections = {}) {
  const points = [];
  const pointKeys = new Set();
  const addPoint = (coordinate, name) => {
    const key = JSON.stringify([coordinate[0], coordinate[1], name]);
    if (pointKeys.has(key)) return;
    pointKeys.add(key);
    points.push({ coordinate, name });
  };
  if (spec.latitude && spec.longitude) {
    for (const row of tableRows) {
      const lat = finiteMetric(row[spec.latitude], spec.decimal);
      const lon = finiteMetric(row[spec.longitude], spec.decimal);
      if (lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        addPoint([lon, lat], labelOf(row[spec.region ?? spec.x]));
      }
    }
  }
  const regions = [];
  const validCoordinate = (point) => Array.isArray(point) && point.length >= 2
    && Number.isFinite(point[0]) && Number.isFinite(point[1])
    && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
  for (const feature of spec.locations?.features ?? []) {
    const geom = feature?.geometry;
    if (!geom) continue;
    const properties = feature.properties ?? {};
    const name = labelOf(properties[spec.geoKey ?? 'name'] ?? feature.id);
    if (geom.type === 'Point' && validCoordinate(geom.coordinates)) {
      addPoint(geom.coordinates, name);
    }
    const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
    const rings = Array.isArray(polygons) ? polygons.flatMap((polygon) => Array.isArray(polygon)
      ? polygon.map((ring) => (Array.isArray(ring) ? ring.filter(validCoordinate) : [])).filter((ring) => ring.length >= 3)
      : []) : [];
    if (rings.length) regions.push({ rings, name });
  }
  if (!points.length && !regions.length) return '';
  const width = 780;
  const height = 440;
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  const include = ([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  points.forEach((item) => include(item.coordinate));
  regions.forEach((region) => region.rings.forEach((ring) => ring.forEach(include)));
  const zoom = Math.min((width - 80) / Math.max(maxX - minX, 0.01), (height - 80) / Math.max(maxY - minY, 0.01));
  const screen = ([x, y]) => [
    (width / 2 + (x - (maxX + minX) / 2) * zoom).toFixed(1),
    (height / 2 - (y - (maxY + minY) / 2) * zoom).toFixed(1),
  ];
  const escape = escapeMarkup;
  const key = spec.region ?? spec.x;
  const attributes = (name) => ' class="pick" role="button" tabindex="0" data-region="' + escape(name) + '" aria-label="' + escape(name) + '"';
  const outlines = regions.map(({ rings, name }) => {
    const path = rings.map((ring) => 'M' + ring.map(screen).join(' L') + ' Z').join(' ');
    return '<path d="' + path + '" fill="' + (selections[key] === name ? '#a5c9f1' : '#dceafa')
      + '" fill-rule="evenodd" stroke="#477399" stroke-width="1.5"' + attributes(name) + '><title>' + escape(name) + '</title></path>';
  });
  const markers = points.map(({ coordinate, name }) => {
    const [cx, cy] = screen(coordinate);
    return '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#1565a9" stroke="white"' + attributes(name) + '><title>' + escape(name) + '</title></circle>';
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height
    + '" role="img" aria-label="Mapa de regiones o registros de los datos aportados"><rect width="100%" height="100%" fill="#f1f7fc"/>'
    + outlines.join('') + markers.join('') + '</svg>';
}

export function diagramSvg(edges) {
  const nodes = [...new Set(edges.flatMap((edge) => [edge.from, edge.to]))];
  const visible = nodes.slice(0, 48);
  if (!visible.length) return '';
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(visible.length))));
  const width = 270 * columns + 60;
  const height = Math.ceil(visible.length / columns) * 110 + 64;
  const layout = new Map(visible.map((name, index) => [name, { x: 135 + index % columns * 270, y: 60 + Math.floor(index / columns) * 110 }]));
  const connectors = edges.filter(({ from, to }) => layout.has(from) && layout.has(to)).map(({ from, to }) => {
    const start = layout.get(from);
    const end = layout.get(to);
    if (from === to) return '<path d="M' + start.x + ' ' + (start.y - 24) + ' c70 -65 100 15 55 20" fill="none" stroke="#64748b" marker-end="url(#flecha)"/>';
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const offset = Math.min(0.39, 90 / distance);
    const x1 = start.x + (end.x - start.x) * offset;
    const y1 = start.y + (end.y - start.y) * offset;
    const x2 = end.x - (end.x - start.x) * offset;
    const y2 = end.y - (end.y - start.y) * offset;
    return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="#64748b" stroke-width="2" marker-end="url(#flecha)"/>';
  });
  const boxes = [...layout].map(([name, { x, y }]) => '<g><title>' + escapeMarkup(name) + '</title><rect x="' + (x - 82) + '" y="' + (y - 23) + '" width="164" height="46" rx="5" fill="#edf4fd" stroke="#4278ad"/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14">'
    + escapeMarkup(name.length > 19 ? name.slice(0, 17) + '…' : name) + '</text></g>');
  const notice = visible.length < nodes.length ? '<text x="24" y="' + (height - 12) + '" font-size="12">Se muestran ' + visible.length + ' de ' + nodes.length + ' nodos.</text>' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" font-family="system-ui, sans-serif" role="img" aria-label="Diagrama de relaciones"><defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#64748b"/></marker></defs><rect width="100%" height="100%" fill="white"/>'
    + connectors.join('') + boxes.join('') + notice + '</svg>';
}

export function dashboardMain() {
  const spec = JSON.parse(document.querySelector('#datos').textContent);
  const find = (id) => document.getElementById(id);
  const selections = Object.create(null);
  const elements = [...new Set([...spec.filters, spec.x, spec.region].filter(Boolean))];
  let result;
  let renderedFilters;
  const savedFilters = new Map();
  const hasSelection = (key, value) => spec.rows.some((row) => labelOf(row[key]) === value);
  const pick = (key, label) => {
    if (!hasSelection(key, label)) {
      find('estado').textContent = 'No hay datos vinculados con la selección «' + label + '».';
      return;
    }
    selections[key] = selections[key] === label ? '' : label;
    savedFilters.get(key).value = selections[key];
    render();
  };
  const listenToPicks = (container, attribute, key) => {
    container.querySelectorAll('[' + attribute + ']').forEach((item) => {
      const handle = () => pick(key, item.getAttribute(attribute));
      item.addEventListener('click', handle);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handle();
        }
      });
    });
  };
  document.addEventListener('graficos:seleccionar', (event) => {
    const { key, label } = event.detail ?? {};
    if (elements.includes(key) && typeof label === 'string') pick(key, label);
  });
  const controls = find('filtros');
  for (const key of elements) {
    const label = document.createElement('label');
    label.textContent = key;
    const field = document.createElement('select');
    const allOption = new Option('Todos', '');
    field.add(allOption);
    const values = [...new Set(spec.rows.map((row) => labelOf(row[key])))].sort((a, b) => a.localeCompare(b, 'es-MX', { numeric: true }));
    for (const value of values) field.add(new Option(value, value));
    field.addEventListener('change', () => {
      selections[key] = field.value;
      render();
    });
    label.appendChild(field);
    controls.appendChild(label);
    savedFilters.set(key, field);
  }
  const heading = find('encabezados');
  for (const column of spec.columns) {
    const cell = document.createElement('th');
    cell.textContent = column;
    cell.scope = 'col';
    heading.appendChild(cell);
  }
  find('titulo').textContent = spec.title;
  find('fuente').textContent = 'Fuente: ' + spec.source;
  find('variacion').addEventListener('input', render);
  find('reiniciar').addEventListener('click', () => {
    for (const key of elements) {
      selections[key] = '';
      savedFilters.get(key).value = '';
    }
    find('variacion').value = '0';
    render();
  });
  function download(name, type, content) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  find('descargar-csv').addEventListener('click', () =>
    download('datos-filtrados.csv', 'text/csv;charset=utf-8', csvText(spec.columns, result.included.map((index) => spec.rows[index]))));
  const activeFilters = () => Object.fromEntries(elements.filter((key) => selections[key])
    .map((key) => [key, selections[key]]));
  find('descargar-auditoria').addEventListener('click', () => {
    const report = {
      titulo: spec.title, fuente: spec.source, variable: spec.y, unidad: spec.unit,
      filtros: renderedFilters,
      registros: { origen: spec.rows.length, coincidentes: result.matched,
        incluidos: result.included.length, excluidosPorValorInvalido: result.omitted },
      totalObservado: result.included.length ? result.total : null,
      escenarioHipotetico: result.percentage && result.included.length
        ? { variacionPorcentual: result.percentage, total: result.scenario } : null,
    };
    download('comprobacion-seleccion.json', 'application/json', JSON.stringify(report, null, 2) + '\n');
  });
  find('descargar-svg').addEventListener('click', () => download('grafica.svg', 'image/svg+xml', chartSvg(spec, result)));
  find('descargar-png').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([chartSvg(spec, result)], { type: 'image/svg+xml' }));
    const image = new Image();
    image.onload = () => {
      const output = document.createElement('canvas');
      output.width = image.width * 2;
      output.height = image.height * 2;
      const context = output.getContext('2d');
      context.drawImage(image, 0, 0, output.width, output.height);
      URL.revokeObjectURL(url);
      output.toBlob((png) => {
        if (png) download('grafica.png', 'image/png', png);
        else find('estado').textContent = 'No se pudo convertir la gráfica a PNG en este navegador.';
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      find('estado').textContent = 'El navegador no pudo convertir la gráfica a PNG.';
    };
    image.src = url;
  });
  const drawDetail = () => {
    const rows = document.createDocumentFragment();
    for (const index of result.included.slice(0, 100)) {
      const tr = document.createElement('tr');
      for (const key of spec.columns) {
        const td = tr.insertCell();
        td.textContent = labelOf(spec.rows[index][key]);
      }
      rows.appendChild(tr);
    }
    find('detalle').replaceChildren(rows);
    find('detalle-nota').textContent = result.included.length > 100
      ? 'Se muestran 100 registros. El CSV contiene todos los incluidos.'
      : 'Se muestran todos los registros incluidos.';
  };
  function render() {
    try {
      result = analyze(spec, selections, find('variacion').value);
    } catch (error) {
      find('estado').textContent = error.message;
      return;
    }
    find('total').textContent = result.included.length ? formatNumber(result.total) : 'Sin datos';
    find('promedio').textContent = formatNumber(result.average);
    find('observaciones').textContent = formatNumber(result.included.length);
    find('escenario').textContent = result.percentage ? formatNumber(result.scenario) : 'Sin variación';
    find('estado').textContent = result.omitted
      ? result.omitted + ' registros excluidos por no tener un valor numérico válido en ' + spec.y + '.'
      : result.matched + ' registros coinciden con la selección.';
    renderedFilters = activeFilters();
    const filters = Object.entries(renderedFilters).map(([key, value]) => key + ' = ' + value);
    find('contexto-seleccion').textContent = 'Filtros activos: ' + (filters.join(' · ') || 'ninguno') + '.';
    find('cobertura').textContent = formatNumber(result.included.length) + ' de ' +
      formatNumber(result.matched) + ' registros seleccionados entran al cálculo.';
    const figure = find('figura');
    figure.innerHTML = chartSvg(spec, result, { interactive: true });
    listenToPicks(figure, 'data-category', spec.x);
    const mapSection = find('mapa-seccion');
    const map = find('mapa');
    const newMap = mapSvg(spec, result.included.map((index) => spec.rows[index]), selections);
    mapSection.hidden = !newMap;
    if (newMap) {
      map.innerHTML = newMap;
      listenToPicks(map, 'data-region', spec.region ?? spec.x);
    }
    document.dispatchEvent(new CustomEvent('graficos:render', { detail: { spec, result } }));
    drawDetail();
  }
  const diagram = diagramSvg(spec.edges ?? []);
  if (diagram) {
    find('diagrama-seccion').hidden = false;
    find('diagrama').innerHTML = diagram;
  }
  if (spec.surface === 'sine') {
    find('superficie').hidden = false;
    find('angulo').addEventListener('input', drawSurface);
    find('amplitud').addEventListener('input', drawSurface);
    drawSurface();
  }
  function drawSurface() {
    const canvas = find('lienzo');
    const context = canvas.getContext('2d');
    if (!context) return;
    const amplitude = Number(find('amplitud').value);
    const angle = Number(find('angulo').value) * Math.PI / 180;
    const rotate = (x, z) => [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)];
    const project = (x, z) => {
      const y = amplitude * Math.sin(x) * Math.cos(z);
      const [horizontal, depth] = rotate(x, z);
      return [canvas.width / 2 + horizontal * 53, canvas.height / 2 + depth * 19 - y * 41];
    };
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let axis = 0; axis < 2; axis += 1) {
      context.strokeStyle = axis ? '#147a69' : '#1755a3';
      for (let line = -3; line <= 3; line += 0.4) {
        context.beginPath();
        for (let step = 0; step <= 48; step += 1) {
          const t = -3 + step / 8;
          const [x, y] = axis ? project(line, t) : project(t, line);
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    }
    find('funcion').textContent = 'z = ' + amplitude + ' sen(x) cos(y)';
  }
  render();
}

export function dashboardHtml(spec, stylesheet, adapters = '') {
  const payload = JSON.stringify(spec).replace(/</g, '\\u003c');
  const declarations = [finiteMetric, labelOf, numericSum, formatNumber, analyze, escapeMarkup, chartSvg, csvText, mapSvg, diagramSvg, dashboardMain];
  const runtime = declarations.map((fn) => fn.toString()).join('\n');
  return `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeMarkup(spec.title)}</title><style>${stylesheet}</style></head><body>
<main>
<header><h1 id="titulo"></h1><p id="fuente"></p></header>
<section aria-labelledby="seleccion"><h2 id="seleccion">Explorar datos</h2>
<div id="filtros" class="controls"></div>
<div class="controls"><label>Escenario hipotético (% de variación)
<input id="variacion" type="number" step="1" min="-100" max="1000" value="0"></label>
<button id="reiniciar" type="button">Restablecer filtros</button></div>
<p id="estado" role="status"></p>
<p id="contexto-seleccion"></p>
<dl class="kpis">
<div><dt>Total observado</dt><dd id="total"></dd></div>
<div><dt>Promedio por registro</dt><dd id="promedio"></dd></div>
<div><dt>Registros incluidos</dt><dd id="observaciones"></dd></div>
<div><dt>Total hipotético</dt><dd id="escenario"></dd></div>
</dl>
<div id="figura" class="figure"></div>
<p><a href="#registros-origen">Ir a los registros de la selección</a></p>
<section id="plotly-seccion" hidden><h2>Exploración con Plotly.js</h2><div id="plotly" class="plotly"></div><div id="plotly-superficie" hidden></div></section>
</section>
<section id="mapa-seccion" hidden><h2>Mapa de los datos</h2><div id="mapa" class="figure"></div><p>Selecciona una región o punto para filtrar la gráfica y los registros. El fondo usa únicamente las geometrías aportadas.</p></section>
<section id="diagrama-seccion" hidden><h2>Relaciones</h2><div id="diagrama" class="figure"></div></section>
<section id="superficie" hidden><h2>Superficie matemática</h2>
<div class="controls"><label>Giro <input id="angulo" type="range" min="-180" max="180" value="33"></label>
<label>Amplitud <input id="amplitud" type="range" min="0" max="2" value="1" step="0.1"></label></div>
<p id="funcion"></p><canvas id="lienzo" width="780" height="410" role="img" aria-label="Proyección de la superficie matemática"></canvas>
<div id="three" hidden><p id="three-estado" role="status"></p></div>
</section>
<section aria-labelledby="registros-origen"><h2 id="registros-origen" tabindex="-1">Registros de origen</h2>
<p id="cobertura"></p>
<p id="detalle-nota"></p><div class="controls"><button id="descargar-csv" type="button">Descargar CSV filtrado</button>
<button id="descargar-auditoria" type="button">Descargar comprobación</button>
<button id="descargar-svg" type="button">Descargar gráfica SVG</button>
<button id="descargar-png" type="button">Descargar gráfica PNG</button></div>
<div class="table" tabindex="0" aria-label="Tabla de registros"><table><thead><tr id="encabezados"></tr></thead><tbody id="detalle"></tbody></table></div>
</section>
</main>
<script id="datos" type="application/json">${payload}</script>
<script>${adapters}</script>
<script>${runtime}\ndashboardMain();</script>
</body></html>`;
}
