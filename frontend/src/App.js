import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ChatComponent from './ChatComponent';
import ChatHeaderComponent from './ChatHeaderComponent';
import './App.css';

const App = () => {
    const [selectedTheme, setSelectedTheme] = useState('');

    const handleThemeSelection = (theme) => {
        setSelectedTheme(theme);
    };

    const handleHome = () => {
        window.location.href = "/";
    };

    return (
        <div className="App">
            <ChatHeaderComponent onHome={handleHome} />
            <ChatComponent
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
            />
        </div>
    );
};

export default App;