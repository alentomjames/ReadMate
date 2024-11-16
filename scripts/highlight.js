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
            css: { backgroundColor: "rgba(200, 200, 0, 0.3)" },
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
      $(activeWordElement).css("background-color", "rgba(255, 255, 0, 0.3)");
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
            css: { backgroundColor: "rgba(255, 0, 0, 0.6)" },
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
            background-color: rgba(255, 255, 0, 0.3) !important;
            display: inline !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            text-decoration: none !important;
            position: relative !important;
            z-index: 9999 !important;
        }
        .readmate-word-highlight {
            background-color: rgba(255, 0, 0, 0.6);
        }
      `
    )
    .appendTo("head");

  // Message listener to handle highlighting based on chunk and word events
  chrome.runtime.onMessage.addListener((request, sendResponse) => {
    if (request.action === "highlightChunk") {
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
