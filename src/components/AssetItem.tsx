import React, { useState, useEffect } from 'react';
import './AssetItem.css'; // Import CSS file for styling
const AssetItem = ({ data }) => {
    console.log('INSIDE ASSET ITEM',data)
  return (
    <table className="asset-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Market Price</th>
          <th>Market Signal</th>
          <th>Market Date</th>
          <th>Favorite</th>
        </tr>
      </thead>
      <tbody>
        {data.map((asset, index) => (
          <tr key={index}>
            <td>{asset.name}</td>
            <td>{asset.marketPrice}</td>
            <td>{asset.signal}</td>
            <td>{asset.date}</td>
            <td>
              <button onClick={() => handleFavorite(asset.id)}>Favorite</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AssetItem;
