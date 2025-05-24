let lastCheckedUrl = null;
let lastPostTime = 0;
const POST_INTERVAL = 30000; // 30 seconds
let lastCategory = null;

function getVisibleText() {

  const main = document.querySelector("main") || document.querySelector("article") || document.body;

  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      if (!node.parentNode) return NodeFilter.FILTER_REJECT;
      const style = window.getComputedStyle(node.parentNode);
      return style && style.display !== "none" && style.visibility !== "hidden"
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  let text = '';
  let wordLimit = 50;
  let wordCount = 0;

  while (walker.nextNode()) {
    const content = walker.currentNode.nodeValue.trim();
    const words = content.split(/\s+/);
    if (wordCount + words.length > wordLimit) break;

    text += content + ' ';
    wordCount += words.length;
  }

  return text.trim();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "analyzeContent") {
    const url = window.location.href;
    const words = getVisibleText();

    const now = Date.now();
    if ((url !== lastCheckedUrl) || (now - lastPostTime > POST_INTERVAL)) {
      lastCheckedUrl = url;
      lastPostTime = now;

      fetch("https://focus-backend-0pm1.onrender.com/classify-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: words, url: url }),
      })
        .then(res => res.json())
        .then(data => {
          lastCategory = data.category || null;
          if (data.category === "Distracting") {
            chrome.runtime.sendMessage({ action: "notify" });
          }
        })
        .catch(err => {
          console.error("Content analysis failed:", err);
          lastCategory = null;
        });
    }

    sendResponse({ text: words, category: lastCategory });
    return true; 
  }

  if (msg.action === "getVisibleText") {
    const words = getVisibleText();
    sendResponse({ text: words });
    return true;
  }

  return true;
});
