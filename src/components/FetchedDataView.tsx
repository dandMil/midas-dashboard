import React, { useState } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling

const FetchedDataView = ({ data }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false); // State variable to track whether asset is in watchlist

  // Function to handle adding/removing asset from watchlist
  const handleToggleWatchlist = async (name, type) => {
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
    <div className="fetched-data-container">
      <h2 className="fetched-data-title">Fetched Data</h2>
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
          <tr>
            <td>{data.name}</td>
            <td>{data.marketPrice}</td>
            <td>{data.signal}</td>
            <td>
              <button onClick={() => handleToggleWatchlist(data.name, data.type)}>
                {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FetchedDataView;
