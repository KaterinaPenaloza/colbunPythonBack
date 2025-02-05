import React, { useState } from 'react';
import ChatComponent from './ChatComponent';
import './App.css';

const App = () => {
  const [selectedTheme, setSelectedTheme] = useState('');
  const handleThemeSelection = (theme) => {
    setSelectedTheme(theme);
  };
  return (
    <div className="App">
      <ChatComponent selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} />
    </div>
  );
};

export default App;