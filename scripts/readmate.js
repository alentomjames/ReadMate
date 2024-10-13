var isPaused = false;

/* This is adding click functionality to the button in the in the extension popup.
  The button can show:
    - "Read Aloud" if awaiting a click, and if there is a click, but no text was highlighted.
    - "Pause" if the TTS is currently speaking.
    - "Resume" if the TTS is currently paused.
*/
document.getElementById("ttsBtn").addEventListener("click", () => {
  chrome.tts.isSpeaking((speaking) => {
    if (speaking) {
      if (isPaused) {
        chrome.tts.resume();
        isPaused = false;
        document.getElementById("ttsBtn").innerHTML =
          '<i class="bi bi-pause-circle"></i>';
      } else {
        chrome.tts.pause();
        isPaused = true;
        document.getElementById("ttsBtn").innerHTML =
          '<i class="bi bi-play-circle"></i>';
      }
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => window.getSelection().toString(),
          },
          (results) => {
            const selectedText = results && results[0] && results[0].result;

            // If the text exists, show "Pause" for initial button press. else "Read Aloud"
            if (selectedText) {
              chrome.runtime.sendMessage({ text: selectedText });
              document.getElementById("ttsBtn").innerHTML =
                '<i class="bi bi-pause-circle"></i>';
            } else {
              document.getElementById("ttsBtn").innerHTML =
                '<i class="bi bi-play-circle"></i>';
            }
          }
        );
      });
    }
  });
});

// The slow button sends a rateChange request with slow set to true.
document.getElementById("slowBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ rateChange: true, slow: true });
});

// The fast button sends a rateChange request with slow set to false.
document.getElementById("fastBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ rateChange: true, slow: false });
});

// The stop button sends a stop request to the background script.
document.getElementById("stopBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ stop: true });
});

// This opens the settings window.
document.getElementById("settingsBtn").addEventListener("click", () => {
  chrome.windows.create({
    url: "src/settings.html",
    type: "popup",
    width: 400,
    height: 300,
  });
});

// This listens for requests from the background script to reset the button (can be expanded upon later)
chrome.runtime.onMessage.addListener((request) => {
  if (request.ttsEnded) {
    resetTTSButton();
  }
});

// This function gets the highlighted text and sends it to the background service worker.
function getHighlightedText() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.runtime.sendMessage({ text: selectedText });
  }
}

// This function resets the primary TTS Button text to "Read Aloud"
function resetTTSButton() {
  document.getElementById("ttsBtn").innerHTML =
    '<i class="bi bi-play-circle"></i>';
  isPaused = false;
}
