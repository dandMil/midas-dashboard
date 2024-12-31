// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import AssetFetcher from './pages/Portfolio/Watchlist/Watchlist.tsx';
import Dashboard from './components/AnalyticsComponent.tsx';
import TopMenu from './components/TopMenu.jsx';
import TradeRecommendations from './pages/Portfolio/Portfolio.tsx';
import ResearchView from './components/ResearchView.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';
function App() {
  return (
    <Router>
      <div className="App">
        {/* Include the TopMenu at the top */}
        <TopMenu />
        <main className="App-main">
          {/* Define routes for different pages */}
          <Routes>
            <Route path="/" element={<AnalyticsView />} />
            <Route path="/portfolio" element={<TradeRecommendations />} />
            <Route path="/watchlist" element={<AssetFetcher />} />
            <Route path="/research" element={<ResearchView />} />
            {/* Add other routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
