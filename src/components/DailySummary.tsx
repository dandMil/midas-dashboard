import React, { useEffect, useMemo, useState } from 'react';
import { fetchDailySummary, fetchCryptoSummary, purchaseAsset, sellAsset, /* NEW: */ fetchAssetVolume } from '../services/api.tsx';
import './css/spinner.css';
import './css/DailySummary.css';

type VolumePoint = { date: string; volume: number };


const VolumeChart: React.FC<{ data: VolumePoint[]; width?: number; height?: number }> = ({
  data,
  width = 720,
  height = 240,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: VolumePoint } | null>(null);
  const margin = { top: 10, right: 12, bottom: 24, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const {
    xs,
    ys,
    pathD,
    minVol,
    maxVol,
    tickEvery,
  } = useMemo(() => {
    const n = data.length;
    const vols = data.map(d => d.volume);
    const minVol = Math.min(...vols, 0);
    const maxVol = Math.max(...vols, 1);
    const yRange = Math.max(1, maxVol - minVol);

    // x positions (even spacing by index)
    const xs = data.map((_, i) => {
      if (n === 1) return margin.left + innerW / 2;
      return margin.left + (i * innerW) / (n - 1);
    });

    // y scale (invert because SVG y grows downward)
    const ys = data.map(d => {
      const t = (d.volume - minVol) / yRange; // 0..1
      return margin.top + (1 - t) * innerH;
    });

    // Build simple polyline path: M x0 y0 L x1 y1 ...
    let pathD = '';
    if (n > 0) {
      pathD = `M ${xs[0]} ${ys[0]}`;
      for (let i = 1; i < n; i++) pathD += ` L ${xs[i]} ${ys[i]}`;
    }

    // ~6 x-ticks
    const tickEvery = Math.max(1, Math.floor((n || 1) / 6));

    return { xs, ys, pathD, minVol, maxVol, tickEvery };
  }, [data, innerW, innerH, margin.left, margin.top]);

  return (
    <svg width={width} height={height} role="img" aria-label="Volume line chart">
      {/* Axes */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={margin.top + innerH}
        stroke="var(--border-primary)"
        strokeWidth={1}
      />
      <line
        x1={margin.left}
        y1={margin.top + innerH}
        x2={margin.left + innerW}
        y2={margin.top + innerH}
        stroke="var(--border-primary)"
        strokeWidth={1}
      />

      {/* Optional horizontal gridlines (quartiles) */}
      {Array.from({ length: 3 }).map((_, i) => {
        const y = margin.top + ((i + 1) * innerH) / 4;
        return (
          <line
            key={`grid-${i}`}
            x1={margin.left}
            x2={margin.left + innerW}
            y1={y}
            y2={y}
            stroke="var(--border-secondary)"
            strokeWidth={1}
            opacity={0.3}
          />
        );
      })}

      {/* Line path */}
      {data.length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          style={{ 
            transition: 'stroke-width 0.2s ease',
            strokeWidth: hoveredPoint ? 3 : 2
          }}
        />
      )}

      {/* Points with hover functionality */}
      {data.map((d, i) => (
        <g key={i}>
          {/* Invisible larger hit area for better hover detection */}
          <circle 
            cx={xs[i]} 
            cy={ys[i]} 
            r={8} 
            fill="transparent"
            onMouseEnter={() => setHoveredPoint({ x: xs[i], y: ys[i], data: d })}
            onMouseLeave={() => setHoveredPoint(null)}
            style={{ cursor: 'pointer' }}
          />
          {/* Visible point */}
          <circle 
            cx={xs[i]} 
            cy={ys[i]} 
            r={hoveredPoint?.data === d ? 4 : 2.5} 
            fill={hoveredPoint?.data === d ? "var(--accent-primary)" : "var(--accent-secondary)"}
            stroke={hoveredPoint?.data === d ? "var(--text-primary)" : "none"}
            strokeWidth={hoveredPoint?.data === d ? 1 : 0}
            style={{ 
              transition: 'all 0.2s ease',
              filter: hoveredPoint?.data === d ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none'
            }}
          />
        </g>
      ))}

      {/* Hover tooltip */}
      {hoveredPoint && (
        <g className="tooltip">
          {/* Calculate tooltip position to avoid going off-screen */}
          {(() => {
            const tooltipWidth = 120;
            const tooltipHeight = 50;
            const padding = 10;
            
            // Calculate x position
            let tooltipX = hoveredPoint.x + padding;
            if (tooltipX + tooltipWidth > width - margin.right) {
              tooltipX = hoveredPoint.x - tooltipWidth - padding;
            }
            
            // Calculate y position
            let tooltipY = hoveredPoint.y - tooltipHeight - padding;
            if (tooltipY < margin.top) {
              tooltipY = hoveredPoint.y + padding;
            }
            
            const textOffsetX = tooltipX + 5;
            const textOffsetY = tooltipY + 15;
            
            return (
              <>
                {/* Tooltip background */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  fill="var(--bg-tertiary)"
                  stroke="var(--border-accent)"
                  strokeWidth={1}
                  rx={4}
                  ry={4}
                  opacity={0.95}
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                />
                {/* Date text */}
                <text
                  x={textOffsetX}
                  y={textOffsetY}
                  fontSize="10"
                  fill="var(--text-primary)"
                  fontFamily="var(--font-family-primary)"
                  fontWeight="600"
                >
                  {new Date(hoveredPoint.data.date).toLocaleDateString()}
                </text>
                {/* Volume text */}
                <text
                  x={textOffsetX}
                  y={textOffsetY + 15}
                  fontSize="10"
                  fill="var(--accent-primary)"
                  fontFamily="var(--font-family-primary)"
                  fontWeight="600"
                >
                  Vol: {hoveredPoint.data.volume.toLocaleString()}
                </text>
              </>
            );
          })()}
        </g>
      )}

      {/* Y-axis labels (min/max) */}
      <text x={margin.left - 8} y={margin.top + 10} textAnchor="end" fontSize="10" fill="var(--text-muted)">
        {maxVol.toLocaleString()}
      </text>
      <text
        x={margin.left - 8}
        y={margin.top + innerH}
        dy={-2}
        textAnchor="end"
        fontSize="10"
        fill="var(--text-muted)"
      >
        {minVol.toLocaleString()}
      </text>

      {/* X-axis ticks */}
      {data.map((d, i) =>
        i % tickEvery === 0 ? (
          <text
            key={`tick-${i}`}
            x={xs[i]}
            y={margin.top + innerH + 14}
            fontSize="10"
            textAnchor="middle"
            fill="var(--text-muted)"
          >
            {new Date(d.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
          </text>
        ) : null
      )}

      {/* Axes labels */}
      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
        Date
      </text>
      <text x={12} y={margin.top + 12} fontSize="10" fill="var(--text-secondary)">
        Volume
      </text>
    </svg>
  );
};



const DailySummary: React.FC = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});

  // NEW: selection + volume state
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [volume, setVolume] = useState<VolumePoint[] | null>(null);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [volumeError, setVolumeError] = useState<string | null>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });

  // Asset type tabs state
  const [activeAssetType, setActiveAssetType] = useState<'crypto' | 'stocks' | 'forex'>('stocks');

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        let rawData;
        console.log('Loading data for asset type:', activeAssetType);
        
        switch (activeAssetType) {
          case 'crypto':
            console.log('=== CRYPTO TAB SELECTED ===');
            console.log('About to call fetchCryptoSummary()...');
            try {
              rawData = await fetchCryptoSummary();
              console.log('✅ Crypto API call successful!');
              console.log('Crypto data received:', rawData);
            } catch (cryptoError) {
              console.error('❌ Crypto API call failed:', cryptoError);
              console.warn('Falling back to daily summary...');
              rawData = await fetchDailySummary();
              console.log('Fallback data received:', rawData);
            }
            break;
          case 'stocks':
            console.log('Fetching stocks summary...');
            rawData = await fetchDailySummary();
            console.log('Stocks data received:', rawData);
            break;
          case 'forex':
            console.log('Fetching forex summary...');
            rawData = await fetchDailySummary();
            console.log('Forex data received:', rawData);
            break;
          default:
            rawData = await fetchDailySummary();
            break;
        }

        // Transform the data structure to match expected format
        let transformedData;
        if (rawData && typeof rawData === 'object' && 'top_gainers' in rawData) {
          // New API structure with top_gainers, top_losers, reddit_mentions
          const allTickers = [
            ...(rawData.top_gainers || []),
            ...(rawData.top_losers || [])
          ];
          
          transformedData = allTickers.map((item: any) => ({
            ticker: item.ticker,
            strategy: 'Market Analysis',
            signal: rawData.top_gainers?.some((g: any) => g.ticker === item.ticker) ? 'BUY' : 'SELL',
            price: item.close_price || 0,
            stop_loss: item.close_price ? item.close_price * 0.95 : 0, // 5% below current price
            take_profit: item.close_price ? item.close_price * 1.05 : 0, // 5% above current price
            expected_profit: item.close_price ? item.close_price * 0.05 : 0,
            expected_loss: item.close_price ? item.close_price * 0.05 : 0,
            total_return: 0, // Will be calculated based on price_change when available
            log: []
          }));
        } else if (Array.isArray(rawData)) {
          // Original API structure - array of summary items
          transformedData = rawData;
        } else {
          // Fallback - empty array
          transformedData = [];
        }
        
        console.log('Transformed data:', transformedData);
        setSummary(transformedData);
      } catch (error) {
        console.error("Failed to load summary:", error);
        setSummary([]);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [activeAssetType]);

  const handleShareChange = (key: string, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setShareCounts(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleBuy = async (
    ticker: string,
    shares: number,
    current_price: number,
    stop_loss: number,
    take_profit: number
  ) => {
    if (shares <= 0) return alert("Please enter number of shares to buy");
    const payload = { ticker, shares, current_price, stop_loss, take_profit };
    const response = await purchaseAsset(payload);
    console.log("Buy response:", response);
  };

  const handleSell = async (
    ticker: string,
    shares: number,
    current_price: number,
    stop_loss: number,
    take_profit: number
  ) => {
    if (shares <= 0) return alert("Please enter number of shares to sell");
    const payload = { ticker, shares, current_price, stop_loss, take_profit };
    const response = await sellAsset(payload);
    console.log("Sell response:", response);
  };

  // NEW: click handler to load volume
  const handleSelectTicker = async (ticker: string) => {
    setSelectedTicker(ticker);
    setVolume(null);
    setVolumeError(null);
    setVolumeLoading(true);
    try {
      // implement fetchAssetVolume in ../services/api.tsx
      const data: VolumePoint[] = await fetchAssetVolume(ticker, '1M'); // e.g., last month
      setVolume(data);
    } catch (e: any) {
      console.error('Failed to load volume:', e);
      setVolumeError('Failed to load volume data');
    } finally {
      setVolumeLoading(false);
    }
  };

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    
    setSortConfig({ key: direction ? key : null, direction });
  };

  // Sort summary data with hold signals at bottom and column sorting
  const sortedSummary = useMemo(() => {
    return [...summary].sort((a, b) => {
      const aIsHold = a.signal?.toLowerCase() === 'hold';
      const bIsHold = b.signal?.toLowerCase() === 'hold';
      
      // Always put hold signals at the bottom
      if (aIsHold && !bIsHold) return 1;
      if (!aIsHold && bIsHold) return -1;
      
      // If both are hold or both are not hold, apply column sorting
      if (sortConfig.key && sortConfig.direction) {
        let aValue: number | string;
        let bValue: number | string;
        
        switch (sortConfig.key) {
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'take_profit':
            aValue = a.take_profit || 0;
            bValue = b.take_profit || 0;
            break;
          default:
            return 0;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (sortConfig.direction === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        }
      }
      
      // Maintain original order if no sorting or same values
      return 0;
    });
  }, [summary, sortConfig]);

  const renderLog = (log: any[]) => {
    return (
      <ul style={{ margin: 0, paddingLeft: '1em' }}>
        {log.map((entry, i) => (
          <li key={i}>
            {entry.date}: {entry.action.toUpperCase()} @ ${entry.price.toFixed(2)}<br />
            SL: ${entry.stop_loss.toFixed(2)}, TP: ${entry.take_profit.toFixed(2)}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="spinner-text">Loading daily trade summary...</p>
      </div>
    );
  }

  return (
    <div className="daily-summary-container">
      <h2>Top Movers and Mentions</h2>
      
      {/* Asset Type Tabs */}
      <div className="asset-tabs">
        <div className="asset-tabs-header">
          <span className="current-asset-type">
            Currently viewing: {activeAssetType.toUpperCase()}
          </span>
        </div>
        <div className="asset-tabs-buttons">
          <button
            className={`asset-tab ${activeAssetType === 'crypto' ? 'active' : ''}`}
            onClick={() => {
              console.log('🖱️ Crypto tab clicked!');
              setActiveAssetType('crypto');
            }}
          >
            <span className="tab-icon">₿</span>
            Crypto
          </button>
          <button
            className={`asset-tab ${activeAssetType === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveAssetType('stocks')}
          >
            <span className="tab-icon">📈</span>
            Stocks
          </button>
          <button
            className={`asset-tab ${activeAssetType === 'forex' ? 'active' : ''}`}
            onClick={() => setActiveAssetType('forex')}
          >
            <span className="tab-icon">💱</span>
            Forex
          </button>
        </div>
      </div>
      
      <p className="text-secondary" style={{ marginTop: -8 }}>
        Tip: Click a <strong>Ticker</strong> to view its recent <strong>volume</strong> chart.
      </p>

      <div className="dashboard-layout">
        {/* Main table section */}
        <div className="table-section">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Strategy</th>
                <th>Signal</th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('price')}
                  style={{ cursor: 'pointer' }}
                >
                  Price
                  {sortConfig.key === 'price' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Stop Loss</th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('take_profit')}
                  style={{ cursor: 'pointer' }}
                >
                  Take Profit
                  {sortConfig.key === 'take_profit' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Expected Profit</th>
                <th>Expected Loss</th>
                <th>Shares</th>
                <th>Action</th>
                <th>Backtested Return</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {sortedSummary.map((item, index) => {
                const key = item.ticker;
                const shares = shareCounts[key] || 0;

                return (
                  <tr key={index}>
                    <td
                      onClick={() => handleSelectTicker(item.ticker)}
                      style={{
                        cursor: 'pointer',
                        color: selectedTicker === item.ticker ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        textDecoration: 'underline',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: '600'
                      }}
                      title="Click to view volume"
                    >
                      {item.ticker}
                    </td>
                    <td>{item.strategy}</td>
                    <td>{item.signal}</td>
                    <td>{item.price != null ? `$${item.price.toFixed(2)}` : '—'}</td>
                    <td>{item.stop_loss != null ? `$${item.stop_loss.toFixed(2)}` : '—'}</td>
                    <td>{item.take_profit != null ? `$${item.take_profit.toFixed(2)}` : '—'}</td>
                    <td>{item.expected_profit != null ? `$${item.expected_profit.toFixed(2)}` : '—'}</td>
                    <td>{item.expected_loss != null ? `$${item.expected_loss.toFixed(2)}` : '—'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={shares}
                        onChange={(e) => handleShareChange(key, e.target.value)}
                        style={{ width: '60px' }}
                      />
                    </td>
                    <td>
                      <button
                        className="primary"
                        onClick={() =>
                          handleBuy(item.ticker, shares, item.price, item.stop_loss, item.take_profit)
                        }
                        style={{ marginBottom: '4px' }}
                      >
                        Buy
                      </button>
                      <br />
                      <button
                        onClick={() =>
                          handleSell(item.ticker, shares, item.price, item.stop_loss, item.take_profit)
                        }
                      >
                        Sell
                      </button>
                    </td>
                    <td>{item.total_return != null ? `${item.total_return.toFixed(2)}%` : '—'}</td>
                    <td>{renderLog(item.log)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Volume chart section - prominent position */}
        {selectedTicker && (
          <div className="volume-section">
            <div className="volume-chart-container">
              <div className="volume-header">
                <h3>Volume Analysis — {selectedTicker}</h3>
                <button 
                  className="close-volume-btn"
                  onClick={() => setSelectedTicker(null)}
                  title="Close volume chart"
                >
                  ×
                </button>
              </div>
              {volumeLoading && (
                <div className="volume-loading">
                  <div className="spinner"></div>
                  <p className="spinner-text">Loading volume data...</p>
                </div>
              )}
              {volumeError && (
                <div className="volume-error">
                  <p className="error-text">{volumeError}</p>
                  <button 
                    onClick={() => handleSelectTicker(selectedTicker)}
                    className="retry-btn"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!volumeLoading && !volumeError && volume && volume.length > 0 && (
                <div className="volume-chart-wrapper">
                  <VolumeChart data={volume} />
                </div>
              )}
              {!volumeLoading && !volumeError && volume && volume.length === 0 && (
                <div className="volume-empty">
                  <p className="text-secondary">No volume data available for this range.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder when no ticker selected */}
        {!selectedTicker && (
          <div className="volume-placeholder">
            <div className="volume-chart-container">
              <h3>Volume Analysis</h3>
              <div className="placeholder-content">
                <div className="placeholder-icon">📊</div>
                <p className="text-secondary">Select a ticker from the table above to view volume analysis</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySummary;
