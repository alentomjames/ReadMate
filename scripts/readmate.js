// This is adding click functionality to the button in the in the extension popup.
document.getElementById("ttsBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getHighlightedText,
    });
  });
});

// This function gets the highlighted text and sends it to the background service worker.
function getHighlightedText() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.runtime.sendMessage({ text: selectedText });
  }
}
