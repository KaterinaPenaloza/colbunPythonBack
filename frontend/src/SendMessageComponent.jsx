import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './App.css';

const SendMessageComponent = ({ userQuestion, onInputChange, onSendMessage, sendMessage }) => {
    const [selectedInstructivo, setSelectedInstructivo] = useState('');
    const [showLimitMessage, setShowLimitMessage] = useState(false);
    const [isChatBlocked, setIsChatBlocked] = useState(false);
    const inputRef = useRef(null);

    const handleSelectChange = (e) => {
        setSelectedInstructivo(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        blockChat(); // Call function to block the chat

        await onSendMessage(selectedInstructivo);

        setTimeout(() => {
            unblockChat(); // Call function to unblock the chat
        }, 20000);
    };

    const handleInputChange = (e) => {
        if (e.target.value.length <= 300) {
            onInputChange(e);
            setShowLimitMessage(false);
        } else {
            setShowLimitMessage(true);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            blockChat(); // Block on Enter key press as well

            sendMessage(); // Assuming sendMessage handles the sending logic

            setTimeout(() => {
                unblockChat(); // Unblock after 20 seconds
            }, 20000);
        }
    };

    const blockChat = () => {
        setIsChatBlocked(true);
        console.log("Chat blocked");
    }

    const unblockChat = () => {
        setIsChatBlocked(false);
        console.log("Chat unblocked");
    }


    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <select value={selectedInstructivo} onChange={handleSelectChange} className="instructivo-select">
                    <option value="">Seleccione un instructivo</option>
                    <option value="oc">Instructivo RPA</option>
                    <option value="bp">Instructivo BP</option>
                    <option value="bofa">Instructivo BOFA</option>
                    <option value="solped">Instructivo SOLPED</option>
                </select>
                <div className="chat-input-form">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={userQuestion}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        maxLength="300"
                        className="chat-input"
                        disabled={isChatBlocked} // Disable the input when chat is blocked
                    />
                    {showLimitMessage && (
                        <div className="limit-message">
                            Has alcanzado el límite de 300 caracteres.
                        </div>
                    )}
                </div>
                <button type="submit" className="send-button" disabled={isChatBlocked}>
                    <Icon icon="ic:round-send" />
                </button>
            </form>
        </div>
    );
};

export default SendMessageComponent;