// SideMenu.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SideMenu.css';

const SideMenu = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('');
  const navigate = useNavigate();

  const handleMenuItemClick = (menuItem, url) => {
    setActiveMenuItem(menuItem);
    navigate(url);
  };

  return (
    <div className="side-menu">
      <h2>Navigation Menu</h2>
      <ul>
        <li className={activeMenuItem === 'Portfolio' ? 'active' : ''} onClick={() => handleMenuItemClick('Portfolio', '/portfolio')}>Portfolio</li>
        <li className={activeMenuItem === 'Watchlist' ? 'active' : ''} onClick={() => handleMenuItemClick('Watchlist', '/watchlist')}>Watchlist</li>
        <li className={activeMenuItem === 'Research' ? 'active' : ''} onClick={() => handleMenuItemClick('Research', '/research')}>Research</li>
      </ul>
    </div>
  );
};

export default SideMenu;
