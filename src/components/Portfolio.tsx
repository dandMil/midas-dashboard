import React, { useState, useEffect } from 'react';
import './Portfolio.css'; // Import CSS file for styling

const Portfolio = () => {
  const [recommendations, setRecommendations] = useState([]);

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
          ...item.tradeRecommendation,
        }));
        setRecommendations(transformedData);
      } catch (error) {
        console.error('Error fetching trade recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="trade-recommendations-container">
      <h2>Trade Recommendations</h2>
      <table className="trade-recommendations-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Shares</th>
            <th>Entry Price</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
            <th>Expected Profit</th>
            <th>Expected Loss</th>
            <th>Strategy</th>
            {/* <th>Date</th> */}
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, index) => (
            <tr key={index}>
              <td>{rec.ticker}</td>
              <td>{rec.shares}</td>
              <td>{rec.priceEntry.toFixed(3)}</td>
              <td>{rec.stopLoss.toFixed(3)}</td>
              <td>{rec.takeProfit.toFixed(3)}</td>
              <td>{rec.expectedProfit.toFixed(3)}</td>
              <td>{rec.expectedLoss.toFixed(3)}</td>
              <td>{rec.strategy}</td>
              {/* <td>{new Date(rec.recommendationDate).toLocaleDateString()}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Portfolio;
