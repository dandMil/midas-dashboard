// This now points everything to your Python backend
const BASE_URL = 'http://localhost:8000/midas/asset';
const ANALYTICS_URL = 'http://localhost:8000/query';

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
