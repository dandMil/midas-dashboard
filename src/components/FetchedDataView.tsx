import React, { useState } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling
import StockChart from './Chart.tsx';
import LlmPlugin from './LlmPlugin.tsx';

const FetchedDataView = ({ searchData }) => {
  const [watchlistItems, setWatchlistItems] = useState([]); // State variable to hold watched items
  const [purchaseInfo, setPurchaseInfo] = useState({}); // State to hold purchase details
  const [expandedRows, setExpandedRows] = useState({}); // State to track expanded rows
  const [indicatorData, setIndicatorData] = useState({}); // State to store indicator data

  console.log('SEARCHED DATA', searchData);

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
        await fetch(`http://localhost:8080/midas/asset/watch_list/${name}`, {
          method: 'DELETE',
        });
      } else {
        // If item is not in watchlist, add it
        const updatedList = [...watchlistItems, { name, type }];
        setWatchlistItems(updatedList);
        // Call add API if needed
        await fetch('http://localhost:8080/midas/asset/watch_list/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, type }),
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  // Function to handle purchase action
  const handlePurchaseClick = (name, price) => {
    setPurchaseInfo({ ...purchaseInfo, [name]: { shares: '', price, showInput: true } });
  };

  // Function to handle change in the number of shares input
  const handleSharesChange = (name, shares) => {
    setPurchaseInfo({ ...purchaseInfo, [name]: { ...purchaseInfo[name], shares } });
  };

  // Function to handle confirm purchase action
  const handleConfirmPurchase = async (name) => {
    const { shares, price } = purchaseInfo[name];
    try {
      // Send POST request to the API
      await fetch('http://localhost:8080/midas/asset/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, shares: parseInt(shares, 10), price }),
      });
      // Clear the purchase info for the confirmed item
      setPurchaseInfo({ ...purchaseInfo, [name]: { shares: '', price, showInput: false } });
      alert(`Purchased ${shares} shares of ${name} at ${price}`);
    } catch (error) {
      console.error('Error making purchase:', error);
    }
  };

  const handleRowClick = async (ticker) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [ticker]: !prevExpandedRows[ticker], // Toggle the expansion state
    }));

    if (!expandedRows[ticker]) {
      try {
        const response = await fetch(`http://localhost:8080/midas/asset/get_signal/${ticker}/stock`);
        const jsonData = await response.json();
        setIndicatorData((prevData) => ({
          ...prevData,
          [ticker]: jsonData,
        }));
      } catch (error) {
        console.error(`Error fetching indicator data for ${ticker}:`, error);
      }
    }
  };

  const getStyle = (value, type) => {
    let isBearish = false;
    let isNeutral = false;
    switch (type) {
      case 'MACD':
        isBearish = value < 0;
        isNeutral = value === 0;
        break;
      case 'Rate of Change':
        isBearish = value < 0;
        isNeutral = value === 0;
        break;
      case 'RSI':
        isBearish = value > 70;
        isNeutral = value >= 30 && value <= 70;
        break;
      case 'SO':
        isBearish = value > 80;
        isNeutral = value >= 20 && value <= 80;
        break;
      default:
        break;
    }
    if (isBearish) {
      return { color: 'red' };
    } else if (isNeutral) {
      return { color: 'blue' };
    } else {
      return {};
    }
  };

  return (
    <div className="fetched-data-container">
      <table className="fetched-data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Market Price</th>
            <th title="MACD: Above 0 indicates bullish, below 0 indicates bearish">MACD</th>
            <th title="Rate of Change: Above 0 indicates bullish, below 0 indicates bearish">Rate of Change</th>
            <th title="RSI: Above 70 indicates overbought (bearish), below 30 indicates oversold (bullish)">RSI</th>
            <th title="Stochastic Oscillator: Above 80 indicates overbought (bearish), below 20 indicates oversold (bullish)">SO</th>
            <th>Signal</th>
            <th>Watch</th>
            <th>Buy</th>
          </tr>
        </thead>
        <tbody>
          {searchData.map((item, index) => (
            <React.Fragment key={index}>
              <tr onClick={() => handleRowClick(item.name)}>
                <td>{item.name}</td>
                <td>{item.marketPrice}</td>
                <td style={getStyle(item.macd, 'MACD')}>{item.macd}</td>
                <td style={getStyle(item.priceRateOfChange, 'Rate of Change')}>{item.priceRateOfChange}</td>
                <td style={getStyle(item.relativeStrengthIndex, 'RSI')}>{item.relativeStrengthIndex}</td>
                <td style={getStyle(item.stochasticOscillator, 'SO')}>{item.stochasticOscillator}</td>
                <td>{item.signal}</td>
                <td>
                  <button className="search-button" onClick={() => handleToggleWatchlist(item.name, item.type)}>
                    {watchlistItems.some(watchlistItem => watchlistItem.name === item.name) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </button>
                </td>
                <td>
                  {purchaseInfo[item.name]?.showInput ? (
                    <>
                      <input
                        type="number"
                        value={purchaseInfo[item.name].shares}
                        onChange={(e) => handleSharesChange(item.name, e.target.value)}
                        placeholder="Shares"
                        className="input-box"
                      />
                      <button className="confirm-button" onClick={() => handleConfirmPurchase(item.name)}>
                        Confirm
                      </button>
                    </>
                  ) : (
                    <button className="search-button" onClick={() => handlePurchaseClick(item.name, item.marketPrice)}>
                      Purchase
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows[item.name] && (
                <tr>
                  <td colSpan="9">
                    <StockChart ticker={item.name} timeRange={1} />
                  </td>
                  <LlmPlugin/>

                </tr>
      
              )}
          
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FetchedDataView;
