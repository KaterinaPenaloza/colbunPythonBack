import React from 'react';
import { Icon } from '@iconify/react';
import './App.css';

const SendMessageComponent = ({ userQuestion, onInputChange, onSendMessage, onInputKeyDown }) => {
    return (
        <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={onSendMessage}>
                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={userQuestion}
                    onChange={onInputChange}
                    onKeyDown={onInputKeyDown}
                    className="chat-input"
                />
                <button type="submit" className="send-button">
                    <Icon icon="ic:round-send" /> {/* Usando un icono de envío */}
                </button>
            </form>
        </div>
    );
};

export default SendMessageComponent;