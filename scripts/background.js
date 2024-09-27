// This listener listens for TTS requests from the button press in the extension popup.
chrome.runtime.onMessage.addListener((request) => {
  if (request.text) {
    tts(request.text);
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
  if (menuOption.menuItemId === "ttsRightClick") tts(menuOption.selectionText);
});

// This function is calling Chrome's TTS API to read the text aloud.
function tts(text) {
  const lang = "en-US";
  const rate = 1.0;

  chrome.tts.speak(text, { lang: lang, rate: rate });
}
