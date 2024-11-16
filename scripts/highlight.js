// First, ensure jQuery is properly loaded
if (typeof jQuery === "undefined") {
  console.error("jQuery not loaded! Highlighting will not work.");
} else {
  console.log("jQuery loaded successfully!");
}

var currentChunk;

$(document).ready(function () {
  console.log("Document ready, initializing highlighting...");

  let highlightedElements = [];
  let originalElements = [];
  let activeWordElement = null; // Track the currently highlighted word
  let originalChunkText = "";

  let ttsInProgress = false;
  let pendingColorUpdates = {};

  // Variables to hold the highlight colors
  let sentenceColor = "rgba(255, 255, 0, 0.3)"; // default color
  let activeWordColor = "rgba(255, 0, 0, 0.6)"; // default color

  // Load colors from chrome.storage.local
  chrome.storage.local.get(['sentenceColor', 'activeColor'], function(result) {
    if (result.sentenceColor) {
      sentenceColor = result.sentenceColor;
    }
    if (result.activeColor) {
      activeWordColor = result.activeColor;
    }
    console.log('Loaded colors:', sentenceColor, activeWordColor);
  });

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName === 'local') {
    if (ttsInProgress) {
      console.log('TTS in progress, deferring color updates until TTS ends.');
      if (changes.sentenceColor) {
        pendingColorUpdates.sentenceColor = changes.sentenceColor.newValue;
      }
      if (changes.activeColor) {
        pendingColorUpdates.activeColor = changes.activeColor.newValue;
      }
    } else {
      if (changes.sentenceColor) {
        sentenceColor = changes.sentenceColor.newValue;
        console.log('Updated sentence color to:', sentenceColor);
        // Update existing highlights
        $(".readmate-chunk-highlight").css("background-color", sentenceColor);
      }
      if (changes.activeColor) {
        activeWordColor = changes.activeColor.newValue;
        console.log('Updated active word color to:', activeWordColor);
        // Update existing active word highlight
        $(".readmate-word-highlight").css("background-color", activeWordColor);
      }
    }
  }
});

// Function to apply pending color updates after TTS ends
function applyPendingColorUpdates() {
  if (pendingColorUpdates.sentenceColor) {
    sentenceColor = pendingColorUpdates.sentenceColor;
    console.log('Applying pending sentence color:', sentenceColor);
    $(".readmate-chunk-highlight").css("background-color", sentenceColor);
  }
  if (pendingColorUpdates.activeColor) {
    activeWordColor = pendingColorUpdates.activeColor;
    console.log('Applying pending active word color:', activeWordColor);
    $(".readmate-word-highlight").css("background-color", activeWordColor);
  }
  pendingColorUpdates = {};
}

  // Function to highlight the whole chunk (e.g., sentence or phrase)
  function highlightChunk() {
    console.log("Attempting to highlight chunk:", currentChunk);
    removeHighlights();

    if (!currentChunk) return;

    const normalizedChunk = currentChunk.trim();
    $("body")
      .find(":not(script,style)")
      .contents()
      .filter(function () {
        return (
          this.nodeType === 3 &&
          $(this).parent().is(":visible") &&
          this.textContent.toLowerCase().includes(normalizedChunk.toLowerCase())
        );
      })
      .each(function () {
        const node = $(this);
        const parent = node.parent();
        const text = node.text();
        const index = text.toLowerCase().indexOf(normalizedChunk.toLowerCase());

        if (index >= 0) {
          originalElements.push({
            node: this,
            parent: parent[0],
            content: text,
          });

          const before = text.substring(0, index);
          const match = text.substring(index, index + normalizedChunk.length);
          const after = text.substring(index + normalizedChunk.length);

          originalChunkText = match;

          const highlightElement = $("<span>", {
            class: "readmate-chunk-highlight",
            text: match,
            css: { backgroundColor: sentenceColor },
          });

          const replacement = $("<span>").append(
            document.createTextNode(before),
            highlightElement,
            document.createTextNode(after)
          );

          node.replaceWith(replacement);
          highlightedElements.push(replacement[0]);

          highlightElement[0].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
  }

  function highlightWordInChunk(charIndex, length) {
    if (charIndex == null || length == null || charIndex < 0 || length <= 0)
      return;

    // Reset chunk to the original text before highlighting the new word
    $(".readmate-chunk-highlight").text(originalChunkText);

    if (activeWordElement) {
      $(activeWordElement).css("background-color", sentenceColor);
    }

    $(".readmate-chunk-highlight")
      .contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .each(function () {
        const node = $(this);
        const text = node.text();

        if (charIndex < text.length) {
          const before = text.substring(0, charIndex);
          const match = text.substring(charIndex, charIndex + length);
          const after = text.substring(charIndex + length);

          const wordHighlightElement = $("<span>", {
            class: "readmate-word-highlight",
            text: match,
            css: { backgroundColor: activeWordColor },
          });

          const replacement = $("<span>").append(
            document.createTextNode(before),
            wordHighlightElement,
            document.createTextNode(after)
          );

          node.replaceWith(replacement);
          activeWordElement = wordHighlightElement[0];
          return false; // Stop after the first match
        }
      });
  }

  function removeHighlights() {
    originalElements.forEach(({ node, parent, content }) => {
      if (parent && parent.isConnected) {
        $(parent)
          .find(".readmate-chunk-highlight, .readmate-word-highlight")
          .parent()
          .each(function () {
            $(this).replaceWith(document.createTextNode(content));
          });
        parent.normalize();
      }
    });
    highlightedElements = [];
    originalElements = [];
    activeWordElement = null;
  }

  $("<style>")
    .text(
      `
        .readmate-chunk-highlight {
            display: inline !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            text-decoration: none !important;
            position: relative !important;
            z-index: 9999 !important;
        }
        .readmate-word-highlight {
        }
      `
    )
    .appendTo("head");

  // Message listener to handle highlighting based on chunk and word events
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ttsStatus") {
      if (request.status === "started") {
        ttsInProgress = true;
      } else if (request.status === "ended") {
        ttsInProgress = false;
        applyPendingColorUpdates();
      }
      sendResponse({ success: true });
    } else if (request.action === "highlightChunk") {
      currentChunk = request.chunk;
      highlightChunk();
      sendResponse({ success: true });
    } else if (request.action === "highlightWord") {
      highlightWordInChunk(request.charIndex, request.length);
    } else if (request.action === "removeHighlights") {
      removeHighlights();
      sendResponse({ success: true });
    }
    return true;
  });
});
