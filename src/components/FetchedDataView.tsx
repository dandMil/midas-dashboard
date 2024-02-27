import React, { useState } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling

const FetchedDataView = ({ searchData }) => {
  const [watchlistItems, setWatchlistItems] = useState([]); // State variable to hold watched items

  // Function to handle adding/removing asset from watchlist
  const handleToggleWatchlist = async (name, type) => {
    try {
      // Check if the item is already in the watchlist
      const isAlreadyInWatchlist = watchlistItems.some(item => item.name === name);

      if (isAlreadyInWatchlist) {
        // If item is already in watchlist, remove it
        const updatedList = watchlistItems.filter(item => item.name !== name);
        setWatchlistItems(updatedList);
        // Call delete API if needed
        const response = await fetch(`http://localhost:8080/midas/asset/watch_list/${name}`, {
          method: 'DELETE',
        });
        // Handle response as needed
      } else {
        // If item is not in watchlist, add it
        const updatedList = [...watchlistItems, { name, type }];
        setWatchlistItems(updatedList);
        // Call add API if needed
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
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  return (
    <div className="fetched-data-container">
      <table className="fetched-data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Market Price</th>
            <th>Signal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {searchData.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.marketPrice}</td>
              <td>{item.signal}</td>
              <td>
                <button className="search-button" onClick={() => handleToggleWatchlist(item.name, item.type)}>
                  {watchlistItems.some(watchlistItem => watchlistItem.name === item.name) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FetchedDataView;
