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

      chunks = request.text.match(/[^.!?;:]+[.!?;:]+/g) || [request.text]; // Split text into sentences using . ! ? ; : as delimiters.
      tts(rate, volume, voice);

      sendResponse({success: true});
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

    sendResponse({success: true});
    return true;
  }

  if (request.stop) {
    resetTTS();
    return true;
  }

  if (request.action === "activateMagnifier") {
    activateMagnifier(request.tabId);
    sendResponse({ success: true });
  }
  
  sendResponse({success: false, message: "Unknown request"});
  return false;
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
    chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
      const rate = result.rate || defaultRate;
      const volume = result.volume || defaultVolume;
      const voice = result.voice || defaultVoice;

      // Split text into sentences using . ! ? ; : as delimiters.
      chunks = menuOption.selectionText.match(/[^.!?;:]+[.!?;:]+/g) || [
        menuOption.selectionText,
      ];
      tts(rate, volume, voice);
    });
});

// This function is calling Chrome's TTS API to read the text aloud.
function tts(rate, volume, voice) {
  if (currentChunkIndex < chunks.length) {
    chrome.tts.speak(chunks[currentChunkIndex], {
      requiredEventTypes: ["cancelled", "end", "interrupted", "error", "word"],
      lang: lang,
      rate: rate,
      volume: volume,
      voiceName: voice,
      onEvent: function (event) {
        if (event.type === "end") {
          currentChunkIndex++;
          if (currentChunkIndex < chunks.length) {
            tts(rate, volume, voice);
          }
        }
        if (event.type === "cancelled" || event.type === "interrupted") {
          if (!sentenceSkipped) {
            resetTTS();
          }
        }
        if (event.type === "error") {
          console.error("TTS Error:", event.errorMessage);
        }
        sentenceSkipped = false;
      },
    });
  }
}

// This function restarts TTS from a different chunk.
function restartTTS() {
  chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
    const rate = result.rate || defaultRate;
    const volume = result.volume || defaultVolume;
    const voice = result.voice || defaultVoice;

    tts(rate, volume, voice);
  });
}

// A simple function to reset TTS and all the associated variables.
function resetTTS() {
  chrome.tts.stop();
  currentChunkIndex = 0;
  chrome.runtime.sendMessage({ ttsEnded: true });
  chunks = [];
}


function activateMagnifier(tabId) {
  chrome.storage.local.get(
    {
      magnifierStrength: 2.0, // Default value
      magnifierSize: 425, // You can adjust or remove if not needed
      magnifierAA: true,
      magnifierShape: 0, // For rectangle
      osFactor: 100,
      escLimit: false,
    },
    (items) => {
      chrome.tabs.captureVisibleTab({ format: "png" }, (screenshotUrl) => {

        chrome.scripting.insertCSS(
          {
            target: { tabId: tabId },
            files: ["styles/snapshot2.css"],
          },
          () => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                files: ["scripts/jquery-3.6.0.min.js"],
              },
              () => {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: tabId },
                    files: ["scripts/magnifying-glass.js"],
                  },
                  () => {
                    chrome.tabs.getZoom(tabId, (zoomFactor) => {
                      chrome.tabs.sendMessage(tabId, {
                        snapshot_url: screenshotUrl,
                        magnifier_str: items.magnifierStrength,
                        magnifier_size: items.magnifierSize,
                        magnifier_aa: items.magnifierAA,
                        magnifier_shape: items.magnifierShape,
                        page_zoom: zoomFactor,
                        os_compensation: items.osFactor,
                        esc_only: items.escLimit,
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
}

