#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { analyze, chartSvg, normalizeSpec } from './model.mjs';
import { csvText, dashboardHtml, diagramSvg } from './dashboard.mjs';
import { pdfReport, workbook } from './office.mjs';

const require = createRequire(import.meta.url);
const portableFormats = ['html', 'xlsx', 'pdf', 'svg', 'json', 'csv'];
const availableFormats = [...portableFormats, 'png'];
const assetUrl = (path) => new URL('../assets/' + path, import.meta.url);

function csvRows(text, explicitDelimiter) {
  const raw = text.replace(/^\ufeff/, '');
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = explicitDelimiter === '\\t' ? '\t' : explicitDelimiter ?? (firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',');
  if (![',', ';', '\t'].includes(delimiter)) throw new Error('El separador debe ser coma, punto y coma o tabulador.');
  const records = [];
  let row = [];
  let value = '';
  let quoted = false;
  let closed = false;
  function endValue() {
    row.push(value);
    value = '';
    closed = false;
  }
  function endRow() {
    endValue();
    if (row.some((field) => field !== '')) records.push(row);
    row = [];
  }
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (quoted) {
      if (character !== '"') value += character;
      else if (raw[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (character === delimiter) {
      endValue();
    } else if (character === '\r' || character === '\n') {
      endRow();
      if (character === '\r' && raw[index + 1] === '\n') index += 1;
    } else if (character === '"' && value === '' && !closed) {
      quoted = true;
    } else {
      if (closed || character === '"') throw new Error('Hay comillas mal formadas en el CSV.');
      value += character;
    }
  }
  if (quoted) throw new Error('Hay una celda CSV con comillas incompletas.');
  if (row.length || value !== '' || closed) endRow();
  return tableToRows(records);
}

function tableToRows(records) {
  const columns = records.shift()?.map((key) => String(key ?? '').trim()) ?? [];
  if (!columns.length || columns.some((key) => !key) || new Set(columns).size !== columns.length) {
    throw new Error('La primera fila debe contener nombres de columnas únicos y completos.');
  }
  return records.map((values, index) => {
    if (values.length > columns.length) throw new Error('La fila ' + (index + 2) + ' supera el número de columnas.');
    return Object.fromEntries(columns.map((key, field) => [key, values[field] ?? null]));
  });
}

function optional(name, suppliedPath) {
  try {
    return require(suppliedPath ? resolve(suppliedPath) : name);
  } catch (cause) {
    throw new Error('No se pudo cargar el módulo local ' + name + '. Si está instalado fuera de este complemento, indica su archivo con la opción correspondiente.', { cause });
  }
}

async function xlsxRows(path, options) {
  const Excel = optional('exceljs', options.exceljs);
  const book = new Excel.Workbook();
  await book.xlsx.readFile(path);
  const sheet = options.sheet ? book.getWorksheet(options.sheet) : book.worksheets[0];
  if (!sheet) throw new Error('La hoja XLSX solicitada no existe.');
  const records = [];
  sheet.eachRow((row) => records.push(row.values.slice(1).map((value) => {
    if (value instanceof Date) return value.toISOString();
    if (value?.formula || value?.sharedFormula) return value.result ?? null;
    if (value?.text !== undefined) return value.text;
    if (value?.richText) return value.richText.map((segment) => segment.text).join('');
    if (value?.error) return null;
    return value ?? null;
  })));
  return tableToRows(records);
}

async function inputSpec(options) {
  const config = options.config ? JSON.parse((await readFile(options.config, 'utf8')).replace(/^\ufeff/, '')) : {};
  const path = options.input;
  const extension = extname(path).toLowerCase();
  let input;
  if (extension === '.json') {
    const decoded = JSON.parse((await readFile(path, 'utf8')).replace(/^\ufeff/, ''));
    input = Array.isArray(decoded) ? { ...config, rows: decoded } : { ...config, ...decoded };
  } else if (['.csv', '.tsv'].includes(extension)) {
    input = { ...config, rows: csvRows(await readFile(path, 'utf8'), extension === '.tsv' ? '\t' : config.delimiter) };
  } else if (extension === '.xlsx') {
    input = { ...config, rows: await xlsxRows(path, options) };
  } else {
    throw new Error('Usa datos JSON, CSV, TSV o XLSX.');
  }
  if (options.geojson) input.locations = JSON.parse((await readFile(options.geojson, 'utf8')).replace(/^\ufeff/, ''));
  return normalizeSpec(input);
}

async function advancedBundle(spec, options) {
  const engines = (options.engines ?? spec.engines?.join(',') ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  const permitted = new Map([
    ['plotly', 'plotly.cjs'],
    ['three', 'three-surface.cjs'],
  ]);
  const scripts = [];
  for (const engine of new Set(engines)) {
    if (!permitted.has(engine)) throw new Error('Motor HTML desconocido: ' + engine);
    if (engine === 'three' && spec.surface !== 'sine') throw new Error('La opción three requiere surface: "sine" para esta plantilla.');
    const path = assetUrl('vendor/' + permitted.get(engine));
    try {
      const script = await readFile(path, 'utf8');
      scripts.push(script.replace(/<\/script/gi, '<\\/script'));
    } catch (cause) {
      throw new Error('El motor ' + engine + ' no está incluido en esta copia: ' + fileURLToPath(path), { cause });
    }
  }
  return scripts.join('\n;\n');
}

export async function generate(options) {
  const spec = await inputSpec(options);
  const result = analyze(spec);
  const formats = new Set((options.formats ?? portableFormats.join(',')).split(',').map((name) => name.trim()).filter(Boolean));
  if (!formats.size || [...formats].some((name) => !availableFormats.includes(name))) throw new Error('Formatos válidos: ' + availableFormats.join(', '));
  const output = resolve(options.out);
  const files = new Map();
  const figure = chartSvg(spec, result);
  if (formats.has('html')) files.set('panel.html', dashboardHtml(spec, await readFile(assetUrl('dashboard.css'), 'utf8'), await advancedBundle(spec, options)));
  if (formats.has('xlsx')) files.set('datos.xlsx', workbook(spec, result));
  if (formats.has('pdf')) files.set('resumen.pdf', pdfReport(spec, result));
  if (formats.has('svg')) {
    files.set('grafica.svg', figure);
    if (spec.edges.length) files.set('diagrama.svg', diagramSvg(spec.edges));
  }
  if (formats.has('csv')) files.set('datos.csv', csvText(spec.columns, spec.rows));
  if (formats.has('png')) {
    const { createCanvas, loadImage } = optional('@napi-rs/canvas', options.raster);
    const wideFigure = figure.replace('width="960" height="460"', 'width="1920" height="920"');
    const image = await loadImage(Buffer.from(wideFigure));
    const raster = createCanvas(1920, 920);
    raster.getContext('2d').drawImage(image, 0, 0, 1920, 920);
    files.set('grafica.png', raster.toBuffer('image/png'));
  }
  if (formats.has('json')) {
    const duplicateCount = spec.rows.length - new Set(spec.rows.map((row) => JSON.stringify(spec.columns.map((key) => row[key] ?? null)))).size;
    const analysis = {
      title: spec.title, source: spec.source, unit: spec.unit, dimension: spec.x, variable: spec.y,
      method: 'Suma por categoría; el promedio usa los registros con valor numérico válido.',
      metrics: { total: result.total, mean: result.average, min: result.minimum, max: result.maximum },
      rows: { original: spec.rows.length, included: result.included.length, excluded: result.omitted, repeated: duplicateCount },
      groups: result.groups.map(({ label, value, count }) => ({ label, value, count })),
    };
    const { title, source, unit, x, y, chartType } = spec;
    const scene = { title, source, unit, x, y, chartType, rows: result.groups.map(({ label, value }) => Object.fromEntries([[x, label], [y, value]])) };
    files.set('analisis.json', JSON.stringify(analysis, null, 2) + '\n');
    files.set('escena.json', JSON.stringify(scene, null, 2) + '\n');
  }
  await mkdir(output, { recursive: true });
  for (const [name, contents] of files) await writeFile(join(output, name), contents);
  return { output, files: [...files.keys()], total: result.total, valid: result.included.length, excluded: result.omitted };
}

try {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' }, out: { type: 'string' }, config: { type: 'string' }, geojson: { type: 'string' },
      formats: { type: 'string' }, engines: { type: 'string' }, sheet: { type: 'string' }, exceljs: { type: 'string' },
      raster: { type: 'string' }, help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    process.stdout.write('node graficos.mjs --input <JSON|CSV|TSV|XLSX> --out <carpeta> [--config <JSON>] [--formats html,xlsx,pdf,svg,json,csv,png] [--engines plotly,three]\n');
  } else {
    if (!values.input || !values.out) throw new Error('Indica --input y --out. Usa --help para consultar opciones.');
    const report = await generate(values);
    process.stdout.write(JSON.stringify(report) + '\n');
  }
} catch (error) {
  process.stderr.write('Gráficos: ' + error.message + '\n');
  process.exitCode = 1;
}
