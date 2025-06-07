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
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Volume</th>
                        <th>VWAP</th>
                    </tr>
                </thead>
                <tbody>
                    {tickers.map((tickerData, index) => (                      
                       <React.Fragment key={index}>
                <tr onClick={() => handleRowClick(tickerData.ticker)}>

                            <td>{tickerData.ticker}</td>
                            <td>{tickerData.todaysChangePerc.toFixed(2)}</td>
                            <td>{tickerData.todaysChange.toFixed(2)}</td>
                            <td>{tickerData.day.o.toFixed(2)}</td>
                            <td>{tickerData.day.h.toFixed(2)}</td>
                            <td>{tickerData.day.l.toFixed(2)}</td>
                            <td>{tickerData.day.c.toFixed(2)}</td>
                            <td>{tickerData.day.v}</td>
                            <td>{tickerData.day.vw.toFixed(2)}</td>
                        </tr>
                        {expandedRows[tickerData.ticker] && indicatorData[tickerData.ticker] && (
                        <>

             <tr>
                  <td colSpan="9">
                    <TechnicalIndicator searchData={[indicatorData[tickerData.ticker]]} /> {/* Pass the specific asset data to TechnicalIndicator */}
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
