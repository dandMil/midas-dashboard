import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TickerDetailView from './TickerDetailView.tsx';
import { fetchStockScreener } from '../services/api.tsx';
import './css/Dashboard.css';
import './css/ScreenerView.css';
import './css/spinner.css';

interface ScreenerResult {
  ticker: string;
  current_price: number;
  performance_1m: number;
  performance_3m: number;
  performance_6m: number;
  adr_percentage: number;
  rsi: number;
  rsi_signal: string;
  macd: number;
  macd_signal: number;
  stochastic_oscillator: number;
  atr: number;
  indicator_scores: {
    MACD: number;
    RSI: number;
    SO: number;
    PRC: number;
  };
  overall_signal: string;
  overall_score: number;
  volume_avg_30d: number;
  last_updated: string;
}

interface ScreenerFilters {
  sector: string;
  min_1m_performance: number;
  min_3m_performance: number;
  min_6m_performance: number;
  max_1m_performance: number;
  max_3m_performance: number;
  max_6m_performance: number;
  min_price: number;
  max_price: number;
  min_adr: number;
  max_adr: number;
  min_rsi: number;
  max_rsi: number;
  sort_by: 'adr' | 'rsi' | 'performance_1m' | 'performance_3m' | 'performance_6m';
  sort_order: 'asc' | 'desc';
  limit: number;
}

const ScreenerView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [screenerResults, setScreenerResults] = useState<ScreenerResult[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedResults, setExpandedResults] = useState<{[key: string]: boolean}>({});

  const [filters, setFilters] = useState<ScreenerFilters>({
    sector: 'tech',
    min_1m_performance: 15,
    min_3m_performance: -100,
    min_6m_performance: -100,
    max_1m_performance: 100,
    max_3m_performance: 100,
    max_6m_performance: 100,
    min_price: 1,
    max_price: 50,
    min_adr: 0,
    max_adr: 100,
    min_rsi: 0,
    max_rsi: 100,
    sort_by: 'adr',
    sort_order: 'desc',
    limit: 50
  });

  // Check for ticker in URL params on component mount
  useEffect(() => {
    const tickerFromUrl = searchParams.get('ticker');
    
    if (tickerFromUrl) {
      setSelectedTicker(tickerFromUrl);
    }
  }, [searchParams]);

  // Fetch screener data on component mount
  useEffect(() => {
    fetchScreenerData();
  }, []);

  const fetchScreenerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching screener data with filters:', filters);
      const data = await fetchStockScreener(filters);
      console.log('Screener data received:', data);
      
      setScreenerResults(data);
    } catch (err: any) {
      console.error('Error fetching screener data:', err);
      setError(err.message || 'Failed to fetch screener data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScreenerData();
    setRefreshing(false);
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchParams({ ticker });
  };

  const handleResultExpand = (ticker: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [ticker]: !prev[ticker]
    }));
  };

  const handleFilterChange = (key: keyof ScreenerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchScreenerData();
  };

  const handleResetFilters = () => {
    setFilters({
      sector: 'tech',
      min_1m_performance: 15,
      min_3m_performance: -100,
      min_6m_performance: -100,
      max_1m_performance: 100,
      max_3m_performance: 100,
      max_6m_performance: 100,
      min_price: 1,
      max_price: 50,
      min_adr: 0,
      max_adr: 100,
      min_rsi: 0,
      max_rsi: 100,
      sort_by: 'adr',
      sort_order: 'desc',
      limit: 50
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p className="spinner-text">Loading screener data<span className="loading-dots"></span></p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchScreenerData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="search-section">
        <div className="search-bar-container">
          <h2>Stock Screener</h2>
          <p className="search-description">
            Screen stocks based on performance, price range, and technical indicators
          </p>
        </div>
      </div>

      {/* Filters Section */}
      {!selectedTicker && (
        <div className="screener-filters">
          <div className="filters-grid">
            {/* Sector Filter */}
            <div className="filter-group">
              <label>Sector:</label>
              <select 
                value={filters.sector} 
                onChange={(e) => handleFilterChange('sector', e.target.value)}
              >
                <option value="all">All Sectors</option>
                <option value="tech">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="energy">Energy</option>
                <option value="consumer">Consumer</option>
                <option value="industrial">Industrial</option>
                <option value="materials">Materials</option>
                <option value="utilities">Utilities</option>
                <option value="real_estate">Real Estate</option>
                <option value="communication">Communication</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range:</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', parseFloat(e.target.value) || 0)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            {/* Performance Filters */}
            <div className="filter-group">
              <label>1M Performance (%):</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_1m_performance}
                  onChange={(e) => handleFilterChange('min_1m_performance', parseFloat(e.target.value) || -100)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_1m_performance}
                  onChange={(e) => handleFilterChange('max_1m_performance', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>3M Performance (%):</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_3m_performance}
                  onChange={(e) => handleFilterChange('min_3m_performance', parseFloat(e.target.value) || -100)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_3m_performance}
                  onChange={(e) => handleFilterChange('max_3m_performance', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>6M Performance (%):</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_6m_performance}
                  onChange={(e) => handleFilterChange('min_6m_performance', parseFloat(e.target.value) || -100)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_6m_performance}
                  onChange={(e) => handleFilterChange('max_6m_performance', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            {/* ADR Range */}
            <div className="filter-group">
              <label>ADR Range (%):</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_adr}
                  onChange={(e) => handleFilterChange('min_adr', parseFloat(e.target.value) || 0)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_adr}
                  onChange={(e) => handleFilterChange('max_adr', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            {/* RSI Range */}
            <div className="filter-group">
              <label>RSI Range:</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_rsi}
                  onChange={(e) => handleFilterChange('min_rsi', parseFloat(e.target.value) || 0)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_rsi}
                  onChange={(e) => handleFilterChange('max_rsi', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label>Sort By:</label>
              <select 
                value={filters.sort_by} 
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <option value="adr">ADR</option>
                <option value="rsi">RSI</option>
                <option value="performance_1m">1M Performance</option>
                <option value="performance_3m">3M Performance</option>
                <option value="performance_6m">6M Performance</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order:</label>
              <select 
                value={filters.sort_order} 
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Limit:</label>
              <input
                type="number"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 50)}
                min="1"
                max="200"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="search-button" 
              onClick={handleApplyFilters}
              disabled={loading}
            >
              Apply Filters
            </button>
            <button 
              className="reset-button" 
              onClick={handleResetFilters}
              disabled={loading}
            >
              Reset
            </button>
            <button 
              className="search-button" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="research-content">
        {selectedTicker ? (
          <TickerDetailView ticker={selectedTicker} assetType="stock" />
        ) : (
          <div className="screener-results">
            {screenerResults.length > 0 ? (
              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Price</th>
                      <th>1M %</th>
                      <th>3M %</th>
                      <th>6M %</th>
                      <th>ADR %</th>
                      <th>RSI</th>
                      <th>Signal</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenerResults.map((item, index) => (
                      <tr 
                        key={index}
                        className="result-row"
                        onClick={() => handleTickerClick(item.ticker)}
                      >
                        <td className="ticker-cell">{item.ticker}</td>
                        <td>${item.current_price.toFixed(2)}</td>
                        <td className={item.performance_1m >= 0 ? 'positive' : 'negative'}>
                          {item.performance_1m.toFixed(1)}%
                        </td>
                        <td className={item.performance_3m >= 0 ? 'positive' : 'negative'}>
                          {item.performance_3m.toFixed(1)}%
                        </td>
                        <td className={item.performance_6m >= 0 ? 'positive' : 'negative'}>
                          {item.performance_6m.toFixed(1)}%
                        </td>
                        <td>{item.adr_percentage.toFixed(2)}%</td>
                        <td>{item.rsi.toFixed(1)}</td>
                        <td className={`signal ${item.overall_signal.toLowerCase()}`}>
                          {item.overall_signal}
                        </td>
                        <td>{item.overall_score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="research-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🔍</div>
                  <h3>No Results Found</h3>
                  <p>Try adjusting your filters and click "Apply Filters" to search for stocks.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!selectedTicker && screenerResults.length > 0 && (
        <div className="recent-searches">
          <h3>Quick Access - Top Results</h3>
          <div className="recent-items">
            {screenerResults.slice(0, 10).map((item, index) => (
              <div key={index} className="result-card">
                <div 
                  className={`recent-item ${selectedTicker === item.ticker ? 'active' : ''}`}
                  onClick={() => handleTickerClick(item.ticker)}
                >
                  <span className="ticker">{item.ticker}</span>
                  <span className="price">${item.current_price.toFixed(2)}</span>
                  <span className={`signal ${item.overall_signal.toLowerCase()}`}>
                    {item.overall_signal}
                  </span>
                  <span className="performance">
                    {item.performance_1m.toFixed(1)}%
                  </span>
                  <button 
                    className="expand-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResultExpand(item.ticker);
                    }}
                  >
                    {expandedResults[item.ticker] ? '▼' : '▶'}
                  </button>
                </div>
                
                {expandedResults[item.ticker] && (
                  <div className="expanded-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">3M Performance:</span>
                        <span className={`detail-value ${item.performance_3m >= 0 ? 'positive' : 'negative'}`}>
                          {item.performance_3m.toFixed(1)}%
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">6M Performance:</span>
                        <span className={`detail-value ${item.performance_6m >= 0 ? 'positive' : 'negative'}`}>
                          {item.performance_6m.toFixed(1)}%
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">ADR:</span>
                        <span className="detail-value">{item.adr_percentage.toFixed(2)}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">RSI:</span>
                        <span className="detail-value">{item.rsi.toFixed(1)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">MACD:</span>
                        <span className="detail-value">{item.macd.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Overall Score:</span>
                        <span className="detail-value">{item.overall_score.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Volume (30d avg):</span>
                        <span className="detail-value">{item.volume_avg_30d.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Updated:</span>
                        <span className="detail-value">
                          {new Date(item.last_updated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="view-details-button"
                        onClick={() => handleTickerClick(item.ticker)}
                      >
                        View Full Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenerView;
