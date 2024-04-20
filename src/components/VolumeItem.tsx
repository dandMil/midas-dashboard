import React, { useState, useEffect } from 'react';
import './css/AssetItem.css'; // Import CSS file for styling

const VolumeItem = ({ data: initialData }) => {
  const [data, setData] = useState(initialData); // State variable to store asset data
  const [currentPage, setCurrentPage] = useState(1); // State variable to track current page

  // Calculate total number of pages
  const totalPages = Math.ceil(data.length / 15);

  // Function to handle adding/removing asset from watchlist
  const handleToggleWatchlist = async (name, type) => {
    try {
      // Your logic for adding/removing from watchlist
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  // Function to sort assets by market signal
  const sortBySignal = () => {
    // Your sorting logic
  };

  useEffect(() => {
    // Update data when initialData changes
    setData(initialData);
  }, [initialData]);

  // Function to handle page navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate start and end page numbers to display
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(startPage + 4, totalPages);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  return (
    <div>
      <table className="asset-table">
          <thead>
              <tr>
                  <th>Name</th>
                  <th>Market Price</th>
                  <th>Market Signal</th>
                  <th>Volume</th>
                  <th>Daily Change</th>
                  <th>Weekly Change</th>
                  <th>Market Date</th>
                  <th>Favorite</th>
              </tr>
          </thead>
          <tbody>
              {data.slice((currentPage - 1) * 15, currentPage * 15).map((asset, index) => (
                  <tr key={index}>
                      <td>{asset.name}</td>
                      <td>{asset.marketPrice}</td>
                      <td>{asset.signal}</td>
                      <td>{asset.volume}</td>
                      <td>{asset.dailyIncrease}</td>
                      <td>{asset.weeklyIncrease}</td>
                      <td>{asset.lastUpdated}</td>
                      <td>
                          <button className='asset-button' onClick={() => handleToggleWatchlist(asset.name, asset.type)}>
                              Add to Watchlist
                          </button>
                      </td>
                  </tr>
              ))}
          </tbody>
      </table>
      <div className="pagination">
        {/* Render previous button */}
        {currentPage > 1 && (
          <button onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
        )}

        {/* Render first page button */}
        {startPage > 1 && (
          <button onClick={() => handlePageChange(1)}>1</button>
        )}

        {/* Render start ellipsis */}
        {startPage > 2 && (
          <span>...</span>
        )}

        {/* Render pages */}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
          <button key={startPage + index} onClick={() => handlePageChange(startPage + index)} className={currentPage === startPage + index ? 'active' : ''}>
            {startPage + index}
          </button>
        ))}

        {/* Render end ellipsis */}
        {endPage < totalPages && (
          <span>...</span>
        )}

        {/* Render last page button */}
        {endPage < totalPages && (
          <button onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
        )}

        {/* Render next button */}
        {currentPage < totalPages && (
          <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
        )}
      </div>
    </div>
  );
};

export default VolumeItem;
