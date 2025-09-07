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

export const queryTopMovers = async (mover?: string): Promise<any> => {
  try {
    let url = `${BASE_URL}/top_movers`;
    if (mover) url += `?mover=${encodeURIComponent(mover)}`;
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
    
    // Add industry information if available (this would come from your backend)
    // For now, we'll add a placeholder that can be enhanced later
    return {
      ...data,
      ticker: ticker.toUpperCase(),
      industry: data.industry || 'Technology', // Placeholder - should come from backend
      company_name: data.company_name || ticker.toUpperCase(),
      sector: data.sector || 'Technology'
    };
  } catch (error) {
    console.error(`Error fetching ticker details for ${ticker}:`, error);
    throw error;
  }
};
