import React, { useState, useEffect } from 'react';
import { fetchTechnicalAnalysis } from '../services/api.tsx';
import './css/TechnicalAnalysis.css';

interface TechnicalAnalysisProps {
  ticker: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface TechnicalData {
  ticker: string;
  market_price: number;
  macd: number;
  macd_signal: number;
  rsi: number;
  stochastic_oscillator: number;
  price_rate_of_change: number;
  atr: number;
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
  };
  indicator_scores: {
    MACD: number;
    RSI: number;
    SO: number;
    PRC: number;
    BB: number;
  };
  signal: string;
}

const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({ ticker, isExpanded, onToggle }) => {
  const [data, setData] = useState<TechnicalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && !data) {
      loadTechnicalData();
    }
  }, [isExpanded, ticker]);

  const loadTechnicalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTechnicalAnalysis(ticker);
      console.log('Technical Analysis API Response for', ticker, ':', result);
      setData(result);
    } catch (err: any) {
      console.error('Technical Analysis API Error for', ticker, ':', err);
      setError(err.message || 'Failed to load technical analysis');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal?.toUpperCase()) {
      case 'BULLISH':
        return '#00ff00';
      case 'BEARISH':
        return '#ff0000';
      case 'NEUTRAL':
        return '#ffff00';
      default:
        return '#888888';
    }
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Overbought', color: '#ff4444' };
    if (rsi < 30) return { status: 'Oversold', color: '#44ff44' };
    return { status: 'Neutral', color: '#ffff44' };
  };

  const getSOStatus = (so: number) => {
    if (so > 80) return { status: 'Overbought', color: '#ff4444' };
    if (so < 20) return { status: 'Oversold', color: '#44ff44' };
    return { status: 'Neutral', color: '#ffff44' };
  };

  const getMACDSignal = (macd: number, signal: number) => {
    if (macd > signal) return { signal: 'Bullish', color: '#00ff00' };
    if (macd < signal) return { signal: 'Bearish', color: '#ff0000' };
    return { signal: 'Neutral', color: '#ffff00' };
  };

  const getBBStatus = (price: number, upper: number, lower: number) => {
    if (price > upper) return { status: 'Overbought', color: '#ff4444' };
    if (price < lower) return { status: 'Oversold', color: '#44ff44' };
    return { status: 'Neutral', color: '#ffff44' };
  };

  return (
    <div className="technical-analysis-container">
      <div className="ta-header" onClick={onToggle}>
        <span className="ta-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="ta-title">Technical Analysis</span>
        {data && (
          <span 
            className="ta-overall-signal"
            style={{ color: getSignalColor(data.signal) }}
          >
            {data.signal}
          </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="ta-content">
          {loading && (
            <div className="ta-loading">
              <div className="spinner"></div>
              <span>Loading technical analysis...</span>
            </div>
          )}
          
          {error && (
            <div className="ta-error">
              <span className="error-text">{error}</span>
              <button onClick={loadTechnicalData} className="retry-btn">
                Retry
              </button>
            </div>
          )}
          
          {data && !loading && !error && (
            <div className="ta-indicators">
              <div className="ta-grid">
                {/* RSI */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">RSI</span>
                    <span className="ta-indicator-value">{data.rsi?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="ta-indicator-status">
                    {(() => {
                      const rsiStatus = getRSIStatus(data.rsi || 0);
                      return (
                        <span 
                          className="ta-status-badge"
                          style={{ backgroundColor: rsiStatus.color }}
                        >
                          {rsiStatus.status}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* MACD */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">MACD</span>
                    <span className="ta-indicator-value">{data.macd?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="ta-indicator-details">
                    <span className="ta-detail">Signal: {data.macd_signal?.toFixed(2) || 'N/A'}</span>
                    {(() => {
                      const macdSignal = getMACDSignal(data.macd || 0, data.macd_signal || 0);
                      return (
                        <span 
                          className="ta-status-badge"
                          style={{ backgroundColor: macdSignal.color }}
                        >
                          {macdSignal.signal}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Stochastic Oscillator */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">Stochastic</span>
                    <span className="ta-indicator-value">{data.stochastic_oscillator?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="ta-indicator-status">
                    {(() => {
                      const soStatus = getSOStatus(data.stochastic_oscillator || 0);
                      return (
                        <span 
                          className="ta-status-badge"
                          style={{ backgroundColor: soStatus.color }}
                        >
                          {soStatus.status}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Price Rate of Change */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">ROC</span>
                    <span className="ta-indicator-value">{data.price_rate_of_change?.toFixed(2) || 'N/A'}%</span>
                  </div>
                  <div className="ta-indicator-status">
                    <span 
                      className="ta-status-badge"
                      style={{ 
                        backgroundColor: (data.price_rate_of_change || 0) > 0 ? '#00ff00' : '#ff0000' 
                      }}
                    >
                      {(data.price_rate_of_change || 0) > 0 ? 'Positive' : 'Negative'}
                    </span>
                  </div>
                </div>

                {/* ATR */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">ATR</span>
                    <span className="ta-indicator-value">{data.atr?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="ta-indicator-details">
                    <span className="ta-detail">Volatility</span>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="ta-indicator">
                  <div className="ta-indicator-header">
                    <span className="ta-indicator-name">Bollinger</span>
                    <span className="ta-indicator-value">${data.market_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="ta-indicator-details">
                    <span className="ta-detail">U: ${data.bollinger_bands?.upper?.toFixed(2) || 'N/A'}</span>
                    <span className="ta-detail">L: ${data.bollinger_bands?.lower?.toFixed(2) || 'N/A'}</span>
                    {(() => {
                      const bbStatus = getBBStatus(
                        data.market_price || 0, 
                        data.bollinger_bands?.upper || 0, 
                        data.bollinger_bands?.lower || 0
                      );
                      return (
                        <span 
                          className="ta-status-badge"
                          style={{ backgroundColor: bbStatus.color }}
                        >
                          {bbStatus.status}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysis;
