import React, { useState, useEffect } from 'react';
import './css/TickerTable.css'; // Import CSS file for styling

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

    useEffect(() => {
        // Update data when initialData changes
        // setData(initialData);
      }, [tickers]);
    console.log('TICKER TABLE ',tickers)
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
                        
                        <tr key={index}>
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
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TickerTable;
