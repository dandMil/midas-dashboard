import React, { useState, useEffect } from 'react';
import AssetItem from './components/WatchlistItem.tsx';
import { fetchRepeatedMovers } from '../../../services/api.tsx'; // Import the API function
import '../../../css/theme.css';

const AssetFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const watchlistData = await fetchRepeatedMovers(); // Use the API function
        console.log('WATCHLIST DATA',watchlistData)
        setData(watchlistData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Top Movers</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <AssetItem data={data} />
        </div>
      )}
    </div>
  );
};

export default AssetFetcher;
