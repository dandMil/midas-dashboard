import React, { useState } from 'react';
import './css/AssetItem.css'; // Import CSS file for styling

const AssetItem = ({ data }) => {

    console.log('DATA IN ASSET ITEMS',data)
  const [isInWatchlist, setIsInWatchlist] = useState(false); // State variable to track whether asset is in watchlist

  // Function to handle adding/removing asset from watchlist
  const handleToggleWatchlist = async (name:string, type:string) => {
    try {
      if (isInWatchlist) {
        // If asset is already in watchlist, call delete API
        const response = await fetch(`http://localhost:8080/midas/asset/watch_list/${name}`, {
          method: 'DELETE',
        });
        // Handle response as needed
      } else {
        // If asset is not in watchlist, call add API
        const response = await fetch('http://localhost:8080/midas/asset/watch_list/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            type: type,
          }),
        });
        // Handle response as needed
      }
      // Toggle the isInWatchlist state
      setIsInWatchlist(prevState => !prevState);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  return (
    <table className="asset-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Market Price</th>
                <th>Market Signal</th>
                <th>Market Date</th>
                <th>Favorite</th>
            </tr>
        </thead>
        <tbody>
            {data.map((asset, index) => (
                <tr key={index}>
                    <td>{asset.name}</td>
                    <td>{asset.marketPrice}</td>
                    <td>{asset.signal}</td>
                    <td>{asset.date}</td>
                    <td>
                        <button className = 'asset-button' onClick={() => handleToggleWatchlist(asset.name, asset.type)}>
                            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);
};


export default AssetItem;
