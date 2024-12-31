import React, { useState } from 'react';
import AssetFetcher from '../pages/Portfolio/Watchlist/Watchlist.tsx';
import FetchedDataView from './FetchedDataView.tsx';
import VolumeFetcher from './VolumeFetcher.tsx';
import TopMoverFetcher from './TopMoverFetcher.tsx'
import StringListFetcher from './StringListFetcher.tsx';
import StockChart from './Chart.tsx';

import './css/Dashboard.css'; // Import CSS file for styling

const ReserchView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState('crypto'); // Default to 'crypto'
  const [searchedItems, setSearchedItems] = useState([]); // State variable to hold searched items

  const handleSearch = async () => {
    console.log(`Searching for ${searchTerm} with type ${assetType}`);
    let url = `http://localhost:8080/midas/asset/get_signal/${searchTerm}/${assetType}`;

    try {
      const response = await fetch(url);
      const jsonData = await response.json();
      console.log('JSON RESPONSE', jsonData);

      // Add searched item to the list of searched items
      const newItem = { name: searchTerm, marketPrice: jsonData.marketPrice, signal: jsonData.signal,
        macd: jsonData.macd, priceRateOfChange: jsonData.priceRateOfChange, relativeStrengthIndex: jsonData.relativeStrengthIndex,
        stochasticOscillator: jsonData.stochasticOscillator
       };
      setSearchedItems(prevItems => [...prevItems, newItem]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleStringListFetch = async (strings: string[], startDate: string, endDate: string) => {
    console.log(`Fetching data for strings: ${strings.join(', ')} from ${startDate} to ${endDate}`);
    const url = `http://localhost:8080/api/your-endpoint`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strings, startDate, endDate }),
      });
      const jsonData = await response.json();
      console.log('Fetched data:', jsonData);
      // Handle the response data
    } catch (error) {
      console.error('Error fetching string list data:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="search-bar-container">
        <br>
        </br>
        <br>
        </br>
        <br>
        </br>
        <input
          type="text"
          className="search-bar"
          placeholder="Enter search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-button" onClick={handleSearch}>Search</button>
      </div>
      <div className="radio-buttons-container">
        <input
          type="radio"
          id="crypto"
          name="assetType"
          value="crypto"
          checked={assetType === 'crypto'}
          onChange={() => setAssetType('crypto')}
        />
        <label htmlFor="crypto">Crypto</label>

        <input
          type="radio"
          id="stock"
          name="assetType"
          value="stock"
          checked={assetType === 'stock'}
          onChange={() => setAssetType('stock')}
        />
        <label htmlFor="stock">Stock</label>
      </div>
      {/* Display of fetched data */}
      <div className="data-display">
        {searchedItems.length > 0 ? (
          <FetchedDataView searchData={searchedItems} /> // Pass searched items to FetchedDataView component
        ) : (
          <p>No data available</p>
        )}
      </div>

    </div>
  );
};

export default ReserchView;
