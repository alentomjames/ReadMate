const lang = "en-US";
var defaultRate = 1.0;
var defaultVolume = 1.0;
var defaultVoice = "";

var chunks = [];
var currentChunkIndex = 0;
var sentenceSkipped = false;

// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request) => {
  if (request.text) {
    chrome.storage.local.get(["rate", "volume", "voice"], (result) => {
      const rate = result.rate || defaultRate;
      const volume = result.volume || defaultVolume;
      const voice = result.voice || defaultVoice;

      chunks = request.text.match(/[^.!?;:]+[.!?;:]+/g) || [request.text]; // Split text into sentences using . ! ? ; : as delimiters.
      tts(rate, volume, voice);
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
