const lang = "en-US";
var initialRate = 1.0;

// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request) => {
  if (request.text) {
    chrome.storage.local.get(["rate"], (result) => {
      const currentRate = result.rate || initialRate;
      tts(request.text, currentRate);
    });
  }

  if (request.slow) {
    chrome.storage.local.get(["rate"], (result) => {
      var currentRate = result.rate || initialRate;
      currentRate = Math.max(0.5, currentRate - 0.1); // Prevent speaking rate from going too slow (half the speed)
      chrome.storage.local.set({ rate: currentRate }, () => {
        chrome.tts.isSpeaking((speaking) => {
          if (speaking) {
            chrome.tts.update({ rate: currentRate });
          }
        });
      });
    });
  }

  if (request.fast) {
    chrome.storage.local.get(["rate"], (result) => {
      var currentRate = result.rate || initialRate;
      currentRate = Math.min(2.0, currentRate + 0.1); // Prevent speaking rate from going too fast (double the speed)
      chrome.storage.local.set({ rate: currentRate }, () => {
        chrome.tts.isSpeaking((speaking) => {
          if (speaking) {
            chrome.tts.update({ rate: currentRate });
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
  chrome.tts.speak(text, {
    requiredEventTypes: ["cancelled", "end", "interrupted"],
    onEvent: function (event) {
      if (
        event.type === "cancelled" ||
        event.type === "end" ||
        event.type === "interrupted"
      ) {
        chrome.runtime.sendMessage({ ttsEnded: true });
      }
    },
    lang: lang,
    rate: rate,
  });
}
