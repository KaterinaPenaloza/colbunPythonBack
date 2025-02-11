import React, { useState } from 'react';
import ReactDOM from 'react-dom/client'; // Importa createRoot
import ChatComponent from './ChatComponent';
import ChatHeaderComponent from './ChatHeaderComponent';
import './App.css';

const App = () => {
    const [selectedTheme, setSelectedTheme] = useState('');
    const [showModal, setShowModal] = useState(false); // Estado para el modal
    const handleThemeSelection = (theme) => {
        setSelectedTheme(theme);
    };

    const handleHome = () => {
        window.location.href = "/";
    };

    const handleHelpClick = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
      <div className="App">
          <ChatHeaderComponent
              onHome={handleHome}
              onInfo={handleHelpClick}
              showModal={showModal}
              onCloseModal={handleCloseModal}
          />
          <ChatComponent
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
          />
      </div>
  );
};

export default App;