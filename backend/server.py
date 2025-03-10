from flask import Flask, request, jsonify
from flask_cors import CORS
from index import run
import logging

app = Flask(__name__)

# Configurar CORS
CORS(app, origins="http://localhost:81", methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])

# Configurar logs para mostrar mensajes en consola
logging.basicConfig(level=logging.DEBUG)

@app.route('/chat', methods=['POST'])
def chat():
    # Obtener la pregunta del usuario del cuerpo de la solicitud
    user_question = request.json.get('query')
    app.logger.debug(f'Recibí la pregunta: {user_question}')

    try:
        # Ejecutar la función de procesamiento del chatbot
        response = run(user_question)
        app.logger.debug(f'Respuesta generada: {response}')

        return jsonify({"text": response})

    except Exception as error:
        app.logger.error(f'Error durante el procesamiento del chat: {error}', exc_info=True)
        return jsonify({"error": "Error Interno del Servidor"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
