import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SendMessageComponent from './SendMessageComponent';
import './App.css';
// Iconos y animaciones
import { PulseLoader } from 'react-spinners';
import { Icon } from '@iconify/react';

const ChatComponent = () => {
  const apiUrl = 'http://localhost/chat';  // URL de la página (el dominio donde está alojado el back)
  const chatContainerRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]); // Historial del chat
  const [userQuestion, setUserQuestion] = useState(''); // Contiene la pregunta del usuario
  const [askingForAnotherQuestion, setAskingForAnotherQuestion] = useState(false); // Estado para hacer otra pregunta
  const [questions, setQuestions] = useState([]); // Set de preguntas predefinidas
  const [selectedTheme, setSelectedTheme] = useState(''); // Tema seleccionado
  const [initialGreetingSent, setInitialGreetingSent] = useState(false);  // El primer mensaje (saludo inicial)
  const [loading, setLoading] = useState(false); // Estado de carga (cargando respuesta)



  // Preguntas por tema
  const questionSets = {
    instructivo: [
      "¿Con qué frecuencia se debe revisar el proceso?",
      "¿Qué transacción se utiliza?",
      "¿Qué campos se deben revisar?",
      "¿Qué parámetros deben considerarse?",
      "¿Cómo validar orden de compra?",
      "¿Qué hacer si el documento no cumple con lo establecido?"
    ],
    instructivo_bp: [
      "¿Cuáles son los pasos del Instructivo BP?"

    ],
    instructivo_bofa: [
      "¿Cuáles son los pasos del Instructivo BOFA?"
    ],
    instructivo_solped: [
      "¿Cuáles son los pasos del Instructivo SOLPED?"
    ]
    // Agregar más temas y preguntas aqui
  };

  // Redirigir a la página de inicio
  const handleHome = () => {
    window.location.href = "/";
  };

  // Desactivar contextmenu
  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  /*********** Mensajes **********/
  // Manejo de mensajes
  const handleSendMessage = async (selectedInstructivo) => {
    if (!userQuestion.trim()) {
      return;
    }
    let finalQuestion = userQuestion;
    if (selectedInstructivo) {
      finalQuestion = `En el instructivo ${selectedInstructivo}, ${userQuestion}`;
    }

    try {
      setUserQuestion('');
      setLoading(true);
      const newChatHistory = [...chatHistory, { user: finalQuestion }];
      setChatHistory(newChatHistory);
      const res = await axios.post(apiUrl, { query: finalQuestion });
      console.log('Respuesta del servidor:', res.data);
      let botResponse = res.data && res.data.text ? res.data.text : 'Respuesta no reconocida';
      const updatedChatHistory = [...newChatHistory, { bot: botResponse }];
      setChatHistory(updatedChatHistory);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } catch (error) {
      // ... (manejo de errores)
    } finally {
      setLoading(false);
    }
  };

  //Función de enviar mensaje, preguntas libres
  const sendMessage = async () => {
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
      const res = await axios.post(apiUrl, { query: userQuestion });
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
            <button className="opciones-buttons" onClick={() => handleQuestionListByTheme(selectedTheme)}>Tengo otra pregunta</button>
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

  /********** Temas **********/
  const handleQuestionListByTheme = (theme) => {
    setQuestions(questionSets[theme]);
    setAskingForAnotherQuestion(false);
    setSelectedTheme(theme);
  };

  const handleThemeSelection = async (theme) => {
    setSelectedTheme(theme);
    setQuestions(questionSets[theme]);
    setChatHistory([
      ...chatHistory,
    ]);
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

  const handleThemeList = () => {
    setQuestions([]);
    setAskingForAnotherQuestion(false);
    setSelectedTheme(null);

    // Mostrar nuevamente el mensaje de saludo y opciones de temas
    const greetingMessage = {
      bot: (
        <div style={{ textAlign: 'center' }}>
          <p>¿Sobre qué tema te gustaría tratar ahora?</p>
          <ul className="theme-buttons-list">
            <button className="theme-button" onClick={() => handleThemeSelection("instructivo")}>
              Instructivo RPA
            </button>
            <button className="theme-button" onClick={() => handleThemeSelection("instructivo_bp")}>
              Instructivo BP
            </button>
            <button className="theme-button" onClick={() => handleThemeSelection("instructivo_bofa")}>
              Instructivo BOFA
            </button>
            <button className="theme-button" onClick={() => handleThemeSelection("instructivo_solped")}>
              Instructivo SOLPED
            </button>
            {/* Agregar más botones para más temas aquí */}
          </ul>
        </div>
      ),
    };
    setChatHistory([greetingMessage]);
  };


  /********** Estructura de la pagina **********/
  useEffect(() => {
    document.title = 'Chatbot';
    // Desactivar el menú contextual en toda la página
    document.addEventListener('contextmenu', handleContextMenu);
    // Manejar seleccion de temas
    const handleThemeSelection = async (theme) => {
      setSelectedTheme(theme);
      setQuestions(questionSets[theme]);
      setChatHistory([
        ...chatHistory,
      ]);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    };

    // Cuerpo del historial
    if (!initialGreetingSent) {
      setChatHistory([
        ...chatHistory,
        // Saludo inicial
        {
          bot: (
            <div style={{ textAlign: 'center' }}>
              <p>Hola, soy tu asistente virtual para ayudarte con</p>
              <ul className="theme-buttons-list">
                <button className="theme-button"
                  onClick={() => handleThemeSelection("instructivo")}>
                  Instructivo RPA
                </button>

                <button className="theme-button"
                  onClick={() => handleThemeSelection("instructivo_bp")}>
                  Instructivo BP
                </button>

                <button className="theme-button"
                  onClick={() => handleThemeSelection("instructivo_bofa")}>
                  Instructivo BOFA
                </button>

                <button className="theme-button"
                  onClick={() => handleThemeSelection("instructivo_solped")}>
                  Instructivo SOLPED
                </button>
                {/* Agregar más botones para más temas aquí */}
              </ul>
            </div>
          ),
        },
      ]);
      setInitialGreetingSent(true);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else if (selectedTheme) {
      // Si el usuario selecciona un tema, se despliegan las preguntas predefinidas
      const questionButtons = questions.map((question, index) => ({
        bot: (
          <div key={index}>
            <button className="question-buttons" onClick={() => handleQuestionSelection(question)}>
              {question}
            </button>
          </div>
        )
      }));
      const updatedChatHistory = [
        ...chatHistory,
        { bot: "Selecciona una pregunta:" },
        ...questionButtons,
      ];
      setChatHistory(updatedChatHistory);
      setSelectedTheme(null);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [chatHistory, initialGreetingSent, selectedTheme, questions]);



  // JSX
  return (
    <div className="chat-app">
      {/* Container historial */}
      <div className="chat-history-container" ref={chatContainerRef}>
        <ul className="chat-history">
          {/* Intercambio de mensajes */}
          {chatHistory.map((message, index) => (
            <li key={index} className={message.user ? 'message user-message' : 'message bot-message'}>
              <div className="message-content">{message.user ? message.user : message.bot}</div>
            </li>
          ))}
          {/* Cargando */}
          {loading && (
            <li className="message bot-message loading-message">
              <PulseLoader color="#003ca6" size={12} />
            </li>
          )}
        </ul>
      </div>
      <SendMessageComponent
        userQuestion={userQuestion}
        onInputChange={(e) => setUserQuestion(e.target.value)}
        onSendMessage={handleSendMessage}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default ChatComponent;