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

# Ensure UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load your model and vectorizer
model = joblib.load('focus_model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

# Configure Gemini API
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

def classify_with_gemini(text: str) -> str:
    prompt = (
        f"Text: {text}\n\n"
        "Is this content likely to be distracting for someone trying to stay focused on work or study? "
        "Answer 'Distracting' or 'Non-distracting'."
    )

    response = gemini_model.generate_content(prompt)
    gemini_output = response.text.strip()

    if gemini_output.lower().startswith("distracting"):
        return "Distracting"
    elif gemini_output.lower().startswith("non-distracting"):
        return "Non-distracting"
    else:
        return "Distracting"  # fallback

def hybrid_classify(text: str) -> dict:
    X = vectorizer.transform([text])
    prob = model.predict_proba(X)[0]
    class_index = np.argmax(prob)
    confidence = prob[class_index]

    if confidence < 1.0:
        gemini_result = classify_with_gemini(text)
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
    text = data.get('text', '').strip()

    print(f"[Request] Received text for classification: {text}")  # ✅ Debug: print input

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    text = normalize_text(text)

    try:
        result = hybrid_classify(text)
        print(f"[Response] Classification result: {result}\n")  # ✅ Debug: print output
        return app.response_class(
            response=json.dumps(result, ensure_ascii=False).encode('utf-8'),
            status=200,
            mimetype='application/json; charset=utf-8'
        )
    except Exception as e:
        print(f"[Error] Exception during classification: {e}")  # ✅ Debug: print error
        return jsonify({'error': str(e)}), 500

# --- TESTERS ---
def test_texts():
    test_cases = [
        ("Distracting #1", "I can't focus because of the loud music and constant notifications."),
        ("Distracting #2", "OMG, did you see that viral video? Check this out!"),
        ("Distracting #3", "My phone keeps buzzing every minute with texts and alerts."),
        ("Non-distracting #1", "The lecture was very informative and kept me engaged the entire time."),
        ("Non-distracting #2", "I organized my notes and planned my study session carefully.")
    ]

    for label, text in test_cases:
        print(f"--- {label} ---")
        result = hybrid_classify(text)
        print(f"Text: {text}")
        print(f"Classification: {result['category']} (Confidence: {result['confidence']}, Source: {result['source']})\n")

if __name__ == '__main__':
    import threading
    import time

    def run_tests():
        time.sleep(1)  # wait for server start
        # test_texts()

    threading.Thread(target=run_tests).start()
    app.run(debug=True)
