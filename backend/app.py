from flask import Flask, request, jsonify
from flask_cors import CORS
from index import run  # Asegúrate de que 'run' exista en index.py

app = Flask(__name__)
CORS(app, resources={r"/chat": {"origins": "http://localhost:81"}})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_question = data.get('query')
    
    if not user_question:
        return jsonify({"error": "La pregunta no puede estar vacía"}), 400

    try:
        response = run(user_question)
        return jsonify({"text": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=80)
