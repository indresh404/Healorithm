import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3.2"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'history' not in data:
        return jsonify({"error": "No history provided in request body"}), 400

    history = data['history']
    
    # Build prompt string for Ollama from history
    prompt = ""
    for msg in history:
        role = 'User' if msg.get('role') == 'user' else 'Assistant'
        parts = msg.get('parts', [])
        text = parts[0].get('text', '') if parts else ''
        prompt += f"{role}: {text}\n"
    prompt += "Assistant:\n"
        
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 512,
            }
        }
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({"response": result.get("response", "").strip()})
        else:
            return jsonify({"error": f"Ollama returned {response.status_code}"}), 500
            
    except requests.exceptions.RequestException as e:
        print(f"Error during generation: {str(e)}", flush=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/summarize_chat', methods=['POST'])
def summarize_chat():
    data = request.get_json()
    if not data or 'chat_text' not in data:
        return jsonify({"error": "No chat_text provided"}), 400

    chat_text = data['chat_text']
    prompt = f"Please summarize this medical chat conversation between a patient and yourself (an AI). Keep it brief, listing the key symptoms and advice:\n\n{chat_text}\n\nSummary:"
    
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 256,
            }
        }
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({"summary": result.get("response", "").strip()})
        else:
            return jsonify({"error": f"Ollama returned {response.status_code}"}), 500
            
    except Exception as e:
        print(f"Error during summarization: {str(e)}", flush=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    # Run on all interfaces so emulator (10.0.2.2) and real devices can access it
    app.run(host='0.0.0.0', port=5000, debug=True)
