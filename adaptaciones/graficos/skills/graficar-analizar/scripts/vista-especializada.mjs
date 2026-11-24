import { access, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { analyze, escapeMarkup, normalizeSpec } from './model.mjs';

const clientScripts = {
  chartjs: `
import Chart from 'chart.js/auto';
const { views, chartType, unit, filter } = data;
const control = document.querySelector('#elegir');
const detail = document.querySelector('#detalles');
for (const [index, view] of views.entries()) control.add(new Option(view.label, String(index)));
if (!filter || views.length < 2) control.closest('label').hidden = true;
const chart = new Chart(document.querySelector('canvas'), {
  type: chartType,
  data: { labels: [], datasets: [{ label: unit, data: [], backgroundColor: '#2458a6', borderColor: '#2458a6', tension: 0, fill: false }] },
  options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, title: { display: true, text: unit } } }, plugins: { legend: { display: false } } },
});
function show(index) {
  const view = views[index];
  chart.data.labels = view.groups.map((group) => group.label);
  chart.data.datasets[0].data = view.groups.map((group) => group.value);
  chart.update();
  const rows = view.groups.map((group) => {
    const row = document.createElement('tr');
    for (const value of [group.label, format(group.value), format(group.count)]) row.insertCell().textContent = value;
    return row;
  });
  detail.replaceChildren(...rows);
  status.textContent = 'Total: ' + format(view.total) + ' ' + unit;
}
control.addEventListener('change', () => show(Number(control.value)));
show(0);
ready();`,

  mermaid: `
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false, suppressErrorRendering: true, theme: 'neutral' });
async function draw() {
  const { svg } = await mermaid.render('diagrama-local', data.diagram);
  const fragment = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const drawing = fragment.documentElement;
  if (drawing.localName !== 'svg') throw new Error('Mermaid no generó un SVG válido.');
  for (const element of drawing.querySelectorAll('script, iframe, foreignObject, image')) element.remove();
  for (const element of [drawing, ...drawing.querySelectorAll('*')]) {
    for (const attribute of [...element.attributes]) {
      if (attribute.localName.startsWith('on') || (attribute.localName === 'href' && !attribute.value.startsWith('#'))) {
        element.removeAttributeNode(attribute);
      }
    }
  }
  drawing.setAttribute('role', 'img');
  drawing.setAttribute('aria-label', 'Diagrama generado con Mermaid');
  document.querySelector('#vista').replaceChildren(document.importNode(drawing, true));
  ready();
}
draw().catch(showError);`,

  deckgl: `
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
const view = document.querySelector('#vista');
const nameOf = (object) => String(object?.properties?.[data.key] ?? object?.id ?? 'Región sin nombre');
const layer = new GeoJsonLayer({
  id: 'regiones-aportadas',
  data: data.geojson,
  pickable: true,
  autoHighlight: true,
  filled: true,
  stroked: true,
  getFillColor: [45, 110, 181, 142],
  getLineColor: [22, 59, 115, 255],
  lineWidthMinPixels: 2,
  getPointRadius: 6,
  pointRadiusUnits: 'pixels',
  onClick: ({ object }) => { if (object) status.textContent = nameOf(object); },
});
const deck = new Deck({
  parent: view,
  controller: true,
  initialViewState: data.initial,
  onError: showError,
  onLoad: () => ready(),
  layers: [layer],
  getTooltip: ({ object }) => object ? { text: nameOf(object) } : null,
});
window.addEventListener('pagehide', () => deck.finalize(), { once: true });`,

  cytoscape: `
import cytoscape from 'cytoscape';
const graph = cytoscape({
  container: document.querySelector('#vista'),
  elements: data.elements,
  layout: { name: 'breadthfirst', directed: true, fit: true, padding: 30, animate: false },
  minZoom: 0.12,
  maxZoom: 7,
  style: [
    { selector: 'node', style: { label: 'data(label)', 'text-wrap': 'wrap', 'text-max-width': 115, 'text-valign': 'bottom', 'text-margin-y': 7, 'font-size': 15, color: '#172840', 'background-color': '#2458a6' } },
    { selector: 'edge', style: { width: 2, 'curve-style': 'bezier', 'line-color': '#8096b5', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#8096b5' } },
    { selector: 'node:selected', style: { 'background-color': '#207866' } },
  ],
});
graph.on('tap', 'node', (event) => {
  const node = event.target;
  status.textContent = node.data('label') + ' · ' + format(node.connectedEdges().length) + ' conexiones';
});
ready();`,
};

const commonScript = `
const data = JSON.parse(document.querySelector('#datos').textContent);
const status = document.querySelector('#estado');
const format = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 6 }).format;
function ready() {
  document.documentElement.dataset.status = 'ready';
  if (!status.textContent) status.textContent = 'Vista lista.';
}
function showError(error) {
  document.documentElement.dataset.status = 'error';
  status.textContent = 'No se pudo generar la vista: ' + (error?.message ?? error);
}`;

const bodies = {
  chartjs: '<label>Filtrar <select id="elegir" aria-controls="detalles"></select></label><div id="vista" class="canvas"><canvas role="img" aria-label="Gráfica de los datos" aria-describedby="estado"></canvas></div><table><thead><tr><th scope="col">Categoría</th><th scope="col">Valor</th><th scope="col">Registros</th></tr></thead><tbody id="detalles"></tbody></table>',
  mermaid: '<div id="vista" class="diagram"></div>',
  deckgl: '<div id="vista" class="canvas map" role="img" aria-label="Mapa de la geometría aportada"></div>',
  cytoscape: '<div id="vista" class="canvas" role="img" aria-label="Red de relaciones aportadas"></div>',
};

const labels = { chartjs: 'Chart.js', mermaid: 'Mermaid', deckgl: 'deck.gl', cytoscape: 'Cytoscape.js' };
const encodeJSON = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));

function chartPayload(raw) {
  const spec = normalizeSpec(raw);
  const field = spec.group ?? spec.filters[0];
  const views = [{ ...analyze(spec), label: 'Todos' }];
  if (field) {
    const options = new Set(spec.rows.map((row) => {
      const value = row[field];
      return value === null || value === undefined || value === '' ? '(Sin dato)' : String(value);
    }));
    for (const label of [...options].sort((a, b) => a.localeCompare(b, 'es-MX', { numeric: true }))) {
      views.push({ ...analyze(spec, { [field]: label }), label });
    }
  }
  return {
    chartType: spec.chartType,
    unit: spec.unit,
    filter: field,
    views: views.map(({ label, total, groups }) => ({ label, total, groups })),
  };
}

function relationships(raw) {
  if (!Array.isArray(raw?.edges) || raw.edges.length === 0) throw new Error('Se requieren relaciones en edges.');
  const edges = raw.edges.map((edge) => [edge?.from ?? edge?.source, edge?.to ?? edge?.target]);
  if (edges.some((edge) => edge.some((name) => typeof name !== 'string' || !name.trim()))) {
    throw new Error('Cada relación requiere dos nombres en from/to o source/target.');
  }
  const nodes = [...new Set(edges.flat())].map((label, index) => ({ id: 'node' + index, label }));
  const names = new Map(nodes.map(({ id, label }) => [label, id]));
  return { nodes, edges: edges.map(([from, to], index) => ({ id: 'edge' + index, source: names.get(from), target: names.get(to) })) };
}

function toMermaid(raw) {
  const { nodes, edges } = relationships(raw);
  const quote = (value) => value.replace(/[&#"<>`]/g, (character) => '#' + character.charCodeAt(0) + ';').replace(/[\r\n]/g, ' ');
  return ['flowchart TD', ...nodes.map(({ id, label }) => id + '["' + quote(label) + '"]'), ...edges.map(({ source, target }) => source + ' --> ' + target)].join('\n');
}

function mapPayload(raw) {
  const geojson = raw?.locations ?? raw;
  if (geojson?.type !== 'FeatureCollection' || !geojson.features?.length || !Array.isArray(geojson.features)) {
    throw new Error('deck.gl necesita una colección GeoJSON en locations o como raíz del archivo.');
  }
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  function visit(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && value.every((item) => typeof item === 'number')) {
      const [lon, lat] = value;
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) {
        throw new Error('El GeoJSON contiene coordenadas fuera de la longitud o latitud permitidas.');
      }
      minLon = Math.min(minLon, lon);
      minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon);
      maxLat = Math.max(maxLat, lat);
    } else for (const item of value) visit(item);
  }
  const includeGeometry = (geometry) => {
    if (!geometry) return;
    if (geometry.type === 'GeometryCollection') geometry.geometries?.forEach(includeGeometry);
    else visit(geometry.coordinates);
  };
  geojson.features.forEach((feature) => includeGeometry(feature?.geometry));
  if (!Number.isFinite(minLon)) throw new Error('El GeoJSON no tiene coordenadas utilizables.');
  const span = Math.max(maxLon - minLon, maxLat - minLat, 0.002);
  const initial = {
    longitude: (minLon + maxLon) / 2,
    latitude: Math.max(-85, Math.min(85, (minLat + maxLat) / 2)),
    zoom: Math.max(0, Math.min(16, Math.log2(360 / span) - 1.5)),
    pitch: 0,
    bearing: 0,
  };
  return { geojson, initial, key: raw.geoKey ?? 'name' };
}

async function textFile(filename) {
  return (await readFile(filename, 'utf8')).replace(/^\uFEFF/, '');
}

async function main() {
  const { values } = parseArgs({ options: {
    mode: { type: 'string' }, input: { type: 'string' }, diagram: { type: 'string' },
    runtime: { type: 'string' }, out: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('node vista-especializada.mjs --mode chartjs|mermaid|deckgl|cytoscape --input datos.json --runtime directorio-npm --out vista.html [--diagram diagrama.mmd]');
    return;
  }
  const { mode, input, diagram, runtime, out } = values;
  if (!Object.hasOwn(clientScripts, mode) || !runtime || !out || (!input && !(mode === 'mermaid' && diagram))) {
    throw new Error('Indica --mode chartjs|mermaid|deckgl|cytoscape, --runtime, --out y --input (o --diagram para Mermaid).');
  }
  if (diagram && mode !== 'mermaid') throw new Error('--diagram se usa con Mermaid.');
  if (!/\.html$/i.test(out)) throw new Error('--out debe ser un archivo HTML.');
  const target = resolve(out);
  for (const file of [input, diagram].filter(Boolean)) {
    if (resolve(file) === target || await realpath(file) === await realpath(target).catch(() => target)) {
      throw new Error('La salida debe ser distinta de los archivos de entrada.');
    }
  }
  const raw = input ? JSON.parse(await textFile(input)) : undefined;
  let payload;
  if (mode === 'chartjs') payload = chartPayload(raw);
  if (mode === 'mermaid') {
    const definition = diagram ? await textFile(diagram) : toMermaid(raw);
    if (!definition.trim()) throw new Error('La definición Mermaid está vacía.');
    payload = { diagram: definition };
  }
  if (mode === 'deckgl') payload = mapPayload(raw);
  if (mode === 'cytoscape') {
    const { nodes, edges } = relationships(raw);
    payload = { elements: [...nodes.map((data) => ({ group: 'nodes', data })), ...edges.map((data) => ({ group: 'edges', data }))] };
  }
  const runtimePath = resolve(runtime);
  await access(join(runtimePath, 'node_modules'));
  const require = createRequire(join(runtimePath, 'package.json'));
  const { build } = require('esbuild');
  const { outputFiles } = await build({
    stdin: { contents: commonScript + '\n' + clientScripts[mode], loader: 'js', resolveDir: runtimePath },
    bundle: true, platform: 'browser', target: 'es2022', format: 'iife', write: false,
    minify: true, legalComments: 'eof', logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' },
  });
  if (outputFiles.length !== 1) throw new Error('La vista requiere recursos externos al HTML.');
  const bundle = outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const name = labels[mode];
  const title = escapeMarkup(raw?.title ?? 'Vista de ' + name);
  const source = escapeMarkup(raw?.source ?? (diagram ? 'Definición aportada' : 'Datos aportados'));
  const html = `<!doctype html><html lang="es-MX" data-engine="${name}" data-status="loading"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';img-src data: blob:;connect-src 'none';object-src 'none';base-uri 'none';form-action 'none'"><title>${title}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f7f9fc;color:#172840;font:16px/1.5 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:clamp(18px,4vw,42px)}h1{margin:0 0 4px;font-size:clamp(1.5rem,4vw,2.25rem);line-height:1.2}header p{margin:6px 0 20px;color:#49617a}.canvas,.diagram{background:white;border:1px solid #c9d8ea;border-radius:10px;position:relative;overflow:hidden}.canvas{height:clamp(320px,55vh,620px)}.map{background:#edf6fb}.diagram{padding:1rem}.diagram svg{display:block;max-width:100%;height:auto;margin:0 auto}label{display:block;margin:0 0 10px}select{margin-left:8px;padding:5px}table{border-collapse:collapse;width:100%;margin:14px 0}th,td{padding:6px 10px;border-bottom:1px solid #dae2ef;text-align:left}td:nth-child(n+2){font-variant-numeric:tabular-nums}.responsible{color:#49617a;font-size:0.9rem}#estado{min-height:1.5em}</style></head><body><main><header><h1>${title}</h1><p>${name}</p></header>${bodies[mode]}<p id="estado" role="status" aria-live="polite"></p><p class="responsible">Fuente: ${source}</p></main><script id="datos" type="application/json">${encodeJSON(payload)}</script><script>${bundle}</script></body></html>`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  console.log(JSON.stringify({ mode, path: target, local: true }));
}

main().catch((error) => {
  console.error(error?.errors?.map((item) => item.text).join('\n') || error.message);
  process.exitCode = 1;
});
