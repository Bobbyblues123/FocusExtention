import google.generativeai as genai

# Set your API key
genai.configure(api_key="AIzaSyAVxpchnJRs6c75QBTgPA_Wj3Zx5GmXbpI")

# Choose a model
model = genai.GenerativeModel('gemini-1.5-flash')

# Generate text
response = model.generate_content("Explain general relativity in simple terms.")

print(response.text)
