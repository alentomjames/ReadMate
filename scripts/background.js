const lang = "en-US";
var initialRate = 1.0;
var rateChanged = false;

// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request) => {
  if (request.text) {
    chrome.storage.local.get(["rate"], (result) => {
      const currentRate = result.rate || initialRate;
      tts(request.text, currentRate);
    });
  }

  if (request.rateChange) {
    rateChanged = true;
    chrome.storage.local.get(["rate"], (result) => {
      var currentRate = result.rate || initialRate;
      currentRate = request.slow
        ? Math.max(0.5, currentRate - 0.1) // Prevent speaking rate from going too slow (half the speed)
        : Math.min(2.0, currentRate + 0.1); // Prevent speaking rate from going too fast (double the speed)
      chrome.storage.local.set({ rate: currentRate }, () => {
        chrome.tts.isSpeaking((speaking) => {
          if (speaking) {
            restartWithNewRate(currentRate);
          }
        });
      });
    });
  }

  if (request.stop) {
    chrome.tts.stop();
  }
});

// This adds a TTS option on the context menu (right click menu) if there is highlighted text.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ttsRightClick",
    title: "Read Aloud",
    contexts: ["selection"],
  });
});

// Handle the click event for the context menu option.
chrome.contextMenus.onClicked.addListener((menuOption) => {
  if (menuOption.menuItemId === "ttsRightClick")
    chrome.storage.local.get(["rate"], (result) => {
      const currentRate = result.rate || initialRate;
      tts(menuOption.selectionText, currentRate);
    });
});

// This function is calling Chrome's TTS API to read the text aloud.
function tts(text, rate) {
  const chunks = text.match(/[^.!?;:]+[.!?;:]+/g) || [text]; // Split text into sentences using . ! ? ; : as delimiters.
  chrome.storage.local.set({ lastChunk: text });

  chunks.forEach((chunk, index) => {
    chrome.tts.speak(chunk, {
      requiredEventTypes: ["cancelled", "end", "interrupted"],
      lang: lang,
      rate: rate,
      enqueue: true,
      onEvent: function (event) {
        if (event.type === "end" && index === chunks.length - 1) {
          if (!rateChanged) {
            chrome.runtime.sendMessage({ ttsEnded: true });
          }
        }
        if (event.type === "cancelled" || event.type === "interrupted") {
          if (!rateChanged) {
            chrome.runtime.sendMessage({ ttsEnded: true });
          }
        }
        rateChanged = false;
      },
    });
  });
}

// This function restarts speech with the new rate from the current chunk
function restartWithNewRate(rate) {
  chrome.tts.stop();
  chrome.storage.local.get(["lastChunk"], (result) => {
    if (result.lastChunk) tts(result.lastChunk, rate);
  });
}
