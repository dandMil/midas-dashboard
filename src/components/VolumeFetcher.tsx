import React, { useState, useEffect } from 'react';
import AssetItem from './AssetItem.tsx';
import VolumeItem from './VolumeItem.tsx';
const AssetFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/midas/asset/get_all_assets');
        const jsonData = await response.json();
        console.log('JSON DATA',jsonData)
        console.log('JSON TYPE',typeof(jsonData))
        const dataArray = Object.keys(jsonData).map(key => jsonData[key]);

        setData(dataArray);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Top Movers</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
            <VolumeItem data={data} />
        </div>
      )}
    </div>
  );
};

export default AssetFetcher;
