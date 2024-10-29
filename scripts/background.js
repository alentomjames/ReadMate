const lang = "en-US";
var defaultRate = 1.0;
var defaultVolume = 1.0;
var defaultVoice = "";

var chunks = [];
var currentChunkIndex = 0;
var sentenceSkipped = false;

// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.text) {
    chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
      const rate = result.rate || defaultRate;
      const volume = result.volume || defaultVolume;
      const voice = result.voice || defaultVoice;

      // Improved sentence splitting with better handling of punctuation
      chunks = request.text
        .split(/(?<=[.!?;:])\s+/g)
        .filter((chunk) => chunk.trim());
      console.log("Split text into chunks:", chunks);

      currentChunkIndex = 0;
      tts(rate, volume, voice);

      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }

  if (request.skipSentence) {
    sentenceSkipped = true;
    chrome.tts.stop();

    // Remove current highlight before skipping
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "removeHighlights",
        });
      }
    });

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

    sendResponse({ success: true });
    return true;
  }

  if (request.stop) {
    resetTTS();
    // Remove highlights when stopping
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "removeHighlights",
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  sendResponse({ success: false, message: "Unknown request" });
  return false;
});

function tts(rate, volume, voice) {
  chrome.tts.stop();

  if (currentChunkIndex < chunks.length) {
    const currentChunk = chunks[currentChunkIndex].trim();
    console.log("Speaking chunk:", currentChunk);

    // Send message to content script to highlight current chunk
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        if (!tabs[0]) {
          console.error("No active tab found");
          return;
        }

        try {
          // First remove any existing highlights
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: "removeHighlights",
          });

          // Then add new highlight
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: "highlightChunk",
            chunk: currentChunk,
          });

          // Now speak the text
          chrome.tts.speak(currentChunk, {
            requiredEventTypes: [
              "cancelled",
              "end",
              "interrupted",
              "error",
              "word",
            ],
            lang: lang,
            rate: rate,
            volume: volume,
            voiceName: voice,
            onEvent: function (event) {
              console.log(event);
              if (event.type === "end") {
                currentChunkIndex++;
                if (currentChunkIndex < chunks.length) {
                  tts(rate, volume, voice);
                } else {
                  // Clean up at the end
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: "removeHighlights",
                  });
                  resetTTS();
                }
              }
              if (event.type === "word") {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "highlightWord",
                  charIndex: event.charIndex,
                  length: event.length,
                });
              }
              if (event.type === "cancelled" || event.type === "interrupted") {
                if (!sentenceSkipped) {
                  resetTTS();
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: "removeHighlights",
                  });
                }
              }
              if (event.type === "error") {
                console.error("TTS Error:", event.errorMessage);
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "removeHighlights",
                });
              }
              sentenceSkipped = false;
            },
          });
        } catch (error) {
          console.error("Error in TTS process:", error);
          resetTTS();
        }
      }
    );
  }
}

function restartTTS() {
  chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
    const rate = result.rate || defaultRate;
    const volume = result.volume || defaultVolume;
    const voice = result.voice || defaultVoice;

    tts(rate, volume, voice);
  });
}

function resetTTS() {
  chrome.tts.stop();
  currentChunkIndex = 0;
  chrome.runtime.sendMessage({ ttsEnded: true });
  chunks = [];
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ttsRightClick",
    title: "Read Aloud",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((menuOption) => {
  if (menuOption.menuItemId === "ttsRightClick") {
    chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
      const rate = result.rate || defaultRate;
      const volume = result.volume || defaultVolume;
      const voice = result.voice || defaultVoice;

      chunks = menuOption.selectionText
        .split(/(?<=[.!?;:])\s+/g)
        .filter((chunk) => chunk.trim());
      currentChunkIndex = 0;
      tts(rate, volume, voice);
    });
  }
});
