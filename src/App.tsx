import logo from './logo.svg';
import './App.css';
import AssetFetcher from './components/AssetFetcher.tsx';
import Dashboard from './components/Dashboard.tsx';
import React from 'react';
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {"Midas Analytics"}
        </p>
        <Dashboard></Dashboard>
        {/* <AssetFetcher></AssetFetcher> */}

      </header>
    </div>
  );
}

export default App;
