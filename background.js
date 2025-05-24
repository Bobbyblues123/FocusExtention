let startTime = null;
let currentTabId = null;
const checkedTabs = new Map();  
const cache = new Map();        

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
      checkedTabs.set(tab.id, false);
    }

    const elapsedTime = now - startTime;

    if (elapsedTime >= 300000 && !checkedTabs.get(tab.id)) {
      if (cache.has(tab.url)) {
        const category = cache.get(tab.url);
        if (category === "Distracting") {
          chrome.runtime.sendMessage({ action: "notify", category });
        }
        checkedTabs.set(tab.id, true);
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: "analyzeContent" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Message send failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Message sent successfully");
        }
      });

      checkedTabs.set(tab.id, true);
    }
  });
}

setInterval(checkTab, 1000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "notify") {
    if (currentTabId) alertUser(currentTabId);
    if (sender.tab && sender.tab.url) {
      const category = msg.category || "Distracting";
      cache.set(sender.tab.url, category);
    }
  }

  if (msg.type === "getDistractingTime") {
    const now = Date.now();
    const elapsed = startTime ? now - startTime : 0;
    sendResponse({ timeMs: elapsed });
    return true;
  }
});

chrome.runtime.onStartup.addListener(() => {
  currentTabId = null;
  startTime = null;
  checkedTabs.clear();
  cache.clear();
});
