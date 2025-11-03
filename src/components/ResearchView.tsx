import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TickerDetailView from './TickerDetailView.tsx';
import FetchedDataView from './FetchedDataView.tsx';
import { fetchTickerDetails } from '../services/api.tsx';
import './css/Dashboard.css';

interface SearchedItem {
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
}

const ResearchView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState('stock'); // Default to 'stock'
  const [searchedItems, setSearchedItems] = useState<SearchedItem[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for ticker in URL params on component mount
  useEffect(() => {
    const tickerFromUrl = searchParams.get('ticker');
    const typeFromUrl = searchParams.get('type');
    
    if (tickerFromUrl) {
      setSearchTerm(tickerFromUrl);
      setAssetType(typeFromUrl || 'stock');
      setSelectedTicker(tickerFromUrl);
    }
  }, [searchParams]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Searching for ${searchTerm} with type ${assetType}`);
      const data = await fetchTickerDetails(searchTerm.trim().toUpperCase(), assetType);
      
      // Add searched item to the list of searched items
      const newItem = {
        ticker: data.ticker || searchTerm.trim().toUpperCase(),
        market_price: data.market_price || data.price || data.currentPrice || 0,
        signal: data.signal || 'NEUTRAL',
        macd: data.macd || 0,
        price_rate_of_change: data.price_rate_of_change || data.priceRateOfChange || 0,
        rsi: data.rsi || data.relativeStrengthIndex || 0,
        stochastic_oscillator: data.stochastic_oscillator || data.stochasticOscillator || 0,
        industry: data.industry || 'Unknown',
        company_name: data.company_name || data.name || searchTerm.trim().toUpperCase(),
        sector: data.sector || 'Unknown'
      };
      
      setSearchedItems(prevItems => {
        // Remove existing item with same ticker if it exists
        const filtered = prevItems.filter(item => item.ticker !== newItem.ticker);
        return [newItem, ...filtered]; // Add new item to the beginning
      });
      
      setSelectedTicker(searchTerm.trim().toUpperCase());
      
      // Update URL params
      setSearchParams({ ticker: searchTerm.trim().toUpperCase(), type: assetType });
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch ticker data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  return (
    <div className="dashboard-container">
      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar-container">
          <h2>Research & Analysis</h2>
          <p className="search-description">Search for any ticker symbol to get detailed analysis and trading information</p>
          
          <div className="search-input-group">
            <input
              type="text"
              className="search-bar"
              placeholder="Enter ticker symbol (e.g., AAPL, TSLA, BTC)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button 
              className="search-button" 
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {error && (
            <div className="search-error">
              <p className="error-text">{error}</p>
            </div>
          )}
        </div>
        
        <div className="radio-buttons-container">
          <input
            type="radio"
            id="crypto"
            name="assetType"
            value="crypto"
            checked={assetType === 'crypto'}
            onChange={() => setAssetType('crypto')}
            disabled={loading}
          />
          <label htmlFor="crypto">Crypto</label>

          <input
            type="radio"
            id="stock"
            name="assetType"
            value="stock"
            checked={assetType === 'stock'}
            onChange={() => setAssetType('stock')}
            disabled={loading}
          />
          <label htmlFor="stock">Stock</label>
        </div>
      </div>

      {/* Main Content */}
      <div className="research-content">
        {selectedTicker ? (
          <TickerDetailView ticker={selectedTicker} assetType={assetType} />
        ) : (
          <div className="research-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🔍</div>
              <h3>Search for a Ticker</h3>
              <p>Enter a ticker symbol above to view detailed analysis, technical indicators, and trading information.</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Searches */}
      {searchedItems.length > 0 && (
        <div className="recent-searches">
          <h3>Recent Searches</h3>
          <div className="recent-items">
            {searchedItems.slice(0, 5).map((item, index) => (
              <div 
                key={index}
                className={`recent-item ${selectedTicker === item.ticker ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTicker(item.ticker);
                  setSearchParams({ ticker: item.ticker, type: assetType });
                }}
              >
                <span className="ticker">{item.ticker}</span>
                <span className="price">${item.market_price?.toFixed(2) || 'N/A'}</span>
                <span className={`signal ${item.signal?.toLowerCase()}`}>{item.signal}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchView;
