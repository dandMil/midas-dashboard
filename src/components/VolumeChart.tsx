import React, { useMemo, useState } from 'react';
import type { VolumeBarPoint } from '../services/api.tsx';

const UP = 'var(--accent-primary, #00ff41)';
const DOWN = 'var(--error-color, #ff4466)';
const MUTED = 'var(--text-muted, #1a9a3a)';
const BORDER = 'var(--border-primary, rgba(0,255,65,0.12))';
const GRID = 'var(--border-secondary, rgba(0,255,65,0.08))';

/** Rolling mean of last `win` values ending at each index (inclusive). */
function rollingMean(values: number[], win: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - win + 1);
    const slice = values.slice(start, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

/**
 * Y-axis max so one outlier spike does not squash the rest of the series.
 * Uses the 2nd-largest value (when n≥3) with padding; falls back gracefully.
 */
function displayVolumeMax(vols: number[]): { yMax: number; hadSpikeTrim: boolean } {
  if (vols.length === 0) return { yMax: 1, hadSpikeTrim: false };
  const sorted = [...vols].sort((a, b) => a - b);
  const n = sorted.length;
  const maxV = sorted[n - 1];
  if (n < 3) {
    return { yMax: Math.max(maxV * 1.05, 1), hadSpikeTrim: false };
  }
  const second = sorted[n - 2];
  const third = sorted[n - 3];
  const spike = maxV > second * 2.5 && maxV > third * 2;
  const base = spike ? Math.max(second * 1.2, third * 1.5) : maxV;
  const yMax = Math.max(base * 1.08, maxV * 0.12, 1);
  return { yMax, hadSpikeTrim: spike };
}

const VolumeChart: React.FC<{
  data: VolumeBarPoint[];
  rangeKey?: '1D' | '5D' | '7D' | '1M' | '3M' | '6M' | 'YTD';
  width?: number;
  height?: number;
}> = ({ data, rangeKey = '1M', width = 720, height = 360 }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const margin = { top: 56, right: 16, bottom: 32, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const layout = useMemo(() => {
    const n = data.length;
    const vols = data.map((d) => d.volume);
    if (n === 0) {
      return {
        xs: [] as number[],
        barW: 0,
        slot: 0,
        ysTop: [] as number[],
        heights: [] as number[],
        clipped: [] as boolean[],
        minVol: 0,
        yMax: 1,
        tickEvery: 1,
        avgLineY: null as number | null,
        resY: null as number | null,
        supY: null as number | null,
        avgVal: null as number | null,
        resVal: null as number | null,
        supVal: null as number | null,
        ma: [] as number[],
        hadSpikeTrim: false,
      };
    }

    const ma20 = rollingMean(vols, Math.min(20, n));
    const avgVal = ma20[ma20.length - 1];
    const recent = vols.slice(-Math.min(20, n));
    const resVal = Math.max(...recent);
    const supVal = Math.min(...recent);

    const { yMax, hadSpikeTrim } = displayVolumeMax(vols);
    const yRange = Math.max(1e-9, yMax);

    const slot = n > 0 ? innerW / n : 0;
    const barW = Math.max(2, slot * 0.72);

    const yForVol = (v: number) => margin.top + (1 - Math.min(v, yMax) / yRange) * innerH;

    const xs = data.map((_, i) => margin.left + i * slot + (slot - barW) / 2);
    const heights: number[] = [];
    const clipped: boolean[] = [];
    const ysTop: number[] = [];

    vols.forEach((v) => {
      const clippedBar = v > yMax;
      const h = clippedBar ? innerH : (v / yRange) * innerH;
      heights.push(Math.max(1, h));
      clipped.push(clippedBar);
      ysTop.push(margin.top + innerH - Math.max(1, h));
    });

    const lineY = (v: number) => {
      if (v > yMax) return margin.top;
      return yForVol(v);
    };

    const avgLineY = Number.isFinite(avgVal) ? lineY(avgVal) : null;
    const resY = lineY(resVal);
    const supY = lineY(supVal);

    const tickEvery = Math.max(1, Math.floor((n || 1) / 6));

    return {
      xs,
      barW,
      slot,
      ysTop,
      heights,
      clipped,
      minVol: 0,
      yMax,
      tickEvery,
      avgLineY,
      resY,
      supY,
      resCapped: resVal > yMax,
      avgCapped: avgVal > yMax,
      supCapped: false,
      avgVal,
      resVal,
      supVal,
      ma: ma20,
      hadSpikeTrim,
    };
  }, [data, innerW, innerH, margin.left, margin.top]);

  const isIntraday = rangeKey === '1D' || rangeKey === '5D';

  const fmtTick = (iso: string) => {
    const d = new Date(iso);
    return isIntraday
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  const barColor = (d: VolumeBarPoint, i: number) => {
    const o = d.o;
    const c = d.c;
    if (o !== undefined && c !== undefined && o > 0 && c > 0) {
      return c >= o ? UP : DOWN;
    }
    const ma = layout.ma[i];
    if (ma !== undefined && d.volume !== undefined) {
      return d.volume >= ma ? UP : DOWN;
    }
    return UP;
  };

  if (!data.length) {
    return (
      <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>
        No volume data.
      </div>
    );
  }

  const legendX = margin.left;
  const legendY = 6;
  const legendLine = 13;

  return (
    <div className="volume-chart-root">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Volume histogram with support resistance levels"
        className="volume-chart-svg"
      >
        <text x={legendX} y={legendY + 12} fontSize={11} fill={MUTED} fontFamily="var(--font-family-primary)">
          Volume (bars = up / down day); dashed lines = 20-session avg · high · low
        </text>

        <text x={legendX} y={legendY + 12 + legendLine} fontSize={9} fill={MUTED} fontFamily="var(--font-family-secondary)">
          {layout.avgVal != null && `Avg (20): ${layout.avgVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          {layout.resVal != null && ` · High: ${layout.resVal.toLocaleString()}`}
          {layout.supVal != null && ` · Low: ${layout.supVal.toLocaleString()}`}
        </text>

        {layout.hadSpikeTrim && (
          <text x={legendX} y={legendY + 12 + legendLine * 2} fontSize={9} fill={MUTED} fontStyle="italic">
            Y-axis scaled to typical range; hover a bar for exact volume (spikes may reach the top).
          </text>
        )}

        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke={BORDER} strokeWidth={1} />
        <line
          x1={margin.left}
          y1={margin.top + innerH}
          x2={margin.left + innerW}
          y2={margin.top + innerH}
          stroke={BORDER}
          strokeWidth={1}
        />

        {Array.from({ length: 3 }).map((_, i) => {
          const y = margin.top + ((i + 1) * innerH) / 4;
          return (
            <line key={`g-${i}`} x1={margin.left} x2={margin.left + innerW} y1={y} y2={y} stroke={GRID} strokeWidth={1} opacity={0.45} />
          );
        })}

        {layout.supY !== null && (
          <line
            x1={margin.left}
            y1={layout.supY}
            x2={margin.left + innerW}
            y2={layout.supY}
            stroke={DOWN}
            strokeWidth={1}
            strokeDasharray="6 4"
            opacity={0.85}
          />
        )}

        {layout.avgLineY !== null && layout.avgVal !== null && (
          <line
            x1={margin.left}
            y1={layout.avgLineY}
            x2={margin.left + innerW}
            y2={layout.avgLineY}
            stroke={MUTED}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.95}
          />
        )}

        {layout.resY !== null && (
          <line
            x1={margin.left}
            y1={layout.resY}
            x2={margin.left + innerW}
            y2={layout.resY}
            stroke={UP}
            strokeWidth={1}
            strokeDasharray="6 4"
            opacity={0.75}
          />
        )}

        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={layout.xs[i]}
              y={layout.ysTop[i]}
              width={layout.barW}
              height={Math.max(1, layout.heights[i])}
              fill={barColor(d, i)}
              opacity={hovered === i ? 1 : 0.88}
              stroke={hovered === i ? BORDER : 'none'}
              strokeWidth={1}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <title>
                {`${new Date(d.date).toLocaleString()} · Vol ${d.volume.toLocaleString()}` +
                  (layout.clipped[i] ? ' (spike — bar hits chart top)' : '') +
                  (d.o && d.c ? ` · O ${d.o.toFixed(2)} C ${d.c.toFixed(2)}` : '')}
              </title>
            </rect>
            {layout.clipped[i] && (
              <polygon
                points={`${layout.xs[i] + layout.barW / 2 - 4},${margin.top + 2} ${layout.xs[i] + layout.barW / 2 + 4},${margin.top + 2} ${layout.xs[i] + layout.barW / 2},${margin.top + 10}`}
                fill={barColor(d, i)}
                opacity={0.95}
              />
            )}
          </g>
        ))}

        <text x={margin.left - 10} y={margin.top + 10} textAnchor="end" fontSize={10} fill={MUTED}>
          {layout.yMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>
        <text x={margin.left - 10} y={margin.top + innerH} dy={-2} textAnchor="end" fontSize={10} fill={MUTED}>
          0
        </text>

        {data.map((d, i) =>
          i % layout.tickEvery === 0 ? (
            <text
              key={`t-${i}`}
              x={layout.xs[i] + layout.barW / 2}
              y={margin.top + innerH + 16}
              fontSize={9}
              textAnchor="middle"
              fill={MUTED}
            >
              {fmtTick(d.date)}
            </text>
          ) : null
        )}

        <text x={width / 2} y={height - 4} textAnchor="middle" fontSize={10} fill={MUTED}>
          {isIntraday ? 'Time' : 'Date'}
        </text>
      </svg>
    </div>
  );
};

export default VolumeChart;
