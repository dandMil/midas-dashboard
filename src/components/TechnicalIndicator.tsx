import React, { useState } from 'react';
import './css/FetchedDataView.css'; // Import CSS file for styling
import LlmPlugin from './LlmPlugin.tsx';
import { doPaperTransaction } from '../services/api.tsx';

const TechnicalIndicator = ({ searchData, tickerData }: { searchData: any[], tickerData?: any }) => {
  const [watchlistItems, setWatchlistItems] = useState([]); // State variable to hold watched items
  const [purchaseInfo, setPurchaseInfo] = useState<{[key: string]: {
    shares: string;
    price: string;
    stopLoss: string;
    takeProfit: string;
    showInput: boolean;
  }}>({}); // State to hold purchase details

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

  // Calculate suggested stop loss and take profit based on ADR or default percentages
  const calculateSuggestedStopLoss = (currentPrice: number, adrPercentage?: number) => {
    if (adrPercentage && adrPercentage > 0) {
      // Use 2x ADR as stop loss distance (conservative)
      const stopLossPct = (adrPercentage * 2) / 100;
      return Math.max(currentPrice * (1 - stopLossPct), currentPrice * 0.95); // Max 5% loss
    }
    // Default 5% stop loss
    return currentPrice * 0.95;
  };

  const calculateSuggestedTakeProfit = (currentPrice: number, adrPercentage?: number) => {
    if (adrPercentage && adrPercentage > 0) {
      // Use 3x ADR as take profit target
      const takeProfitPct = (adrPercentage * 3) / 100;
      return currentPrice * (1 + takeProfitPct);
    }
    // Default 10% take profit
    return currentPrice * 1.10;
  };

  // Function to handle purchase action
  const handlePurchaseClick = (name: string, price: number, adrPercentage?: number) => {
    const suggestedStopLoss = calculateSuggestedStopLoss(price, adrPercentage).toFixed(2);
    const suggestedTakeProfit = calculateSuggestedTakeProfit(price, adrPercentage).toFixed(2);
    
    setPurchaseInfo({ 
      ...purchaseInfo, 
      [name]: { 
        shares: '', 
        price: price.toString(), 
        stopLoss: suggestedStopLoss,
        takeProfit: suggestedTakeProfit,
        showInput: true 
      } 
    });
  };

  // Function to handle change in the number of shares input
  const handleSharesChange = (name: string, field: string, value: string) => {
    setPurchaseInfo({ 
      ...purchaseInfo, 
      [name]: { 
        ...purchaseInfo[name],
        [field]: value
      } 
    });
  };

  // Function to handle confirm purchase action (now using paper trading)
  const handleConfirmPurchase = async (name: string) => {
    const info = purchaseInfo[name];
    if (!info || !info.shares || !info.price) {
      alert('Please fill in shares and price');
      return;
    }

    try {
      const result = await doPaperTransaction({
        ticker: name,
        transactionType: 'buy',
        shares: parseInt(info.shares, 10),
        current_price: parseFloat(info.price),
        stop_loss: info.stopLoss ? parseFloat(info.stopLoss) : undefined,
        take_profit: info.takeProfit ? parseFloat(info.takeProfit) : undefined
      });

      if (result.success) {
        alert(result.message);
        // Clear the purchase info for the confirmed item
        setPurchaseInfo({ ...purchaseInfo, [name]: { ...info, shares: '', showInput: false } });
      } else {
        alert(result.message || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('Error making purchase:', error);
      alert(error.message || 'Transaction failed');
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
          {searchData.map((item, index) => {
            const ticker = item.ticker || item.name;
            const currentPrice = item.marketPrice || item.price || 0;
            // Get ADR from tickerData if available (passed from TickerTable)
            const adrPercentage = tickerData?.adr_percentage || item.adr_percentage;
            
            return (
              <tr key={index}>
                <td style={getStyle(item.macd || 0, 'MACD')}>{item.macd || 'N/A'}</td>
                <td style={getStyle(item.price_rate_of_change || 0, 'Rate of Change')}>{item.price_rate_of_change || 'N/A'}</td>
                <td style={getStyle(item.rsi || 0, 'RSI')}>{item.rsi || 'N/A'}</td>
                <td style={getStyle(item.stochastic_oscillator || 0, 'SO')}>{item.stochastic_oscillator || 'N/A'}</td>
                <td>{item.signal || 'N/A'}</td>
                <td>
                  {purchaseInfo[ticker]?.showInput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
                      <input
                        type="number"
                        value={purchaseInfo[ticker].shares}
                        onChange={(e) => handleSharesChange(ticker, 'shares', e.target.value)}
                        placeholder="Shares"
                        className="input-box"
                      />
                      <input
                        type="number"
                        value={purchaseInfo[ticker].stopLoss}
                        onChange={(e) => handleSharesChange(ticker, 'stopLoss', e.target.value)}
                        placeholder="Stop Loss"
                        className="input-box"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={purchaseInfo[ticker].takeProfit}
                        onChange={(e) => handleSharesChange(ticker, 'takeProfit', e.target.value)}
                        placeholder="Take Profit"
                        className="input-box"
                        step="0.01"
                      />
                      <button className="confirm-button" onClick={() => handleConfirmPurchase(ticker)}>
                        Confirm Buy
                      </button>
                      <button 
                        className="cancel-button" 
                        onClick={() => setPurchaseInfo({ ...purchaseInfo, [ticker]: { ...purchaseInfo[ticker], showInput: false } })}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="search-button" 
                      onClick={() => handlePurchaseClick(ticker, currentPrice, adrPercentage)}
                    >
                      Paper Trade
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TechnicalIndicator;
