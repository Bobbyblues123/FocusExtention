import time
import nltk
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

nltk.download('stopwords')
nltk.download('punkt')

distracting_keywords = ['funny', 'meme', 'viral', 'celebrity', 'entertainment', 'game', 'music']
data = []

def extract_keywords(url):
    try:
        # Set up the Selenium WebDriver
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # Run in headless mode (without opening a window)
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        print(f"Loading {url}...")
        driver.get(url)

        # Wait for the page to load (you can adjust the time if needed)
        time.sleep(5)  # Wait for 5 seconds for the page to fully load

        # Extract page source after the page is fully loaded
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        text = ""
        for paragraph in soup.find_all(['p', 'h1', 'h2', 'h3', 'title']):
            text += paragraph.get_text() + " "

        stop_words = set(stopwords.words('english'))
        word_tokens = word_tokenize(text)

        filtered_text = [word.lower() for word in word_tokens if word.lower() not in stop_words and word.isalpha()]

        distracting = any(keyword in filtered_text for keyword in distracting_keywords)
        category = 'Distracting' if distracting else 'Non-distracting'

        print(f"\nURL: {url}")
        print(f"Category: {category}")
        print(f"Top Keywords: {filtered_text[:10]}")

        data.append({'URL': url, 'Category': category, 'Extracted Keywords': filtered_text[:10]})
        
        # Close the browser
        driver.quit()

    except Exception as e:
        print(f"\nFailed to process {url}: {e}")

websites = [
    # Distracting
    "https://www.buzzfeed.com/ariannarebolini/books-that-will-make-you-laugh",
    "https://about.instagram.com/features/reels",
    "https://www.tiktok.com/discover/tibs",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.reddit.com/r/funny/comments/15y7z9z/that_one_friend/",
    "https://9gag.com/",
    "https://www.pinterest.com/",
    "https://www.netflix.com/title/80192098",
    "https://www.hulu.com/guides/brooklyn-99-season-8",
    "https://open.spotify.com/track/6b8Be6ljOzmkOmFslEb23P",
    "https://www.boredpanda.com/funny-design-fails/",
    "https://www.twitch.tv/twitch/videos", 

    # Non-distracting
    "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-videos/",
    "https://www.khanacademy.org/math/calculus-1",
    "https://en.wikipedia.org/wiki/Photosynthesis",
    "https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-an-unsorted-array",
    "https://www.coursera.org/learn/machine-learning",
    "https://www.edx.org/course/cs50s-introduction-to-computer-science",
    "https://www.codecademy.com/learn/learn-python-3",
    "https://www.geeksforgeeks.org/python-programming-language/",
    "https://academic.oup.com/nar/article/50/D1/D387/6431379",
    "https://www.nature.com/articles/s41586-024-07135-2",
    "https://workspace.google.com/products/docs/",
    "https://www.nytimes.com/2023/01/12/learning/lesson-plans-articles-classroom.html"
]


for website in websites:
    extract_keywords(website)

df = pd.DataFrame(data)
df.to_excel("focusdata.xlsx", index=False)
print("\nData saved to focusdata.xlsx")
