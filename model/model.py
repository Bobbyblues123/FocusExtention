import joblib
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
import pandas as pd

# Load your Excel data
df = pd.read_excel("focusdata.xlsx")

# Join keywords into a single string for each row
df['text'] = df['Extracted Keywords'].apply(lambda x: ' '.join(eval(x)) if isinstance(x, str) else '')

X = df['text']
y = df['Category'].apply(lambda c: 1 if c == 'Distracting' else 0)

# Vectorize
vectorizer = CountVectorizer()
X_vec = vectorizer.fit_transform(X)

# Train model
model = LogisticRegression()
model.fit(X_vec, y)

# Save model + vectorizer
joblib.dump(model, 'focus_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')
print("Model and vectorizer saved.")
