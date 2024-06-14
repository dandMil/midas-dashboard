import React, { useState } from 'react';

interface StringListFetcherProps {
  onFetch: (strings: string[], startDate: string, endDate: string) => void;
}

const StringListFetcher: React.FC<StringListFetcherProps> = ({ onFetch }) => {
  const [strings, setStrings] = useState<string[]>([]);
  const [currentString, setCurrentString] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const addString = () => {
    if (currentString.trim() !== '') {
      setStrings([...strings, currentString.trim()]);
      setCurrentString('');
    }
  };

  const handleFetch = () => {
    onFetch(strings, startDate, endDate);
  };

  return (
    <div className="string-list-fetcher">
      <div className="input-group">
        <input
          type="text"
          value={currentString}
          onChange={(e) => setCurrentString(e.target.value)}
          placeholder="Enter string"
        />
        <button onClick={addString}>Add</button>
      </div>
      <div className="date-range">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <button onClick={handleFetch}>Fetch</button>
      <div className="string-list">
        {strings.map((str, index) => (
          <p key={index}>{str}</p>
        ))}
      </div>
    </div>
  );
};

export default StringListFetcher;
