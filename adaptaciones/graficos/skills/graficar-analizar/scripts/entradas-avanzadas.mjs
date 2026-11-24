#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { normalizeSpec } from './model.mjs';

const maxRows = 100_000;
const maxBytes = 64 * 1024 * 1024;
const sqlOptions = {
  aggregate: 'avg count sum min max median stddev stddev_samp stddev_pop variance var_samp var_pop quantile_cont quantile_disc approx_count_distinct',
  scalar: 'abs ceil ceiling floor round trunc sqrt pow power ln log log10 exp sign coalesce nullif greatest least if ifnull cast try_cast lower upper trim length regexp_matches starts_with ends_with concat substring substr date_part date_trunc datediff date_diff year month day lag lead row_number rank dense_rank',
  types: 'decimal numeric varchar char timestamp time',
  syntax: 'select distinct as from join on and or not where having qualify in exists filter over values limit group order partition between all any',
};
const permittedCalls = new Set(Object.values(sqlOptions).join(' ').split(' '));

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function localPath(value) {
  check(typeof value === 'string' && value && !value.includes('://') && !/^[/\\]{2}/.test(value), 'Indica una ruta local.');
  const absolute = resolve(value);
  check(!/^[/\\]{2}/.test(absolute), 'Indica una ruta local.');
  return absolute;
}

async function file(value, limit = maxBytes) {
  const path = localPath(value);
  const info = await stat(path);
  check(info.isFile() && info.size <= limit, 'Archivo no regular o demasiado grande: ' + basename(path));
  return readFile(path);
}

function moduleAt(directory) {
  if (!directory) return createRequire(import.meta.url);
  const base = localPath(directory);
  return createRequire(join(basename(base) === 'node_modules' ? dirname(base) : base, 'resolucion-local.cjs'));
}

function analyticalSql(source) {
  const sql = source.trim().replace(/;$/, '').trim();
  const names = sql
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"((?:""|[^"])*)"/g, (_, identifier) => /^[a-z_][a-z_0-9]*$/i.test(identifier) ? identifier : 'columna');
  check(/^select\s/i.test(names) && !/;|--|\/\*|\*\/|\$|['"]['"]\s*\(/.test(names),
    'Usa una sola consulta SELECT, sin comentarios ni sentencias adicionales.');
  check(/\bfrom\s+datos\b/i.test(names), 'La consulta debe analizar la tabla local datos.');
  for (const match of names.matchAll(/\b(?:from|join)\s*(datos\b|\(|[^\s(),]+)/gi)) {
    check(['datos', '('].includes(match[1].toLowerCase()), 'Las fuentes SQL deben proceder de datos.');
  }
  for (const match of names.matchAll(/\b([a-z_][a-z_0-9]*)\s*\(/gi)) {
    check(permittedCalls.has(match[1].toLowerCase()), 'Función SQL fuera del conjunto analítico: ' + match[1]);
  }
  return sql;
}

function plain(value, column, metric, type) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    check(Number.isFinite(value), 'Número fuera de intervalo en «' + column + '».');
    if (/^(Date|Timestamp)/.test(String(type))) return new Date(value).toISOString();
    return value;
  }
  if (typeof value === 'bigint') {
    if (!metric) return value.toString();
    const safe = Number(value);
    check(Number.isSafeInteger(safe), 'El valor entero de «' + column + '» excede la precisión exportable.');
    return safe;
  }
  if (/^Decimal/.test(String(type))) {
    const raw = String(value);
    check(/^-?\d+$/.test(raw), 'El decimal de «' + column + '» requiere una conversión SQL explícita.');
    const digits = raw.replace(/^-/, '');
    const scale = type.scale ?? 0;
    check(scale >= 0 && scale <= 38, 'Escala decimal fuera de intervalo.');
    const padded = digits.padStart(scale + 1, '0');
    const exact = (raw.startsWith('-') ? '-' : '') + (scale ? padded.slice(0, -scale) + '.' + padded.slice(-scale) : digits);
    if (!metric) return exact;
    check(digits.replace(/^0+/, '').length <= 15, 'Convierte «' + column + '» a un número de hasta 15 cifras significativas.');
    return Number(exact);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  throw new Error('«' + column + '» contiene un valor complejo. Selecciona columnas planas.');
}

function excelValue(value) {
  if (value instanceof Date) return value;
  if (value?.formula !== undefined || value?.sharedFormula !== undefined) return excelValue(value.result);
  if (Array.isArray(value?.richText)) return value.richText.map((part) => part.text ?? '').join('');
  if (typeof value?.text === 'string') return value.text;
  if (value?.error) return null;
  return value ?? null;
}

async function excelRows(require, contents, name, metric) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(contents);
  const sheet = name ? workbook.getWorksheet(name) : workbook.worksheets[0];
  check(sheet, 'No se encontró la hoja solicitada.');
  const header = sheet.getRow(1);
  const count = header.cellCount;
  const columns = Array.from({length: count}, (_, field) => String(excelValue(header.getCell(field + 1).value) ?? '').trim());
  check(columns.length && columns.every(Boolean) && new Set(columns).size === columns.length,
    'Usa encabezados únicos y completos en la primera fila de Excel.');
  const rows = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    check(rows.length < maxRows && row.cellCount <= count, 'Hoja demasiado grande o con celdas sin encabezado.');
    rows.push(Object.fromEntries(columns.map((column, field) => [
      column, plain(excelValue(row.getCell(field + 1).value), column, metric === column),
    ])));
  });
  return { rows, hoja: sheet.name };
}

export function parseSeparated(contents, configured) {
  const text = contents.toString('utf8').replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const separator = configured ?? (first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',');
  check([',', ';', '\t'].includes(separator), 'Separador CSV inválido.');
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closed = false;
  function pushField() {
    row.push(field);
    field = '';
    closed = false;
  }
  function pushRow() {
    pushField();
    if (row.some(Boolean)) records.push(row);
    row = [];
  }
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (character === separator) {
      pushField();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      pushRow();
    } else if (character === '"' && !field && !closed) {
      quoted = true;
    } else {
      check(!closed && character !== '"', 'Comillas mal formadas en el CSV.');
      field += character;
    }
  }
  check(!quoted, 'El CSV termina dentro de un valor entre comillas.');
  if (field || closed || row.length) pushRow();
  const columns = records.shift()?.map((value) => value.trim()) ?? [];
  check(columns.length && columns.every(Boolean) && new Set(columns).size === columns.length, 'El CSV requiere encabezados únicos.');
  return records.map((values) => {
    check(values.length <= columns.length, 'Hay valores sin encabezado en el CSV.');
    return Object.fromEntries(columns.map((name, index) => [name, values[index] || null]));
  });
}

async function parquetRows(require, contents) {
  const { parquetMetadata, parquetReadObjects } = await import(pathToFileURL(require.resolve('hyparquet')).href);
  const file = contents.buffer.slice(contents.byteOffset, contents.byteOffset + contents.byteLength);
  const metadata = parquetMetadata(file);
  check(metadata.num_rows <= 1_000_000n, 'El Parquet supera un millón de filas. Usa una selección más pequeña.');
  let compressors;
  try {
    const path = require.resolve('hyparquet-compressors');
    compressors = (await import(pathToFileURL(path).href)).compressors;
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  return parquetReadObjects({ file, metadata, compressors, utf8: false, geoparquet: false });
}

function columnArrays(rows, decimal) {
  check(rows.length && rows.length <= 1_000_000, 'La tabla debe tener de 1 a un millón de filas.');
  const columns = [...new Set(rows.flatMap(Object.keys))];
  return Object.fromEntries(columns.map((column) => {
    const values = rows.map((row) => row[column] ?? null);
    const present = values.filter((value) => value !== null);
    const safe = (value) => {
      const number = typeof value === 'string' && decimal === ',' ? value.trim().replace(',', '.') : value;
      const numeric = typeof number === 'number' || (typeof number === 'string' &&
        /^[+-]?(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(number.trim()));
      return numeric && Number.isFinite(Number(number)) && (typeof number !== 'string' ||
        number.split(/e/i)[0].replace(/[^\d]/g, '').replace(/^0+/, '').length <= 15);
    };
    if (present.length && present.every(safe)) {
      return [column, values.map((value) => value === null ? null : Number(typeof value === 'string' ? value.trim().replace(decimal ?? '.', '.') : value))];
    }
    if (present.length && present.every((value) => typeof value === 'bigint')) return [column, values];
    if (present.length && present.every((value) => typeof value === 'boolean')) return [column, values];
    check(present.every((value) => value instanceof Date || ['string', 'number', 'boolean', 'bigint'].includes(typeof value)),
      'La columna «' + column + '» contiene un valor complejo. Usa una tabla plana.');
    return [column, values.map((value) => value === null ? null : value instanceof Date ? value.toISOString() : String(value))];
  }));
}

async function sqlRows(require, rows, query, metric, decimal) {
  const duck = require('@duckdb/duckdb-wasm/blocking');
  const arrow = require('apache-arrow');
  let binary;
  for (const filename of ['duckdb-base.wasm', 'duckdb-mvp.wasm']) {
    try {
      binary = require.resolve('@duckdb/duckdb-wasm/dist/' + filename);
      break;
    } catch {}
  }
  check(binary, 'No se encontró el binario WASM local de DuckDB.');
  const module = { mainModule: binary };
  const database = await duck.createDuckDB({ base: module, mvp: module }, new duck.VoidLogger(), duck.NODE_RUNTIME);
  await database.instantiate();
  database.open({ path: ':memory:' });
  const connection = database.connect();
  try {
    connection.query("SET autoinstall_known_extensions = false; SET autoload_known_extensions = false; SET temp_directory = ''; SET memory_limit = '512 MB'; SET enable_external_access = false; SET lock_configuration = true");
    connection.insertArrowTable(arrow.tableFromArrays(columnArrays(rows, decimal)), {name: 'datos', create: true});
    const table = connection.query('SELECT * FROM (' + query + ') AS resultado LIMIT ' + (maxRows + 1));
    check(table.numRows <= maxRows, 'La consulta entrega más de ' + maxRows + ' filas. Resume o filtra antes de exportar.');
    const columns = table.schema.fields;
    check(new Set(columns.map(({name: field}) => field)).size === columns.length, 'Usa alias distintos en las columnas de la consulta.');
    const vectors = columns.map((_, index) => table.getChildAt(index));
    return Array.from({length: table.numRows}, (_, row) => Object.fromEntries(columns.map(({name: field, type}, column) => [
      field, plain(vectors[column].get(row), field, metric === field, type),
    ])));
  } finally {
    connection.close();
  }
}

async function main(args) {
  const { values } = parseArgs({ args, options: {
    runtime: {type: 'string'}, input: {type: 'string'}, config: {type: 'string'}, out: {type: 'string'},
    sql: {type: 'string'}, sheet: {type: 'string'}, help: {type: 'boolean'},
  } });
  if (values.help) {
    console.log('Uso: node entradas-avanzadas.mjs --runtime carpeta-local --input datos.csv|.tsv|.parquet|.xlsx --config campos.json --out entrada.json [--sql "SELECT … FROM datos"] [--sheet nombre]');
    return;
  }
  check(values.input && values.config && values.out, 'Indica --input, --config y --out. Consulta --help.');
  const extension = extname(localPath(values.input)).toLowerCase();
  const output = localPath(values.out);
  check(['.csv', '.tsv', '.parquet', '.xlsx'].includes(extension), 'Usa CSV, TSV, Parquet o XLSX.');
  check(extname(output).toLowerCase() === '.json', 'La salida debe ser un JSON nuevo.');
  check((!values.sql || extension !== '.xlsx') && (!values.sheet || extension === '.xlsx'), 'Usa --sql con CSV, TSV o Parquet y --sheet con XLSX.');
  const config = JSON.parse((await file(values.config, 4 * 1024 * 1024)).toString('utf8').replace(/^\uFEFF/, ''));
  const input = await file(values.input);
  const require = moduleAt(values.runtime);
  const query = extension !== '.xlsx' ? analyticalSql(values.sql ?? 'SELECT * FROM datos') : null;
  const result = extension === '.xlsx'
    ? await excelRows(require, input, values.sheet, config.y)
    : {rows: await sqlRows(require,
      extension === '.parquet' ? await parquetRows(require, input) : parseSeparated(input, extension === '.tsv' ? '\t' : config.delimiter),
      query, config.y, config.decimal)};
  const analyzed = normalizeSpec({...config, rows: result.rows});
  const record = {
    ...config,
    rows: analyzed.rows,
    procedencia: { fuente: analyzed.source, archivo: basename(values.input), consulta: query, hoja: result.hoja ?? null },
  };
  await writeFile(output, JSON.stringify(record, null, 2) + '\n', {encoding: 'utf8', flag: 'wx'});
  console.log(JSON.stringify({file: output, rows: analyzed.rows.length, engine: query ? 'DuckDB-Wasm' : 'ExcelJS'}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error('Importación pendiente: ' + error.message);
    process.exitCode = 2;
  }
}
