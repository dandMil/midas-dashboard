import React, { useState, useEffect } from 'react';
import { Table, Button, Pagination } from '@mantine/core';
import '../../../../css/theme.css';
import TechnicalIndicator from '../../../../components/TechnicalIndicator.tsx';

const AssetItem = ({ data: initialData }) => {
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / 15);
  const handleToggleWatchlist = async (name, type) => {
    try {
      // Your logic for adding/removing from watchlist
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <div>
      <Table
        highlightOnHover
        withBorder
        withColumnBorders
        sx={{
          color: '#80ff80', // Ensure table text color is green
          'th, td': { color: '#80ff80' }, // Apply green color to headers and cells
        }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Market Price</th>
            <th>Market Signal</th>
            <th>Volume</th>
            <th>Market Date</th>
            <th>Favorite</th>
          </tr>
        </thead>
        <tbody>
          {data.slice((currentPage - 1) * 15, currentPage * 15).map((asset, index) => (
            <tr key={index}>
              <td>{asset.name}</td>
              <td>{asset.price}</td>
              <td>{asset.signal}</td>
              <td>{asset.volume}</td>
              <td>{asset.dateCreated}</td>
              <td colSpan={9}>
                      <TechnicalIndicator searchData={[asset.name]} />
                    </td>
              {/* <td>
                <Button
                  onClick={() => handleToggleWatchlist(asset.name, asset.type)}
                  variant="dark"
                  color="blue"
                  size="xs"
                  sx={{
                    color: '#80ff80', // Green button text
                  }}
                >
                  Add to Watchlist
                </Button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        total={totalPages}
        page={currentPage}
        onChange={setCurrentPage}
        siblings={2}
        boundary={1}
        mt="md"
        position="center"
      />
    </div>
  );
};

export default AssetItem;
