var isPaused = false;
var textExists = false;

// This is adding click functionality to the button in the in the extension popup.
document.getElementById("ttsBtn").addEventListener("click", () => {
  chrome.tts.isSpeaking((speaking) => {
    if (speaking) {
      if (isPaused) {
        // Resume the speech if it was paused
        chrome.tts.resume();
        isPaused = false;
        document.getElementById("ttsBtn").textContent = "Pause";
      } else {
        // Pause the speech if it's currently speaking
        chrome.tts.pause();
        isPaused = true;
        document.getElementById("ttsBtn").textContent = "Resume";
      }
    } else {
      // Start reading aloud if nothing is currently speaking
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getHighlightedText,
        });
      });

      if (textExists) {
        document.getElementById("ttsBtn").textContent = "Pause";
      }
    }
  });
});

document.getElementById("slowBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        chrome.runtime.sendMessage({ slow: true });
      },
    });
  });
});

document.getElementById("fastBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        chrome.runtime.sendMessage({ fast: true });
      },
    });
  });
});

document.getElementById("stopBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        chrome.runtime.sendMessage({ stop: true });
      },
    });
  });
});

// Listen for messages from the background script to reset the button
chrome.runtime.onMessage.addListener((message) => {
  if (message.ttsEnded) {
    resetTTSButton();
  }
});

// This function gets the highlighted text and sends it to the background service worker.
function getHighlightedText() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.runtime.sendMessage({ text: selectedText });
    textExists = true;
  }
}

// This function resets the primary TTS Button text to "Read Aloud"
function resetTTSButton() {
  document.getElementById("ttsBtn").textContent = "Read Aloud";
  isPaused = false;
}
