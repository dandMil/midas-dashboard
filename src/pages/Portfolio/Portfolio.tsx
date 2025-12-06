import React, { useState, useEffect } from 'react';
import './Portfolio.css';
import TechnicalIndicator from '../../components/TechnicalIndicator.tsx';
import StockChart from '../../components/Chart.tsx';
import { 
  getPaperPortfolio, 
  getPaperAccount, 
  doPaperTransaction,
  fetchIndicatorData 
} from '../../services/api.tsx';

interface Position {
  ticker: string;
  shares: number;
  entry_price: number;
  current_price: number;
  position_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  stop_loss: number | null;
  take_profit: number | null;
  updated_at: string;
}

interface Account {
  starting_capital: number;
  cash_balance: number;
  portfolio_value: number;
  total_portfolio_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_pnl: number;
  total_return_percent: number;
  last_updated: string;
  trading_date: string;
}

const Portfolio = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  const [indicatorData, setIndicatorData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<{[key: string]: {
    type: 'buy' | 'sell';
    shares: string;
    stopLoss: string;
    takeProfit: string;
    showInput: boolean;
  }}>({});

  const loadPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolioData, accountData] = await Promise.all([
        getPaperPortfolio(),
        getPaperAccount()
      ]);
      setPositions(portfolioData);
      setAccount(accountData);
    } catch (err: any) {
      console.error('Error loading portfolio:', err);
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    // Refresh every 30 seconds to update prices
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRowClick = async (ticker: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [ticker]: !prev[ticker]
    }));

    if (!expandedRows[ticker]) {
      try {
        const jsonData = await fetchIndicatorData(ticker);
        setIndicatorData((prev) => ({
          ...prev,
          [ticker]: jsonData
        }));
      } catch (err) {
        console.error(`Error fetching indicator data for ${ticker}:`, err);
      }
    }
  };

  const handleTransactionClick = (ticker: string, type: 'buy' | 'sell', currentPrice: number) => {
    setTransactionData((prev) => ({
      ...prev,
      [ticker]: {
        type,
        shares: '',
        stopLoss: '',
        takeProfit: '',
        showInput: true
      }
    }));
  };

  const handleTransactionInputChange = (ticker: string, field: string, value: string) => {
    setTransactionData((prev) => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        [field]: value
      }
    }));
  };

  const handleExecuteTransaction = async (position: Position) => {
    const txnData = transactionData[position.ticker];
    if (!txnData || !txnData.shares) {
      alert('Please enter number of shares');
      return;
    }

    try {
      const result = await doPaperTransaction({
        ticker: position.ticker,
        transactionType: txnData.type,
        shares: parseInt(txnData.shares),
        current_price: position.current_price,
        stop_loss: txnData.stopLoss ? parseFloat(txnData.stopLoss) : undefined,
        take_profit: txnData.takeProfit ? parseFloat(txnData.takeProfit) : undefined
      });

      if (result.success) {
        alert(result.message);
        // Clear transaction input
        setTransactionData((prev) => {
          const newData = { ...prev };
          delete newData[position.ticker];
          return newData;
        });
        // Reload portfolio
        loadPortfolio();
      } else {
        alert(result.message || 'Transaction failed');
      }
    } catch (err: any) {
      alert(err.message || 'Transaction failed');
      console.error('Transaction error:', err);
    }
  };

  if (loading) {
    return <div className="trade-recommendations-container"><p>Loading portfolio...</p></div>;
  }

  if (error) {
    return <div className="trade-recommendations-container"><p>Error: {error}</p></div>;
  }

  return (
    <div className="trade-recommendations-container">
      <div style={{ marginBottom: '20px' }}>
        <h2>Paper Trading Portfolio</h2>
        {account && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Starting Capital:</strong><br />
              ${account.starting_capital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Cash Balance:</strong><br />
              ${account.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Portfolio Value:</strong><br />
              ${account.total_portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Total P&L:</strong><br />
              <span style={{ 
                color: account.total_pnl >= 0 ? '#00ff00' : '#ff0000',
                fontWeight: 'bold'
              }}>
                ${account.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                ({account.total_return_percent.toFixed(2)}%)
              </span>
            </div>
            <div>
              <strong>Unrealized P&L:</strong><br />
              <span style={{ 
                color: account.unrealized_pnl >= 0 ? '#00ff00' : '#ff0000'
              }}>
                ${account.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <strong>Realized P&L:</strong><br />
              <span style={{ 
                color: account.realized_pnl >= 0 ? '#00ff00' : '#ff0000'
              }}>
                ${account.realized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <p>No positions. Start paper trading from the Screener or Top Movers view!</p>
      ) : (
        <table className="trade-recommendations-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Shares</th>
              <th>Entry Price</th>
              <th>Current Price</th>
              <th>Position Value</th>
              <th>Unrealized P&L</th>
              <th>Stop Loss</th>
              <th>Take Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <React.Fragment key={position.ticker}>
                <tr onClick={() => handleRowClick(position.ticker)} style={{ cursor: 'pointer' }}>
                  <td><strong>{position.ticker}</strong></td>
                  <td>{position.shares}</td>
                  <td>${position.entry_price.toFixed(2)}</td>
                  <td>${position.current_price.toFixed(2)}</td>
                  <td>${position.position_value.toFixed(2)}</td>
                  <td style={{ 
                    color: position.unrealized_pnl >= 0 ? '#00ff00' : '#ff0000',
                    fontWeight: 'bold'
                  }}>
                    ${position.unrealized_pnl.toFixed(2)} ({position.unrealized_pnl_percent.toFixed(2)}%)
                  </td>
                  <td>{position.stop_loss ? `$${position.stop_loss.toFixed(2)}` : '—'}</td>
                  <td>{position.take_profit ? `$${position.take_profit.toFixed(2)}` : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {transactionData[position.ticker]?.showInput ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input
                          type="number"
                          placeholder="Shares"
                          value={transactionData[position.ticker].shares}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'shares', e.target.value)}
                          style={{ width: '80px' }}
                        />
                        <input
                          type="number"
                          placeholder="Stop Loss (opt)"
                          value={transactionData[position.ticker].stopLoss}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'stopLoss', e.target.value)}
                          style={{ width: '100px' }}
                        />
                        <input
                          type="number"
                          placeholder="Take Profit (opt)"
                          value={transactionData[position.ticker].takeProfit}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'takeProfit', e.target.value)}
                          style={{ width: '100px' }}
                        />
                        <button 
                          onClick={() => handleExecuteTransaction(position)}
                          style={{ padding: '5px 10px', cursor: 'pointer' }}
                        >
                          {transactionData[position.ticker].type === 'buy' ? 'Buy' : 'Sell'}
                        </button>
                        <button 
                          onClick={() => setTransactionData((prev) => {
                            const newData = { ...prev };
                            delete newData[position.ticker];
                            return newData;
                          })}
                          style={{ padding: '5px 10px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          onClick={() => handleTransactionClick(position.ticker, 'buy', position.current_price)}
                          style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#00ff00' }}
                        >
                          Buy
                        </button>
                        <button 
                          onClick={() => handleTransactionClick(position.ticker, 'sell', position.current_price)}
                          style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ff0000', color: 'white' }}
                        >
                          Sell
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedRows[position.ticker] && indicatorData[position.ticker] && (
                  <>
                    <tr>
                      <td colSpan={9}>
                        <TechnicalIndicator searchData={[indicatorData[position.ticker]]} />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={9}>
                        <StockChart ticker={position.ticker} timeRange={1} />
                      </td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Portfolio;
