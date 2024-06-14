import React from 'react';
import logo from './logo.svg';
import './App.css';
import AssetFetcher from './components/AssetFetcher.tsx';
import Dashboard from './components/Dashboard.tsx';
import SideMenu from './components/SideMenu.jsx'; // Import the SideMenu component

function App() {
  return (
    <div className="App">
      <SideMenu /> {/* Include the SideMenu component */}
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {"Midas Analytics"}
        </p>
        <Dashboard />
        {/* <AssetFetcher /> */}
      </header>
    </div>
  );
}

export default App;
