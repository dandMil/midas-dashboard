import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsMarketSession } from '../utils/usMarketSession.js';
import './TopMenu.css';

const TopMenu = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [marketInfo, setMarketInfo] = useState(() => getUsMarketSession());

  useEffect(() => {
    const tick = () => setMarketInfo(getUsMarketSession());
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault();
      if (searchInputRef.current) searchInputRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/research?ticker=${searchTerm.trim().toUpperCase()}&type=stock`);
      setSearchTerm('');
    }
  };

  const sessionClass =
    marketInfo.kind === 'regular'
      ? 'market-session--open'
      : marketInfo.kind === 'pre_market'
        ? 'market-session--pre'
        : marketInfo.kind === 'after_hours'
          ? 'market-session--ah'
          : 'market-session--closed';

  return (
    <div className="top-menu">
      <div className="app-name" onClick={() => handleNavigation('/')}>
        MIDAS
      </div>
      <div className="center-section">
        <button className="nav-button" onClick={() => handleNavigation('/')}>Dashboard</button>
        <button className="nav-button" onClick={() => handleNavigation('/portfolio')}>Portfolio</button>
        <button className="nav-button" onClick={() => handleNavigation('/watchlist')}>Watchlist</button>
        <button className="nav-button" onClick={() => handleNavigation('/research')}>Research</button>
        <button className="nav-button" onClick={() => handleNavigation('/screener')}>Screener</button>
        <button className="nav-button" onClick={() => handleNavigation('/backtesting')}>Backtesting</button>
        <button className="nav-button" onClick={() => handleNavigation('/shorts-squeeze')}>Shorts Squeeze</button>
      </div>
      <div className="right-section">
        <div className={`market-session ${sessionClass}`} title="US cash equity hours (ET). Holidays not modeled.">
          <span className="market-session__label">{marketInfo.label}</span>
          <span className="market-session__time">
            {marketInfo.etTimeLabel} · {marketInfo.etDateLabel}
          </span>
        </div>
        <form onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-bar"
            placeholder="Ticker search… (press /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(e);
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default TopMenu;
