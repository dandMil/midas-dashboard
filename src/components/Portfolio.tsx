import React, { useState, useEffect } from 'react';
import './Portfolio.css'; // Import CSS file for styling
import TechnicalIndicator from './TechnicalIndicator.tsx'; // Import the TechnicalIndicator component
import StockChart from './Chart.tsx'; // Import the StockChart component

const Portfolio = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // State to track expanded rows
  const [indicatorData, setIndicatorData] = useState({}); // State to store indicator data

  useEffect(() => {
    // Fetch trade recommendations from the API
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('http://localhost:8080/midas/asset/get_portfolio');
        const data = await response.json();
        // Extract and transform the data to fit the table's requirements
        const transformedData = data.map(item => ({
          ticker: item.ticker,
          shares: item.shares,
          currentPrice: item.currentPrice,
          ...item.tradeRecommendation,
        }));
        setRecommendations(transformedData);
      } catch (error) {
        console.error('Error fetching trade recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

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

  return (
    <div className="trade-recommendations-container">
      <h2>Trade Recommendations</h2>
      <table className="trade-recommendations-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Shares</th>
            <th>Last Price</th>
            <th>Entry Price</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
            <th>Expected Profit</th>
            <th>Expected Loss</th>
            <th>Strategy</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, index) => (
            <React.Fragment key={index}>
              <tr onClick={() => handleRowClick(rec.ticker)}>
                <td>{rec.ticker}</td>
                <td>{rec.shares}</td>
                <td>{rec.currentPrice}</td>
                <td>{rec.priceEntry.toFixed(3)}</td>
                <td>{rec.stopLoss.toFixed(3)}</td>
                <td>{rec.takeProfit.toFixed(3)}</td>
                <td>{rec.expectedProfit.toFixed(3)}</td>
                <td>{rec.expectedLoss.toFixed(3)}</td>
                <td>{rec.strategy}</td>
              </tr>
              {expandedRows[rec.ticker] && indicatorData[rec.ticker] && (
                <>
                  <tr>
                    <td colSpan="9">
                      <TechnicalIndicator searchData={[indicatorData[rec.ticker]]} />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="9">
                      <StockChart ticker={rec.ticker} timeRange={1} />
                    </td>
                  </tr>
                </>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Portfolio;
