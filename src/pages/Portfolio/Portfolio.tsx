import React, { useState, useEffect } from 'react';
import './Portfolio.css'; // Import CSS file for styling
import TechnicalIndicator from '../../components/TechnicalIndicator.tsx'; // Import the TechnicalIndicator component
import StockChart from '../../components/Chart.tsx'; // Import the StockChart component
import { fetchRecommendations, fetchIndicatorData } from '../../services/api.tsx'; // Import API functions

const Portfolio = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // State to track expanded rows
  const [indicatorData, setIndicatorData] = useState({}); // State to store indicator data

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await fetchRecommendations();
        setRecommendations(data);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    };

    loadRecommendations();
  }, []);

  const handleRowClick = async (ticker: string) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [ticker]: !prevExpandedRows[ticker], // Toggle the expansion state
    }));

    if (!expandedRows[ticker]) {
      try {
        const jsonData = await fetchIndicatorData(ticker);
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
                    <td colSpan={9}>
                      <TechnicalIndicator searchData={[indicatorData[rec.ticker]]} />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={9}>
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
