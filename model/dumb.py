import google.generativeai as genai

# Set your API key
genai.configure(api_key="AIzaSyAVxpchnJRs6c75QBTgPA_Wj3Zx5GmXbpI")

# Choose a model
model = genai.GenerativeModel('gemini-1.5-flash')

# Generate text
response = model.generate_content("You are a focus assistant helping someone avoid content that is clearly irrelevant or attention-grabbing in a non-productive way (e.g. memes, gossip, shopping, entertainment, etc Given a website snippet, decide: Non-distracting if it's educational, work-related, research, or study material.Distracting only if it obviously pulls someone away from focused work or study.Text: Linear algebra is central to almost all areas of mathematics. For instance, linear algebra is fundamental in modern presentations of geometry, including for defining basic objects such as lines, planes and rotations. Also, functional analysis, a branch of mathematical analysis, may be viewed as the application of linear alg. URL: https://en.wikipedia.org/wiki/Linear_algebra Is this content likely to be distracting for someone trying to stay focused on work or study? "
        "Answer 'Distracting' or 'Non-distracting' and explain why in one line.")

print(response.text)
