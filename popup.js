//popup.js
async function isDistractingSite(url) {
  try {
    const res = await fetch("http://127.0.0.1:5000/classify-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: url })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server responded with ${res.status}: ${errorText}`);
    }

    const data = await res.json();

    return data.category === "Distracting";
  } catch (err) {
    console.error("Popup classification failed:", err);
    return false;  // Fallback: treat as not distracting
  }
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

        const isDistracting = await isDistractingSite(tab.url);

        if (isDistracting && timeSec >= 5) {
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
      document.getElementById("status").textContent = "❌ Couldn't load focus time.";
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updatePopup();
  setInterval(updatePopup, 1000);
});

// Ask background.js if the current URL is known to be distracting

// async function isDistractingSite(url) {
//   return new Promise((resolve) => {
//     chrome.runtime.sendMessage({ type: "isUrlDistracting", url }, (response) => {
//       resolve(response?.distracting || false);
//     });
//   });
// }

// function updatePopup() {
//   chrome.runtime.sendMessage({ type: "getDistractingTime" }, (response) => {
//     if (response && response.timeMs !== undefined) {
//       const timeSec = Math.floor(response.timeMs / 1000);

//       chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//         const tab = tabs[0];
//         const url = tab.url || "Unknown";
//         document.getElementById("site").textContent = url;

//         const status = document.getElementById("focusTime");
//         const closeBtn = document.getElementById("closeBtn");

//         const isDistracting = await isDistractingSite(url);

//         if (isDistracting && timeSec >= 5) {
//           status.textContent = `⚠️ On a distracting site for ${timeSec}s - Stay focused!`;
//           closeBtn.style.display = "inline-block";

//           closeBtn.onclick = () => {
//             const confirmed = confirm("You’ve been on a distracting site for a while. Do you want to close this tab?");
//             if (confirmed) {
//               chrome.tabs.remove(tab.id);
//             }
//           };
//         } else if (isDistracting) {
//           status.textContent = `⌛ On a distracting site for ${timeSec}s`;
//           closeBtn.style.display = "none";
//         } else {
//           status.textContent = "✅ You're focused!";
//           closeBtn.style.display = "none";
//         }
//       });
//     } else {
//       document.getElementById("site").textContent = "Loading...";
//       document.getElementById("status").textContent = "❌ Couldn't load focus time.";
//     }
//   });
// }

// document.addEventListener('DOMContentLoaded', () => {
//   updatePopup();
//   setInterval(updatePopup, 1000);
// });
