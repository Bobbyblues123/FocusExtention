import requests

URL = "http://127.0.0.1:5000/classify-text"

test_texts = [
    "Watch unlimited Netflix and YouTube videos here!",
    "Learn advanced machine learning techniques using Python.",
    "Check out the latest celebrity gossip and memes!",
    "Here’s how to install Python and set up your first Flask app."
]

for text in test_texts:
    print(f"Testing: {text}")
    try:
        response = requests.post(URL, json={"text": text})
        print("Status Code:", response.status_code)
        if response.status_code == 200:
            print("Response:", response.json())
        else:
            print("Error:", response.text)
    except Exception as e:
        print("Exception occurred:", str(e))
    print("-" * 40)
