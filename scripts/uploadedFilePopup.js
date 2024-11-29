document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("uploadedTextContainer");
  // const closeBtn = document.getElementById("closeBtn");

  // Apply the stored theme mode
  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme = result.theme || "light";
    document.body.classList.add(`${savedTheme}-mode`);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.theme && namespace === "local") {
      const newTheme = changes.theme.newValue;
      document.body.classList.remove("light-mode", "dark-mode");
      document.body.classList.add(`${newTheme}-mode`);
    }
  });

  // Load the initial file content from storage
  chrome.storage.local.get("uploadedFileContent", (result) => {
    if (result.uploadedFileContent) {
      container.innerHTML = formatText(result.uploadedFileContent);
    } else {
      container.innerHTML = "No content available.";
    }
  });

  // Close the popup when clicking the close button
  // closeBtn.addEventListener("click", () => {
  //   window.close();
  // });

  // Listen for dynamic updates to highlight sentences or words
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "highlightChunk") {
      highlightSentence(request.chunk);
    } else if (request.action === "highlightWord") {
      highlightWord(request.charIndex, request.length);
    } else if (request.ttsEnded) {
      removeHighlights();
    }
  });

  // Helper function to format text as HTML
  function formatText(text) {
    return text
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  // Function to highlight a sentence
  function highlightSentence(chunk) {
    removeHighlights();
    const regex = new RegExp(chunk, "gi");
    container.innerHTML = container.innerHTML.replace(
      regex,
      (match) => `<span class="readmate-chunk-highlight">${match}</span>`
    );
  }

  // Function to highlight a word in a sentence
  function highlightWord(charIndex, length) {
    const highlightedSentence = document.querySelector(
      ".readmate-chunk-highlight"
    );
    if (highlightedSentence) {
      const text = highlightedSentence.textContent;

      // Remove any previous word highlights
      const wordHighlight = highlightedSentence.querySelector(
        ".readmate-word-highlight"
      );
      if (wordHighlight) {
        wordHighlight.outerHTML = wordHighlight.innerHTML; // Remove the word highlight
      }

      // Highlight the new word
      const word = text.slice(charIndex, charIndex + length);
      highlightedSentence.innerHTML = text.replace(
        word,
        `<span class="readmate-word-highlight">${word}</span>`
      );
    }
  }

  // Function to remove highlights
  function removeHighlights() {
    // Remove all word highlights
    document.querySelectorAll(".readmate-word-highlight").forEach((el) => {
      el.outerHTML = el.innerHTML; // Remove the word highlight
    });

    // Remove all sentence highlights
    document.querySelectorAll(".readmate-chunk-highlight").forEach((el) => {
      el.outerHTML = el.innerHTML; // Remove the sentence highlight
    });
  }
}); // Closing for DOMContentLoaded event listener

let sentenceColor = "#FFFF00"; // Default sentence color (yellow)
let activeWordColor = "#FF0000"; // Default active word color (red)
let styleElement = null;

// Function to convert hex color to rgba with a given alpha
function hexToRGBA(hex, alpha) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Function to update styles dynamically
function updateStyles() {
  if (styleElement) {
    styleElement.remove();
  }

  const sentenceColorRGBA = hexToRGBA(sentenceColor, 0.5); // 50% opacity
  const activeWordColorRGBA = hexToRGBA(activeWordColor, 0.5); // 50% opacity

  styleElement = document.createElement("style");
  styleElement.textContent = `
    .readmate-chunk-highlight {
      background-color: ${sentenceColorRGBA} !important;
      display: inline !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      text-decoration: none !important;
      position: relative !important;
      z-index: 9999 !important;
    }
    .readmate-word-highlight {
      background-color: ${activeWordColorRGBA} !important;
    }
  `;
  document.head.appendChild(styleElement);
}

// Load initial colors from storage and update styles
chrome.storage.local.get(["sentenceColor", "activeWordColor"], (result) => {
  if (result.sentenceColor) sentenceColor = result.sentenceColor;
  if (result.activeWordColor) activeWordColor = result.activeWordColor;
  updateStyles();
});

// Listen for changes to storage and update colors dynamically
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    let needsUpdate = false;
    if (changes.sentenceColor) {
      sentenceColor = changes.sentenceColor.newValue;
      needsUpdate = true;
    }
    if (changes.activeWordColor) {
      activeWordColor = changes.activeWordColor.newValue;
      needsUpdate = true;
    }
    if (needsUpdate) {
      updateStyles();
    }
  }
});
