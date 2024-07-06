// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import AssetFetcher from './components/AssetFetcher.tsx';
import Dashboard from './components/Dashboard.tsx';
import SideMenu from './components/SideMenu';
import TradeRecommendations from './components/Portfolio.tsx';
import ResearchView from './components/ResearchView.tsx';
function App() {
  return (
    <Router>
      <div className="App">
        <SideMenu />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            {"Midas Analytics"}
          </p>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<TradeRecommendations />} />
            <Route path="/watchlist" element={<AssetFetcher />} />
            <Route path="/research" element={<ResearchView/>} />
            {/* Add other routes as needed */}
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
