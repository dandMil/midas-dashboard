import React, { useState } from 'react';
import AssetFetcher from './AssetFetcher.tsx';
import FetchedDataView from './FetchedDataView.tsx'; // Import the new component
import VolumeFetcher from './VolumeFetcher.tsx'
import './css/Dashboard.css'; // Import CSS file for styling

const Dashboard = () => {
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
      const newItem = { name: searchTerm, marketPrice: jsonData.marketPrice, signal: jsonData.signal };
      setSearchedItems(prevItems => [...prevItems, newItem]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="search-bar-container">
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
      
            {/* AssetFetcher component */}
            <div className="fetcher-view">
        <VolumeFetcher />
      </div>

      {/* AssetFetcher component */}
      <div className="fetcher-view">
        <AssetFetcher />
      </div>

    </div>
  );
};

export default Dashboard;
