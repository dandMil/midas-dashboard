import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TickerDetailView from './TickerDetailView.tsx';
import { fetchStockScreener, doPaperTransaction} from '../services/api.tsx';
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
  const [transactionData, setTransactionData] = useState<{[key: string]: {
    transactionType: 'buy' | 'sell';
    quantity: string;
    price: string;
    stopLoss: string;
    takeProfit: string;
    stopLossType: 'percentage' | 'absolute';
    stopLossPercentage: string;
    stopLossAbsolute: string;
    takeProfitType: 'percentage' | 'absolute';
    takeProfitPercentage: string;
    takeProfitAbsolute: string;
  }}>({});

  // Batch buying selection state
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [batchSelectionMode, setBatchSelectionMode] = useState<'all' | 'none' | 'bullish' | 'bearish' | 'score_range' | 'manual'>('none');
  const [scoreRange, setScoreRange] = useState({ min: '', max: '' });
  const [batchBuying, setBatchBuying] = useState(false);
  
  // Batch trade configuration
  const [batchTradeConfig, setBatchTradeConfig] = useState({
    quantity: '100',
    stopLossType: 'percentage' as 'percentage' | 'absolute',
    stopLossPercentage: '5',
    stopLossAbsolute: '',
    takeProfitType: 'percentage' as 'percentage' | 'absolute',
    takeProfitPercentage: '10',
    takeProfitAbsolute: '',
  });

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

  // Calculate suggested stop loss and take profit based on ADR or default percentages
  const calculateSuggestedStopLoss = (currentPrice: number, adrPercentage?: number) => {
    if (adrPercentage && adrPercentage > 0) {
      // Use 2x ADR as stop loss distance (conservative)
      const stopLossPct = (adrPercentage * 2) / 100;
      return Math.max(currentPrice * (1 - stopLossPct), currentPrice * 0.95); // Max 5% loss
    }
    // Default 5% stop loss
    return currentPrice * 0.95;
  };

  const calculateSuggestedTakeProfit = (currentPrice: number, adrPercentage?: number) => {
    if (adrPercentage && adrPercentage > 0) {
      // Use 3x ADR as take profit target
      const takeProfitPct = (adrPercentage * 3) / 100;
      return currentPrice * (1 + takeProfitPct);
    }
    // Default 10% take profit
    return currentPrice * 1.10;
  };

  // Calculate projected profit/loss if stop loss is reached
  const calculateProjectedStopLossPL = (currentPrice: number, stopLoss: number, quantity: number) => {
    if (!currentPrice || !stopLoss || !quantity) return 0;
    return (stopLoss - currentPrice) * quantity;
  };

  // Calculate projected profit/loss if take profit is reached
  const calculateProjectedTakeProfitPL = (currentPrice: number, takeProfit: number, quantity: number) => {
    if (!currentPrice || !takeProfit || !quantity) return 0;
    return (takeProfit - currentPrice) * quantity;
  };

  const handleTransactionTypeChange = (ticker: string, transactionType: 'buy' | 'sell', item?: any) => {
    setTransactionData(prev => {
      const currentPrice = parseFloat(prev[ticker]?.price || item?.current_price || '0');
      const adrPct = item?.adr_percentage;
      
      // Only suggest stop loss/take profit for buys
      let suggestedStopLossPct = '';
      let suggestedTakeProfitPct = '';
      let suggestedStopLossAbs = '';
      let suggestedTakeProfitAbs = '';
      
      if (transactionType === 'buy' && currentPrice > 0) {
        const suggestedStopLossValue = calculateSuggestedStopLoss(currentPrice, adrPct);
        const suggestedTakeProfitValue = calculateSuggestedTakeProfit(currentPrice, adrPct);
        
        // Calculate percentage values
        const stopLossPct = ((currentPrice - suggestedStopLossValue) / currentPrice) * 100;
        const takeProfitPct = ((suggestedTakeProfitValue - currentPrice) / currentPrice) * 100;
        
        suggestedStopLossPct = stopLossPct.toFixed(1);
        suggestedTakeProfitPct = takeProfitPct.toFixed(1);
        suggestedStopLossAbs = suggestedStopLossValue.toFixed(2);
        suggestedTakeProfitAbs = suggestedTakeProfitValue.toFixed(2);
      }

      return {
        ...prev,
        [ticker]: {
          ...prev[ticker],
          transactionType,
          quantity: prev[ticker]?.quantity || '100',
          price: prev[ticker]?.price || (item?.current_price?.toString() || ''),
          stopLoss: prev[ticker]?.stopLoss || '',
          takeProfit: prev[ticker]?.takeProfit || '',
          stopLossType: prev[ticker]?.stopLossType || 'percentage',
          stopLossPercentage: prev[ticker]?.stopLossPercentage || suggestedStopLossPct,
          stopLossAbsolute: prev[ticker]?.stopLossAbsolute || suggestedStopLossAbs,
          takeProfitType: prev[ticker]?.takeProfitType || 'percentage',
          takeProfitPercentage: prev[ticker]?.takeProfitPercentage || suggestedTakeProfitPct,
          takeProfitAbsolute: prev[ticker]?.takeProfitAbsolute || suggestedTakeProfitAbs
        }
      };
    });
  };

  const handleTransactionInputChange = (ticker: string, field: string, value: string) => {
    setTransactionData(prev => {
      const currentData = prev[ticker] || {
        transactionType: 'buy' as 'buy' | 'sell',
        quantity: '100',
        price: '',
        stopLoss: '',
        takeProfit: '',
        stopLossType: 'percentage' as 'percentage' | 'absolute',
        stopLossPercentage: '5',
        stopLossAbsolute: '',
        takeProfitType: 'percentage' as 'percentage' | 'absolute',
        takeProfitPercentage: '10',
        takeProfitAbsolute: ''
      };
      
      const updated = {
        ...currentData,
        [field]: value
      };
      
      const price = parseFloat(updated.price || '0');
      
      // When price changes, recalculate absolute values based on current percentage if in percentage mode
      if (field === 'price' && price > 0) {
        if (updated.stopLossType === 'percentage') {
          const pct = parseFloat(updated.stopLossPercentage || '0');
          updated.stopLossAbsolute = (price * (1 - pct / 100)).toFixed(2);
        }
        if (updated.takeProfitType === 'percentage') {
          const pct = parseFloat(updated.takeProfitPercentage || '0');
          updated.takeProfitAbsolute = (price * (1 + pct / 100)).toFixed(2);
        }
      }
      
      // When stop loss percentage changes, update absolute value
      if (field === 'stopLossPercentage' && price > 0 && updated.stopLossType === 'percentage') {
        const pct = parseFloat(value || '0');
        updated.stopLossAbsolute = (price * (1 - pct / 100)).toFixed(2);
      }
      
      // When take profit percentage changes, update absolute value
      if (field === 'takeProfitPercentage' && price > 0 && updated.takeProfitType === 'percentage') {
        const pct = parseFloat(value || '0');
        updated.takeProfitAbsolute = (price * (1 + pct / 100)).toFixed(2);
      }
      
      // When stop loss absolute changes, update percentage value
      if (field === 'stopLossAbsolute' && price > 0) {
        const abs = parseFloat(value || '0');
        if (abs > 0) {
          const pct = ((price - abs) / price) * 100;
          updated.stopLossPercentage = Math.max(0, pct).toFixed(1);
        }
      }
      
      // When take profit absolute changes, update percentage value
      if (field === 'takeProfitAbsolute' && price > 0) {
        const abs = parseFloat(value || '0');
        if (abs > 0) {
          const pct = ((abs - price) / price) * 100;
          updated.takeProfitPercentage = Math.max(0, pct).toFixed(1);
        }
      }
      
      // When switching stop loss type, sync the display value
      if (field === 'stopLossType') {
        if (updated.stopLossType === 'percentage' && price > 0) {
          const pct = parseFloat(updated.stopLossPercentage || '0');
          updated.stopLossAbsolute = (price * (1 - pct / 100)).toFixed(2);
        } else if (updated.stopLossType === 'absolute' && price > 0) {
          const abs = parseFloat(updated.stopLossAbsolute || '0');
          if (abs > 0) {
            const pct = ((price - abs) / price) * 100;
            updated.stopLossPercentage = Math.max(0, pct).toFixed(1);
          }
        }
      }
      
      // When switching take profit type, sync the display value
      if (field === 'takeProfitType') {
        if (updated.takeProfitType === 'percentage' && price > 0) {
          const pct = parseFloat(updated.takeProfitPercentage || '0');
          updated.takeProfitAbsolute = (price * (1 + pct / 100)).toFixed(2);
        } else if (updated.takeProfitType === 'absolute' && price > 0) {
          const abs = parseFloat(updated.takeProfitAbsolute || '0');
          if (abs > 0) {
            const pct = ((abs - price) / price) * 100;
            updated.takeProfitPercentage = Math.max(0, pct).toFixed(1);
          }
        }
      }
      
      return {
        ...prev,
        [ticker]: updated
      };
    });
  };

  const handleConfirmTransaction = async (ticker: string) => {
    const data = transactionData[ticker];
    if (!data) {
      setError('Please fill in all transaction fields');
      return;
    }

    const { transactionType, quantity, price, stopLossType, stopLossPercentage, stopLossAbsolute, takeProfitType, takeProfitPercentage, takeProfitAbsolute } = data;
    
    if (!quantity || !price) {
      setError('Please fill in quantity and price');
      return;
    }

    // Calculate actual stop loss and take profit values
    const entryPrice = parseFloat(price);
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;

    if (stopLossType === 'percentage') {
      const pct = parseFloat(stopLossPercentage || '0');
      if (!isNaN(pct) && pct > 0) {
        stopLoss = entryPrice * (1 - pct / 100);
      }
    } else {
      const abs = parseFloat(stopLossAbsolute || '0');
      if (!isNaN(abs) && abs > 0) {
        stopLoss = abs;
      }
    }

    if (takeProfitType === 'percentage') {
      const pct = parseFloat(takeProfitPercentage || '0');
      if (!isNaN(pct) && pct > 0) {
        takeProfit = entryPrice * (1 + pct / 100);
      }
    } else {
      const abs = parseFloat(takeProfitAbsolute || '0');
      if (!isNaN(abs) && abs > 0) {
        takeProfit = abs;
      }
    }

    try {
      setLoading(true);
      const result = await doPaperTransaction({
        ticker,
        transactionType,
        shares: parseFloat(quantity),
        current_price: entryPrice,
        stop_loss: stopLoss,
        take_profit: takeProfit
      });
      
      if (result.success) {
        alert(result.message);
        setError(null);
        // Clear the form
        setTransactionData(prev => {
          const newData = { ...prev };
          delete newData[ticker];
          return newData;
        });
      } else {
        setError(result.message || 'Transaction failed');
      }
    } catch (err: any) {
      console.error('Error executing transaction:', err);
      setError(err.message || 'Failed to execute transaction');
    } finally {
      setLoading(false);
    }
  };


  // Get stocks to buy based on selection mode
  const getStocksToBuy = (): ScreenerResult[] => {
    switch (batchSelectionMode) {
      case 'all':
        return screenerResults;
      
      case 'none':
        return [];
      
      case 'bullish':
        return screenerResults.filter(stock => stock.overall_signal === 'BULLISH');
      
      case 'bearish':
        return screenerResults.filter(stock => stock.overall_signal === 'BEARISH');
      
      case 'score_range':
        const minScore = parseFloat(scoreRange.min) || -Infinity;
        const maxScore = parseFloat(scoreRange.max) || Infinity;
        return screenerResults.filter(stock => {
          const score = stock.overall_score;
          return score >= minScore && score <= maxScore;
        });
      
      case 'manual':
        return screenerResults.filter(stock => selectedTickers.has(stock.ticker));
      
      default:
        return [];
    }
  };

  const handleSelectionModeChange = (mode: typeof batchSelectionMode) => {
    setBatchSelectionMode(mode);
    
    // Auto-select stocks based on mode
    if (mode === 'all') {
      setSelectedTickers(new Set(screenerResults.map(s => s.ticker)));
    } else if (mode === 'none') {
      setSelectedTickers(new Set());
    } else if (mode === 'bullish' || mode === 'bearish' || mode === 'score_range') {
      // Will be filtered in getStocksToBuy
      setSelectedTickers(new Set());
    } else if (mode === 'manual') {
      // Keep current selection
    }
  };

  const handleToggleTickerSelection = (ticker: string) => {
    setBatchSelectionMode('manual');
    const newSelection = new Set(selectedTickers);
    if (newSelection.has(ticker)) {
      newSelection.delete(ticker);
    } else {
      newSelection.add(ticker);
    }
    setSelectedTickers(newSelection);
  };

  const handleBatchBuy = async () => {
    const stocksToBuy = getStocksToBuy();
    
    if (stocksToBuy.length === 0) {
      setError('No stocks selected for purchase. Please select stocks using the filters or checkboxes.');
      return;
    }

    const quantity = parseFloat(batchTradeConfig.quantity) || 0;

    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Validate stop loss and take profit based on type
    let stopLossValid = false;
    let takeProfitValid = false;

    if (batchTradeConfig.stopLossType === 'percentage') {
      const stopLossPct = parseFloat(batchTradeConfig.stopLossPercentage);
      stopLossValid = !isNaN(stopLossPct) && stopLossPct > 0 && stopLossPct <= 100;
    } else {
      stopLossValid = !isNaN(parseFloat(batchTradeConfig.stopLossAbsolute)) && parseFloat(batchTradeConfig.stopLossAbsolute) > 0;
    }

    if (batchTradeConfig.takeProfitType === 'percentage') {
      const takeProfitPct = parseFloat(batchTradeConfig.takeProfitPercentage);
      takeProfitValid = !isNaN(takeProfitPct) && takeProfitPct > 0;
    } else {
      takeProfitValid = !isNaN(parseFloat(batchTradeConfig.takeProfitAbsolute)) && parseFloat(batchTradeConfig.takeProfitAbsolute) > 0;
    }

    if (!stopLossValid || !takeProfitValid) {
      setError('Please enter valid stop loss and take profit values (percentages or absolute prices)');
      return;
    }

    if (!window.confirm(`Buy ${stocksToBuy.length} selected stocks? This will execute ${stocksToBuy.length} paper trading transactions.`)) {
      return;
    }

    setBatchBuying(true);
    setError(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < stocksToBuy.length; i++) {
        const stock = stocksToBuy[i];
        try {
          // Calculate stop loss and take profit based on current price and type
          let stopLoss: number;
          let takeProfit: number;

          if (batchTradeConfig.stopLossType === 'percentage') {
            const stopLossPct = parseFloat(batchTradeConfig.stopLossPercentage) / 100;
            stopLoss = stock.current_price * (1 - stopLossPct); // Percentage decrease
          } else {
            stopLoss = parseFloat(batchTradeConfig.stopLossAbsolute);
          }

          if (batchTradeConfig.takeProfitType === 'percentage') {
            const takeProfitPct = parseFloat(batchTradeConfig.takeProfitPercentage) / 100;
            takeProfit = stock.current_price * (1 + takeProfitPct); // Percentage increase
          } else {
            takeProfit = parseFloat(batchTradeConfig.takeProfitAbsolute);
          }

          await doPaperTransaction({
            ticker: stock.ticker,
            transactionType: 'buy',
            shares: quantity,
            current_price: stock.current_price,
            stop_loss: stopLoss,
            take_profit: takeProfit
          });

          successCount++;
        } catch (err: any) {
          console.error(`Error buying ${stock.ticker}:`, err);
          failCount++;
          // Continue with next stock
        }
      }

      if (successCount > 0) {
        setError(`Successfully purchased ${successCount} stock(s).${failCount > 0 ? ` ${failCount} failed.` : ''}`);
      } else {
        setError(`Failed to purchase any stocks. ${failCount} error(s).`);
      }

      // Clear selection after successful batch buy
      if (successCount > 0) {
        setSelectedTickers(new Set());
        setBatchSelectionMode('none');
      }
    } catch (err: any) {
      console.error('Error in batch buy:', err);
      setError(`Batch buy failed: ${err.message}`);
    } finally {
      setBatchBuying(false);
    }
  };

  const handleResultExpand = (ticker: string, item?: any) => {
    const wasExpanded = expandedResults[ticker];
    setExpandedResults(prev => ({
      ...prev,
      [ticker]: !prev[ticker]
    }));
    
    // Initialize transaction with defaults when expanding for the first time
    if (!wasExpanded && item && !transactionData[ticker]) {
      const currentPrice = item.current_price || 0;
      const adrPct = item.adr_percentage;
      const suggestedStopLossValue = calculateSuggestedStopLoss(currentPrice, adrPct);
      const suggestedTakeProfitValue = calculateSuggestedTakeProfit(currentPrice, adrPct);
      
      // Calculate percentage values
      const stopLossPct = currentPrice > 0 ? ((currentPrice - suggestedStopLossValue) / currentPrice) * 100 : 5;
      const takeProfitPct = currentPrice > 0 ? ((suggestedTakeProfitValue - currentPrice) / currentPrice) * 100 : 10;

      setTransactionData(prev => ({
        ...prev,
        [ticker]: {
          transactionType: 'buy',
          quantity: '100', // Default to 100 shares
          price: currentPrice.toString(),
          stopLoss: '',
          takeProfit: '',
          stopLossType: 'percentage',
          stopLossPercentage: stopLossPct.toFixed(1),
          stopLossAbsolute: suggestedStopLossValue.toFixed(2),
          takeProfitType: 'percentage',
          takeProfitPercentage: takeProfitPct.toFixed(1),
          takeProfitAbsolute: suggestedTakeProfitValue.toFixed(2)
        }
      }));
    }
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
            {/* Batch Selection & Configuration */}
            {screenerResults.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Batch Purchase Selection</h4>
                
                {/* Batch Selection Controls */}
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '14px' }}>Select Stocks:</h5>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="batchSelection"
                        checked={batchSelectionMode === 'all'}
                        onChange={() => handleSelectionModeChange('all')}
                        style={{ marginRight: '8px' }}
                      />
                      All Stocks ({screenerResults.length})
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="batchSelection"
                        checked={batchSelectionMode === 'bullish'}
                        onChange={() => handleSelectionModeChange('bullish')}
                        style={{ marginRight: '8px' }}
                      />
                      All Bullish ({screenerResults.filter(s => s.overall_signal === 'BULLISH').length})
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="batchSelection"
                        checked={batchSelectionMode === 'bearish'}
                        onChange={() => handleSelectionModeChange('bearish')}
                        style={{ marginRight: '8px' }}
                      />
                      All Bearish ({screenerResults.filter(s => s.overall_signal === 'BEARISH').length})
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="batchSelection"
                        checked={batchSelectionMode === 'score_range'}
                        onChange={() => handleSelectionModeChange('score_range')}
                        style={{ marginRight: '8px' }}
                      />
                      Score Range
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="batchSelection"
                        checked={batchSelectionMode === 'manual'}
                        onChange={() => handleSelectionModeChange('manual')}
                        style={{ marginRight: '8px' }}
                      />
                      Manual Selection ({selectedTickers.size})
                    </label>
                  </div>

                  {/* Score Range Inputs */}
                  {batchSelectionMode === 'score_range' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Min Score:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={scoreRange.min}
                        onChange={(e) => setScoreRange({ ...scoreRange, min: e.target.value })}
                        placeholder="e.g. 0"
                        style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                      />
                      <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Max Score:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={scoreRange.max}
                        onChange={(e) => setScoreRange({ ...scoreRange, max: e.target.value })}
                        placeholder="e.g. 5"
                        style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ({getStocksToBuy().length} stocks match)
                      </span>
                    </div>
                  )}

                  {/* Batch Trade Configuration */}
                  <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '15px', marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Batch Trade Configuration</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-primary)' }}>Quantity (Shares):</label>
                        <input
                          type="number"
                          value={batchTradeConfig.quantity}
                          onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, quantity: e.target.value })}
                          min="1"
                          style={{ width: '100%', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                        />
                      </div>
                    </div>

                    {/* Stop Loss Configuration */}
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', border: '1px solid var(--border-primary)' }}>
                      <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block', color: 'var(--text-primary)' }}>Stop Loss:</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="batchStopLossType"
                            checked={batchTradeConfig.stopLossType === 'percentage'}
                            onChange={() => setBatchTradeConfig({ ...batchTradeConfig, stopLossType: 'percentage' })}
                            style={{ marginRight: '8px' }}
                          />
                          Percentage
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="batchStopLossType"
                            checked={batchTradeConfig.stopLossType === 'absolute'}
                            onChange={() => setBatchTradeConfig({ ...batchTradeConfig, stopLossType: 'absolute' })}
                            style={{ marginRight: '8px' }}
                          />
                          Absolute Price
                        </label>
                      </div>
                      {batchTradeConfig.stopLossType === 'percentage' ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={batchTradeConfig.stopLossPercentage}
                            onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, stopLossPercentage: e.target.value })}
                            placeholder="e.g. 5"
                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>% decrease from entry price</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={batchTradeConfig.stopLossAbsolute}
                            onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, stopLossAbsolute: e.target.value })}
                            placeholder="e.g. 10.50"
                            style={{ width: '120px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Absolute stop loss price</span>
                        </div>
                      )}
                    </div>

                    {/* Take Profit Configuration */}
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', border: '1px solid var(--border-primary)' }}>
                      <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block', color: 'var(--text-primary)' }}>Take Profit:</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="batchTakeProfitType"
                            checked={batchTradeConfig.takeProfitType === 'percentage'}
                            onChange={() => setBatchTradeConfig({ ...batchTradeConfig, takeProfitType: 'percentage' })}
                            style={{ marginRight: '8px' }}
                          />
                          Percentage
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="batchTakeProfitType"
                            checked={batchTradeConfig.takeProfitType === 'absolute'}
                            onChange={() => setBatchTradeConfig({ ...batchTradeConfig, takeProfitType: 'absolute' })}
                            style={{ marginRight: '8px' }}
                          />
                          Absolute Price
                        </label>
                      </div>
                      {batchTradeConfig.takeProfitType === 'percentage' ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={batchTradeConfig.takeProfitPercentage}
                            onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, takeProfitPercentage: e.target.value })}
                            placeholder="e.g. 10"
                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>% increase from entry price</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={batchTradeConfig.takeProfitAbsolute}
                            onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, takeProfitAbsolute: e.target.value })}
                            placeholder="e.g. 15.75"
                            style={{ width: '120px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Absolute take profit price</span>
                        </div>
                      )}
                    </div>

                    {/* Selected Count and Buy Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Selected: <strong>{getStocksToBuy().length}</strong> stocks
                      </span>
                      <button
                        className="search-button"
                        onClick={handleBatchBuy}
                        disabled={batchBuying || getStocksToBuy().length === 0}
                        style={{ padding: '10px 20px' }}
                      >
                        {batchBuying 
                          ? `Processing ${getStocksToBuy().length} purchases...` 
                          : `Buy Selected (${getStocksToBuy().length})`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {screenerResults.length > 0 ? (
              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        {batchSelectionMode === 'manual' && (
                          <input
                            type="checkbox"
                            checked={selectedTickers.size === screenerResults.length && screenerResults.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTickers(new Set(screenerResults.map(s => s.ticker)));
                              } else {
                                setSelectedTickers(new Set());
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </th>
                      <th></th>
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
                    {screenerResults.map((item, index) => {
                      const isSelected = selectedTickers.has(item.ticker);
                      const isHighlighted = batchSelectionMode === 'score_range' && getStocksToBuy().some(s => s.ticker === item.ticker);
                      
                      return (
                        <React.Fragment key={index}>
                          <tr 
                            className={`result-row ${expandedResults[item.ticker] ? 'expanded' : ''}`}
                            onClick={() => handleResultExpand(item.ticker, item)}
                            style={isSelected || isHighlighted ? { backgroundColor: 'var(--bg-hover)' } : {}}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              {batchSelectionMode === 'manual' && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleTickerSelection(item.ticker)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </td>
                            <td>
                              <button 
                                className="expand-table-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResultExpand(item.ticker, item);
                                }}
                              >
                                {expandedResults[item.ticker] ? '▼' : '▶'}
                              </button>
                            </td>
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
                        {expandedResults[item.ticker] && (
                          <tr className="expanded-table-row">
                            <td colSpan={11}>
                              <div className="table-expanded-content">
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
                                  <div className="detail-item">
                                    <span className="detail-label">Transaction Type:</span>
                                    <span className="detail-value">
                                      <select 
                                        value={transactionData[item.ticker]?.transactionType || 'buy'}
                                        onChange={(e) => handleTransactionTypeChange(item.ticker, e.target.value as 'buy' | 'sell', item)}
                                        className="transaction-type-select"
                                      >
                                        <option value="buy">Buy</option>
                                        <option value="sell">Sell</option>
                                      </select>
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Quantity:</span>
                                    <span className="detail-value">
                                      <input 
                                        type="number" 
                                        placeholder="100" 
                                        value={transactionData[item.ticker]?.quantity || '100'}
                                        onChange={(e) => handleTransactionInputChange(item.ticker, 'quantity', e.target.value)}
                                      />
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Price:</span>
                                    <span className="detail-value">
                                      <input 
                                        type="number" 
                                        placeholder="Price" 
                                        step="0.01"
                                        value={transactionData[item.ticker]?.price || item.current_price || ''}
                                        onChange={(e) => handleTransactionInputChange(item.ticker, 'price', e.target.value)}
                                      />
                                    </span>
                                  </div>
                                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <span className="detail-label">Stop Loss:</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                          <input
                                            type="radio"
                                            name={`stopLossType-${item.ticker}`}
                                            checked={(transactionData[item.ticker]?.stopLossType || 'percentage') === 'percentage'}
                                            onChange={() => handleTransactionInputChange(item.ticker, 'stopLossType', 'percentage')}
                                            style={{ marginRight: '8px' }}
                                          />
                                          Percentage
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                          <input
                                            type="radio"
                                            name={`stopLossType-${item.ticker}`}
                                            checked={(transactionData[item.ticker]?.stopLossType || 'percentage') === 'absolute'}
                                            onChange={() => handleTransactionInputChange(item.ticker, 'stopLossType', 'absolute')}
                                            style={{ marginRight: '8px' }}
                                          />
                                          Absolute Price
                                        </label>
                                      </div>
                                      {(transactionData[item.ticker]?.stopLossType || 'percentage') === 'percentage' ? (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={transactionData[item.ticker]?.stopLossPercentage || ''}
                                            onChange={(e) => handleTransactionInputChange(item.ticker, 'stopLossPercentage', e.target.value)}
                                            placeholder="e.g. 5"
                                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                          />
                                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>% decrease from entry price</span>
                                          {transactionData[item.ticker]?.price && (
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                              (${((parseFloat(transactionData[item.ticker]?.price || '0') * (1 - parseFloat(transactionData[item.ticker]?.stopLossPercentage || '0') / 100))).toFixed(2)})
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={transactionData[item.ticker]?.stopLossAbsolute || ''}
                                            onChange={(e) => handleTransactionInputChange(item.ticker, 'stopLossAbsolute', e.target.value)}
                                            placeholder="e.g. 95.50"
                                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                          />
                                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Absolute price</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <span className="detail-label">Take Profit:</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                          <input
                                            type="radio"
                                            name={`takeProfitType-${item.ticker}`}
                                            checked={(transactionData[item.ticker]?.takeProfitType || 'percentage') === 'percentage'}
                                            onChange={() => handleTransactionInputChange(item.ticker, 'takeProfitType', 'percentage')}
                                            style={{ marginRight: '8px' }}
                                          />
                                          Percentage
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                          <input
                                            type="radio"
                                            name={`takeProfitType-${item.ticker}`}
                                            checked={(transactionData[item.ticker]?.takeProfitType || 'percentage') === 'absolute'}
                                            onChange={() => handleTransactionInputChange(item.ticker, 'takeProfitType', 'absolute')}
                                            style={{ marginRight: '8px' }}
                                          />
                                          Absolute Price
                                        </label>
                                      </div>
                                      {(transactionData[item.ticker]?.takeProfitType || 'percentage') === 'percentage' ? (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={transactionData[item.ticker]?.takeProfitPercentage || ''}
                                            onChange={(e) => handleTransactionInputChange(item.ticker, 'takeProfitPercentage', e.target.value)}
                                            placeholder="e.g. 10"
                                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                          />
                                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>% increase from entry price</span>
                                          {transactionData[item.ticker]?.price && (
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                              (${((parseFloat(transactionData[item.ticker]?.price || '0') * (1 + parseFloat(transactionData[item.ticker]?.takeProfitPercentage || '0') / 100))).toFixed(2)})
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={transactionData[item.ticker]?.takeProfitAbsolute || ''}
                                            onChange={(e) => handleTransactionInputChange(item.ticker, 'takeProfitAbsolute', e.target.value)}
                                            placeholder="e.g. 110.00"
                                            style={{ width: '100px', padding: '5px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                          />
                                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Absolute price</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(() => {
                                    const quantity = parseFloat(transactionData[item.ticker]?.quantity || '100') || 100;
                                    const currentPrice = parseFloat(transactionData[item.ticker]?.price || item.current_price?.toString() || '0') || 0;
                                    
                                    // Calculate actual stop loss and take profit based on type
                                    let stopLoss = 0;
                                    let takeProfit = 0;
                                    
                                    const stopLossType = transactionData[item.ticker]?.stopLossType || 'percentage';
                                    const takeProfitType = transactionData[item.ticker]?.takeProfitType || 'percentage';
                                    
                                    if (stopLossType === 'percentage' && currentPrice > 0) {
                                      const pct = parseFloat(transactionData[item.ticker]?.stopLossPercentage || '0');
                                      stopLoss = currentPrice * (1 - pct / 100);
                                    } else if (stopLossType === 'absolute') {
                                      stopLoss = parseFloat(transactionData[item.ticker]?.stopLossAbsolute || '0');
                                    }
                                    
                                    if (takeProfitType === 'percentage' && currentPrice > 0) {
                                      const pct = parseFloat(transactionData[item.ticker]?.takeProfitPercentage || '0');
                                      takeProfit = currentPrice * (1 + pct / 100);
                                    } else if (takeProfitType === 'absolute') {
                                      takeProfit = parseFloat(transactionData[item.ticker]?.takeProfitAbsolute || '0');
                                    }
                                    
                                    const totalCost = quantity * currentPrice;
                                    const stopLossPL = calculateProjectedStopLossPL(currentPrice, stopLoss, quantity);
                                    const takeProfitPL = calculateProjectedTakeProfitPL(currentPrice, takeProfit, quantity);
                                    
                                    return (
                                      <>
                                        <div className="detail-item">
                                          <span className="detail-label">Total Cost:</span>
                                          <span className="detail-value">
                                            {quantity && currentPrice ? `$${totalCost.toFixed(2)}` : '—'}
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label">Projected P/L @ Stop Loss:</span>
                                          <span className={`detail-value ${stopLossPL >= 0 ? 'positive' : 'negative'}`}>
                                            {stopLoss && quantity ? `$${stopLossPL.toFixed(2)}` : '—'}
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label">Projected P/L @ Take Profit:</span>
                                          <span className={`detail-value ${takeProfitPL >= 0 ? 'positive' : 'negative'}`}>
                                            {takeProfit && quantity ? `$${takeProfitPL.toFixed(2)}` : '—'}
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                  <div className="detail-item">
                                    <span className="detail-label">Confirm Transaction:</span>
                                    <span className="detail-value">
                                      <button 
                                        className={`confirm-transaction-button ${transactionData[item.ticker]?.transactionType === 'buy' ? 'buy' : 'sell'}`}
                                        onClick={() => handleConfirmTransaction(item.ticker)}
                                        disabled={loading}
                                      >
                                        Confirm {transactionData[item.ticker]?.transactionType === 'buy' ? 'Purchase' : 'Sell'}
                                      </button>
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
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
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
