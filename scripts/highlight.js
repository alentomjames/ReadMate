
let wordSpans = [];
let originalContent = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTTS' && message.text) {
    // Handle the selected text
    wrapSelectedText();
  } else if (message.action === 'highlightWord' && typeof message.wordIndex !== 'undefined') {
    // Highlight the word at index message.wordIndex
    highlightWord(message.wordIndex);
  } else if (message.action === 'resetHighlighting') {
    // Reset the highlighting
    resetHighlighting();
  }
});

function wrapSelectedText() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  // Save original content to restore later
  originalContent = range.cloneContents();

  const selectedText = selection.toString();
  const words = selectedText.match(/\S+/g) || [];

  // Create a document fragment to build the new content
  const fragment = document.createDocumentFragment();
  let wordIndex = 0;

  words.forEach((word, idx) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.dataset.wordIndex = idx;
    span.style.whiteSpace = 'pre'; // Preserve spaces
    fragment.appendChild(span);

    // Add a space if not the last word
    if (idx < words.length - 1) {
      const space = document.createTextNode(' ');
      fragment.appendChild(space);
    }
    wordIndex++;
  });

  // Replace the selected content with the new fragment
  range.deleteContents();
  range.insertNode(fragment);

  // Collapse the selection to avoid interference
  selection.collapseToEnd();

  // Collect the word spans
  wordSpans = document.querySelectorAll('span[data-word-index]');
}

function highlightWord(index) {
  // Remove previous highlighting
  wordSpans.forEach(span => {
    span.style.backgroundColor = '';
  });

  // Highlight the current word
  const currentSpan = document.querySelector(`span[data-word-index='${index}']`);
  if (currentSpan) {
    currentSpan.style.backgroundColor = 'yellow';
    // Scroll into view if necessary
    currentSpan.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function resetHighlighting() {
  if (!originalContent) return;

  const selection = window.getSelection();
  const range = document.createRange();

  // Assume the parent node is the same
  const parent = wordSpans[0].parentNode;

  // Remove the word spans
  wordSpans.forEach(span => {
    span.parentNode.removeChild(span);
  });

  // Insert the original content back
  range.setStart(parent, 0);
  range.collapse(true);
  parent.insertBefore(originalContent, parent.firstChild);

  // Clear variables
  wordSpans = [];
  originalContent = null;
}