import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

interface StockData {
  resistance: number;
  support: number;
  polygonResponse: {
    results: {
      v: number;
      vw: number;
      o: number;
      c: number;
      h: number;
      l: number;
      t: number;
      n: number;
    }[];
  };
}

const StockChart: React.FC<{ ticker: string; timeRange: number }> = ({ ticker, timeRange }) => {
  const [data, setData] = useState<StockData | null>(null);

  useEffect(() => {
    const fetchData = async () => {

      try {
        const response = await fetch(`http://localhost:8080/midas/asset/get_bars?ticker=${ticker}&timeRange=${timeRange}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Error fetching trade recommendations:', error);
      }
    };

    fetchData();
  }, [ticker, timeRange]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const dates = data.polygonResponse.results.map(result =>
    new Date(result.t).toLocaleDateString()
  );
  const closePrices = data.polygonResponse.results.map(result => result.c);

  const options = {
    title: {
      text: 'Stock Prices with Support and Resistance'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Close Price',
        type: 'line',
        data: closePrices,
        markLine: {
          data: [
            {
              name: 'Resistance',
              yAxis: data.resistance,
              lineStyle: {
                color: 'red'
              }
            },
            {
              name: 'Support',
              yAxis: data.support,
              lineStyle: {
                color: 'green'
              }
            }
          ]
        }
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '400px', width: '100%' }} />;
};

export default StockChart;
