export function finiteMetric(value, decimal = '.') {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = decimal === ',' ? value.trim().replace(',', '.') : value.trim();
  if (!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:e[+-]?[0-9]+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function labelOf(value) {
  if (value === null || value === undefined || value === '') return '(Sin dato)';
  return String(value);
}

export function numericSum(values) {
  let sum = 0;
  let correction = 0;
  for (const value of values) {
    const adjusted = value - correction;
    const next = sum + adjusted;
    correction = (next - sum) - adjusted;
    sum = next;
  }
  if (!Number.isFinite(sum)) throw new Error('El total supera el rango numérico representable.');
  return sum;
}

export function formatNumber(value) {
  return value === null ? 'Sin datos' : new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 6,
  }).format(value);
}

export function analyze(spec, selections = {}, scenarioPercent = 0) {
  const categories = new Map();
  const included = [];
  const values = [];
  const percentage = finiteMetric(scenarioPercent) ?? 0;
  const factor = 1 + percentage / 100;
  const fields = Object.entries(selections).filter(([, selected]) => selected !== '');
  let matched = 0;
  let minimum = null;
  let maximum = null;
  for (const [index, row] of spec.rows.entries()) {
    if (fields.some(([key, selected]) => labelOf(row[key]) !== selected)) continue;
    matched += 1;
    const number = finiteMetric(row[spec.y], spec.decimal);
    if (number === null) continue;
    included.push(index);
    values.push(number);
    minimum = minimum === null ? number : Math.min(minimum, number);
    maximum = maximum === null ? number : Math.max(maximum, number);
    const category = labelOf(row[spec.x]);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(number);
  }
  const groups = [...categories].map(([label, group]) => {
    const value = numericSum(group);
    return { label, value, scenario: value * factor, count: group.length };
  });
  if (spec.chartType === 'line') groups.sort((a, b) => a.label.localeCompare(b.label, 'es-MX', { numeric: true }));
  const total = numericSum(values);
  const scenario = total * factor;
  if (!Number.isFinite(scenario) || groups.some((group) => !Number.isFinite(group.scenario))) {
    throw new Error('El escenario supera el rango numérico representable.');
  }
  return {
    groups,
    total,
    scenario,
    percentage,
    included,
    matched,
    omitted: matched - included.length,
    average: included.length ? total / included.length : null,
    minimum,
    maximum,
  };
}

const textFields = ['title', 'source', 'unit', 'x', 'y'];
const scalar = (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value);

export function normalizeSpec(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Se requiere una configuración JSON.');
  for (const field of textFields) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      throw new Error('Falta el texto de «' + field + '».');
    }
  }
  if (!Array.isArray(input.rows) || !input.rows.length) throw new Error('La tabla debe incluir registros.');
  if (input.x === input.y) throw new Error('La dimensión y la variable deben ser columnas distintas.');
  if (input.filters !== undefined && (!Array.isArray(input.filters) || input.filters.some((key) => typeof key !== 'string' || !key))) {
    throw new Error('filters debe ser una lista de nombres de columnas.');
  }
  const columns = new Set();
  for (const row of input.rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Cada registro debe ser un objeto plano.');
    for (const [key, value] of Object.entries(row)) {
      if (!scalar(value) || (typeof value === 'number' && !Number.isFinite(value))) {
        throw new Error('El campo «' + key + '» contiene un valor que no es una celda simple.');
      }
      columns.add(key);
    }
  }
  for (const key of [input.x, input.y, input.group, input.region, input.latitude, input.longitude, ...(input.filters ?? [])].filter(Boolean)) {
    if (!columns.has(key)) throw new Error('No existe la columna «' + key + '».');
  }
  const chartType = input.chartType ?? 'bar';
  if (!['bar', 'line'].includes(chartType)) throw new Error('chartType debe ser bar o line.');
  if (input.decimal !== undefined && !['.', ','].includes(input.decimal)) throw new Error('decimal debe ser punto o coma.');
  if (input.locations !== undefined && (input.locations?.type !== 'FeatureCollection' || !Array.isArray(input.locations.features))) {
    throw new Error('locations debe ser una colección GeoJSON FeatureCollection.');
  }
  if ((input.latitude && !input.longitude) || (input.longitude && !input.latitude)) {
    throw new Error('Un mapa de puntos requiere las columnas latitude y longitude.');
  }
  const edges = Array.isArray(input.edges) ? input.edges.map((edge) => ({ from: edge?.from ?? edge?.source, to: edge?.to ?? edge?.target })) : [];
  if (input.edges !== undefined && (!Array.isArray(input.edges) || edges.some((edge) =>
    typeof edge.from !== 'string' || !edge.from.trim() || typeof edge.to !== 'string' || !edge.to.trim()
  ))) throw new Error('edges debe incluir conexiones de texto from y to.');
  const spec = {
    ...input,
    chartType,
    edges,
    columns: [...columns],
    filters: [...new Set([input.group, ...(input.filters ?? [])].filter(Boolean))],
  };
  const result = analyze(spec);
  if (!result.included.length) throw new Error('La variable «' + input.y + '» no tiene valores numéricos válidos.');
  return spec;
}

export function escapeMarkup(value) {
  const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (character) => replacements[character]);
}

export function chartSvg(spec, result, { width = 960, height = 460, interactive = false, limit = 24 } = {}) {
  const escape = escapeMarkup;
  const displayed = result.groups.slice(0, limit);
  const body = [];
  const x0 = 93;
  const right = width - 34;
  const top = 77;
  const bottom = height - 104;
  let low = 0;
  let high = 0;
  for (const row of displayed) {
    low = Math.min(low, row.value, result.percentage ? row.scenario : 0);
    high = Math.max(high, row.value, result.percentage ? row.scenario : 0);
  }
  const magnitude = Math.max(1, Math.abs(high), Math.abs(low));
  const scaledLow = low / magnitude;
  const range = high / magnitude - scaledLow || 1;
  const vertical = (value) => bottom - ((value / magnitude - scaledLow) / range) * (bottom - top);
  const baseline = vertical(0);
  const slot = (right - x0) / Math.max(1, displayed.length);
  body.push('<rect width="100%" height="100%" fill="#ffffff"/>');
  body.push('<text x="34" y="35" font-size="23" font-weight="700">' + escape(spec.title) + '</text>');
  body.push('<text x="34" y="60" font-size="14" fill="#475569">' + escape(spec.unit) + ' · suma por ' + escape(spec.x) + '</text>');
  for (let index = 0; index <= 4; index += 1) {
    const value = (scaledLow + index / 4 * range) * magnitude;
    const y = vertical(value);
    body.push('<line x1="' + x0 + '" x2="' + right + '" y1="' + y + '" y2="' + y + '" stroke="#e2e8f0"/>');
    body.push('<text x="' + (x0 - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="#475569">' + escape(formatNumber(value)) + '</text>');
  }
  body.push('<line x1="' + x0 + '" x2="' + right + '" y1="' + baseline + '" y2="' + baseline + '" stroke="#64748b"/>');
  if (spec.chartType === 'line' && displayed.length > 1) {
    const series = (field) => displayed.map((row, index) => [x0 + (index + 0.5) * slot, vertical(row[field])].join(',')).join(' ');
    body.push('<polyline points="' + series('value') + '" fill="none" stroke="#1755a3" stroke-width="3"/>');
    if (result.percentage) body.push('<polyline points="' + series('scenario') + '" fill="none" stroke="#147a69" stroke-width="2" stroke-dasharray="6 4"/>');
  }
  displayed.forEach((row, index) => {
    const center = x0 + (index + 0.5) * slot;
    const barWidth = Math.max(5, Math.min(result.percentage ? slot * 0.31 : slot * 0.61, 72));
    const caption = row.label + ': ' + formatNumber(row.value) + ' ' + spec.unit;
    body.push('<g' + (interactive ? ' class="pick" role="button" tabindex="0" data-category="' + escape(row.label) + '" aria-label="' + escape(caption) + '"' : '') + '><title>' + escape(caption) + '</title>');
    for (const [field, color, offset] of result.percentage ? [['value', '#1755a3', -barWidth / 2], ['scenario', '#147a69', barWidth / 2]] : [['value', '#1755a3', 0]]) {
      const y = vertical(row[field]);
      if (spec.chartType === 'line') {
        body.push('<circle cx="' + center + '" cy="' + y + '" r="5" fill="' + color + '"/>');
      } else {
        body.push('<rect x="' + (center - barWidth / 2 + offset) + '" y="' + Math.min(baseline, y) + '" width="' + barWidth + '" height="' + Math.max(2, Math.abs(baseline - y)) + '" fill="' + color + '"/>');
      }
    }
    const label = row.label.length > 22 ? row.label.slice(0, 20) + '…' : row.label;
    body.push('<text transform="translate(' + center + ' ' + (bottom + 14) + ') rotate(-28)" text-anchor="end" font-size="12">' + escape(label) + '</text></g>');
  });
  if (!displayed.length) body.push('<text x="' + (width / 2) + '" y="' + (height / 2) + '" text-anchor="middle">Sin observaciones para los filtros aplicados.</text>');
  if (result.percentage) body.push('<text x="34" y="' + (height - 48) + '" font-size="12">Azul: observado · Verde: escenario hipotético (' + escape(formatNumber(result.percentage)) + '%)</text>');
  body.push('<text x="34" y="' + (height - 27) + '" font-size="12" fill="#475569">Fuente: ' + escape(spec.source.substring(0, 135)) + '</text>');
  if (displayed.length < result.groups.length) body.push('<text x="34" y="' + (height - 9) + '" font-size="11" fill="#475569">Se muestran ' + displayed.length + ' de ' + result.groups.length + ' categorías. El total incluye todas.</text>');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" role="img" aria-label="' + escape(spec.title + ' · ' + spec.unit) + '" font-family="system-ui, sans-serif" fill="#0f172a">' + body.join('') + '</svg>';
}
