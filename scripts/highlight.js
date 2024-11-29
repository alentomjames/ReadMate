// First, ensure jQuery is properly loaded
if (typeof jQuery === "undefined") {
  console.error("jQuery not loaded! Highlighting will not work.");
} else {
  console.log("jQuery loaded successfully!");
}

// Ensure mark.js is loaded
if (typeof Mark === "undefined") {
  console.error("mark.js not loaded! Highlighting will not work.");
} else {
  console.log("mark.js loaded successfully!");
}

var currentChunk;

$(document).ready(function () {
  console.log("Document ready, initializing highlighting...");

  let highlightedElements = [];
  let activeWordElement = null; // Track the currently highlighted word

  let ttsInProgress = false;
  let pendingColorUpdates = {};

  // Variables to hold the highlight colors
  let sentenceColor = "#FFFF00"; // default color (yellow)
  let activeWordColor = "#FF0000"; // default color (red)

  // Variable to hold the style element
  let styleElement = null;

  // Function to convert hex color to rgba with given alpha
  function hexToRGBA(hex, alpha) {
    // Remove '#' if present
    hex = hex.replace("#", "");

    // Convert 3-digit hex to 6-digit hex
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map(function (hexChar) {
          return hexChar + hexChar;
        })
        .join("");
    }

    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  // Function to update styles
  function updateStyles() {
    if (styleElement) {
      styleElement.remove();
    }

    var sentenceColorRGBA = hexToRGBA(sentenceColor, 0.5); // Adjust alpha to 0.5
    var activeWordColorRGBA = hexToRGBA(activeWordColor, 0.5); // Adjust alpha to 0.5

    styleElement = $("<style>")
      .text(
        `
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
        `
      )
      .appendTo("head");
  }

  // Load colors from chrome.storage.local
  chrome.storage.local.get(["sentenceColor", "activeColor"], function (result) {
    if (result.sentenceColor) {
      sentenceColor = result.sentenceColor;
    }
    if (result.activeColor) {
      activeWordColor = result.activeColor;
    }
    console.log("Loaded colors:", sentenceColor, activeWordColor);

    // After loading colors, update styles
    updateStyles();
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === "local") {
      if (ttsInProgress) {
        console.log("TTS in progress, deferring color updates until TTS ends.");
        if (changes.sentenceColor) {
          pendingColorUpdates.sentenceColor = changes.sentenceColor.newValue;
        }
        if (changes.activeColor) {
          pendingColorUpdates.activeColor = changes.activeColor.newValue;
        }
      } else {
        let colorsChanged = false;
        if (changes.sentenceColor) {
          sentenceColor = changes.sentenceColor.newValue;
          console.log("Updated sentence color to:", sentenceColor);
          colorsChanged = true;
        }
        if (changes.activeColor) {
          activeWordColor = changes.activeColor.newValue;
          console.log("Updated active word color to:", activeWordColor);
          colorsChanged = true;
        }
        if (colorsChanged) {
          // Update the styles in the head
          updateStyles();
        }
      }
    }
  });

  // Function to apply pending color updates after TTS ends
  function applyPendingColorUpdates() {
    if (pendingColorUpdates.sentenceColor) {
      sentenceColor = pendingColorUpdates.sentenceColor;
      console.log("Applying pending sentence color:", sentenceColor);
    }
    if (pendingColorUpdates.activeColor) {
      activeWordColor = pendingColorUpdates.activeColor;
      console.log("Applying pending active word color:", activeWordColor);
    }
    pendingColorUpdates = {};
    updateStyles(); // Update styles after applying pending updates
  }

  // Function to highlight the whole chunk (e.g., sentence or phrase)
  function highlightChunk() {
    console.log("Attempting to highlight chunk:", currentChunk);
    removeHighlights();

    if (!currentChunk) return;

    const normalizedChunk = currentChunk.trim();

    const markInstance = new Mark(document.body);

    markInstance.mark(normalizedChunk, {
      acrossElements: true,
      separateWordSearch: false,
      className: "readmate-chunk-highlight",
      exclude: [".readmate-word-highlight"],
      limit: 1,
      debug: true,
      done: function (totalMatches) {
        highlightedElements = document.querySelectorAll(
          ".readmate-chunk-highlight"
        );
        if (highlightedElements.length > 0) {
          highlightedElements[0].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          console.log("Chunk not found in the document.");
        }
      },
    });
  }

  function highlightWordInChunk(charIndex, length) {
    if (charIndex == null || length == null || charIndex < 0 || length <= 0)
      return;

    // First, remove any existing word highlights within the chunk
    if (activeWordElement) {
      unwrapNode(activeWordElement);
      activeWordElement = null;
    }

    const chunkElement = document.querySelector(".readmate-chunk-highlight");

    if (!chunkElement) return;

    const chunkText = chunkElement.textContent;

    if (charIndex + length > chunkText.length) {
      console.log("Word indices are out of bounds.");
      return;
    }

    let range = document.createRange();
    let startNode, endNode;
    let startOffset, endOffset;
    let charCount = 0;

    // Create a TreeWalker to traverse text nodes
    const treeWalker = document.createTreeWalker(
      chunkElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode;
      const nodeText = node.textContent;
      const nodeLength = nodeText.length;

      if (!startNode && charCount + nodeLength > charIndex) {
        // The start of the word is in this node
        startNode = node;
        startOffset = charIndex - charCount;
      }

      if (startNode && charCount + nodeLength >= charIndex + length) {
        // The end of the word is in this node
        endNode = node;
        endOffset = charIndex + length - charCount;
        break;
      }

      charCount += nodeLength;
    }

    if (!endNode && startNode) {
      // The word ends in this node
      endNode = startNode;
      endOffset = startNode.textContent.length;
    }

    if (startNode && endNode) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      const mark = document.createElement("span");
      mark.className = "readmate-word-highlight";
      range.surroundContents(mark);

      activeWordElement = mark;
    } else {
      console.log("Could not create a range for the word.");
    }
  }

  function unwrapNode(node) {
    if (!node || !node.parentNode) return;

    const parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
    parent.normalize();
  }

  function removeHighlights() {
    // Remove word highlight within the chunk
    if (activeWordElement) {
      unwrapNode(activeWordElement);
      activeWordElement = null;
    }

    // Remove chunk highlights
    highlightedElements.forEach((element) => {
      if (element) {
        unwrapNode(element);
      }
    });
    highlightedElements = [];
  }

  // Initial call to updateStyles to set default styles
  updateStyles();

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
