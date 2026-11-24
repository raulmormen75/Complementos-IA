import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis} from 'recharts';

export type ChartSpec = {
  title: string;
  source: string;
  unit: string;
  x: string;
  y: string;
  rows: Record<string, unknown>[];
  filters?: unknown;
};

const integer = new Intl.NumberFormat('es-MX', {maximumFractionDigits: 2});

function displayedRows(chart: ChartSpec) {
  if (!chart.title || !chart.source || !chart.x || !chart.y || !Array.isArray(chart.rows)) {
    throw new Error('La gráfica requiere título, fuente, variables x/y y filas.');
  }
  if (chart.rows.length < 1 || chart.rows.length > 14) {
    throw new Error('Usa entre 1 y 14 categorías por escena. Divide fuera del motor y conserva la fuente.');
  }
  const rows = chart.rows.map((row) => {
    const display = row[chart.x];
    const value = row[chart.y];
    if ((typeof display !== 'string' && typeof display !== 'number') || typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('Cada fila requiere una categoría y un número finito ya calculado para y.');
    }
    return {label: String(display), value};
  });
  if (new Set(rows.map((row) => row.label)).size !== rows.length) {
    throw new Error('Las categorías se repiten. Agrega los registros en Gráficos antes de animarlos.');
  }
  return rows;
}

type Point = {label: string; value: number};
function revealed(frame: number, fps: number, index: number) {
  const begin = index * fps * 0.095;
  return interpolate(frame, [begin, begin + fps * 0.81], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}

function RechartsView({rows, accent, frame, fps, title}: {
  rows: Point[]; accent: string; frame: number; fps: number; title: string;
}) {
  const visual = rows.map(({label, value}, index) => ({
    label: label.length > 31 ? label.slice(0, 30) + '…' : label,
    current: value * revealed(frame, fps, index),
  }));
  const low = Math.min(0, ...rows.map(({value}) => value));
  const high = Math.max(0, ...rows.map(({value}) => value));
  const axisMaximum = low === 0 && high === 0 ? 1 : high;
  const rowHeight = 370 / rows.length;
  return (
    <div style={{width: 1124, height: 423, position: 'relative'}} aria-label={title}>
      <BarChart layout="vertical" width={1124} height={423} data={visual}
        margin={{top: 34, right: 111, bottom: 19, left: 0}}>
        <CartesianGrid stroke="#344650" horizontal={false}/>
        <XAxis type="number" domain={[low, axisMaximum]} allowDataOverflow
          tickFormatter={(value) => integer.format(value)} tick={{fill: '#B9C7CD', fontSize: 15}}/>
        <YAxis type="category" dataKey="label" width={325} interval={0}
          tickMargin={13} tick={{fill: '#D8E3E7', fontSize: 18}}/>
        <ReferenceLine x={0} stroke="#829095" strokeWidth={1.2}/>
        <Bar dataKey="current" fill={accent} isAnimationActive={false} maxBarSize={28}/>
      </BarChart>
      {rows.map(({label, value}, index) => (
        <div key={label} title={label} style={{
          position: 'absolute', top: 34 + rowHeight * (index + 0.5) - 12, right: 16, width: 95,
          textAlign: 'right', color: '#F3EFE5', fontSize: 19, opacity: revealed(frame, fps, index),
        }}>{integer.format(value)}</div>
      ))}
    </div>
  );
}

export function AnimatedChart({chart, accent, engine}: {chart: ChartSpec; accent: string; engine: 'recharts' | 'svg'}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows = displayedRows(chart);
  const left = 325;
  const right = 1030;
  const top = 34;
  const height = 370;
  const step = height / rows.length;
  const barHeight = Math.min(28, step * 0.61);
  const low = Math.min(0, ...rows.map((row) => row.value));
  const high = Math.max(0, ...rows.map((row) => row.value));
  const pixel = (number: number) => left + (number - low) / (high - low || 1) * (right - left);
  const zero = pixel(0);
  return (
    <AbsoluteFill style={{background: '#111C26', color: '#F3EFE5', fontFamily: 'Arial, sans-serif', padding: '54px 78px'}}>
      <div style={{color: accent, letterSpacing: 3, fontSize: 18}}>{chart.unit || chart.y}</div>
      <h1 style={{fontSize: 51, fontWeight: 600, margin: '12px 0 18px', letterSpacing: '-0.025em'}}>{chart.title}</h1>
      {engine === 'recharts'
        ? <RechartsView rows={rows} accent={accent} frame={frame} fps={fps} title={chart.title}/>
        : <svg viewBox="0 0 1124 423" style={{width: '100%', height: 423}} aria-label={chart.title}>
        <line x1={zero} y1={top - 12} x2={zero} y2={top + height} stroke="#829095"/>
        {rows.map(({label, value}, index) => {
          const progress = revealed(frame, fps, index);
          const y = top + step * (index + 0.5);
          const end = pixel(value);
          const current = zero + (end - zero) * progress;
          return (
            <g key={label}>
              <title>{label}: {integer.format(value)}</title>
              <text x={left - 22} y={y} fill="#D8E3E7" fontSize={18} textAnchor="end" dominantBaseline="central">{label.length > 31 ? label.slice(0, 30) + '…' : label}</text>
              <rect x={Math.min(zero, current)} y={y - barHeight / 2} width={Math.abs(zero - current)} height={barHeight}
                rx={Math.min(4, barHeight / 2)} fill={accent}/>
              <text x={right + 82} y={y} fill="#F3EFE5" fontSize={19} textAnchor="end"
                dominantBaseline="central" opacity={progress}>{integer.format(value)}</text>
            </g>
          );
        })}
        </svg>}
      <div style={{position: 'absolute', bottom: 43, left: 78, right: 78, color: '#C3D3D9', fontSize: 17, lineHeight: 1.25}}>
        Fuente: {chart.source}
      </div>
    </AbsoluteFill>
  );
}
