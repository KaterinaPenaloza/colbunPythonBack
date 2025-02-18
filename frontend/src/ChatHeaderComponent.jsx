import React, { useState } from 'react'; // Importa useState aquí
import { Icon } from '@iconify/react';
import Modal from './Modal';
import './App.css';

const ChatHeaderComponent = ({ onHome }) => {
    const [showModal, setShowModal] = useState(false); // Mueve el estado aquí

    const handleHelpClick = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <div className="chat-header-banner">
            <div className="chat-header-content">
                <a href="/">
                    <img src="/Logo.png" alt="Logo" className="logo-image"/>
                </a>
                <div className="button-container right-align">
                    <button className="home-button" onClick={onHome}>
                        <Icon icon="material-symbols:home" />
                    </button>
                    <button className="info-button" onClick={handleHelpClick}>
                        <Icon icon="material-symbols:info" />
                    </button>
                </div>
                {showModal && <Modal onClose={handleCloseModal} />}
            </div>
        </div>
    );
};

export default ChatHeaderComponent;