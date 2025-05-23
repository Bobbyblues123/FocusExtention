//background.js
let startTime = null;
let currentTabId = null;
let alreadyChecked = false;
const cache = new Map(); // NEW: Cache to avoid redundant checks

function alertUser(tabId) {
  const notificationId = 'focusCheck-' + Date.now();
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'icon512.png',
    title: 'Focus Check',
    message: 'You seem distracted. Need to get back on track?',
    buttons: [{ title: "Yes, I'm focused" }, { title: "Close this tab" }],
    priority: 2,
  });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 1) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.remove(tabs[0].id);
    });
  }
  chrome.notifications.clear(notificationId);
});

function checkTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id || !tab.url.startsWith('http')) return;

    const now = Date.now();

    if (currentTabId !== tab.id) {
      currentTabId = tab.id;
      startTime = now;
      alreadyChecked = false;
    }

    const elapsedTime = now - startTime;

    if (elapsedTime >= 5000 && !alreadyChecked) {
      // Check cache first
      if (cache.has(tab.url)) {
        const cachedResult = cache.get(tab.url);
        if (cachedResult) {
          chrome.runtime.sendMessage({ action: "notify" });
        }
        alreadyChecked = true;
        return;
      }

      // Ask content script to analyze
      chrome.tabs.sendMessage(tab.id, { action: "analyzeContent" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Message send failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Message sent successfully");
        }
      });
      alreadyChecked = true;
    }
  });
}

setInterval(checkTab, 1000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "notify") {
    if (currentTabId) alertUser(currentTabId);
    if (sender.tab && sender.tab.url) {
      cache.set(sender.tab.url, true); // Cache the result
    }
  }

  if (msg.type === "getDistractingTime") {
    const now = Date.now();
    const elapsed = startTime ? now - startTime : 0;
    sendResponse({ timeMs: elapsed });
    return true;
  }
});
