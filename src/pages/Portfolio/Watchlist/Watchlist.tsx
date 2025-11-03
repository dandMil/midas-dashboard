import React, { useState, useEffect } from 'react';
import AssetItem from './components/WatchlistItem.tsx';
import { fetchRepeatedMovers } from '../../../services/api.tsx'; // Import the API function
import '../../../css/theme.css';

const AssetFetcher = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const watchlistData = await fetchRepeatedMovers(); // Use the API function
        console.log('WATCHLIST DATA',watchlistData)
        setData(Array.isArray(watchlistData) ? watchlistData : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch watchlist data');
        setData([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Top Movers</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : data.length === 0 ? (
        <p>No data available</p>
      ) : (
        <div>
          <AssetItem data={data} />
        </div>
      )}
    </div>
  );
};

export default AssetFetcher;
