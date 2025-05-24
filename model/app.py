# -*- coding: utf-8 -*-
# app.py
import sys
import io
import os
import json
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(__file__), 'focus_model.pkl')
model = joblib.load(model_path)
vectorizer_path = os.path.join(os.path.dirname(__file__), 'vectorizer.pkl')
vectorizer = joblib.load(vectorizer_path)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

def normalize_text(text: str) -> str:
    replacements = {
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'",
        '\xa0': ' ',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def classify_with_gemini(text: str, url: str) -> str:
    prompt = (
        "You are a focus assistant helping someone stay productive. "
        "Determine if a website snippet and its URL are likely to distract someone from work or study where distracting means social media or video watching, video games, etc..\n\n"
        f"Text: {text}\n"
        f"URL: {url}\n\n"
        "Reply ONLY with 'Distracting' or 'Non-distracting'."
    )
    print(f"[Gemini] Prompt sent to Gemini model:\n{prompt}")

    response = gemini_model.generate_content(prompt)
    gemini_output = response.text.strip()
    return gemini_output if gemini_output in ["Distracting", "Non-distracting"] else "Distracting"

def hybrid_classify(text: str, url: str) -> dict:
    X = vectorizer.transform([text])
    prob = model.predict_proba(X)[0]
    class_index = np.argmax(prob)
    confidence = prob[class_index]

    if confidence < 1.0:
        gemini_result = classify_with_gemini(text, url)
        print(f"Model not confident (confidence={confidence:.4f}). Using Gemini fallback. Gemini result: {gemini_result}")
        return {
            'category': gemini_result,
            'confidence': round(confidence, 4),
            'source': 'gemini'
        }
    else:
        category = 'Non-distracting' if class_index == 0 else 'Distracting'
        print(f"Model prediction: {category} (confidence={confidence:.4f})")
        return {
            'category': category,
            'confidence': round(confidence, 4),
            'source': 'model'
        }

@app.route('/')
def home():
    return 'Hybrid Focus Classifier (ML + Gemini fallback)'

@app.route('/classify-text', methods=['POST'])
def classify_text():
    data = request.get_json(force=True)
    print("recieved json", data)
    text = data.get('text', '').strip()
    url = data.get('url', '').strip()

    print(f"[Request] Text: {text[:100]}... | URL: {url}")  

    if not text or not url:
        return jsonify({'error': 'No text/url provided'}), 400

    text = normalize_text(text)

    try:
        result = hybrid_classify(text, url)
        print(f"[Response] Classification result: {result}\n") 
        return app.response_class(
            response=json.dumps(result, ensure_ascii=False).encode('utf-8'),
            status=200,
            mimetype='application/json; charset=utf-8'
        )
    except Exception as e:
        print(f"[Error] Exception during classification: {e}")  
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    import threading
    import time

    def run_tests():
        time.sleep(1)  
        # test_texts()

    threading.Thread(target=run_tests).start()
    port = int(os.environ["PORT"])
    app.run(host='0.0.0.0', port=port)
