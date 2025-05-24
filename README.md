# Focus Tracker - Chrome Extension

**Focus Tracker** is a Chrome extension that helps you stay productive by detecting when you're on distracting websites. It uses an AI-powered text classifier to analyze the current page content and alert you when you're losing focus.

## Features

- Detects when you're on a distracting website
- Uses AI (via a local Flask server) to analyze visible webpage text
- Tracks how long you've been on a distracting site
- Sends a notification with an option to close the tab
- Displays current site status in the popup

## Files Overview

- `manifest.json` — Chrome extension config
- `content.js` — Extracts visible text and communicates with the classifier
- `popup.js` — Displays site status and allows user interaction
- `background.js` — Tracks tab focus time and sends notifications
- `icon*.png` — Extension icons
- `app.py` - Flask app

## Setup Instructions

### 1. Load the Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode** 
3. Click **Load unpacked**
4. Select the folder containing this project

### 2. Start Your Local AI Server

Load Server using render or other servers

#### License

MIT


