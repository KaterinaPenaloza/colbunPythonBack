import React from 'react';

const Modal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Información</h2>
        <p>
            Recuerda que puedes seleccionar las preguntas predefinidas del tema elegido o hacer tus propias preguntas!<br/ >
            Luego de recibir tu respuesta, puedes volver a seleccionar otra pregunta del mismo tema o volver para seleccionar otro tema.<br/ >
            Si tienes un error mientras se genera la respuesta, pulsa el botón de reinicio para volver al inicio.
        </p>
        <p>Para más información, por favor contactarse a [correo@example.com]</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default Modal;