import React, { useState, useEffect } from 'react';
import { fetchTickerDetails, fetchAssetVolume, fetchTechnicalAnalysis } from '../services/api.tsx';
import TechnicalAnalysis from './TechnicalAnalysis.tsx';
import VolumeChart from './VolumeChart.tsx';
import './css/TickerDetailView.css';

interface TickerDetailViewProps {
  ticker: string;
  assetType?: string;
}

type VolumePoint = { date: string; volume: number };
type VolumeStats = {
  period: string;
  average: number;
  total: number;
  max: number;
  min: number;
  days: number;
};

const TickerDetailView: React.FC<TickerDetailViewProps> = ({ ticker, assetType = 'stock' }) => {
  const [tickerData, setTickerData] = useState<any>(null);
  const [volume, setVolume] = useState<VolumePoint[] | null>(null);
  const [volumeStats, setVolumeStats] = useState<VolumeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState(0);

  useEffect(() => {
    loadTickerData();
    loadVolumeData();
  }, [ticker, assetType]);

  const loadTickerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickerDetails(ticker, assetType);
      setTickerData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticker data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: VolumePoint[]): VolumeStats | null => {
    if (!data || data.length === 0) return null;
    
    const volumes = data.map(d => d.volume);
    const total = volumes.reduce((sum, vol) => sum + vol, 0);
    const average = total / volumes.length;
    const max = Math.max(...volumes);
    const min = Math.min(...volumes);
    
    return {
      period: '',
      average: Math.round(average),
      total: total,
      max: max,
      min: min,
      days: data.length
    };
  };

  const loadVolumeData = async () => {
    setVolumeLoading(true);
    try {
      // Fetch volume data for all periods
      const periods = [
        { key: '1D', label: 'Last Day' },
        { key: '7D', label: '7 Days' },
        { key: '1M', label: 'Month' },
        { key: '3M', label: '3 Months' },
        { key: '6M', label: '6 Months' },
        { key: 'YTD', label: 'YTD' }
      ];

      const statsPromises = periods.map(async (period) => {
        try {
          const data = await fetchAssetVolume(ticker, period.key);
          const stats = calculateStats(data);
          if (stats) {
            stats.period = period.label;
            return stats;
          }
          return null;
        } catch (err) {
          console.error(`Failed to load volume data for ${period.label}:`, err);
          return null;
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const validStats = statsResults.filter((s): s is VolumeStats => s !== null);
      setVolumeStats(validStats);

      // Set the 1M data for the chart (default view)
      const monthData = await fetchAssetVolume(ticker, '1M');
      setVolume(monthData);
    } catch (err: any) {
      console.error('Failed to load volume data:', err);
    } finally {
      setVolumeLoading(false);
    }
  };

  const handleShareChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setShares(num);
    }
  };

  if (loading) {
    return (
      <div className="ticker-detail-loading">
        <div className="spinner"></div>
        <p className="spinner-text">Loading {ticker} details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticker-detail-error">
        <h3>Error loading {ticker}</h3>
        <p className="error-text">{error}</p>
        <button onClick={loadTickerData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!tickerData) {
    return (
      <div className="ticker-detail-error">
        <h3>No data available for {ticker}</h3>
      </div>
    );
  }

  return (
    <div className="ticker-detail-container">
      {/* Header Section */}
      <div className="ticker-header">
        <div className="ticker-info">
          <h1 className="ticker-symbol">{tickerData.ticker}</h1>
          <h2 className="company-name">{tickerData.company_name}</h2>
          <div className="ticker-meta">
            <span className="industry">Industry: {tickerData.industry}</span>
            <span className="sector">Sector: {tickerData.sector}</span>
          </div>
        </div>
        <div className="ticker-price">
          <div className="current-price">
            ${tickerData.market_price?.toFixed(2) || 'N/A'}
          </div>
          <div className={`signal ${tickerData.signal?.toLowerCase()}`}>
            {tickerData.signal}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="ticker-content-grid">
        {/* Left Column - Technical Analysis */}
        <div className="technical-section">
          <h3>Technical Analysis</h3>
          <TechnicalAnalysis
            ticker={ticker}
            isExpanded={true}
            onToggle={() => {}} // Always expanded in detail view
          />
        </div>

        {/* Right Column - Trading Actions */}
        <div className="trading-section">
          <h3>Trading Actions</h3>
          <div className="trading-card">
            <div className="shares-input">
              <label htmlFor="shares">Number of Shares:</label>
              <input
                id="shares"
                type="number"
                min="0"
                value={shares}
                onChange={(e) => handleShareChange(e.target.value)}
                placeholder="Enter shares"
              />
            </div>
            
            <div className="trading-buttons">
              <button
                className="buy-btn"
                onClick={() => {
                  if (shares <= 0) {
                    alert("Please enter number of shares to buy");
                    return;
                  }
                  // Implement buy logic here
                  console.log(`Buying ${shares} shares of ${ticker} at $${tickerData.market_price}`);
                }}
                disabled={shares <= 0}
              >
                Buy {shares} Shares
              </button>
              
              <button
                className="sell-btn"
                onClick={() => {
                  if (shares <= 0) {
                    alert("Please enter number of shares to sell");
                    return;
                  }
                  // Implement sell logic here
                  console.log(`Selling ${shares} shares of ${ticker} at $${tickerData.market_price}`);
                }}
                disabled={shares <= 0}
              >
                Sell {shares} Shares
              </button>
            </div>

            <div className="price-info">
              <div className="price-item">
                <span>Stop Loss:</span>
                <span>${tickerData.stop_loss?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="price-item">
                <span>Take Profit:</span>
                <span>${tickerData.take_profit?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Chart Section */}
      <div className="volume-section">
        <h3>Volume Analysis</h3>
        
        {/* Volume Statistics Table */}
        {volumeStats.length > 0 && (
          <div className="volume-stats-table">
            <table className="volume-stats">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Average Volume</th>
                  <th>Total Volume</th>
                  <th>Max Volume</th>
                  <th>Min Volume</th>
                </tr>
              </thead>
              <tbody>
                {volumeStats.map((stat, index) => (
                  <tr key={index}>
                    <td><strong>{stat.period}</strong></td>
                    <td>{stat.average.toLocaleString()}</td>
                    <td>{stat.total.toLocaleString()}</td>
                    <td>{stat.max.toLocaleString()}</td>
                    <td>{stat.min.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Volume Chart */}
        {volumeLoading && (
          <div className="volume-loading">
            <div className="spinner"></div>
            <p className="spinner-text">Loading volume data...</p>
          </div>
        )}
        {!volumeLoading && volume && volume.length > 0 && (
          <div className="volume-chart-wrapper">
            <h4>Volume Chart (Last Month)</h4>
            <VolumeChart data={volume} width={1000} height={300} />
          </div>
        )}
        {!volumeLoading && volume && volume.length === 0 && (
          <div className="volume-empty">
            <p className="text-secondary">No volume data available for this ticker.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerDetailView;
