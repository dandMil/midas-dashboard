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
          {"Midas Dahsboard"}
        </p>
        <Dashboard></Dashboard>
        {/* <AssetFetcher></AssetFetcher> */}
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
