// First, ensure jQuery is properly loaded
if (typeof jQuery === 'undefined') {
    console.error('jQuery not loaded! Highlighting will not work.');
} else {
    console.log('jQuery loaded successfully!');
}

$(document).ready(function() {
    console.log('Document ready, initializing highlighting...');
    
    let highlightedElements = [];
    let originalElements = [];

    function highlightChunk(chunk) {
        console.log('Attempting to highlight:', chunk);
        
        // Remove previous highlights
        removeHighlights();
        
        if (!chunk) return;
        
        // Normalize the chunk text
        const normalizedChunk = chunk.trim();
        
        try {
            // Use more specific jQuery selector for better performance
            $('body').find(':not(script,style)').contents().filter(function() {
                return this.nodeType === 3 && // Text nodes only
                       $(this).parent().is(':visible') && // Visible elements only
                       this.textContent.toLowerCase().includes(normalizedChunk.toLowerCase()); // Contains our text
            }).each(function() {
                const node = $(this);
                const parent = node.parent();
                const text = node.text();
                const index = text.toLowerCase().indexOf(normalizedChunk.toLowerCase());
                
                if (index >= 0) {
                    console.log('Found matching text in:', parent.prop('tagName'));
                    
                    // Store original for restoration
                    originalElements.push({
                        node: this,
                        parent: parent[0],
                        content: text
                    });
                    
                    // Split text and create highlight
                    const before = text.substring(0, index);
                    const match = text.substring(index, index + normalizedChunk.length);
                    const after = text.substring(index + normalizedChunk.length);
                    
                    const highlightElement = $('<span>', {
                        class: 'readmate-highlight',
                        text: match,
                        css: {
                            backgroundColor: 'rgba(255, 255, 0, 0.3)',
                            transition: 'background-color 0.3s ease',
                            display: 'inline !important',
                            position: 'relative !important'
                        }
                    });
                    
                    // Replace text node with highlighted version
                    const replacement = $('<span>').append(
                        document.createTextNode(before),
                        highlightElement,
                        document.createTextNode(after)
                    );
                    
                    node.replaceWith(replacement);
                    highlightedElements.push(replacement[0]);
                    
                    // Scroll into view
                    try {
                        highlightElement[0].scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    } catch (scrollError) {
                        console.warn('Scroll into view failed:', scrollError);
                    }
                }
            });
        } catch (error) {
            console.error('Error highlighting text:', error);
        }
    }

    function removeHighlights() {
        try {
            console.log('Removing highlights, count:', originalElements.length);
            originalElements.forEach(({node, parent, content}) => {
                if (parent && parent.isConnected) {
                    $(parent).find('.readmate-highlight').parent().each(function() {
                        $(this).replaceWith(document.createTextNode(content));
                    });
                    parent.normalize();
                }
            });
            
            highlightedElements = [];
            originalElements = [];
            
        } catch (error) {
            console.error('Error removing highlights:', error);
        }
    }

    // Add required styles
    $('<style>')
        .text(`
            .readmate-highlight {
                background-color: rgba(255, 255, 0, 0.3) !important;
                display: inline !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                text-decoration: none !important;
                position: relative !important;
                z-index: 9999 !important;
            }
        `)
        .appendTo('head');

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Message received:', request);
        
        if (request.action === 'highlightChunk') {
            highlightChunk(request.chunk);
            sendResponse({ success: true });
        } else if (request.action === 'removeHighlights') {
            removeHighlights();
            sendResponse({ success: true });
        }
        return true;
    });

    console.log('Highlighting initialization complete!');
});