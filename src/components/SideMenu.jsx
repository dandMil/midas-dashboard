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
        <li className={activeMenuItem === 'Home' ? 'active' : ''} onClick={() => handleMenuItemClick('Home')}>Home</li>
        <li className={activeMenuItem === 'About' ? 'active' : ''} onClick={() => handleMenuItemClick('About')}>About</li>
        <li className={activeMenuItem === 'Services' ? 'active' : ''} onClick={() => handleMenuItemClick('Services')}>Services</li>
        <li className={activeMenuItem === 'Contact' ? 'active' : ''} onClick={() => handleMenuItemClick('Contact')}>Contact</li>
      </ul>
    </div>
  );
};

export default SideMenu;
