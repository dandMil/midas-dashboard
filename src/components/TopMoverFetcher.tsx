import React, { useState, useEffect } from 'react';
import AssetItem from '../pages/Portfolio/Watchlist/components/WatchlistItem.tsx';
import VolumeItem from './VolumeItem.tsx';
import TickerTable from './TickerTable.tsx';
const TopMoverFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/midas/asset/top_movers');
        const jsonData = await response.json();
        console.log('JSON DATA',jsonData)
        console.log('JSON DATA TICKER',jsonData.tickers)
        console.log('FIRST ELEMENT',jsonData.tickers[0])
        console.log('TYPE OF JSON DATA TICKER',typeof(jsonData.tickers))
        setData(jsonData.tickers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Today's Movers</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
            <TickerTable data={data} />
        </div>
      )}
    </div>
  );
};

export default TopMoverFetcher;
