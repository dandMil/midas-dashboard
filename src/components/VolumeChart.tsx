// VolumeChart.tsx (replace your existing component)
import React, { useMemo } from 'react';

type VolumePoint = { date: string; volume: number };

const VolumeChart: React.FC<{
  data: VolumePoint[];
  rangeKey?: '1D' | '5D' | '1M' | '6M' | 'YTD';
  width?: number;
  height?: number;
}> = ({ data, rangeKey = '1D', width = 720, height = 240 }) => {
  const margin = { top: 10, right: 12, bottom: 24, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const { xs, ys, pathD, minVol, maxVol, tickEvery } = useMemo(() => {
    const n = data.length;
    const vols = data.map(d => d.volume);
    const minVol = Math.min(...vols, 0);
    const maxVol = Math.max(...vols, 1);
    const yRange = Math.max(1, maxVol - minVol);

    const xs = data.map((_, i) => (n === 1 ? margin.left + innerW / 2 : margin.left + (i * innerW) / (n - 1)));
    const ys = data.map(d => {
      const t = (d.volume - minVol) / yRange;
      return margin.top + (1 - t) * innerH;
    });

    let pathD = '';
    if (n > 0) {
      pathD = `M ${xs[0]} ${ys[0]}`;
      for (let i = 1; i < n; i++) pathD += ` L ${xs[i]} ${ys[i]}`;
    }
    const tickEvery = Math.max(1, Math.floor((n || 1) / 6));
    return { xs, ys, pathD, minVol, maxVol, tickEvery };
  }, [data, innerW, innerH, margin.left, margin.top]);

  const isIntraday = rangeKey === '1D' || rangeKey === '5D';

  const fmtTick = (iso: string) => {
    const d = new Date(iso);
    return isIntraday
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  return (
    <svg width={width} height={height} role="img" aria-label="Volume line chart">
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#c7c7c7" />
      <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#c7c7c7" />

      {Array.from({ length: 3 }).map((_, i) => {
        const y = margin.top + ((i + 1) * innerH) / 4;
        return <line key={i} x1={margin.left} x2={margin.left + innerW} y1={y} y2={y} stroke="#eee" />;
      })}

      {data.length > 0 && <path d={pathD} fill="none" stroke="#6b8afd" strokeWidth={2} />}

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={2.5} fill="#3554ff" />
          <title>{`${new Date(d.date).toLocaleString()} • Vol: ${d.volume.toLocaleString()}`}</title>
        </g>
      ))}

      <text x={margin.left - 8} y={margin.top + 10} textAnchor="end" fontSize="10" fill="#666">
        {maxVol.toLocaleString()}
      </text>
      <text x={margin.left - 8} y={margin.top + innerH} dy={-2} textAnchor="end" fontSize="10" fill="#666">
        {minVol.toLocaleString()}
      </text>

      {data.map((d, i) =>
        i % tickEvery === 0 ? (
          <text key={i} x={xs[i]} y={margin.top + innerH + 14} fontSize="10" textAnchor="middle" fill="#666">
            {fmtTick(d.date)}
          </text>
        ) : null
      )}

      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="#888">
        {isIntraday ? 'Time' : 'Date'}
      </text>
      <text x={12} y={margin.top + 12} fontSize="10" fill="#888">
        Volume
      </text>
    </svg>
  );
};

export default VolumeChart;
