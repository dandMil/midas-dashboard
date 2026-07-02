import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchChartBars, type ChartBar } from '../services/api.tsx';

const GREEN = '#00ff41';
const RED = '#ff4466';
const MUTED = '#1a9a3a';
const BG = '#0a0c0e';
const GRID = 'rgba(0, 255, 65, 0.12)';

function candleRows(bars: ChartBar[]): [number, number, number, number][] {
  return bars.map((b) => [Number(b.o), Number(b.c), Number(b.l), Number(b.h)]);
}

function stratLabelColor(sig: string | null | undefined): string {
  if (sig === 'BULLISH') return GREEN;
  if (sig === 'BEARISH') return RED;
  return MUTED;
}

export type PriceVolumeChartProps = {
  ticker: string;
  /** Calendar days of daily bars to request (Polygon). */
  days?: number;
  /** Optional title override */
  title?: string;
};

/**
 * Single chart: price candles + S/R lines on top, volume bars below — same category axis.
 * Aligns session-by-session for structure analysis (e.g. The Strat: inside/outside, continuations)
 * alongside participation (volume).
 */
const PriceVolumeChart: React.FC<PriceVolumeChartProps> = ({ ticker, days: daysProp = 30, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bars, setBars] = useState<ChartBar[]>([]);
  const [support, setSupport] = useState<number | null>(null);
  const [resistance, setResistance] = useState<number | null>(null);

  const days = Math.min(730, Math.max(5, daysProp));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChartBars(ticker, days)
      .then((data) => {
        if (cancelled) return;
        setBars(data.results || []);
        setSupport(data.support ?? null);
        setResistance(data.resistance ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Failed to load chart');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, days]);

  const option = useMemo(() => {
    const dates = bars.map((b) => {
      const ms = typeof b.t === 'number' ? b.t : 0;
      return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const candleData = candleRows(bars);

    const volBarData = bars.map((b) => {
      const o = Number(b.o);
      const c = Number(b.c);
      const up = c >= o;
      const v = Number(b.v ?? 0);
      return {
        value: v,
        itemStyle: { color: up ? GREEN : RED, opacity: 0.85 },
      };
    });

    const markLineData: { name: string; yAxis: number; lineStyle: { color: string; type: 'dashed' } }[] = [];
    if (resistance != null && Number.isFinite(resistance)) {
      markLineData.push({
        name: 'Resistance',
        yAxis: resistance,
        lineStyle: { color: RED, type: 'dashed' },
      });
    }
    if (support != null && Number.isFinite(support)) {
      markLineData.push({
        name: 'Support',
        yAxis: support,
        lineStyle: { color: GREEN, type: 'dashed' },
      });
    }

    const many = dates.length > 45;

    const priceMin = Math.min(...bars.map((b) => Number(b.l)));
    const priceMax = Math.max(...bars.map((b) => Number(b.h)));
    const pad = Math.max((priceMax - priceMin) * 0.02, priceMax * 0.002, 0.01);

    const stratScatterData = bars
      .map((b, i) => {
        if (i === 0 || b.strat_scenario == null || b.strat_scenario === '') return null;
        const sc = b.strat_scenario;
        return {
          name: sc,
          value: [dates[i], Number(b.l) - pad] as [string, number],
          label: {
            color: stratLabelColor(b.strat_signal),
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    return {
      backgroundColor: BG,
      title: {
        text: title ?? `${ticker} — price & volume`,
        subtext:
          'The Strat (vs prior bar): 1 = inside · 2U / 2D = directional · 3 = outside — labels under candles · S/R = 20d range',
        left: 'center',
        top: 8,
        textStyle: { color: GREEN, fontSize: 14, fontFamily: 'monospace' },
        subtextStyle: { color: MUTED, fontSize: 10, width: '90%' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(10, 12, 14, 0.94)',
        borderColor: GRID,
        textStyle: { color: GREEN, fontSize: 11 },
        formatter(params: any) {
          const rows = Array.isArray(params) ? params : [params];
          if (!rows.length) return '';
          const idx = rows[0]?.dataIndex ?? 0;
          const b = bars[idx];
          if (!b) return '';
          const t = typeof b.t === 'number' ? new Date(b.t).toLocaleDateString() : '';
          const strat =
            b.strat_scenario != null
              ? `Strat ${b.strat_scenario} (${b.strat_signal ?? '—'} vs prior)`
              : 'Strat — (first bar)';
          const lines = [
            `<div style="font-weight:600;margin-bottom:4px">${t}</div>`,
            `O ${Number(b.o).toFixed(4)}  H ${Number(b.h).toFixed(4)}  L ${Number(b.l).toFixed(4)}  C ${Number(b.c).toFixed(4)}`,
            strat,
            `Volume ${Number(b.v ?? 0).toLocaleString()}`,
          ];
          return lines.join('<br/>');
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 56, right: 20, top: 88, height: '50%' },
        { left: 56, right: 20, top: '62%', height: '22%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          gridIndex: 0,
          axisLine: { lineStyle: { color: GRID } },
          axisLabel: { show: false },
          splitLine: { show: false },
          boundaryGap: true,
        },
        {
          type: 'category',
          data: dates,
          gridIndex: 1,
          axisLine: { lineStyle: { color: GRID } },
          axisLabel: { color: MUTED, fontSize: 10, rotate: many ? 35 : 0 },
          splitLine: { show: false },
          boundaryGap: true,
        },
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          scale: true,
          axisLine: { lineStyle: { color: GRID } },
          splitLine: { lineStyle: { color: GRID, opacity: 0.45 } },
          axisLabel: {
            color: MUTED,
            formatter: (v: number) => (v < 1000 ? v.toFixed(2) : v.toFixed(0)),
          },
        },
        {
          type: 'value',
          gridIndex: 1,
          scale: true,
          axisLine: { lineStyle: { color: GRID } },
          splitLine: { lineStyle: { color: GRID, opacity: 0.35 } },
          axisLabel: {
            color: MUTED,
            formatter: (v: number) => {
              if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
              if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
              if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
              return String(Math.round(v));
            },
          },
        },
      ],
      dataZoom: many
        ? [
            { type: 'inside', xAxisIndex: [0, 1] },
            { type: 'slider', xAxisIndex: [0, 1], bottom: 4, height: 22 },
          ]
        : undefined,
      series: [
        {
          name: 'Price',
          type: 'candlestick',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: candleData,
          itemStyle: {
            color: GREEN,
            color0: RED,
            borderColor: GREEN,
            borderColor0: RED,
          },
          markLine:
            markLineData.length > 0
              ? {
                  symbol: 'none',
                  label: { formatter: '{b}', color: MUTED, fontSize: 9 },
                  data: markLineData,
                }
              : undefined,
        },
        {
          name: 'Strat',
          type: 'scatter',
          xAxisIndex: 0,
          yAxisIndex: 0,
          z: 5,
          symbolSize: 0,
          data: stratScatterData,
          label: {
            show: true,
            position: 'bottom',
            distance: 0,
            fontSize: 10,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            formatter: '{b}',
          },
          emphasis: {
            label: { fontSize: 11 },
          },
          itemStyle: {
            opacity: 0,
          },
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volBarData,
          barMaxWidth: 12,
        },
      ],
    };
  }, [ticker, bars, support, resistance, title]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', fontFamily: 'var(--font-family-primary)' }}>
        Loading price & volume…
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24, color: 'var(--error-color, #ff4466)' }}>{error}</div>;
  }

  if (!bars.length) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>No OHLCV data for {ticker}.</div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 520, width: '100%' }}
      notMerge
      lazyUpdate
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default PriceVolumeChart;
