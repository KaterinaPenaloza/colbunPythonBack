import React from 'react';
import { Icon } from '@iconify/react';
import Modal from './Modal';
import './App.css';

const ChatHeaderComponent = ({ onHome, onInfo, showModal, onCloseModal }) => {
    return (
        <div className="chat-header-banner"> {/* Reemplaza chat-header-container con chat-header-banner */}
            <div className="chat-header-content">
                <a href="/">
                    <img src="/logo.png" alt="Logo" className="logo-image" /> {/* logo-image ya coincide */}
                </a>
                <div className="button-container right-align"> {/* Reemplaza chat-header-buttons con button-container y right-align */}
                    <button className="home-button" onClick={onHome}>
                        <Icon icon="material-symbols:home" />
                    </button>
                    <button className="info-button" onClick={onInfo}> 
                        <Icon icon="material-symbols:info" />
                    </button>
                </div>
            </div>
            {showModal && <Modal onClose={onCloseModal} />}
        </div>
    );
};

export default ChatHeaderComponent;