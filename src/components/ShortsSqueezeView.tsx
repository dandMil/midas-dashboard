import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TickerDetailView from './TickerDetailView.tsx';
import FetchedDataView from './FetchedDataView.tsx';
import { fetchShortsSqueeze, fetchTickerDetails } from '../services/api.tsx';
import './css/Dashboard.css';

interface ShortsSqueezeItem {
  ticker: string;
  market_price: number;
  signal: string;
  macd: number;
  price_rate_of_change: number;
  rsi: number;
  stochastic_oscillator: number;
  industry: string;
  company_name: string;
  sector: string;
  short_interest?: number;
  short_ratio?: number;
  days_to_cover?: number;
}

const ShortsSqueezeView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shortsSqueezeData, setShortsSqueezeData] = useState<ShortsSqueezeItem[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check for ticker in URL params on component mount
  useEffect(() => {
    const tickerFromUrl = searchParams.get('ticker');
    
    if (tickerFromUrl) {
      setSelectedTicker(tickerFromUrl);
    }
  }, [searchParams]);

  // Fetch shorts squeeze data on component mount
  useEffect(() => {
    fetchShortsSqueezeData();
  }, []);

  const fetchShortsSqueezeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching shorts squeeze data...');
      const data = await fetchShortsSqueeze();
      console.log('Shorts squeeze data received:', data);
      
      // Process the data to match our interface
      const processedData = data.map((item: any) => ({
        ticker: item.ticker || item.symbol,
        market_price: item.market_price || item.price || item.currentPrice,
        signal: item.signal || 'NEUTRAL',
        macd: item.macd || 0,
        price_rate_of_change: item.price_rate_of_change || item.priceRateOfChange || 0,
        rsi: item.rsi || item.relativeStrengthIndex || 0,
        stochastic_oscillator: item.stochastic_oscillator || item.stochasticOscillator || 0,
        industry: item.industry || 'Unknown',
        company_name: item.company_name || item.name || item.ticker,
        sector: item.sector || 'Unknown',
        short_interest: item.short_interest || item.shortInterest,
        short_ratio: item.short_ratio || item.shortRatio,
        days_to_cover: item.days_to_cover || item.daysToCover
      }));
      
      setShortsSqueezeData(processedData);
    } catch (err: any) {
      console.error('Error fetching shorts squeeze data:', err);
      setError(err.message || 'Failed to fetch shorts squeeze data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShortsSqueezeData();
    setRefreshing(false);
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchParams({ ticker });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading shorts squeeze data...</p>
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
          <button onClick={fetchShortsSqueezeData} className="retry-button">
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
          <h2>Shorts Squeeze Analysis</h2>
          <p className="search-description">
            Monitor stocks with high short interest and potential for short squeezes
          </p>
          
          <div className="search-input-group">
            <button 
              className="search-button" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          
          {error && (
            <div className="search-error">
              <p className="error-text">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="research-content">
        {selectedTicker ? (
          <TickerDetailView ticker={selectedTicker} assetType="stock" />
        ) : (
          <div className="shorts-squeeze-grid">
            {shortsSqueezeData.length > 0 ? (
              <FetchedDataView 
                searchData={shortsSqueezeData.map(item => ({
                  name: item.ticker,
                  marketPrice: item.market_price,
                  signal: item.signal,
                  macd: item.macd,
                  priceRateOfChange: item.price_rate_of_change,
                  relativeStrengthIndex: item.rsi,
                  stochasticOscillator: item.stochastic_oscillator,
                  shortInterest: item.short_interest,
                  shortRatio: item.short_ratio,
                  daysToCover: item.days_to_cover
                }))}
                onTickerClick={handleTickerClick}
              />
            ) : (
              <div className="research-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📊</div>
                  <h3>No Shorts Squeeze Data Available</h3>
                  <p>Click "Refresh Data" to load the latest shorts squeeze analysis.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shorts Squeeze List */}
      {!selectedTicker && shortsSqueezeData.length > 0 && (
        <div className="recent-searches">
          <h3>Potential Short Squeeze Candidates</h3>
          <div className="recent-items">
            {shortsSqueezeData.slice(0, 10).map((item, index) => (
              <div 
                key={index}
                className={`recent-item ${selectedTicker === item.ticker ? 'active' : ''}`}
                onClick={() => handleTickerClick(item.ticker)}
              >
                <span className="ticker">{item.ticker}</span>
                <span className="price">${item.market_price?.toFixed(2) || 'N/A'}</span>
                <span className={`signal ${item.signal?.toLowerCase()}`}>{item.signal}</span>
                {item.short_interest && (
                  <span className="short-interest">
                    SI: {(item.short_interest * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortsSqueezeView;
