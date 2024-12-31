import React, { useState } from 'react';
import AssetFetcher from '../pages/Portfolio/Watchlist/Watchlist.tsx';
import FetchedDataView from './FetchedDataView.tsx';
import VolumeFetcher from './VolumeFetcher.tsx';
import TopMoverFetcher from './TopMoverFetcher.tsx'
import StringListFetcher from './StringListFetcher.tsx';
import {Card, Select} from 'antd';


import './css/theme.css'; 
const {Option} = Select;

const Dashboard = () => {

  const[selectedValue, setSelectedValue] = useState('Top Gainers');


  const handleChange = (value: string) => {
    setSelectedValue(value);
  }

  const renderComponent = () => {
    switch(selectedValue){
      case 'TopGainers':
        return <TopMoverFetcher mover="gainer"/>;
        case 'TopLosers':
          return <TopMoverFetcher mover="loser"/>;
          case 'RepeatedTopMovers':
            return <TopMoverFetcher mover = "gainer" />;
    }
  }

  return (
    <div className="dashboard-container">

      {/* Display of fetched data */}
      <div style={{ padding: '20px', backgroundColor: '#000', color: '#66ff66' }}>
      <h2 style={{ color: '#66ff66' }}>Select a Category</h2>
      <Select
        style={{
          width: 200,
          borderColor: '#66ff66',
          backgroundColor: '#000',
          color: '#66ff66',
        }}
        placeholder="Choose one"
        onChange={handleChange}
        value={selectedValue}
        dropdownStyle={{
          backgroundColor: '#000',
          color: '#66ff66',
          borderColor: '#66ff66',
        }}
        optionLabelProp="label"
      >
        <Option value="TopGainers" label="Top Gainers">
          <span style={{ color: '#66ff66' }}>Top Gainers</span>
        </Option>
        <Option value="TopLosers" label="Top Losers">
          <span style={{ color: '#66ff66' }}>Top Losers</span>
        </Option>
        <Option value="RepeatedTopMovers" label="Repeated Top Movers">
          <span style={{ color: '#66ff66' }}>Repeated Top Movers</span>
        </Option>
      </Select>
      <div style={{ marginTop: '20px' }}>
        {renderComponent()}
      </div>    </div>
    </div>
  );
};

export default Dashboard;
