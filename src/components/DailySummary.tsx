import React, { useEffect, useState } from 'react';
import { fetchDailySummary } from '../services/api.tsx';

const DailySummary: React.FC = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        console.log('Fetching Daily Summary');
        const data = await fetchDailySummary();
        console.log('DATA RETRIEVED', data);
        setSummary(data);
      } catch (error) {
        console.error("Failed to load daily summary:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

//   const renderLog = (log: any[]) => {
//     if (!log || log.length === 0) return '—';
//     return (
//       <ul style={{ margin: 0, paddingLeft: '1em' }}>
//         {log.map((entry, i) => (
//           <li key={i}>
//             {entry.date}: {entry.action.toUpperCase()} @ ${entry.price.toFixed(2)}
//             <br />
//             SL: ${entry.stop_loss.toFixed(2)}, TP: ${entry.take_profit.toFixed(2)}
//           </li>
//         ))}
//       </ul>
//     );
//   };


const renderLog = (log: any[]) => {
    return (
      <table className="trade-log">
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Price</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
          </tr>
        </thead>
        <tbody>
          {log.map((logItem, idx) => (
            <tr key={idx}>
              <td>{logItem.date ?? 'N/A'}</td>
              <td>{logItem.action}</td>
              <td>{logItem.price != null ? `$${logItem.price.toFixed(2)}` : '—'}</td>
              <td>{logItem.stop_loss != null ? `$${logItem.stop_loss.toFixed(2)}` : '—'}</td>
              <td>{logItem.take_profit != null ? `$${logItem.take_profit.toFixed(2)}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  
  
  if (loading) return <div>Loading daily trade summary...</div>;

  return (
    <div className="daily-summary-container">
      <h2>Daily Trade Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Strategy</th>
            <th>Signal</th>
            <th>Price</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
            <th>Expected Profit</th>
            <th>Expected Loss</th>
            <th>Backtested Return</th>
            <th>Log</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((item, index) => (
            <tr key={index}>
              <td>{item.ticker}</td>
              <td>{item.strategy}</td>
              <td>{item.signal}</td>
              <td>{item.price != null ? `$${item.price.toFixed(2)}` : '—'}</td>
              <td>{item.stop_loss != null ? `$${item.stop_loss.toFixed(2)}` : '—'}</td>
              <td>{item.take_profit != null ? `$${item.take_profit.toFixed(2)}` : '—'}</td>
              <td>{item.expected_profit != null ? `$${item.expected_profit.toFixed(2)}` : '—'}</td>
              <td>{item.expected_loss != null ? `$${item.expected_loss.toFixed(2)}` : '—'}</td>
              <td>{item.total_return != null ? `$${item.total_return.toFixed(2)}` : '—'}</td>
              <td>{renderLog(item.log)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailySummary;
