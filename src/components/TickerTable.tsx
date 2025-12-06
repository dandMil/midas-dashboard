import React, { useState, useEffect } from 'react';
import './css/TickerTable.css'; // Import CSS file for styling
import TechnicalIndicator from './TechnicalIndicator.tsx'; // Import the TechnicalIndicator component
import StockChart from './Chart.tsx';
interface DayData {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
}

interface TickerData {
    ticker: string;
    todaysChangePerc: number;
    todaysChange: number;
    updated: number;
    day: DayData;
    // Optional technical indicators
    rsi?: number;
    rsi_signal?: string;
    macd?: number;
    macd_signal?: number;
    stochastic_oscillator?: number;
    adr_percentage?: number;
    overall_signal?: string;
    overall_score?: number;
    performance_1m?: number;
    performance_3m?: number;
    performance_6m?: number;
}

interface PolygonResponse {
    tickers: TickerData[];
}

const TickerTable: React.FC<PolygonResponse> = ({ data: tickers }) => {
    const [indicatorData, setIndicatorData] = useState({}); // State to store indicator data
    const [expandedRows, setExpandedRows] = useState({}); // State to track expanded rows
    useEffect(() => {
        // Update data when initialData changes
        // setData(initialData);
      }, [tickers]);
    console.log('TICKER TABLE ',tickers)

    const handleRowClick = async (ticker) => {
        setExpandedRows((prevExpandedRows) => ({
          ...prevExpandedRows,
          [ticker]: !prevExpandedRows[ticker], // Toggle the expansion state
        }));
    
        if (!expandedRows[ticker]) {
          try {
            const response = await fetch(`http://localhost:8000/midas/asset/get_signal/${ticker}/stock`);
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
        <div>
            <table className = "ticker-table">
                <thead>
                    <tr>
                        <th>Ticker</th>
                        <th>Today's Change (%)</th>
                        <th>Today's Change</th>
                        <th>Close</th>
                        <th>Volume</th>
                        <th>RSI</th>
                        <th>Signal</th>
                        <th>ADR %</th>
                        <th>1M Perf</th>
                    </tr>
                </thead>
                <tbody>
                    {tickers.map((tickerData, index) => (                      
                       <React.Fragment key={index}>
                        <tr onClick={() => handleRowClick(tickerData.ticker)} style={{ cursor: 'pointer' }}>
                            <td><strong>{tickerData.ticker}</strong></td>
                            <td style={{ 
                                color: tickerData.todaysChangePerc >= 0 ? '#00ff00' : '#ff0000',
                                fontWeight: 'bold'
                            }}>
                                {tickerData.todaysChangePerc.toFixed(2)}%
                            </td>
                            <td style={{ 
                                color: tickerData.todaysChange >= 0 ? '#00ff00' : '#ff0000'
                            }}>
                                ${tickerData.todaysChange.toFixed(2)}
                            </td>
                            <td>${tickerData.day.c.toFixed(2)}</td>
                            <td>{tickerData.day.v.toLocaleString()}</td>
                            <td>{tickerData.rsi ? tickerData.rsi.toFixed(1) : 'N/A'}</td>
                            <td>
                                {tickerData.overall_signal ? (
                                    <span style={{
                                        color: tickerData.overall_signal === 'BULLISH' ? '#00ff00' : 
                                               tickerData.overall_signal === 'BEARISH' ? '#ff0000' : '#ffff00',
                                        fontWeight: 'bold',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: tickerData.overall_signal === 'BULLISH' ? 'rgba(0, 255, 0, 0.1)' : 
                                                       tickerData.overall_signal === 'BEARISH' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 0, 0.1)'
                                    }}>
                                        {tickerData.overall_signal}
                                    </span>
                                ) : 'N/A'}
                            </td>
                            <td>{tickerData.adr_percentage ? tickerData.adr_percentage.toFixed(2) + '%' : 'N/A'}</td>
                            <td style={{ 
                                color: (tickerData.performance_1m || 0) >= 0 ? '#00ff00' : '#ff0000'
                            }}>
                                {tickerData.performance_1m ? tickerData.performance_1m.toFixed(1) + '%' : 'N/A'}
                            </td>
                        </tr>
                        {expandedRows[tickerData.ticker] && indicatorData[tickerData.ticker] && (
                        <>
             <tr>
                  <td colSpan="9">
                    <TechnicalIndicator 
                      searchData={[indicatorData[tickerData.ticker]]} 
                      tickerData={tickerData}
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan="9">
                    <StockChart ticker={tickerData.ticker} timeRange={1} />
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

export default TickerTable;
