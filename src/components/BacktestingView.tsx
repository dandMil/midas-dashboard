import React, { useState, useEffect } from 'react';
import { getHistoricalRankings, simulateTrade, listBacktestSessions, getBacktestSession, findBacktestSessionByDate, deleteBacktestSession } from '../services/api.tsx';
import './css/Dashboard.css';
import './css/BacktestingView.css';
import './css/spinner.css';

interface HistoricalRanking {
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

interface TradeSimulation {
  entry_date: string;
  entry_price: number;
  exit_date: string | null;
  exit_price: number | null;
  exit_reason: string | null;
  quantity: number;
  total_cost: number;
  total_proceeds: number;
  profit_loss: number;
  profit_loss_pct: number;
  hold_days: number;
  price_history?: any[];
  events?: any[];
  ticker?: string; // For batch simulations
}

interface ScreeningStrategy {
  id: string;
  name: string;
  type: 'screening';
  description: string;
  filters: {
    sector?: string;
    min_price?: number;
    max_price?: number;
    min_adr?: number;
    max_adr?: number;
    min_1m_performance?: number;
    max_1m_performance?: number;
    min_3m_performance?: number;
    max_3m_performance?: number;
    min_6m_performance?: number;
    max_6m_performance?: number;
    sort_by: string;
    sort_order: string;
  };
}

interface SellingStrategy {
  id: string;
  name: string;
  type: 'selling';
  description: string;
  config: {
    stop_loss_method?: string; // 'percentage', 'atr', 'fixed'
    take_profit_method?: string;
    max_hold_days?: number;
  };
}

const BacktestingView = () => {
  const [referenceDate, setReferenceDate] = useState<string>(() => {
    // Default to 90 days ago
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split('T')[0];
  });
  const [topN, setTopN] = useState<number>(50);
  const [historicalRankings, setHistoricalRankings] = useState<HistoricalRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<HistoricalRanking | null>(null);
  const [tradeConfig, setTradeConfig] = useState({
    quantity: '100',
    stopLoss: '',
    takeProfit: '',
    maxHoldDays: '60', // Default max hold for swing trades
  });
  
  // Batch simulation config (supports percentage-based stops)
  const [batchTradeConfig, setBatchTradeConfig] = useState({
    quantity: '100',
    stopLossType: 'percentage' as 'percentage' | 'absolute',
    stopLossPercentage: '5', // Default 5% stop loss
    stopLossAbsolute: '',
    takeProfitType: 'percentage' as 'percentage' | 'absolute',
    takeProfitPercentage: '10', // Default 10% take profit
    takeProfitAbsolute: '',
    maxHoldDays: '60',
  });
  const [tradeResult, setTradeResult] = useState<TradeSimulation | null>(null);
  const [batchResults, setBatchResults] = useState<TradeSimulation[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [batchSimulating, setBatchSimulating] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  
  // Strategy state
  const [currentScreeningStrategy, setCurrentScreeningStrategy] = useState<ScreeningStrategy>({
    id: 'adr_stack_rank',
    name: 'ADR Stack Rank',
    type: 'screening',
    description: 'Ranks stocks by ADR with performance filters (1M, 3M, 6M)',
    filters: {
      sort_by: 'adr',
      sort_order: 'desc',
    }
  });

  // Batch simulation selection state
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [batchSelectionMode, setBatchSelectionMode] = useState<'all' | 'none' | 'bullish' | 'bearish' | 'score_range' | 'manual'>('all');
  const [scoreRange, setScoreRange] = useState({ min: '', max: '' });

  // Load saved sessions on mount
  useEffect(() => {
    loadSavedSessions();
  }, []);

  const loadSavedSessions = async () => {
    try {
      const data = await listBacktestSessions();
      setSavedSessions(data.sessions || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const handleFetchRankings = async () => {
    setLoading(true);
    setError(null);
    setSelectedStock(null);
    setTradeResult(null);

    try {
      // First check if session exists for this date
      try {
        const existingSession = await findBacktestSessionByDate(referenceDate);
        if (existingSession && existingSession.historical_rankings) {
          setHistoricalRankings(existingSession.historical_rankings);
          setCurrentSessionId(existingSession.session_id);
          window.alert(`✅ Loaded cached session from ${new Date(existingSession.updated_at).toLocaleString()}`);
          setLoading(false);
          return;
        }
      } catch (err) {
        // No existing session, continue to fetch new
      }

      const response = await getHistoricalRankings({
        reference_date: referenceDate,
        top_n: topN,
        sort_by: 'adr',
        sort_order: 'desc',
        // Parallel processing (Pro tier defaults)
        max_workers: 5,  // 5 concurrent workers
        rate_limit_per_minute: 200  // Pro tier: 200 calls/minute
      });
      
      // Handle new response format (may include session_id)
      let rankings: HistoricalRanking[] = [];
      if (Array.isArray(response)) {
        // Legacy format (direct array)
        rankings = response;
      } else if (response.rankings) {
        // New format with session info
        rankings = response.rankings;
        if (response.session_id) {
          setCurrentSessionId(response.session_id);
        }
        if (response.from_cache) {
          window.alert(`✅ Loaded from cache (session: ${response.session_id?.substring(0, 8)}...)`);
        }
      }
      
      setHistoricalRankings(rankings);
      // Reset batch selection when new rankings are loaded
      setSelectedTickers(new Set());
      setBatchSelectionMode('all');
      setBatchResults([]);
      setTradeResult(null);
      
      // Reload sessions list
      await loadSavedSessions();
    } catch (err: any) {
      console.error('Error fetching historical rankings:', err);
      setError(err.message || 'Failed to fetch historical rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const session = await getBacktestSession(sessionId);
      
      // Restore session state
      setReferenceDate(session.reference_date);
      setHistoricalRankings(session.historical_rankings || []);
      setCurrentSessionId(session.session_id);
      
      // Restore strategy if it exists
      if (session.screening_strategy) {
        setCurrentScreeningStrategy(session.screening_strategy);
      }
      
      // Clear previous results
      setTradeResult(null);
      setBatchResults([]);
      setSelectedStock(null);
      
      window.alert(`✅ Loaded session from ${new Date(session.updated_at).toLocaleString()}`);
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await deleteBacktestSession(sessionId);
      await loadSavedSessions();
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      window.alert('Session deleted successfully');
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError(err.message || 'Failed to delete session');
    }
  };


  // Get stocks to simulate based on selection mode
  const getStocksToSimulate = (): HistoricalRanking[] => {
    switch (batchSelectionMode) {
      case 'all':
        return historicalRankings;
      
      case 'none':
        return [];
      
      case 'bullish':
        return historicalRankings.filter(stock => stock.overall_signal === 'BULLISH');
      
      case 'bearish':
        return historicalRankings.filter(stock => stock.overall_signal === 'BEARISH');
      
      case 'score_range':
        const minScore = parseFloat(scoreRange.min);
        const maxScore = parseFloat(scoreRange.max);
        return historicalRankings.filter(stock => {
          if (!isNaN(minScore) && stock.overall_score < minScore) return false;
          if (!isNaN(maxScore) && stock.overall_score > maxScore) return false;
          return true;
        });
      
      case 'manual':
        return historicalRankings.filter(stock => selectedTickers.has(stock.ticker));
      
      default:
        return [];
    }
  };

  const handleSelectionModeChange = (mode: typeof batchSelectionMode) => {
    setBatchSelectionMode(mode);
    
    // Auto-select stocks based on mode
    if (mode === 'all') {
      setSelectedTickers(new Set(historicalRankings.map(s => s.ticker)));
    } else if (mode === 'none') {
      setSelectedTickers(new Set());
    } else if (mode === 'bullish') {
      setSelectedTickers(new Set(historicalRankings.filter(s => s.overall_signal === 'BULLISH').map(s => s.ticker)));
    } else if (mode === 'bearish') {
      setSelectedTickers(new Set(historicalRankings.filter(s => s.overall_signal === 'BEARISH').map(s => s.ticker)));
    } else if (mode === 'score_range') {
      // Will be filtered in getStocksToSimulate
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

  const handleStockSelect = (stock: HistoricalRanking) => {
    setSelectedStock(stock);
    // Auto-calculate suggested stop loss and take profit based on ADR
    const currentPrice = stock.current_price;
    const adrPct = stock.adr_percentage;
    
    // Suggested stop loss: 2x ADR or 5% max
    const stopLossPct = Math.min((adrPct * 2) / 100, 0.05);
    const suggestedStopLoss = (currentPrice * (1 - stopLossPct)).toFixed(2);
    
    // Suggested take profit: 3x ADR or 10% default
    const takeProfitPct = Math.max((adrPct * 3) / 100, 0.10);
    const suggestedTakeProfit = (currentPrice * (1 + takeProfitPct)).toFixed(2);

    setTradeConfig({
      quantity: '100',
      stopLoss: suggestedStopLoss,
      takeProfit: suggestedTakeProfit,
      maxHoldDays: '60', // Default max hold for swing trades
    });
    setTradeResult(null); // Clear any previous single trade result
    setBatchResults([]); // Clear any previous batch results
  };

  const handleSimulateTrade = async () => {
    if (!selectedStock) {
      setError('Please select a stock first');
      return;
    }

    const quantity = parseFloat(tradeConfig.quantity) || 0;
    const stopLoss = parseFloat(tradeConfig.stopLoss) || 0;
    const takeProfit = parseFloat(tradeConfig.takeProfit) || 0;

    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!stopLoss || !takeProfit) {
      setError('Please enter stop loss and take profit values');
      return;
    }

    setSimulating(true);
    setError(null);

    try {
      // Use next day after reference date as entry (more realistic)
      const entryDateObj = new Date(referenceDate);
      entryDateObj.setDate(entryDateObj.getDate() + 1);
      const entryDate = entryDateObj.toISOString().split('T')[0];

      const maxHoldDays = parseFloat(tradeConfig.maxHoldDays) || 60;

      const result = await simulateTrade({
        ticker: selectedStock.ticker,
        entry_date: entryDate,
        entry_price: selectedStock.current_price,
        quantity: quantity,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        max_hold_days: maxHoldDays,
        session_id: currentSessionId || undefined, // Save to current session if available
      });

      setTradeResult(result);
      
      // Update session ID if returned
      if (result.session_id) {
        setCurrentSessionId(result.session_id);
      }
      
      // Reload sessions
      await loadSavedSessions();
    } catch (err: any) {
      console.error('Error simulating trade:', err);
      setError(err.message || 'Failed to simulate trade');
    } finally {
      setSimulating(false);
    }
  };

  const handleBatchSimulate = async () => {
    const stocksToSimulate = getStocksToSimulate();
    
    if (stocksToSimulate.length === 0) {
      setError('No stocks selected for simulation. Please select stocks using the filters or checkboxes.');
      return;
    }

    const quantity = parseFloat(batchTradeConfig.quantity) || 0;
    const maxHoldDays = parseFloat(batchTradeConfig.maxHoldDays) || 60;

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

    if (!window.confirm(`Simulate trades for ${stocksToSimulate.length} selected stocks? This may take a while.`)) {
      return;
    }

    setBatchSimulating(true);
    setError(null);
    setBatchResults([]);

    try {
      const entryDateObj = new Date(referenceDate);
      entryDateObj.setDate(entryDateObj.getDate() + 1);
      const entryDate = entryDateObj.toISOString().split('T')[0];

      const results: TradeSimulation[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < stocksToSimulate.length; i++) {
        const stock = stocksToSimulate[i];
        try {
          // Calculate stop loss and take profit based on entry price and type
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

          const result = await simulateTrade({
            ticker: stock.ticker,
            entry_date: entryDate,
            entry_price: stock.current_price,
            quantity: quantity,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            max_hold_days: maxHoldDays,
            session_id: currentSessionId || undefined,
          });

          results.push({ ...result, ticker: stock.ticker });
          successCount++;
          
          // Update batch results as we go
          setBatchResults([...results]);
        } catch (err: any) {
          console.error(`Error simulating ${stock.ticker}:`, err);
          failCount++;
          // Continue with next stock
        }
      }

      setBatchResults(results);
      window.alert(`Batch simulation complete!\n✅ Successful: ${successCount}\n❌ Failed: ${failCount}`);
    } catch (err: any) {
      console.error('Error in batch simulation:', err);
      setError(err.message || 'Failed to run batch simulation');
    } finally {
      setBatchSimulating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="search-section">
        <div className="search-bar-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h2>Backtesting: ADR Performance Rank Strategy</h2>
              <p className="search-description">
                Select a historical date to see how stocks were ranked by ADR at that point in time, then simulate trades forward
              </p>
              {currentSessionId && (
                <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  📂 Active Session: {currentSessionId.substring(0, 8)}... (saved automatically)
                </p>
              )}
            </div>
            <button
              className="search-button"
              onClick={() => setShowSessions(!showSessions)}
              style={{ marginLeft: '20px' }}
            >
              {showSessions ? 'Hide' : 'Show'} Saved Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Saved Sessions Panel */}
      {showSessions && (
        <div className="backtesting-config" style={{ marginTop: '20px' }}>
          <h3>Saved Backtesting Sessions</h3>
          {savedSessions.length === 0 ? (
            <p>No saved sessions. Sessions are automatically saved when you fetch historical rankings.</p>
          ) : (
            <div className="sessions-list">
              {savedSessions.map((session) => (
                <div key={session.session_id} className="session-item">
                  <div className="session-info">
                    <strong>Date: {session.reference_date}</strong>
                    <span>Rankings: {session.num_rankings} | Trades: {session.num_trades}</span>
                    <span>Updated: {new Date(session.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="session-actions">
                    <button
                      className="select-button"
                      onClick={() => handleLoadSession(session.session_id)}
                    >
                      Load
                    </button>
                    <button
                      className="reset-button"
                      onClick={() => handleDeleteSession(session.session_id)}
                      style={{ marginLeft: '10px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      <div className="backtesting-config">
        <div className="config-grid">
          <div className="config-group">
            <label>Reference Date (Historical Point-in-Time):</label>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
            />
            <p className="config-hint">Select a date to see rankings as they appeared then</p>
          </div>

          <div className="config-group">
            <label>Top N Stocks:</label>
            <input
              type="number"
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value) || 50)}
              min="10"
              max="200"
            />
            <p className="config-hint">Number of top-ranked stocks to display</p>
          </div>
        </div>

        <div className="config-actions">
          <button
            className="search-button"
            onClick={handleFetchRankings}
            disabled={loading}
          >
            {loading ? 'Loading Historical Rankings...' : 'Fetch Historical Rankings'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="retry-button">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p className="spinner-text">Loading historical rankings<span className="loading-dots"></span></p>
        </div>
      )}

      {/* Strategy Info & Batch Selection */}
      {!loading && historicalRankings.length > 0 && (
        <div className="strategy-info-panel" style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Current Strategy: {currentScreeningStrategy.name}</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>{currentScreeningStrategy.description}</p>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              Type: <strong>{currentScreeningStrategy.type}</strong> | 
              Sort: <strong>{currentScreeningStrategy.filters.sort_by.toUpperCase()}</strong> ({currentScreeningStrategy.filters.sort_order})
            </p>
          </div>

          {/* Batch Selection Controls */}
          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '15px', marginTop: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Batch Simulation Selection</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="batchSelection"
                  checked={batchSelectionMode === 'all'}
                  onChange={() => handleSelectionModeChange('all')}
                  style={{ marginRight: '8px' }}
                />
                All Stocks ({historicalRankings.length})
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="batchSelection"
                  checked={batchSelectionMode === 'bullish'}
                  onChange={() => handleSelectionModeChange('bullish')}
                  style={{ marginRight: '8px' }}
                />
                All Bullish ({historicalRankings.filter(s => s.overall_signal === 'BULLISH').length})
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="batchSelection"
                  checked={batchSelectionMode === 'bearish'}
                  onChange={() => handleSelectionModeChange('bearish')}
                  style={{ marginRight: '8px' }}
                />
                All Bearish ({historicalRankings.filter(s => s.overall_signal === 'BEARISH').length})
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
                  ({getStocksToSimulate().length} stocks match)
                </span>
              </div>
            )}

            {/* Batch Trade Configuration */}
            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '15px', marginTop: '15px' }}>
              <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Batch Trade Configuration</h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div className="config-group">
                  <label>Quantity (Shares):</label>
                  <input
                    type="number"
                    value={batchTradeConfig.quantity}
                    onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, quantity: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="config-group">
                  <label>Max Hold Days:</label>
                  <input
                    type="number"
                    value={batchTradeConfig.maxHoldDays}
                    onChange={(e) => setBatchTradeConfig({ ...batchTradeConfig, maxHoldDays: e.target.value })}
                    min="1"
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
                      name="stopLossType"
                      checked={batchTradeConfig.stopLossType === 'percentage'}
                      onChange={() => setBatchTradeConfig({ ...batchTradeConfig, stopLossType: 'percentage' })}
                      style={{ marginRight: '8px' }}
                    />
                    Percentage
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="stopLossType"
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
                      name="takeProfitType"
                      checked={batchTradeConfig.takeProfitType === 'percentage'}
                      onChange={() => setBatchTradeConfig({ ...batchTradeConfig, takeProfitType: 'percentage' })}
                      style={{ marginRight: '8px' }}
                    />
                    Percentage
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="takeProfitType"
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

              {/* Selected Count and Simulate Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Selected: <strong>{getStocksToSimulate().length}</strong> stocks
                </span>
                <button
                  className="search-button"
                  onClick={handleBatchSimulate}
                  disabled={batchSimulating || getStocksToSimulate().length === 0}
                >
                  {batchSimulating 
                    ? `Simulating ${batchResults.length}/${getStocksToSimulate().length}...` 
                    : `Simulate Selected (${getStocksToSimulate().length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Simulation Results */}
      {batchResults.length > 0 && (() => {
            const totalProfit = batchResults.filter(r => r.profit_loss > 0).reduce((sum, r) => sum + r.profit_loss, 0);
            const totalLoss = batchResults.filter(r => r.profit_loss < 0).reduce((sum, r) => sum + r.profit_loss, 0);
            const totalPL = batchResults.reduce((sum, r) => sum + r.profit_loss, 0);
            const winners = batchResults.filter(r => r.profit_loss > 0);
            const losers = batchResults.filter(r => r.profit_loss < 0);
            const avgHoldDays = batchResults.length > 0 ? (batchResults.reduce((sum, r) => sum + r.hold_days, 0) / batchResults.length).toFixed(1) : '0';
            
            // Exit reason breakdown
            const exitReasons: { [key: string]: number } = {};
            batchResults.forEach(r => {
              const reason = r.exit_reason || 'Unknown';
              exitReasons[reason] = (exitReasons[reason] || 0) + 1;
            });

            return (
              <div className="batch-results" style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Batch Simulation Results ({batchResults.length} trades)</h4>
                
                {/* Comprehensive Summary */}
                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Trade Summary</h5>
                  
                  {/* Profit/Loss Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: 'rgba(0, 255, 65, 0.1)', borderRadius: '5px', border: '1px solid rgba(0, 255, 65, 0.3)' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '600' }}>Total Profit</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        ${totalProfit.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        {winners.length} winning trades
                      </div>
                    </div>
                    
                    <div style={{ padding: '15px', backgroundColor: 'rgba(255, 68, 68, 0.1)', borderRadius: '5px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                      <div style={{ fontSize: '14px', color: '#ff6b6b', marginBottom: '5px', fontWeight: '600' }}>Total Loss</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4444' }}>
                        ${Math.abs(totalLoss).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        {losers.length} losing trades
                      </div>
                    </div>
                    
                    <div style={{ padding: '15px', backgroundColor: totalPL >= 0 ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 68, 68, 0.1)', borderRadius: '5px', border: `1px solid ${totalPL >= 0 ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 68, 68, 0.3)'}` }}>
                      <div style={{ fontSize: '14px', color: totalPL >= 0 ? 'var(--text-secondary)' : '#ff6b6b', marginBottom: '5px', fontWeight: '600' }}>Net Total</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: totalPL >= 0 ? 'var(--accent-primary)' : '#ff4444' }}>
                        ${totalPL.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        {batchResults.length > 0 ? ((totalPL / batchResults.reduce((sum, r) => sum + r.total_cost, 0)) * 100).toFixed(2) : '0.00'}% return
                      </div>
                    </div>
                    
                    <div style={{ padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '5px', border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '600' }}>Avg Hold Days</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {avgHoldDays}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        Average holding period
                      </div>
                    </div>
                  </div>

                  {/* Win Rate & Performance Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {batchResults.length > 0 ? ((winners.length / batchResults.length) * 100).toFixed(1) : '0.0'}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Win Rate</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {winners.length > 0 ? (totalProfit / winners.length).toFixed(2) : '0.00'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Profit per Winner</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {losers.length > 0 ? (Math.abs(totalLoss) / losers.length).toFixed(2) : '0.00'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Loss per Loser</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {batchResults.length > 0 ? (batchResults.reduce((sum, r) => sum + r.profit_loss_pct, 0) / batchResults.length).toFixed(2) : '0.00'}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg P/L %</div>
                    </div>
                  </div>

                  {/* Exit Reasons Breakdown */}
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Exit Reasons Breakdown</h6>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {Object.entries(exitReasons).map(([reason, count]) => (
                        <div key={reason} style={{ 
                          padding: '8px 12px', 
                          backgroundColor: 'var(--bg-secondary)', 
                          borderRadius: '5px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: '1px solid var(--border-primary)'
                        }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{reason}:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} trades</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed Results Table */}
                <div style={{ marginTop: '20px' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Individual Trade Results</h5>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '5px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                      <thead style={{ backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Ticker</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Entry Price</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Exit Price</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Profit/Loss</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>P/L %</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Exit Day</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-primary)' }}>Exit Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.map((result, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: idx % 2 === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{result.ticker || 'N/A'}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-primary)' }}>${result.entry_price.toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-primary)' }}>
                              {result.exit_price ? `$${result.exit_price.toFixed(2)}` : 'N/A'}
                            </td>
                            <td style={{ 
                              padding: '10px', 
                              textAlign: 'right', 
                              color: result.profit_loss >= 0 ? 'var(--accent-primary)' : '#ff4444',
                              fontWeight: 'bold'
                            }}>
                              ${result.profit_loss >= 0 ? '+' : ''}{result.profit_loss.toFixed(2)}
                            </td>
                            <td style={{ 
                              padding: '10px', 
                              textAlign: 'right', 
                              color: result.profit_loss_pct >= 0 ? 'var(--accent-primary)' : '#ff4444',
                              fontWeight: 'bold'
                            }}>
                              {result.profit_loss_pct >= 0 ? '+' : ''}{result.profit_loss_pct.toFixed(2)}%
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>
                              {result.exit_date ? formatDate(result.exit_date) : 'N/A'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                              <span style={{ 
                                padding: '4px 8px', 
                                borderRadius: '3px',
                                backgroundColor: result.exit_reason === 'TAKE_PROFIT' ? 'rgba(0, 255, 65, 0.2)' : 
                                                result.exit_reason === 'STOP_LOSS' ? 'rgba(255, 68, 68, 0.2)' :
                                                result.exit_reason === 'MAX_HOLD_DAYS' ? 'rgba(255, 193, 7, 0.2)' : 'var(--bg-secondary)',
                                color: result.exit_reason === 'TAKE_PROFIT' ? 'var(--accent-primary)' :
                                       result.exit_reason === 'STOP_LOSS' ? '#ff4444' :
                                       result.exit_reason === 'MAX_HOLD_DAYS' ? '#ffc107' : 'var(--text-primary)',
                                border: `1px solid ${result.exit_reason === 'TAKE_PROFIT' ? 'rgba(0, 255, 65, 0.3)' : 
                                                      result.exit_reason === 'STOP_LOSS' ? 'rgba(255, 68, 68, 0.3)' :
                                                      result.exit_reason === 'MAX_HOLD_DAYS' ? 'rgba(255, 193, 7, 0.3)' : 'var(--border-primary)'}`
                              }}>
                                {result.exit_reason || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

      {/* Historical Rankings Table */}
      {!loading && historicalRankings.length > 0 && (
        <div className="backtesting-results">
          <div className="results-header">
            <h3>Historical Rankings as of {formatDate(referenceDate)}</h3>
            <p className="results-subtitle">
              Rankings calculated using only data available up to this date
            </p>
          </div>

          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    {batchSelectionMode === 'manual' && (
                      <input
                        type="checkbox"
                        checked={selectedTickers.size === historicalRankings.length && historicalRankings.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickers(new Set(historicalRankings.map(s => s.ticker)));
                          } else {
                            setSelectedTickers(new Set());
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                  <th>Rank</th>
                  <th>Ticker</th>
                  <th>Price</th>
                  <th>ADR %</th>
                  <th>1M %</th>
                  <th>3M %</th>
                  <th>6M %</th>
                  <th>RSI</th>
                  <th>Signal</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historicalRankings.map((stock, index) => {
                  const isSelected = selectedTickers.has(stock.ticker);
                  const isHighlighted = batchSelectionMode === 'score_range' && getStocksToSimulate().some(s => s.ticker === stock.ticker);
                  
                  return (
                    <tr
                      key={stock.ticker}
                      className={`ranking-row ${selectedStock?.ticker === stock.ticker ? 'selected' : ''} ${isSelected && batchSelectionMode === 'manual' ? 'row-selected' : ''} ${isHighlighted && batchSelectionMode === 'score_range' ? 'row-highlighted' : ''}`}
                      onClick={() => handleStockSelect(stock)}
                      style={isSelected || isHighlighted ? { backgroundColor: 'var(--bg-hover)' } : {}}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        {batchSelectionMode === 'manual' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleTickerSelection(stock.ticker)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </td>
                      <td>{index + 1}</td>
                      <td className="ticker-cell">{stock.ticker}</td>
                      <td>${stock.current_price.toFixed(2)}</td>
                      <td>{stock.adr_percentage.toFixed(2)}%</td>
                      <td className={stock.performance_1m >= 0 ? 'positive' : 'negative'}>
                        {stock.performance_1m.toFixed(1)}%
                      </td>
                      <td className={stock.performance_3m >= 0 ? 'positive' : 'negative'}>
                        {stock.performance_3m.toFixed(1)}%
                      </td>
                      <td className={stock.performance_6m >= 0 ? 'positive' : 'negative'}>
                        {stock.performance_6m.toFixed(1)}%
                      </td>
                      <td>{stock.rsi.toFixed(1)}</td>
                      <td className={`signal ${stock.overall_signal.toLowerCase()}`}>
                        {stock.overall_signal}
                      </td>
                      <td>{stock.overall_score.toFixed(2)}</td>
                      <td>
                        <button
                          className="select-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStockSelect(stock);
                          }}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade Configuration and Simulation */}
      {selectedStock && (
        <div className="trade-simulation-panel">
          <div className="panel-header">
            <h3>Simulate Trade: {selectedStock.ticker}</h3>
            <p className="panel-subtitle">
              Entry Price (as of {formatDate(referenceDate)}): ${selectedStock.current_price.toFixed(2)}
            </p>
          </div>

          <div className="trade-config-grid">
            <div className="config-group">
              <label>Quantity (Shares):</label>
              <input
                type="number"
                value={tradeConfig.quantity}
                onChange={(e) => setTradeConfig({ ...tradeConfig, quantity: e.target.value })}
                min="1"
              />
            </div>

            <div className="config-group">
              <label>Stop Loss Price:</label>
              <input
                type="number"
                step="0.01"
                value={tradeConfig.stopLoss}
                onChange={(e) => setTradeConfig({ ...tradeConfig, stopLoss: e.target.value })}
              />
            </div>

            <div className="config-group">
              <label>Take Profit Price:</label>
              <input
                type="number"
                step="0.01"
                value={tradeConfig.takeProfit}
                onChange={(e) => setTradeConfig({ ...tradeConfig, takeProfit: e.target.value })}
              />
            </div>

            <div className="config-group">
              <label>Max Hold Days:</label>
              <input
                type="number"
                value={tradeConfig.maxHoldDays}
                onChange={(e) => setTradeConfig({ ...tradeConfig, maxHoldDays: e.target.value })}
                min="1"
                placeholder="60"
              />
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Maximum days to hold the position before forced exit
              </small>
            </div>
          </div>

          <div className="trade-actions">
            <button
              className="search-button"
              onClick={handleSimulateTrade}
              disabled={simulating}
            >
              {simulating ? 'Simulating Trade...' : 'Run Trade Simulation'}
            </button>
          </div>

          {/* Trade Results */}
          {tradeResult && (
            <div className="trade-results">
              <h4>Simulation Results</h4>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Entry Date:</span>
                  <span className="result-value">{formatDate(tradeResult.entry_date)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Entry Price:</span>
                  <span className="result-value">${tradeResult.entry_price.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Exit Date:</span>
                  <span className="result-value">
                    {tradeResult.exit_date ? formatDate(tradeResult.exit_date) : 'Still Open'}
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Exit Price:</span>
                  <span className="result-value">
                    {tradeResult.exit_price ? `$${tradeResult.exit_price.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Exit Reason:</span>
                  <span className="result-value">{tradeResult.exit_reason || 'N/A'}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Hold Duration:</span>
                  <span className="result-value">{tradeResult.hold_days} days</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Total Cost:</span>
                  <span className="result-value">${tradeResult.total_cost.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Total Proceeds:</span>
                  <span className="result-value">
                    {tradeResult.total_proceeds ? `$${tradeResult.total_proceeds.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="result-item highlight">
                  <span className="result-label">Profit/Loss:</span>
                  <span className={`result-value ${tradeResult.profit_loss >= 0 ? 'positive' : 'negative'}`}>
                    ${tradeResult.profit_loss.toFixed(2)} ({tradeResult.profit_loss_pct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && historicalRankings.length === 0 && !error && (
        <div className="research-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">📊</div>
            <h3>Ready to Backtest</h3>
            <p>Select a historical date and click "Fetch Historical Rankings" to see how stocks were ranked at that point in time.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestingView;

