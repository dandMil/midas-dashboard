import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import AssetFetcher from './pages/Portfolio/Watchlist/Watchlist.tsx';
import Dashboard from './components/AnalyticsComponent.tsx';
import TopMenu from './components/TopMenu.jsx';
import TradeRecommendations from './pages/Portfolio/Portfolio.tsx';
import ResearchView from './components/ResearchView.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';
import DailySummary from './components/DailySummary.tsx';

function App() {
  return (
    <Router>
      <div className="App">
        <TopMenu />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<DailySummary />} />
            <Route path="/portfolio" element={<TradeRecommendations />} />
            <Route path="/watchlist" element={<AssetFetcher />} />
            <Route path="/research" element={<ResearchView />} />
            <Route path="/daily_summary" element={<DailySummary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
