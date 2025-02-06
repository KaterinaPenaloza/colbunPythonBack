import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Modal from './Modal';
// Iconos y animaciones
import { PulseLoader } from 'react-spinners';
import { Icon } from '@iconify/react';


const ChatComponent = () => {
  const apiUrl = 'http://localhost/chat';  // URL de la página (el dominio donde está alojado el back)
  const chatContainerRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState(''); // Pregunta del usuario
  const [askingForAnotherQuestion, setAskingForAnotherQuestion] = useState(false);
  const [questions, setQuestions] = useState([]); // Set de preguntas predefinidas
  const [selectedTheme, setSelectedTheme] = useState(''); // Tema seleccionado
  const [selectedSubTheme, setSelectedSubTheme] = useState(''); // Subtema seleccionado
  const [initialGreetingSent, setInitialGreetingSent] = useState(false);
  const [loading, setLoading] = useState(false); // Estado de carga (cargando respuesta)
  const [showModal, setShowModal] = useState(false);  // Mostrar Información adicional


  // Estructura de temas y subtemas con preguntas
  const themesAndQuestions = {
    instructivo: {
      subtemas: {
        instructivo1: {
          titulo: "Instructivo",
          preguntas: [
            "¿Con qué frecuencia se debe revisar el proceso?",
            "¿Qué transacción se utiliza?",
            "¿Qué campos se deben revisar?",
            "¿Qué parámetros deben considerarse?",
            "¿Cómo validar orden de compra?",
            "¿Qué hacer si el documento no cumple con lo establecido?"
          ]
        },
        instructivo2: {
          titulo: "Instructivo BP",
          preguntas: [
            "¿Cuáles son los pasos del Instructivo BP?"
          ]
        },
        instructivo3: {
          titulo: "Instructivo BOFA",
          preguntas: [
            "¿Cuáles son los pasos del Instructivo BOFA?"
          ]
        },
        instructivo4: {
          titulo: "Instructivo SOLPED",
          preguntas: [
            "¿Cuáles son los pasos del Instructivo SOLPED?"
          ]
        }
      }
    },
    otro: {
      subtemas: {
        subTemaOtro1: {
          titulo: "Test",
          preguntas: ["¿Qué comen los okapi?", "Datos curiosos sobre okapis"]
        }
      }
    }
  };


  // Botón de ayuda con información
  const handleHelpClick = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Redirigir al usuario a la página de inicio
  const handleHome = () => {
    window.location.href = "/";
  };

  // Para enviar la pregunta pulsando "Enter"
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

  // Manejo de mensajes
  const handleSendMessage = async (e) => {
    e.preventDefault();
    await sendMessage();
  };


  //Función de enviar mensaje, preguntas libres
  const sendMessage = async () => {
    //Evitar enviar mensajes vacios
    if (!userQuestion.trim()) {
      return;
    }
    try {
      setUserQuestion('');
      setLoading(true);
      // Se crea el historial
      const newChatHistory = [...chatHistory, { user: userQuestion }];
      setChatHistory(newChatHistory);
      // Respuesta del bot
      const res = await axios.post(apiUrl, {
        query:
          userQuestion
      });
      console.log('Respuesta del servidor:', res.data);
      let botResponse = (res.data && res.data.text) ? res.data.text : 'Respuesta no reconocida';
      // Actualizar el historial
      const updatedChatHistory = [...newChatHistory, { bot: botResponse }];
      setChatHistory(updatedChatHistory);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = {
        bot:
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>Hubo un problema al enviar el mensaje. Por favor, inténtalo nuevamente.</p>
            <button onClick={handleHome} className="reset-button">
              <Icon icon="ion:reload-circle" />
            </button>
          </div>
      };
      setChatHistory([...chatHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };


  //Función de enviar mensaje, pero con las preguntas predefinidas
  const handleQuestionSelection = async (question) => {
    try {
      setUserQuestion('');
      setLoading(true);
      const userQuestion = question;
      // Se crea el historial
      const newChatHistory = [...chatHistory, { user: userQuestion }];
      setChatHistory(newChatHistory);
      // Respuesta del bot
      const res = await axios.post(apiUrl, { query: userQuestion });
      console.log('Respuesta del servidor:', res.data);
      let botResponse = (res.data && res.data.text) ? res.data.text : 'No se encontró la respuesta';
      // Actualizar el historial
      const updatedChatHistory = [...newChatHistory, { bot: botResponse }];
      setChatHistory(updatedChatHistory);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      // Preguntar si tiene otra pregunta
      setAskingForAnotherQuestion(true);
      const anotherQuestionMessage = {
        bot:
          <div>
            <p>¿Tienes otra pregunta?</p>
            <button className="opciones-buttons" onClick={() => handleSubThemeSelection(selectedTheme, selectedSubTheme)}>Tengo otra pregunta</button>
            <button className="opciones-buttons" onClick={() => handleThemeList()}>Volver a temas</button>
          </div>
      };
      setChatHistory(prevChatHistory => [...prevChatHistory, anotherQuestionMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = {
        bot:
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>Hubo un problema al enviar el mensaje. Por favor, inténtalo nuevamente.</p>
            <button onClick={handleHome} className="reset-button">
              <Icon icon="ion:reload-circle" />
            </button>
          </div>
      };
      setChatHistory([...chatHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelection = (theme) => {
    // Validar que el tema exista
    if (!themesAndQuestions[theme]) {
      console.error(`Tema no encontrado: ${theme}`);
      return;
    }

    setSelectedTheme(theme);
    setSelectedSubTheme(null);

    // Verificar que el tema tenga subtemas
    const subtemas = themesAndQuestions[theme]?.subtemas || {};
    const subtemaKeys = Object.keys(subtemas);

    const subtemaButtons = subtemaKeys.map((subtema, index) => ({
      bot: (
        <div key={index}>
          <button
            className="theme-button"
            onClick={() => handleSubThemeSelection(theme, subtema)}
          >
            {subtemas[subtema].titulo}
          </button>
        </div>
      )
    }));

    setChatHistory([
      ...chatHistory,
      {
        bot: (
          <div style={{ textAlign: 'center' }}>
            <p>Selecciona un subtema de {theme}:</p>
            {subtemaButtons.map(btn => btn.bot)}
            <button
              className="opciones-buttons"
              onClick={() => handleThemeList()}
            >
              Volver a temas
            </button>
          </div>
        )
      }
    ]);
  };

  const handleSubThemeSelection = (theme, subtema) => {
    // Validaciones adicionales
    if (!themesAndQuestions[theme]) {
      console.error(`Tema no encontrado: ${theme}`);
      return;
    }

    const subtemas = themesAndQuestions[theme]?.subtemas || {};

    if (!subtemas[subtema]) {
      console.error(`Subtema no encontrado: ${subtema} en tema ${theme}`);
      return;
    }

    setSelectedSubTheme(subtema);

    // Obtener las preguntas del subtema
    const preguntas = subtemas[subtema].preguntas || [];
    const subtematitulo = subtemas[subtema].titulo;

    const questionButtons = preguntas.map((question, index) => ({
      bot: (
        <div key={index}>
          <button
            className="question-buttons"
            onClick={() => handleQuestionSelection(question)}
          >
            {question}
          </button>
        </div>
      )
    }));

    setChatHistory([
      ...chatHistory,
      { bot: `Selecciona una pregunta para ${subtematitulo}:` },
      ...questionButtons,
      {
        bot: (
          <div>
            <button
              className="opciones-buttons"
              onClick={() => handleThemeSelection(theme)}
            >
              Volver a subtemas
            </button>
            <button
              className="opciones-buttons"
              onClick={() => handleThemeList()}
            >
              Volver a temas
            </button>
          </div>
        )
      }
    ]);
  };

  const handleThemeList = () => {
    setQuestions([]);
    setAskingForAnotherQuestion(false);
    setSelectedTheme(null);
    setSelectedSubTheme(null);

    // Mostrar nuevamente el mensaje de saludo y opciones de temas
    const greetingMessage = {
      bot: (
        <div style={{ textAlign: 'center' }}>
          <p>¿Sobre qué tema te gustaría tratar ahora?</p>
          <ul className="theme-buttons-list">
            {Object.keys(themesAndQuestions).map((theme, index) => (
              <button
                key={index}
                className="theme-button"
                onClick={() => handleThemeSelection(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </ul>
        </div>
      ),
    };
    setChatHistory([greetingMessage]);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  // Hook de efecto para manejar el estado inicial y la navegación
  useEffect(() => {
    document.title = 'Demo Chatbot';  // Título de la página
    // Desactivar el menú contextual en toda la página
    document.addEventListener('contextmenu', handleContextMenu);

    // Cuerpo del historial inicial
    if (!initialGreetingSent) {
      setChatHistory([
        ...chatHistory,
        {
          bot: (
            <div style={{ textAlign: 'center' }}>
              <p>Hola, soy tu asistente virtual para...</p>
              <ul className="theme-buttons-list">
                {Object.keys(themesAndQuestions).map((theme, index) => (
                  <button
                    key={index}
                    className="theme-button"
                    onClick={() => handleThemeSelection(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </ul>
            </div>
          ),
        },
      ]);
      setInitialGreetingSent(true);
      chatContainerRef.current.scrollTop = chatContainerRef.current
        .scrollHeight;
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [chatHistory, initialGreetingSent, selectedTheme, selectedSubTheme]);

  // Estructura de la página, como el html pero en react
  return (
    <div className="chat-app">
      <div className="chat-header-banner">
        <a href="/">
          <img src="/Logo.png" alt="Demo" className="logo-image" />
        </a>
        <div className="button-container right-align">
          <button className="home-button" onClick={handleHome}>
            <Icon icon="material-symbols:home" />
          </button>
          <button className="info-button" onClick={handleHelpClick}>
            <Icon icon="material-symbols:info" />
          </button>
          {showModal && <Modal onClose={handleCloseModal} />}
        </div>
      </div>
      <div className="chat-history-container" ref={chatContainerRef}>
        <ul className="chat-history">
          {chatHistory.map((message, index) => (
            <li
              key={index}
              className={`${message.user ? 'message user-message' : 'message bot-message'} new-message`}
            >
              <div className="message-content">
                {message.user ? message.user : message.bot}
              </div>
            </li>
          ))}
          {loading && (
            <li className="message bot-message loading-message">
              <PulseLoader color="#003ca6" size={12} />
            </li>
          )}
        </ul>
      </div>
      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="chat-input"
          />
          <button type="submit" className="send-button">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;