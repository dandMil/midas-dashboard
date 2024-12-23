const BASE_URL = 'http://localhost:8080/midas/asset';

/**
 * Fetch recommendations from the portfolio API.
 * @returns {Promise<any[]>} Transformed recommendation data.
 */
export const fetchRecommendations = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_portfolio`);
    if (!response.ok) {
      throw new Error(`Error fetching recommendations: ${response.statusText}`);
    }
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

/**
 * Fetch indicator data for a specific ticker.
 * @param {string} ticker - The stock ticker.
 * @returns {Promise<any>} Indicator data for the ticker.
 */
export const fetchIndicatorData = async (ticker: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/get_signal/${ticker}/stock`);
    if (!response.ok) {
      throw new Error(`Error fetching indicator data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching indicator data for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Fetch the watchlist data from the API.
 * @returns {Promise<any[]>} Array of watchlist data.
 */
export const fetchWatchlist = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_watch_list`);
    if (!response.ok) {
      throw new Error(`Error fetching watchlist: ${response.statusText}`);
    }
    console.log('Watchlist Item fetched',response)
    const jsonData = await response.json();
    const dataArray = Object.keys(jsonData).map((key) => jsonData[key]);
    return dataArray;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

/**
 * Fetch repeated movers within the configured time window.
 * @returns {Promise<string[]>} A promise that resolves to a list of repeated mover names.
 */
export const fetchRepeatedMovers = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/repeated_movers`);
    if (!response.ok) {
      throw new Error(`Error fetching repeated movers: ${response.statusText}`);
    }
    console.log('Fetched Repeated Movers',response.body)
    return await response.json();
  } catch (error) {
    console.error('Error fetching repeated movers:', error);
    throw error;
  }
};
