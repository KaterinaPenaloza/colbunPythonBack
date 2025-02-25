from flask import Flask, request, jsonify
from flask_cors import CORS
from index import run

app = Flask(__name__)

# Configurar CORS para manejar solicitudes de origen cruzado
#CORS(app, origins="http://localhost:81", methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])
CORS(app, origins="*", methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])



@app.route('/chat', methods=['POST'])
def chat():
    # Obtener la pregunta del usuario del cuerpo de la solicitud
    user_question = request.json.get('query')

    try:
        # Ejecutar la función de procesamiento del chatbot
        response = run(user_question)
        return jsonify({"text": response})

    except Exception as error:
        print(f'Error durante el procesamiento del chat: {error}')
        return jsonify({"error": "Error Interno del Servidor"}), 500


if __name__ == '__main__':
    # Iniciar el servidor en el puerto 80
    app.run(host='0.0.0.0', port=80)
