import React, { useState, useEffect } from 'react';
import TickerTable from './TickerTable.tsx';
import {queryTopMovers} from '../services/api.tsx';

const TopMoverFetcher: React.FC<{ mover: string }> = ({ mover }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const jsonData = await queryTopMovers(mover); // Use the mover prop dynamically
        setData(jsonData.tickers);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mover]); // Re-fetch data whenever mover prop changes

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      {data && data.length > 0 ? (
        <TickerTable data={data} />
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default TopMoverFetcher;
