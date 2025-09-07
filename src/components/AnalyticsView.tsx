import React from 'react';
import { Tabs } from 'antd';
import Dashboard from './AnalyticsComponent.tsx';
import ResearchView from './ResearchView.tsx';
import TradeRecommendations from '../pages/Portfolio/Portfolio.tsx';
import './css/AnalyticsView.css';

const { TabPane } = Tabs;

const AnalyticsView: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
        <br>
        </br>
        <br>
        </br>
        <br>
        </br>
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Overview" key="1">
          <Dashboard />
        </TabPane>
        <TabPane tab="Research" key="2">
          <ResearchView />
        </TabPane>
        <TabPane tab="Portfolio" key="3">
          <TradeRecommendations />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalyticsView;
