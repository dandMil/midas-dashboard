import React, { useState } from 'react';
import './SideMenu.css'; // Import CSS file for styling

const SideMenu = () => {
  // State variable to track the active menu item
  const [activeMenuItem, setActiveMenuItem] = useState('');

  // Function to handle menu item clicks
  const handleMenuItemClick = (menuItem) => {
    setActiveMenuItem(menuItem);
    // You can add additional logic here, such as navigating to a specific page
  };

  return (
    <div className="side-menu">
      <h2>Navigation Menu</h2>
      <ul>
        <li className={activeMenuItem === 'Portfolio' ? 'active' : ''} onClick={() => handleMenuItemClick('Portfolio')}>Portfolio</li>
        <li className={activeMenuItem === 'Watchlist' ? 'active' : ''} onClick={() => handleMenuItemClick('Watchlist')}>Watchlist</li>
        <li className={activeMenuItem === 'Research' ? 'active' : ''} onClick={() => handleMenuItemClick('Research')}>Research</li>
      </ul>
    </div>
  );
};

export default SideMenu;
