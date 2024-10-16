(function() {
    // Adding highlight styles for highlighted text
    var style = document.createElement('style');
    style.innerHTML = '.readmate-highlight { background-color: yellow; }';
    document.head.appendChild(style);
})();

var lastHighlightedNode = null;

function highlightSentence(sentence) {
    resetHighlights(); // Reset any previous highlights

    // Create a NodeIterator to find the text node containing the sentence
    const bodyText = document.body;
    const iterator = document.createNodeIterator(bodyText, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            return node.textContent.includes(sentence) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    let currentNode;
    while (currentNode = iterator.nextNode()) {
        const startIndex = currentNode.textContent.indexOf(sentence);
        if (startIndex !== -1) {
            const range = document.createRange();
            range.setStart(currentNode, startIndex);
            range.setEnd(currentNode, startIndex + sentence.length);

            const highlightElement = document.createElement('span');
            highlightElement.className = 'readmate-highlight';
            highlightElement.style.backgroundColor = 'yellow';
            range.surroundContents(highlightElement);

            // Store the last highlighted node
            lastHighlightedNode = currentNode;
            break; // Stop after finding the first match
        }
    }
}

function resetHighlights() {
    if (lastHighlightedNode) {
        const highlightedSpans = document.querySelectorAll('.readmate-highlight');
        highlightedSpans.forEach((span) => {
            // Remove the highlighting by unwrapping the text
            const parent = span.parentNode;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize(); // Merge adjacent text nodes if necessary
        });
        lastHighlightedNode = null;
    }
}

// Listening for messages from the background script to activate the highlight
chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === "highlight" && request.sentence) {
        highlightSentence(request.sentence);
    }
    if (request.action === "resetHighlights") {
        resetHighlights();
    }
});
