// This now points everything to your Python backend
const BASE_URL = 'http://localhost:8000/midas/asset';
const ANALYTICS_URL = 'http://localhost:8000/query';

// Type definition for volume data
type VolumePoint = { date: string; volume: number };

export const fetchRecommendations = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_portfolio`);
    if (!response.ok) throw new Error(`Error fetching recommendations: ${response.statusText}`);
    const data = await response.json();
    return data.map((item: any) => ({
      ticker: item.ticker,
      shares: item.shares,
      currentPrice: item.currentPrice,
      ...item.tradeRecommendation,
    }));
  } catch (error) {
    console.error('Error fetching trade recommendations:', error);
    throw error;
  }
};

export const fetchIndicatorData = async (ticker: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/get_signal/${ticker}/stock`);
    if (!response.ok) throw new Error(`Error fetching indicator data: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching indicator data for ${ticker}:`, error);
    throw error;
  }
};

export const fetchWatchlist = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_watch_list`);
    if (!response.ok) throw new Error(`Error fetching watchlist: ${response.statusText}`);
    const jsonData = await response.json();
    return Object.keys(jsonData).map((key) => jsonData[key]);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchRepeatedMovers = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/repeated_movers`);
    if (!response.ok) throw new Error(`Error fetching repeated movers: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching repeated movers:', error);
    throw error;
  }
};

export const queryLlm = async (payload: Record<string, any>): Promise<any> => {
  try {
    const response = await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Error processing LLM request: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const queryTopMovers = async (mover?: string, includeIndicators: boolean = true): Promise<any> => {
  try {
    let url = `${BASE_URL}/top_movers`;
    const params = new URLSearchParams();
    if (mover) params.append('mover', mover);
    if (includeIndicators) params.append('include_indicators', 'true');
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching top movers: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching top movers:', error);
    throw error;
  }
};

export const scrapeReddit = async (lookback: string): Promise<any> => {
  try {
    const response = await fetch(`http://localhost:8000/fetch_shorts?lookback=${lookback}`);
    if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error during Reddit scraping:', error);
    throw error;
  }
};


export const fetchDailySummary = async (): Promise<any[]> => {
  try {
    const response = await fetch('http://localhost:8000/midas/daily_summary');
    if (!response.ok) throw new Error(`Error fetching daily summary: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};



export const purchaseAsset = async (payload: {
  ticker: string;
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  const res = await fetch("/midas/purchase_asset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const sellAsset = async (payload: {
  ticker: string;
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  const res = await fetch("/midas/sell_asset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};




export const fetchAssetVolume = async (
  ticker: string,
  range: string = '1M'
): Promise<VolumePoint[]> => {
  if (!ticker) throw new Error('ticker is required');

  const url = `${BASE_URL}/volume?ticker=${encodeURIComponent(ticker)}&range=${encodeURIComponent(range)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error fetching volume for ${ticker}: ${res.status} ${res.statusText}`);
  }

  // Backend returns an array like [{ date, volume }, ...]
  const raw = await res.json();

  // Be tolerant if the backend ever wraps it in { data: [...] }
  const arr: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  return (arr || [])
    .filter((d) => d && d.date && typeof d.volume === 'number')
    .map((d) => ({ date: String(d.date), volume: Number(d.volume) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const fetchCryptoSummary = async (): Promise<any[]> => {
  console.log('🔍 fetchCryptoSummary() called');
  console.log('🌐 Making request to: http://localhost:8000/midas/crypto_summary');
  
  try {
    const response = await fetch('http://localhost:8000/midas/crypto_summary');
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Error fetching crypto summary: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Crypto data parsed successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 Error in fetchCryptoSummary:', error);
    throw error;
  }
};

export const fetchTechnicalAnalysis = async (ticker: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/get_signal/${ticker}/stock`);
    if (!response.ok) throw new Error(`Error fetching technical analysis: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching technical analysis for ${ticker}:`, error);
    throw error;
  }
};

export const fetchTickerDetails = async (ticker: string, assetType: string = 'stock'): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/get_signal/${ticker}/${assetType}`);
    if (!response.ok) throw new Error(`Error fetching ticker details: ${response.statusText}`);
    const data = await response.json();
    
    // Ensure all required properties exist with default values
    return {
      ticker: data.ticker || ticker.toUpperCase(),
      market_price: data.market_price || data.price || data.currentPrice || 0,
      signal: data.signal || 'NEUTRAL',
      macd: data.macd || 0,
      price_rate_of_change: data.price_rate_of_change || data.priceRateOfChange || 0,
      rsi: data.rsi || data.relativeStrengthIndex || 0,
      stochastic_oscillator: data.stochastic_oscillator || data.stochasticOscillator || 0,
      industry: data.industry || 'Technology',
      company_name: data.company_name || data.name || ticker.toUpperCase(),
      sector: data.sector || 'Technology',
      ...data // Spread any additional properties from the API
    };
  } catch (error) {
    console.error(`Error fetching ticker details for ${ticker}:`, error);
    // Return a default object instead of throwing to prevent crashes
    return {
      ticker: ticker.toUpperCase(),
      market_price: 0,
      signal: 'NEUTRAL',
      macd: 0,
      price_rate_of_change: 0,
      rsi: 0,
      stochastic_oscillator: 0,
      industry: 'Unknown',
      company_name: ticker.toUpperCase(),
      sector: 'Unknown'
    };
  }
};

export const fetchShortsSqueeze = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/shorts_squeeze`);
    if (!response.ok) throw new Error(`Error fetching shorts squeeze data: ${response.statusText}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching shorts squeeze data:', error);
    throw error;
  }
};


export const doTransaction = async (payload: {
  ticker: string;
  transactionType?: string; // "buy" or "sell" (optional - can use negative shares for sell)
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  // Convert transactionType to positive/negative shares if provided
  // Backend expects: positive shares = buy, negative shares = sell
  let shares = payload.shares;
  if (payload.transactionType) {
    shares = payload.transactionType.toLowerCase() === 'sell' 
      ? -Math.abs(payload.shares)  // Make negative for sell
      : Math.abs(payload.shares);   // Make positive for buy
  }
  
  const requestPayload = {
    ticker: payload.ticker,
    shares: shares,
    current_price: payload.current_price,
    stop_loss: payload.stop_loss,
    take_profit: payload.take_profit
  };
  
  const res = await fetch("http://localhost:8000/midas/do_transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Transaction failed: ${res.statusText}`);
  }
  
  return await res.json();
};

export const confirmTransaction = async (payload: {
  ticker: string;
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  const res = await fetch("/midas/confirm_transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const cancelTransaction = async (payload: {
  ticker: string;
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  const res = await fetch("/midas/cancel_transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const getTransactionStatus = async (payload: {
  ticker: string;
  shares: number;
  current_price: number;
  stop_loss: number;
  take_profit: number;
}) => {
  const res = await fetch("/midas/get_transaction_status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};



export const fetchStockScreener = async (params: {
  sector?: string;
  min_1m_performance?: number;
  min_3m_performance?: number;
  min_6m_performance?: number;
  max_1m_performance?: number;
  max_3m_performance?: number;
  max_6m_performance?: number;
  min_price?: number;
  max_price?: number;
  min_adr?: number;
  max_adr?: number;
  min_rsi?: number;
  max_rsi?: number;
  sort_by?: 'adr' | 'rsi' | 'performance_1m' | 'performance_3m' | 'performance_6m';
  sort_order?: 'asc' | 'desc';
  limit?: number;
}): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all non-undefined parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `${BASE_URL}/stock_screener?${queryParams.toString()}`;
    console.log('Screener API URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching screener data: ${response.statusText}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching screener data:', error);
    throw error;
  }
};

// ------------------------------
// Paper Trading API Functions
// ------------------------------

export const doPaperTransaction = async (payload: {
  ticker: string;
  transactionType: 'buy' | 'sell';
  shares: number;
  current_price: number;
  stop_loss?: number;
  take_profit?: number;
}) => {
  const adjustedShares = payload.transactionType === 'sell' ? -Math.abs(payload.shares) : Math.abs(payload.shares);
  
  const requestPayload = {
    ticker: payload.ticker,
    shares: adjustedShares,
    current_price: payload.current_price,
    stop_loss: payload.stop_loss,
    take_profit: payload.take_profit
  };
  
  const res = await fetch("http://localhost:8000/midas/paper_trade/do_transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Paper transaction failed: ${res.statusText}`);
  }
  
  return await res.json();
};

export const getPaperAccount = async () => {
  const res = await fetch("http://localhost:8000/midas/paper_trade/account");
  if (!res.ok) throw new Error(`Failed to fetch paper account: ${res.statusText}`);
  return await res.json();
};

export const getPaperPortfolio = async () => {
  const res = await fetch("http://localhost:8000/midas/paper_trade/portfolio");
  if (!res.ok) throw new Error(`Failed to fetch paper portfolio: ${res.statusText}`);
  return await res.json();
};

export const getPaperTransactions = async (limit: number = 50) => {
  const res = await fetch(`http://localhost:8000/midas/paper_trade/transactions?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch paper transactions: ${res.statusText}`);
  return await res.json();
};

export const resetPaperAccount = async (startingCapital: number = 100000) => {
  const res = await fetch("http://localhost:8000/midas/paper_trade/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starting_capital: startingCapital }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Failed to reset paper account: ${res.statusText}`);
  }
  return await res.json();
};

// ------------------------------
// Backtesting API Functions
// ------------------------------

export const getHistoricalRankings = async (params: {
  reference_date: string; // YYYY-MM-DD format
  top_n?: number;
  sector?: string;
  min_price?: number;
  max_price?: number;
  min_adr?: number;
  max_adr?: number;
  // Performance filters (matching regular scanner)
  min_1m_performance?: number;
  max_1m_performance?: number;
  min_3m_performance?: number;
  max_3m_performance?: number;
  min_6m_performance?: number;
  max_6m_performance?: number;
  sort_by?: 'adr' | 'rsi' | 'performance_1m' | 'performance_3m' | 'performance_6m';
  sort_order?: 'asc' | 'desc';
  // Optimization parameters
  use_sample?: boolean;
  sample_size?: number;
  max_universe_size?: number;
  enable_rate_limiting?: boolean;
  // Parallel processing parameters (for Pro tier)
  max_workers?: number;
  rate_limit_per_minute?: number;
}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `http://localhost:8000/midas/backtest/historical_rankings?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching historical rankings: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical rankings:', error);
    throw error;
  }
};

export const simulateTrade = async (payload: {
  ticker: string;
  entry_date: string; // YYYY-MM-DD
  entry_price: number;
  quantity: number;
  stop_loss?: number;
  take_profit?: number;
  exit_date?: string; // YYYY-MM-DD or null
  max_hold_days?: number;
  session_id?: string; // Optional: save trade to session
}) => {
  const res = await fetch("http://localhost:8000/midas/backtest/simulate_trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Trade simulation failed: ${res.statusText}`);
  }
  
  return await res.json();
};

// Backtesting Session Management API Functions

export const listBacktestSessions = async () => {
  const res = await fetch("http://localhost:8000/midas/backtest/sessions");
  if (!res.ok) throw new Error(`Failed to list sessions: ${res.statusText}`);
  return await res.json();
};

export const getBacktestSession = async (sessionId: string) => {
  const res = await fetch(`http://localhost:8000/midas/backtest/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to get session: ${res.statusText}`);
  return await res.json();
};

export const findBacktestSessionByDate = async (referenceDate: string, sector?: string, sortBy?: string) => {
  const params = new URLSearchParams();
  if (sector) params.append('sector', sector);
  if (sortBy) params.append('sort_by', sortBy);
  
  const url = `http://localhost:8000/midas/backtest/sessions/by_date/${referenceDate}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to find session: ${res.statusText}`);
  return await res.json();
};

export const deleteBacktestSession = async (sessionId: string) => {
  const res = await fetch(`http://localhost:8000/midas/backtest/sessions/${sessionId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.statusText}`);
  return await res.json();
};

export const runStrategyBacktest = async (payload: {
  reference_date: string;
  top_n?: number;
  capital_per_trade?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  max_hold_days?: number;
  exit_date?: string;
  filters?: any;
}) => {
  const res = await fetch("http://localhost:8000/midas/backtest/run_strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Strategy backtest failed: ${res.statusText}`);
  }
  
  return await res.json();
};
