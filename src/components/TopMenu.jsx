import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopMenu.css';

const TopMenu = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

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
        <button className="nav-button" onClick={() => handleNavigation('/shorts-squeeze')}>Shorts Squeeze</button>
      </div>
      <div className="right-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="search-bar"
            placeholder="Search ticker symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </form>
      </div>
    </div>
  );
};

export default TopMenu;
