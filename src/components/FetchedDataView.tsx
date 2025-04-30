import React, { useState } from 'react';
import './css/FetchedDataView.css';
import StockChart from './Chart.tsx';
import LlmPlugin from './LlmPlugin.tsx';

const FetchedDataView = ({ searchData }) => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [purchaseInfo, setPurchaseInfo] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [indicatorData, setIndicatorData] = useState({});

  console.log('SEARCHED DATA', searchData);

  const handleToggleWatchlist = async (ticker, type) => {
    try {
      const isAlreadyInWatchlist = watchlistItems.some(item => item.name === ticker);

      if (isAlreadyInWatchlist) {
        const updatedList = watchlistItems.filter(item => item.name !== ticker);
        setWatchlistItems(updatedList);
        await fetch(`http://localhost:5000/midas/asset/watch_list/${ticker}`, {
          method: 'DELETE',
        });
      } else {
        const updatedList = [...watchlistItems, { name: ticker, type }];
        setWatchlistItems(updatedList);
        await fetch('http://localhost:5000/midas/asset/watch_list/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: ticker, type }),
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const handlePurchaseClick = (ticker, price) => {
    setPurchaseInfo({ ...purchaseInfo, [ticker]: { shares: '', price, showInput: true } });
  };

  const handleSharesChange = (ticker, shares) => {
    setPurchaseInfo({ ...purchaseInfo, [ticker]: { ...purchaseInfo[ticker], shares } });
  };

  const handleConfirmPurchase = async (ticker) => {
    const { shares, price } = purchaseInfo[ticker];
    try {
      await fetch('http://localhost:5000/midas/asset/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: ticker, shares: parseInt(shares, 10), price }),
      });
      setPurchaseInfo({ ...purchaseInfo, [ticker]: { shares: '', price, showInput: false } });
      alert(`Purchased ${shares} shares of ${ticker} at ${price}`);
    } catch (error) {
      console.error('Error making purchase:', error);
    }
  };

  const handleRowClick = async (ticker) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [ticker]: !prevExpandedRows[ticker],
    }));

    if (!expandedRows[ticker]) {
      try {
        const response = await fetch(`http://localhost:5000/midas/asset/get_signal/${ticker}/stock`);
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
    if (isBearish) return { color: 'red' };
    if (isNeutral) return { color: 'blue' };
    return {};
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
              <tr onClick={() => handleRowClick(item.ticker)}>
                <td>{item.ticker}</td>
                <td>{item.market_price}</td>
                <td style={getStyle(item.macd, 'MACD')}>{item.macd}</td>
                <td style={getStyle(item.price_rate_of_change, 'Rate of Change')}>{item.price_rate_of_change}</td>
                <td style={getStyle(item.rsi, 'RSI')}>{item.rsi}</td>
                <td style={getStyle(item.stochastic_oscillator, 'SO')}>{item.stochastic_oscillator}</td>
                <td>{item.signal}</td>
                <td>
                  <button
                    className="search-button"
                    onClick={() => handleToggleWatchlist(item.ticker, item.type)}
                  >
                    {watchlistItems.some(watchlistItem => watchlistItem.name === item.ticker)
                      ? 'Remove from Watchlist'
                      : 'Add to Watchlist'}
                  </button>
                </td>
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
                    <button className="search-button" onClick={() => handlePurchaseClick(item.ticker, item.market_price)}>
                      Purchase
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows[item.ticker] && (
                <tr>
                  <td colSpan="9">
                    <StockChart ticker={item.ticker} timeRange={1} />
                    <LlmPlugin />
                  </td>
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
