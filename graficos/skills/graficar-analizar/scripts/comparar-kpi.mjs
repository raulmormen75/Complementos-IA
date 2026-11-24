import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { finiteMetric, normalizeSpec, numericSum } from './model.mjs';

const usage = 'node scripts/comparar-kpi.mjs --input datos.json --period periodo --current ACTUAL --prior ANTERIOR [--dimension grupo] [--denominator base] [--scale 100] [--unit-field unidad] [--out comparacion.json] [--chart aportes.json]';
const optionNames = ['input', 'period', 'current', 'prior', 'dimension', 'denominator', 'scale', 'unit-field', 'out', 'chart'];
const asLabel = (value) => value === undefined || value === null ? '' : String(value).trim();

function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`${label} supera el rango numérico representable.`);
  return value;
}

function summarize(entries, ratio, factor) {
  const included = entries.filter(({ reason }) => !reason);
  const sum = included.length ? numericSum(included.map(({ numerator }) => numerator)) : null;
  const denominator = ratio && included.length ? numericSum(included.map(({ base }) => base)) : null;
  const value = sum === null ? null : ratio ? finite(sum / denominator * factor, 'La tasa') : sum;
  return {
    value, numerator: sum, denominator, rows: entries.length, valid: included.length,
    excluded: entries.filter(({ reason }) => reason).map(({ row, reason }) => ({ row, reason })),
  };
}

function compare(current, prior) {
  if (current.value === null || prior.value === null) {
    return { delta: null, relativePercent: null, status: 'sin_datos_comparables' };
  }
  const delta = finite(current.value - prior.value, 'La diferencia');
  return {
    delta,
    relativePercent: prior.value > 0 ? finite(delta / prior.value * 100, 'La variación relativa') : null,
    status: current.excluded.length || prior.excluded.length ? 'parcial' : 'comparable',
  };
}

function analyze(spec, values) {
  const currentPeriod = asLabel(values.current);
  const priorPeriod = asLabel(values.prior);
  if (!currentPeriod || !priorPeriod || currentPeriod === priorPeriod) throw new Error('Indica dos periodos distintos y no vacíos.');
  const unitField = values['unit-field'];
  const requiredColumns = [values.period, spec.y, values.dimension, values.denominator, unitField].filter(Boolean);
  if (new Set(requiredColumns).size !== requiredColumns.length) throw new Error('Usa columnas distintas para periodo, métrica, dimensión, denominador y unidad.');
  for (const key of requiredColumns) {
    if (!spec.columns.includes(key)) throw new Error(`No existe la columna «${key}».`);
  }
  const ratio = Boolean(values.denominator);
  const factor = values.scale === undefined ? 1 : finiteMetric(values.scale);
  if ((values.scale !== undefined && !ratio) || factor === null || factor <= 0) {
    throw new Error('Usa --scale con --denominator y un factor numérico mayor que cero.');
  }
  const periods = new Map([[currentPeriod, []], [priorPeriod, []]]);
  const segments = new Map();
  const missingPeriods = [];
  let otherPeriods = 0;
  for (const [index, row] of spec.rows.entries()) {
    const period = asLabel(row[values.period]);
    if (!period) {
      missingPeriods.push(index + 1);
      continue;
    }
    if (!periods.has(period)) {
      otherPeriods += 1;
      continue;
    }
    const unit = unitField ? asLabel(row[unitField]) : spec.unit.trim();
    if (unit && unit !== spec.unit.trim()) throw new Error(`Unidad «${unit}» incompatible con «${spec.unit}» en registro ${index + 1}.`);
    const numerator = finiteMetric(row[spec.y], spec.decimal);
    const base = ratio ? finiteMetric(row[values.denominator], spec.decimal) : null;
    const reason = !unit ? 'unidad_ausente' : numerator === null ? 'numerador_invalido' :
      ratio && (base === null || base <= 0) ? 'denominador_invalido' : null;
    const entry = { row: index + 1, numerator, base, reason };
    periods.get(period).push(entry);
    if (values.dimension) {
      const label = asLabel(row[values.dimension]) || null;
      if (!segments.has(label)) segments.set(label, new Map([[currentPeriod, []], [priorPeriod, []]]));
      segments.get(label).get(period).push(entry);
    }
  }
  const summarizePair = (groups) => {
    const current = summarize(groups.get(currentPeriod), ratio, factor);
    const prior = summarize(groups.get(priorPeriod), ratio, factor);
    return { current, prior, ...compare(current, prior) };
  };
  const total = summarizePair(periods);
  if (total.status === 'comparable' && missingPeriods.length) total.status = 'parcial';
  const breakdown = [...segments].map(([label, groups]) => ({ label, ...summarizePair(groups) }));
  breakdown.sort((a, b) => Math.abs(b.delta ?? -0) - Math.abs(a.delta ?? -0) ||
    (a.label ?? '').localeCompare(b.label ?? '', 'es-MX', { numeric: true }));
  const canReconcile = !ratio && total.status === 'comparable' && breakdown.length > 0 &&
    breakdown.every((group) => group.status === 'comparable');
  const contributed = canReconcile ? numericSum(breakdown.map(({ delta }) => delta)) : null;
  return {
    title: spec.title, source: spec.source, unit: spec.unit,
    period: values.period, currentPeriod, priorPeriod, metric: spec.y,
    aggregation: ratio ? 'razon_de_sumas' : 'suma', ...(ratio ? { denominator: values.denominator, factor } : {}),
    dimension: values.dimension ?? null, unitField: unitField ?? null,
    total, breakdown,
    scope: { totalRows: spec.rows.length, otherPeriods, missingPeriods },
    reconciliation: contributed === null ? null : {
      sumOfChanges: contributed, residual: finite(total.delta - contributed, 'El residual'),
    },
    method: {
      delta: 'Valor actual menos anterior, en la unidad declarada del indicador.',
      relative: 'Diferencia dividida por el valor anterior y multiplicada por 100. Se omite si la base es cero, negativa o ausente.',
      coverage: 'Un periodo sin registros válidos se reporta como ausente. Cero se conserva como un valor observado.',
      dimension: ratio ? 'Las tasas de los grupos se comparan por separado y no son contribuciones aditivas.' :
        'Los cambios comparables por grupo indican contribuciones contables. No demuestran causalidad.',
    },
  };
}

function chartOf(report) {
  if (report.total.status !== 'comparable' || report.aggregation !== 'suma' ||
      (report.dimension && !report.reconciliation)) {
    throw new Error('El gráfico de aportes requiere una métrica aditiva con ambos periodos y todos los grupos completos. Omite --chart para obtener el diagnóstico.');
  }
  const rows = report.dimension ? report.breakdown.map(({ label, delta }) => ({
    segmento: label === null ? 'Categoría ausente' : `Valor: ${label}`, cambio: delta,
  })) : [{ segmento: 'Cambio total', cambio: report.total.delta }];
  return {
    title: `${report.title} · cambio ${report.currentPeriod} frente a ${report.priorPeriod}`,
    source: report.source, unit: report.unit, x: 'segmento', y: 'cambio', chartType: 'bar', rows,
  };
}

async function main() {
  const { values } = parseArgs({ options: {
    ...Object.fromEntries(optionNames.map((name) => [name, { type: 'string' }])),
    help: { type: 'boolean' },
  } });
  if (values.help) { console.log(usage); return; }
  if (!values.input || !values.period || values.current === undefined || values.prior === undefined) throw new Error(usage);
  const names = [values.input, values.out, values.chart].filter(Boolean).map((path) => resolve(path));
  const paths = names.map((path) => process.platform === 'win32' ? path.toLowerCase() : path);
  if (new Set(paths).size !== paths.length) throw new Error('Indica rutas distintas para entrada, informe y gráfico.');
  const raw = JSON.parse((await readFile(values.input, 'utf8')).replace(/^\uFEFF/, ''));
  const spec = normalizeSpec(raw);
  const report = analyze(spec, values);
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  if (values.chart) await writeFile(values.chart, json(chartOf(report)), { flag: 'wx' });
  if (values.out) await writeFile(values.out, json(report), { flag: 'wx' });
  else process.stdout.write(json(report));
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
