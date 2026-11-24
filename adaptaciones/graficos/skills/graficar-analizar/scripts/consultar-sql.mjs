import { spawnSync } from 'node:child_process';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parseSeparated } from './entradas-avanzadas.mjs';
import { finiteMetric, normalizeSpec } from './model.mjs';

const maxInputBytes = 64 * 1024 * 1024;
const maxRows = 100_000;
const functions = new Set(('abs avg ceil ceiling coalesce concat concat_ws cos count cume_dist date datetime dense_rank exp ' +
  'first_value floor format glob group_concat hex ifnull iif instr julianday lag last_value lead length like ln log log10 ' +
  'lower ltrim max min mod nth_value ntile nullif percent_rank pow power printf rank replace round row_number rtrim sin sqrt ' +
  'strftime string_agg substr substring sum time total trim trunc typeof unixepoch upper').split(' '));
const usage = 'node scripts/consultar-sql.mjs --input datos.csv [--table catalogo=archivo.json] [--numeric datos.cantidad] (--sql "SELECT … FROM datos" | --sql-file consulta.sql) [--config grafica.json] [--out resultado.json] [--python ejecutable-local]';

function failUnless(condition, message) {
  if (!condition) throw new Error(message);
}

function local(value) {
  failUnless(value && !/^[/\\]{2}/.test(value) && !value.includes('://'), 'Indica una ruta de archivo local.');
  return resolve(value);
}

async function readLocal(value, limit = maxInputBytes) {
  const path = local(await realpath(local(value)));
  const info = await stat(path);
  failUnless(info.isFile() && info.size <= limit, 'El archivo no es regular o supera el límite: ' + basename(path));
  const bytes = await readFile(path);
  failUnless(bytes.length <= limit, 'El archivo cambió de tamaño mientras se abría.');
  return bytes;
}

const asJson = (bytes) => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const identifier = (name) => '"' + name.replace(/"/g, '""') + '"';

async function loadTable(name, path, numericColumns, separator, decimal) {
  const extension = extname(path).toLowerCase();
  const bytes = await readLocal(path);
  let rows;
  if (extension === '.json') {
    const input = asJson(bytes);
    rows = Array.isArray(input) ? input : input?.rows;
  } else if (extension === '.csv' || extension === '.tsv') {
    rows = parseSeparated(bytes, extension === '.tsv' ? '\t' : separator);
  } else {
    throw new Error('Usa CSV, TSV o JSON. Para Parquet consulta la ruta DuckDB-Wasm local.');
  }
  failUnless(Array.isArray(rows) && rows.length && rows.length <= maxRows &&
    rows.every((row) => row && typeof row === 'object' && !Array.isArray(row)),
  'Cada tabla necesita entre 1 y 100,000 registros planos.');
  const columns = [...new Set(rows.flatMap(Object.keys))];
  const lowerNames = columns.map((column) => column.toLowerCase());
  failUnless(columns.length && columns.length <= 256 && columns.every((column) => column && !column.includes('\0')) &&
    new Set(lowerNames).size === columns.length, 'La tabla requiere de 1 a 256 columnas con nombres distintos.');
  const numeric = new Set(numericColumns);
  failUnless([...numeric].every((column) => columns.includes(column)), 'No existe una de las columnas numéricas solicitadas en ' + name + '.');
  return { name, path: basename(path), columns, numeric, rows, decimal };
}

function cell(table, row, column, index) {
  const value = Object.hasOwn(row, column) ? row[column] : null;
  if (value === null || value === undefined) return null;
  if (table.numeric.has(column)) {
    const number = finiteMetric(value, table.decimal);
    failUnless(number !== null && (!Number.isInteger(number) || Number.isSafeInteger(number)),
      'Valor numérico inválido o fuera de precisión en ' + table.name + '.' + column + ', registro ' + (index + 1) + '.');
    return number;
  }
  if (typeof value === 'number') {
    failUnless(Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)),
      'Un entero de JSON supera la precisión segura. Conserva esos identificadores como texto.');
    return value;
  }
  if (typeof value === 'boolean') return Number(value);
  failUnless(typeof value === 'string', 'Usa valores planos en ' + table.name + '.' + column + '.');
  return value;
}

function queryOnly(database, constants, tables, sql) {
  const names = new Set(tables.map(({ name }) => name.toLowerCase()));
  database.setAuthorizer((action, first, second, databaseName) => {
    const allowed = action === constants.SQLITE_SELECT ||
      (action === constants.SQLITE_READ && databaseName === 'main' && names.has(first?.toLowerCase())) ||
      (action === constants.SQLITE_FUNCTION && functions.has(second?.toLowerCase()));
    return allowed ? constants.SQLITE_OK : constants.SQLITE_DENY;
  });
  const statement = database.prepare(sql);
  failUnless(statement.sourceSQL.trim() === sql, 'La consulta contiene más de una sentencia o texto posterior.');
  const columns = statement.columns().map(({ name }) => name);
  failUnless(columns.length > 0 && new Set(columns.map((name) => name.toLowerCase())).size === columns.length,
    'La consulta debe devolver columnas con alias distintos.');
  statement.setReadBigInts(true);
  const rows = [];
  for (const row of statement.iterate()) {
    failUnless(rows.length < maxRows, 'La consulta supera 100,000 resultados. Resume o agrega LIMIT.');
    rows.push(Object.fromEntries(Object.entries(row).map(([key, value]) => {
      if (typeof value === 'bigint') {
        const number = Number(value);
        return [key, Number.isSafeInteger(number) ? number : value.toString()];
      }
      failUnless(value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)),
        'La salida requiere texto, números finitos o valores ausentes.');
      return [key, value];
    })));
  }
  return { columns, rows };
}

const pythonSql = `
import json, sqlite3, sys
def ident(name):
    return '"' + name.replace('"', '""') + '"'

try:
    inputs, functions, query, limit = json.load(sys.stdin)
    db = sqlite3.connect(':memory:')
    db.enable_load_extension(False) if hasattr(db, 'enable_load_extension') else None
    db.execute('PRAGMA temp_store=MEMORY')
    for table in inputs:
        name, columns, rows = table
        db.execute('CREATE TABLE ' + ident(name) + ' (' + ', '.join(map(ident, columns)) + ')')
        db.executemany('INSERT INTO ' + ident(name) + ' VALUES (' + ', '.join('?' for _ in columns) + ')', rows)
    db.commit()
    names = {table[0].lower() for table in inputs}
    functions = set(functions)
    def authorize(action, first, second, database, scope):
        allowed = (action == sqlite3.SQLITE_SELECT
                   or (action == sqlite3.SQLITE_READ and database == 'main' and (first or '').lower() in names)
                   or (action == sqlite3.SQLITE_FUNCTION and (second or '').lower() in functions))
        return sqlite3.SQLITE_OK if allowed else sqlite3.SQLITE_DENY
    db.set_authorizer(authorize)
    cursor = db.execute(query)
    columns = [field[0] for field in cursor.description or ()]
    if not columns or len({name.lower() for name in columns}) != len(columns):
        raise ValueError('La consulta debe devolver columnas con alias distintos.')
    rows = []
    for row in cursor:
        if len(rows) >= limit:
            raise ValueError('La consulta supera 100,000 resultados. Resume o agrega LIMIT.')
        values = [str(value) if isinstance(value, int) and abs(value) > 9007199254740991 else value for value in row]
        rows.append(dict(zip(columns, values)))
    sys.stdout.buffer.write(json.dumps({'columns': columns, 'rows': rows}, ensure_ascii=False, allow_nan=False).encode('utf-8'))
except (ValueError, sqlite3.Error, TypeError) as error:
    sys.stderr.buffer.write(str(error).encode('utf-8'))
    sys.exit(2)
`;

function pythonQuery(tables, sql, executable) {
  const input = JSON.stringify([tables.map(({ name, columns, values }) => [name, columns, values]), [...functions], sql, maxRows]);
  const candidates = executable ? [local(executable)] : process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
  for (const command of candidates) {
    const result = spawnSync(command, ['-I', '-c', pythonSql], {
      input, encoding: 'utf8', timeout: 60_000, maxBuffer: 128 * 1024 * 1024, windowsHide: true,
    });
    if (!executable && result.error && ['ENOENT', 'EACCES', 'EPERM', 'UNKNOWN'].includes(result.error.code)) continue;
    if (result.error) throw result.error;
    failUnless(result.status === 0, result.stderr.trim() || 'Python no pudo ejecutar el SQL local.');
    return JSON.parse(result.stdout);
  }
  throw new Error('El SQL requiere Node.js 24.10 o posterior con SQLite, o Python local con sqlite3.');
}

async function main() {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, table: { type: 'string', multiple: true },
    numeric: { type: 'string', multiple: true }, delimiter: { type: 'string' }, decimal: { type: 'string' },
    sql: { type: 'string' }, 'sql-file': { type: 'string' }, config: { type: 'string' },
    out: { type: 'string' }, python: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) { console.log(usage); return; }
  failUnless(values.input && Boolean(values.sql) !== Boolean(values['sql-file']), 'Indica --input y exactamente uno de --sql o --sql-file. Consulta --help.');
  failUnless(!values.decimal || ['.', ','].includes(values.decimal), 'El decimal debe ser punto o coma.');
  const inputs = new Map([['datos', values.input]]);
  for (const entry of values.table ?? []) {
    const parts = /^([a-z][a-z0-9_]*)=(.+)$/i.exec(entry);
    const key = parts?.[1].toLowerCase();
    failUnless(parts && !inputs.has(key) && !key.startsWith('sqlite_'), 'Usa --table nombre=archivo con nombres únicos.');
    inputs.set(key, parts[2]);
  }
  failUnless(inputs.size <= 8, 'Puedes consultar hasta ocho archivos a la vez.');
  const numeric = new Map([...inputs.keys()].map((name) => [name, []]));
  for (const entry of values.numeric ?? []) {
    const parts = /^([a-z][a-z0-9_]*)\.(.+)$/i.exec(entry);
    const key = parts?.[1].toLowerCase();
    failUnless(parts && numeric.has(key), 'Usa --numeric tabla.columna para una tabla cargada.');
    numeric.get(key).push(parts[2]);
  }
  const sql = (values.sql ?? (await readLocal(values['sql-file'], 64 * 1024)).toString('utf8').replace(/^\uFEFF/, ''))
    .trim().replace(/;$/, '').trim();
  failUnless(Buffer.byteLength(sql) <= 64 * 1024, 'La consulta supera 64 KiB.');
  failUnless(/^(?:SELECT|WITH)\b/i.test(sql), 'Usa una sola consulta SELECT o WITH de solo lectura.');
  const sqlite = values.python ? null : await import('node:sqlite').catch(() => null);
  const native = typeof sqlite?.DatabaseSync.prototype.setAuthorizer === 'function';
  const separator = values.delimiter === '\\t' ? '\t' : values.delimiter;
  const tables = [];
  for (const [name, path] of inputs) {
    const table = await loadTable(name, path, numeric.get(name), separator, values.decimal);
    const rows = table.rows.map((row, index) => table.columns.map((column) => cell(table, row, column, index)));
    tables.push({ name, archivo: table.path, registros: rows.length, columns: table.columns, values: rows });
  }
  let result;
  if (native) {
    const database = new sqlite.DatabaseSync(':memory:', { allowExtension: false });
    try {
      database.exec('PRAGMA temp_store=MEMORY; BEGIN');
      for (const table of tables) {
        const columns = table.columns.map(identifier);
        database.exec('CREATE TABLE ' + identifier(table.name) + ' (' + columns.join(', ') + ')');
        const insert = database.prepare('INSERT INTO ' + identifier(table.name) + ' VALUES (' + columns.map(() => '?').join(', ') + ')');
        table.values.forEach((row) => insert.run(...row.map((value) => Number.isSafeInteger(value) ? BigInt(value) : value)));
      }
      database.exec('COMMIT');
      result = queryOnly(database, sqlite.constants, tables, sql);
    } finally {
      database.close();
    }
  } else {
    result = pythonQuery(tables, sql, values.python);
  }
  let metadata = {};
  if (values.config) {
    const config = asJson(await readLocal(values.config, 4 * 1024 * 1024));
    failUnless(config && typeof config === 'object' && !Array.isArray(config), 'La configuración debe ser un objeto JSON.');
    const spec = normalizeSpec({ ...config, rows: result.rows });
    for (const row of spec.rows) {
      if (typeof row[spec.y] === 'string' && /^-?\d{16,}$/.test(row[spec.y]) && !Number.isSafeInteger(Number(row[spec.y]))) {
        throw new Error('La métrica excede la precisión segura de las gráficas. Resume en una escala apropiada.');
      }
    }
    metadata = config;
  }
  const record = { ...metadata, ...result, procedencia: {
    motor: native ? 'SQLite de Node.js' : 'SQLite de Python',
    tablas: tables.map(({ name, archivo, registros, columns }) => ({ name, archivo, registros, columns })), consulta: sql,
  } };
  const output = JSON.stringify(record, null, 2) + '\n';
  if (values.out) {
    failUnless(extname(values.out).toLowerCase() === '.json', 'La salida debe ser un archivo JSON nuevo.');
    await writeFile(local(values.out), output, { encoding: 'utf8', flag: 'wx' });
  } else process.stdout.write(output);
}

main().catch((error) => { console.error('SQL local: ' + error.message); process.exitCode = 2; });
