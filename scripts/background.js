const lang = "en-US";
var initialRate = 1.0;
var chunks = [];
var currentChunkIndex = 0;
var sentenceSkipped = false;

// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request) => {
  if (request.text) {
    chrome.storage.local.get(["rate"], (result) => {
      const currentRate = result.rate || initialRate;
      chunks = request.text.match(/[^.!?;:]+[.!?;:]+/g) || [request.text]; // Split text into sentences using . ! ? ; : as delimiters.
      tts(currentRate);
    });
  }

  if (request.skipSentence) {
    sentenceSkipped = true;
    chrome.tts.stop();
    if (request.forward) {
      if (currentChunkIndex === chunks.length - 1) {
        resetTTS();
      } else {
        currentChunkIndex++;
        restartTTS();
      }
    } else {
      if (currentChunkIndex > 0) {
        currentChunkIndex--;
      }
      restartTTS();
    }
  }

  // **TODO: Remove this once rate changing is implemented in settings.**
  // if (request.rateChange) {
  //   rateChanged = true;
  //   chrome.storage.local.get(["rate"], (result) => {
  //     var currentRate = result.rate || initialRate;
  //     currentRate = request.slow
  //       ? Math.max(0.5, currentRate - 0.1) // Prevent speaking rate from going too slow (half the speed of normal is lowest)
  //       : Math.min(2.0, currentRate + 0.1); // Prevent speaking rate from going too fast (double the speed of normal is highest)
  //     chrome.storage.local.set({ rate: currentRate }, () => {
  //       chrome.tts.isSpeaking((speaking) => {
  //         if (speaking) {
  //           restartWithNewRate(currentRate);
  //         }
  //       });
  //     });
  //   });
  // }

  if (request.stop) {
    resetTTS();
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

      // Split text into sentences using . ! ? ; : as delimiters.
      chunks = menuOption.selectionText.match(/[^.!?;:]+[.!?;:]+/g) || [
        menuOption.selectionText,
      ];
      tts(currentRate);
    });
});

// This function is calling Chrome's TTS API to read the text aloud.
function tts(rate) {
  if (currentChunkIndex < chunks.length) {
    chrome.tts.speak(chunks[currentChunkIndex], {
      requiredEventTypes: ["cancelled", "end", "interrupted", "error", "word"],
      lang: lang,
      rate: rate,
      onEvent: function (event) {
        if (event.type === "end") {
          currentChunkIndex++;
          if (currentChunkIndex < chunks.length) {
            tts(rate);
          }
        }
        if (event.type === "cancelled" || event.type === "interrupted") {
          if (!sentenceSkipped) {
            resetTTS();
          }
        }
        sentenceSkipped = false;
      },
    });
  }
}

// This function restarts TTS with the from a different chunk.
function restartTTS() {
  chrome.storage.local.get(["rate"], (result) => {
    const rate = result.rate || initialRate;
    tts(rate);
  });
}

// A simple function to reset TTS and all the associated variables.
function resetTTS() {
  chrome.tts.stop();
  currentChunkIndex = 0;
  chrome.runtime.sendMessage({ ttsEnded: true });
  chunks = [];
}
