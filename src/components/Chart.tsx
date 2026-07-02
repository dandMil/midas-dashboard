import React, { useMemo } from 'react';
import PriceVolumeChart from './PriceVolumeChart.tsx';

/**
 * Portfolio / tables: price candles + volume + S/R in one view (same data as research).
 * `timeRange` maps to days of history (×30 days per unit, min 14, max 730).
 */
const StockChart: React.FC<{ ticker: string; timeRange: number }> = ({ ticker, timeRange }) => {
  const days = useMemo(() => {
    const t = timeRange || 1;
    return Math.min(730, Math.max(14, t * 30));
  }, [timeRange]);

  return <PriceVolumeChart ticker={ticker} days={days} />;
};

export default StockChart;
