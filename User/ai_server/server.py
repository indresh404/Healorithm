import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434/api/generate')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')

LLM_BASE_URL = os.getenv('LLM_BASE_URL', 'https://api.groq.com/openai/v1')
LLM_API_KEY = os.getenv('GROK_API_KEY') or os.getenv('GROQ_API_KEY') or os.getenv('OPENAI_API_KEY')
LLM_MODEL = os.getenv('LLM_MODEL', 'llama-3.3-70b-versatile')

SYSTEM_PROMPT = (
    'You are Healorithm medical assistant. Provide practical and safe guidance. '
    'Use the user language when possible. Keep responses concise and actionable. '
    'If severe symptoms appear, advise urgent in-person care.'
)


def _normalize_history(raw_history):
    normalized = []
    if not isinstance(raw_history, list):
        return normalized

    for msg in raw_history:
        role = str(msg.get('role', 'user')).lower()
        if role not in ('user', 'assistant', 'system'):
            role = 'user'

        text = ''
        if isinstance(msg.get('text'), str):
            text = msg.get('text', '')
        elif isinstance(msg.get('content'), str):
            text = msg.get('content', '')
        else:
            parts = msg.get('parts', [])
            if isinstance(parts, list) and parts:
                first = parts[0]
                if isinstance(first, dict):
                    text = str(first.get('text', ''))

        text = text.strip()
        if text:
            normalized.append({'role': role, 'content': text})

    return normalized


def _chat_with_openai_compatible(messages, temperature=0.5, max_tokens=700):
    if not LLM_API_KEY:
        raise RuntimeError('Missing LLM API key. Set GROK_API_KEY or GROQ_API_KEY.')

    url = f"{LLM_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        'model': LLM_MODEL,
        'messages': messages,
        'temperature': temperature,
        'max_tokens': max_tokens,
    }
    headers = {
        'Authorization': f'Bearer {LLM_API_KEY}',
        'Content-Type': 'application/json',
    }

    response = requests.post(url, json=payload, headers=headers, timeout=90)
    response.raise_for_status()
    result = response.json()
    choices = result.get('choices', [])
    if not choices:
        return ''
    return (choices[0].get('message') or {}).get('content', '').strip()


def _chat_with_ollama(prompt, temperature=0.7, max_tokens=512):
    payload = {
        'model': OLLAMA_MODEL,
        'prompt': prompt,
        'stream': False,
        'options': {
            'temperature': temperature,
            'num_predict': max_tokens,
        }
    }
    response = requests.post(OLLAMA_URL, json=payload, timeout=90)
    response.raise_for_status()
    result = response.json()
    return result.get('response', '').strip()


def _history_to_prompt(history, message):
    lines = []
    for item in history:
        role = 'User' if item['role'] == 'user' else 'Assistant'
        lines.append(f"{role}: {item['content']}")
    if message:
        lines.append(f"User: {message}")
    lines.append('Assistant:')
    return '\n'.join(lines)


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    message = str(data.get('message', '')).strip()
    language = str(data.get('language', 'en-IN')).strip()
    history = _normalize_history(data.get('history', []))

    # Backward compatibility: older clients only sent history
    if not message and history:
        message = history[-1]['content']

    if not message:
        return jsonify({'error': 'No message or history provided'}), 400

    try:
        messages = [
            {'role': 'system', 'content': f"{SYSTEM_PROMPT} Preferred language: {language}."},
            *history,
            {'role': 'user', 'content': message},
        ]

        # Prefer external LLM (Grok/Groq/OpenAI-compatible). Fallback to Ollama.
        try:
            reply = _chat_with_openai_compatible(messages)
        except Exception:
            prompt = _history_to_prompt(history, message)
            reply = _chat_with_ollama(prompt, temperature=0.6, max_tokens=700)

        return jsonify({'response': reply})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/summarize_chat', methods=['POST'])
def summarize_chat():
    data = request.get_json() or {}
    chat_text = str(data.get('chat_text', '')).strip()
    if not chat_text:
        return jsonify({'error': 'No chat_text provided'}), 400

    summary_prompt = (
        'Summarize this medical chat briefly with sections: Symptoms, Risk, Advice.\n\n'
        f'{chat_text}'
    )

    try:
        try:
            messages = [
                {'role': 'system', 'content': 'You summarize medical chats clearly and briefly.'},
                {'role': 'user', 'content': summary_prompt},
            ]
            summary = _chat_with_openai_compatible(messages, temperature=0.2, max_tokens=300)
        except Exception:
            summary = _chat_with_ollama(summary_prompt, temperature=0.2, max_tokens=300)

        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/summarize', methods=['POST'])
def summarize_context():
    data = request.get_json() or {}
    context = str(data.get('health_context', '')).strip()
    if not context:
        return jsonify({'error': 'No health_context provided'}), 400

    prompt = (
        'Create a concise patient summary from this context with: probable conditions, '
        'risk trend, and follow-up focus.\n\n'
        f'{context}'
    )

    try:
        try:
            messages = [
                {'role': 'system', 'content': 'You generate concise patient summaries.'},
                {'role': 'user', 'content': prompt},
            ]
            summary = _chat_with_openai_compatible(messages, temperature=0.2, max_tokens=300)
        except Exception:
            summary = _chat_with_ollama(prompt, temperature=0.2, max_tokens=300)

        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
