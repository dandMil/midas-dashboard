import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopMenu.css';

const TopMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
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
      </div>
      <div className="right-section">
        <input
          type="text"
          className="search-bar"
          placeholder="Search ticker, company, or profile"
        />
      </div>
    </div>
  );
};

export default TopMenu;
