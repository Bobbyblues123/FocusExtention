//popup.js
async function isDistractingSite(tab) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { action: "analyzeContent" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Content script error:", chrome.runtime.lastError.message);
        return resolve(false);
      }
      const category = response?.category || null;
      resolve(category === "Distracting");
    });
  });
}

function updatePopup() {
  chrome.runtime.sendMessage({ type: "getDistractingTime" }, (response) => {
    if (response && response.timeMs !== undefined) {
      const timeSec = Math.floor(response.timeMs / 1000);

      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        document.getElementById("site").textContent = tab.url || "Unknown";

        const status = document.getElementById("focusTime");
        const closeBtn = document.getElementById("closeBtn");

        const isDistracting = await isDistractingSite(tab);

        if (isDistracting && timeSec >= 300) {
          status.textContent = `⚠️ On a distracting site for ${timeSec}s - Stay focused!`;
          closeBtn.style.display = "inline-block";

          closeBtn.onclick = () => {
            const confirmed = confirm("You’ve been on a distracting site for a while. Do you want to close this tab?");
            if (confirmed) {
              chrome.tabs.remove(tab.id);
            }
          };
        } else if (isDistracting) {
          status.textContent = `⌛ On a distracting site for ${timeSec}s`;
          closeBtn.style.display = "none";
        } else {
          status.textContent = "✅ You're focused!";
          closeBtn.style.display = "none";
        }
      });
    } else {
      document.getElementById("site").textContent = "Loading...";
      document.getElementById("focusTime").textContent = "❌ Couldn't load focus time.";
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updatePopup();
  setInterval(updatePopup, 1000);
});
