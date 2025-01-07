import React, { useState, useEffect } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling
import FetchedDataView from './FetchedDataView.tsx';
import { scrapeReddit } from '../services/api.tsx';

const ShortsView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]); // Ensure data is an array

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const initialData = await scrapeReddit('1');
        console.log('SHORTS RETRIEVED: ', initialData);

        // Process each item from the initial response
        const processedData = await Promise.all(
          initialData.map(async (searchTerm: string) => {
            const assetType = 'stock'; // Specify asset type
            const url = `http://localhost:8080/midas/asset/get_signal/${searchTerm}/${assetType}`;
            console.log(`Searching for ${searchTerm} with type ${assetType}`);
            try {
              const response = await fetch(url);
              const jsonData = await response.json();
              console.log('JSON RESPONSE', jsonData);

              // Create and return a new item
              return {
                name: searchTerm,
                marketPrice: jsonData.marketPrice,
                signal: jsonData.signal,
                macd: jsonData.macd,
                priceRateOfChange: jsonData.priceRateOfChange,
                relativeStrengthIndex: jsonData.relativeStrengthIndex,
                stochasticOscillator: jsonData.stochasticOscillator,
              };
            } catch (error) {
              console.error(`Error fetching data for ${searchTerm}:`, error);
              return null; // Handle errors gracefully
            }
          })
        );

        // Filter out any null values from failed requests
        setData(processedData.filter((item) => item !== null));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Dependency array ensures this runs once on component mount

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      {data.length > 0 ? (
        <FetchedDataView searchData={data} /> // Pass the entire data array
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default ShortsView;
