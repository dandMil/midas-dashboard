import React, { useState } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling
import LlmPlugin from './LlmPlugin.tsx';

const TechnicalIndicator = ({ searchData }) => {
  const [watchlistItems, setWatchlistItems] = useState([]); // State variable to hold watched items
  const [purchaseInfo, setPurchaseInfo] = useState({}); // State to hold purchase details

  console.log('TECHNICAL DATA', searchData);

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

  // Helper function to get the style based on the value
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
            <th title="MACD: Above 0 indicates bullish, below 0 indicates bearish">MACD</th>
            <th title="Rate of Change: Above 0 indicates bullish, below 0 indicates bearish">Rate of Change</th>
            <th title="RSI: Above 70 indicates overbought (bearish), below 30 indicates oversold (bullish)">RSI</th>
            <th title="Stochastic Oscillator: Above 80 indicates overbought (bearish), below 20 indicates oversold (bullish)">SO</th>
            <th>Signal</th>
            <th>Buy</th>
          </tr>
        </thead>
        <tbody>
          {searchData.map((item, index) => (
            <tr key={index}>
              <td style={getStyle(item.macd, 'MACD')}>{item.macd}</td>
              <td style={getStyle(item.price_rate_of_change, 'Rate of Change')}>{item.price_rate_of_change}</td>
              <td style={getStyle(item.rsi, 'RSI')}>{item.rsi}</td>
              <td style={getStyle(item.stochastic_oscillator, 'SO')}>{item.stochastic_oscillator}</td>
              <td>{item.signal}</td>
              <td>
                {purchaseInfo[item.ticker]?.showInput ? (
                  <>
                    <input
                      type="number"
                      value={purchaseInfo[item.ticker].shares}
                      onChange={(e) => handleSharesChange(item.ticker, e.target.value)}
                      placeholder="Shares"
                      className="input-box"
                    />
                    <button className="confirm-button" onClick={() => handleConfirmPurchase(item.ticker)}>
                      Confirm
                    </button>
                  </>
                ) : (
                  <button className="search-button" onClick={() => handlePurchaseClick(item.ticker, item.marketPrice)}>
                    Purchase
                  </button>
                )}
              </td>
              <td>
                    <LlmPlugin />

                    </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TechnicalIndicator;
