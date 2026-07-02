import React, { useState, useEffect, useMemo } from 'react';
import './Portfolio.css';
import TechnicalIndicator from '../../components/TechnicalIndicator.tsx';
import StockChart from '../../components/Chart.tsx';
import { 
  getPaperPortfolio, 
  getPaperAccount, 
  doPaperTransaction,
  fetchIndicatorData 
} from '../../services/api.tsx';
import { downloadCsvFile, rowsToCsvString } from '../../utils/csvExport.js';

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
  date_purchased: string;
  days_to_close_window: number | null;
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

  const [sizeEquity, setSizeEquity] = useState('');
  const [sizeRiskPct, setSizeRiskPct] = useState('1');
  const [sizeEntry, setSizeEntry] = useState('');
  const [sizeStop, setSizeStop] = useState('');

  const loadPortfolio = async (showLoading: boolean = false) => {
    if (showLoading) {
      setLoading(true);
    }
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
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial load with loading indicator
    loadPortfolio(true);
    // Refresh every 30 seconds to update prices (without loading indicator)
    const interval = setInterval(() => loadPortfolio(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (account) {
      setSizeEquity((prev) => (prev === '' ? String(account.total_portfolio_value) : prev));
    }
  }, [account]);

  const positionSizePreview = useMemo(() => {
    const equityNum = parseFloat(sizeEquity) || 0;
    const riskPctNum = parseFloat(sizeRiskPct) || 0;
    const riskBudget = equityNum * (riskPctNum / 100);
    const hasBoth = sizeEntry.trim() !== '' && sizeStop.trim() !== '';
    if (!hasBoth) {
      return {
        shares: 0,
        riskBudget,
        actualRisk: 0,
        perShare: 0,
        invalid: false,
        show: false,
      };
    }
    const entryNum = parseFloat(sizeEntry);
    const stopNum = parseFloat(sizeStop);
    const e = Number.isFinite(entryNum) ? entryNum : 0;
    const s = Number.isFinite(stopNum) ? stopNum : 0;
    const perShare = Math.abs(e - s);
    if (perShare <= 0) {
      return { shares: 0, riskBudget, actualRisk: 0, perShare, invalid: true, show: true };
    }
    const shares = Math.floor(riskBudget / perShare);
    const actualRisk = shares * perShare;
    return { shares, riskBudget, actualRisk, perShare, invalid: false, show: true };
  }, [sizeEquity, sizeRiskPct, sizeEntry, sizeStop]);

  const handleExportPositionsCsv = () => {
    if (!positions.length) return;
    const headers = [
      'ticker',
      'shares',
      'entry_price',
      'current_price',
      'position_value',
      'unrealized_pnl',
      'unrealized_pnl_percent',
      'stop_loss',
      'take_profit',
      'date_purchased',
    ];
    const rows = positions.map((p) => [
      p.ticker,
      p.shares,
      p.entry_price,
      p.current_price,
      p.position_value,
      p.unrealized_pnl,
      p.unrealized_pnl_percent,
      p.stop_loss ?? '',
      p.take_profit ?? '',
      p.date_purchased ?? '',
    ]);
    const csv = rowsToCsvString(headers, rows);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsvFile(`midas-paper-positions-${stamp}.csv`, csv);
  };

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
        // Reload portfolio without loading indicator
        loadPortfolio(false);
      } else {
        alert(result.message || 'Transaction failed');
      }
    } catch (err: any) {
      alert(err.message || 'Transaction failed');
      console.error('Transaction error:', err);
    }
  };

  if (loading) {
    return (
      <div className="trade-recommendations-container portfolio-loading">
        <p>Loading portfolio…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trade-recommendations-container portfolio-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="trade-recommendations-container">
      <div style={{ marginBottom: '20px' }}>
        <div className="portfolio-page-header">
          <h2>Paper Trading Portfolio</h2>
          {positions.length > 0 && (
            <button type="button" onClick={handleExportPositionsCsv}>
              Export positions (CSV)
            </button>
          )}
        </div>
        {account && (
          <div className="portfolio-stats-grid">
            <div>
              <strong>Starting Capital</strong>
              ${account.starting_capital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Cash Balance</strong>
              ${account.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Portfolio Value</strong>
              ${account.total_portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Total P&amp;L</strong>
              <span className={account.total_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                ${account.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                ({account.total_return_percent.toFixed(2)}%)
              </span>
            </div>
            <div>
              <strong>Unrealized P&amp;L</strong>
              <span className={account.unrealized_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                ${account.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <strong>Realized P&amp;L</strong>
              <span className={account.realized_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                ${account.realized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {account && (
          <div className="portfolio-calculator-panel">
            <h3>Position size calculator</h3>
            <p>
              Size a new position from a risk percent of equity and the distance to your stop. Does not validate cash or margin.
            </p>
            <div className="portfolio-calculator-grid">
              <label className="portfolio-field-label">
                Equity ($)
                <input
                  type="number"
                  value={sizeEquity}
                  onChange={(e) => setSizeEquity(e.target.value)}
                  min={0}
                  step="any"
                />
              </label>
              <label className="portfolio-field-label">
                Risk (% of equity)
                <input
                  type="number"
                  value={sizeRiskPct}
                  onChange={(e) => setSizeRiskPct(e.target.value)}
                  min={0}
                  step="any"
                />
              </label>
              <label className="portfolio-field-label">
                Entry ($)
                <input
                  type="number"
                  value={sizeEntry}
                  onChange={(e) => setSizeEntry(e.target.value)}
                  min={0}
                  step="any"
                />
              </label>
              <label className="portfolio-field-label">
                Stop ($)
                <input
                  type="number"
                  value={sizeStop}
                  onChange={(e) => setSizeStop(e.target.value)}
                  min={0}
                  step="any"
                />
              </label>
            </div>
            {positionSizePreview.invalid && (
              <p className="portfolio-calc-error">
                Entry and stop must differ to compute share count.
              </p>
            )}
            {positionSizePreview.show && !positionSizePreview.invalid && (
              <p className="portfolio-calc-result">
                <strong>Suggested shares:</strong> {positionSizePreview.shares.toLocaleString()} &nbsp;|&nbsp;
                <strong>Risk at stop (~):</strong> $
                {positionSizePreview.actualRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                (budget ${positionSizePreview.riskBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </p>
            )}
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
              <th>Date Purchased</th>
              <th>Days to Close Window</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <React.Fragment key={position.ticker}>
                <tr onClick={() => handleRowClick(position.ticker)} className="portfolio-row-click">
                  <td><strong>{position.ticker}</strong></td>
                  <td>{position.shares}</td>
                  <td>${position.entry_price.toFixed(2)}</td>
                  <td>${position.current_price.toFixed(2)}</td>
                  <td>${position.position_value.toFixed(2)}</td>
                  <td className={position.unrealized_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                    ${position.unrealized_pnl.toFixed(2)} ({position.unrealized_pnl_percent.toFixed(2)}%)
                  </td>
                  <td>{position.stop_loss ? `$${position.stop_loss.toFixed(2)}` : '—'}</td>
                  <td>{position.take_profit ? `$${position.take_profit.toFixed(2)}` : '—'}</td>
                  <td>{position.date_purchased ? new Date(position.date_purchased).toLocaleDateString() : '—'}</td>
                  <td
                    className={
                      position.days_to_close_window !== null && position.days_to_close_window <= 7
                        ? 'pnl-negative'
                        : position.days_to_close_window !== null && position.days_to_close_window <= 14
                          ? 'pnl-warn'
                          : ''
                    }
                  >
                    {position.days_to_close_window !== null ? position.days_to_close_window : '—'}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {transactionData[position.ticker]?.showInput ? (
                      <div className="portfolio-actions-stack">
                        <input
                          type="number"
                          placeholder="Shares"
                          value={transactionData[position.ticker].shares}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'shares', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Stop Loss (opt)"
                          value={transactionData[position.ticker].stopLoss}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'stopLoss', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Take Profit (opt)"
                          value={transactionData[position.ticker].takeProfit}
                          onChange={(e) => handleTransactionInputChange(position.ticker, 'takeProfit', e.target.value)}
                        />
                        <button type="button" onClick={() => handleExecuteTransaction(position)}>
                          {transactionData[position.ticker].type === 'buy' ? 'Buy' : 'Sell'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionData((prev) => {
                            const newData = { ...prev };
                            delete newData[position.ticker];
                            return newData;
                          })}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="portfolio-actions-row">
                        <button
                          type="button"
                          className="btn-trade-buy"
                          onClick={() => handleTransactionClick(position.ticker, 'buy', position.current_price)}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          className="btn-trade-sell"
                          onClick={() => handleTransactionClick(position.ticker, 'sell', position.current_price)}
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
                      <td colSpan={11}>
                        <TechnicalIndicator searchData={[indicatorData[position.ticker]]} />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={11}>
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
