//content.js
console.log('content script loaded');

let lastCheckedUrl = null;

function getVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      if (!node.parentNode) return NodeFilter.FILTER_REJECT;
      const style = window.getComputedStyle(node.parentNode);
      return style && style.display !== "none" && style.visibility !== "hidden"
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  let text = '';
  while (walker.nextNode()) {
    text += walker.currentNode.nodeValue + ' ';
  }
  return text.trim();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "analyzeContent") {
    const url = window.location.href;

    // 🚫 Avoid re-sending POST for the same URL
    if (url === lastCheckedUrl) {
      console.log("Already checked this URL, skipping POST");
      return true;
    }

    lastCheckedUrl = url;

    const words = getVisibleText();

    fetch("https://focus-backend-0pm1.onrender.com/classify-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: {words}, url: {url} })
    })
    .then(res => res.json())
    .then(data => {
      if (data.category === "Distracting") {
        chrome.runtime.sendMessage({ action: "notify" });
      }
    })
    .catch(err => console.error("Content analysis failed:", err));
  }

  return true;
});
