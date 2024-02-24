import React, { useState } from 'react';
import AssetFetcher from './AssetFetcher.tsx';
import AssetItem from './AssetItem.tsx';
import './Dashboard.css'; // Import CSS file for styling

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState('crypto'); // Default to 'crypto'
  const [fetchedData, setFetchedData] = useState(null); // State variable to hold fetched data

  const handleSearch = async () => {
    console.log(`Searching for ${searchTerm} with type ${assetType}`);
    let url = `http://localhost:8080/midas/asset/get_signal/${searchTerm}/${assetType}`;

    try {
      const response = await fetch(url);
      const jsonData = await response.json();
      console.log('JSON RESPONSE', jsonData);
      const dataArray = Object.keys(jsonData).map(key => jsonData[key]);

      // Update state to store the fetched data
      setFetchedData(dataArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
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
      {/* AssetFetcher component */}
      <div className="fetcher-view">
        <h2>Asset Fetcher</h2>
        <AssetFetcher />
      </div>
      {/* Display of fetched data */}
      {/* <div className="data-display">
        {fetchedData ? (
          fetchedData.map(asset => (
            <AssetItem key={asset.id} asset={asset} />
          ))
        ) : (
          <p>No data available</p>
        )}
      </div> */}
      <div className="data-display">
  {fetchedData ? (
    <AssetItem data={fetchedData} />
  ) : (
    <p>No data available</p>
  )}
</div>

    </div>
  );
};

export default Dashboard;
