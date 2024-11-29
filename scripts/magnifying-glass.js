// magnifying-glass.js

(function() {
    // Remove existing magnifier if present
    const existingMagnifier = document.getElementById('_magnifier_window');
    if (existingMagnifier) {
      existingMagnifier.remove();
      return;
    }
  
    // Create the magnifier window
    const magnifierWindow = document.createElement('div');
    magnifierWindow.id = '_magnifier_window';
    Object.assign(magnifierWindow.style, {
      position: 'fixed',
      top: '100px',
      left: '100px',
      width: '400px',
      height: '300px',
      border: '2px solid black',
      borderRadius: '10px', // Rounded corners
      overflow: 'hidden',
      zIndex: 2147483647,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    });

    // **Add the warning popup**
    const warningPopup = document.createElement('div');
    warningPopup.id = '_magnifier_warning';
    warningPopup.innerText = 'May not work as intended on some pages.';
    Object.assign(warningPopup.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      padding: '10px 15px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      fontSize: '14px',
      borderRadius: '5px',
      opacity: '1',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 1s ease-in-out',
      zIndex: 2147483647,
      textAlign: 'center',
    });

    // Append the warning popup to the magnifier window
    magnifierWindow.appendChild(warningPopup);

    // **Set timeout to fade out and remove the popup after 5 seconds**
    setTimeout(() => {
      warningPopup.style.opacity = '0';
      setTimeout(() => {
        warningPopup.remove();
      }, 1000); // Wait for the fade-out transition to complete
    }, 3000); // Display for 5 seconds
  
    // Create the header
    const header = document.createElement('div');
    header.id = '_magnifier_header';
    Object.assign(header.style, {
      backgroundColor: '#396396',
      color: 'white',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'move',
      userSelect: 'none',
    });
  
    // Title
    const title = document.createElement('div');
    title.innerText = 'Magnifier (Click to drag)';
    Object.assign(title.style, {
      marginLeft: '10px',
      fontSize: '16px',
    });
  
    // Controls container
    const controls = document.createElement('div');
    Object.assign(controls.style, {
      display: 'flex',
      alignItems: 'center',
    });
  
    // Zoom out button
    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerText = '–';
    Object.assign(zoomOutButton.style, {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      marginLeft: '5px',
    });
  
    // Zoom in button
    const zoomInButton = document.createElement('button');
    zoomInButton.innerText = '+';
    Object.assign(zoomInButton.style, {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      marginLeft: '5px',
    });
  
    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerText = '×';
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      marginLeft: '5px',
      marginRight: '5px',
    });
  
    // Append controls
    controls.appendChild(zoomOutButton);
    controls.appendChild(zoomInButton);
    controls.appendChild(closeButton);
  
    // Append title and controls to header
    header.appendChild(title);
    header.appendChild(controls);
  
    // Append header to magnifier window
    magnifierWindow.appendChild(header);
  
    // Create the content area
    const contentArea = document.createElement('div');
    contentArea.id = '_magnifier_content';
    Object.assign(contentArea.style, {
      flex: '1',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'grab', // Indicate panning is available
    });
  
    // Append content area to magnifier window
    magnifierWindow.appendChild(contentArea);
  
    // Append magnifier window to body
    document.body.appendChild(magnifierWindow);
  
    // Variables for dragging the window
    let isDragging = false;
    let dragStartX, dragStartY, dragStartLeft, dragStartTop;
  
    // Variables for resizing
    let isResizing = false;
    let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;
  
    // Variables for panning
    let isPanning = false;
    let panStartX, panStartY;
    let panOffsetX = 0;
    let panOffsetY = 0;
  
    // Variables for zooming
    let zoomLevel = 2;
  
    // Create the magnified content
    const magnifiedContent = document.createElement('div');
    magnifiedContent.id = '_magnified_content';
    Object.assign(magnifiedContent.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${document.documentElement.scrollWidth}px`,
      height: `${document.documentElement.scrollHeight}px`,
      transformOrigin: 'top left',
      transform: `scale(${zoomLevel})`,
      background: 'transparent',
      cursor: 'grab', // Indicate panning is available
    });
  
    // Clone the page content
    const pageClone = document.documentElement.cloneNode(true);
  
    // Remove the magnifier from the cloned content to prevent recursion
    const magnifierInClone = pageClone.querySelector('#_magnifier_window');
    if (magnifierInClone) {
      magnifierInClone.remove();
    }

    // Remove elements with the active word highlight class
    const activeWordHighlights = pageClone.querySelectorAll('.readmate-word-highlight');
    activeWordHighlights.forEach((element) => {
        element.classList.remove('readmate-word-highlight'); // Remove the class
        // Optionally, restore the original text style
        element.style.backgroundColor = 'transparent';
    });
  
    // Remove scripts to prevent execution
    pageClone.querySelectorAll('script').forEach((script) => script.remove());
  
     // **Sanitize the cloned content using DOMPurify**
    const sanitizedContent = DOMPurify.sanitize(pageClone.outerHTML, { RETURN_DOM: true });

    // Append cloned content to magnified content
    magnifiedContent.appendChild(sanitizedContent);
  
    // Append magnified content to content area
    contentArea.appendChild(magnifiedContent);
  
    // Update the position of the magnified content
    function updateMagnifiedContentPosition() {
      const rect = magnifierWindow.getBoundingClientRect();
      const offsetX = rect.left + window.scrollX + panOffsetX;
      const offsetY = rect.top + window.scrollY + header.offsetHeight + panOffsetY;
  
      magnifiedContent.style.transform = `scale(${zoomLevel}) translate(-${offsetX / zoomLevel}px, -${offsetY / zoomLevel}px)`;
    }
  
    updateMagnifiedContentPosition();
  
    // Event listeners for dragging the magnifier window
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = magnifierWindow.getBoundingClientRect();
      dragStartLeft = rect.left;
      dragStartTop = rect.top;
      e.preventDefault();
    });
  
    // Event listeners for resizing
    // Create resize handle
    const resizeHandle = document.createElement('div');
    Object.assign(resizeHandle.style, {
      position: 'absolute',
      width: '15px',
      height: '15px',
      right: '0',
      bottom: '0',
      cursor: 'se-resize',
      backgroundColor: 'rgba(0,0,0,0.5)',
    });
    magnifierWindow.appendChild(resizeHandle);
  
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      const rect = magnifierWindow.getBoundingClientRect();
      resizeStartWidth = rect.width;
      resizeStartHeight = rect.height;
      e.preventDefault();
      e.stopPropagation();
    });
  
    // Event listeners for panning within the content area
    magnifiedContent.addEventListener('mousedown', (e) => {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      magnifiedContent.style.cursor = 'grabbing';
      e.preventDefault();
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        magnifierWindow.style.left = `${dragStartLeft + dx}px`;
        magnifierWindow.style.top = `${dragStartTop + dy}px`;
        updateMagnifiedContentPosition();
      } else if (isResizing) {
        const dx = e.clientX - resizeStartX;
        const dy = e.clientY - resizeStartY;
        magnifierWindow.style.width = `${resizeStartWidth + dx}px`;
        magnifierWindow.style.height = `${resizeStartHeight + dy}px`;
        updateMagnifiedContentPosition();
      } else if (isPanning) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        panOffsetX += -dx * (1 / zoomLevel);
        panOffsetY += -dy * (1 / zoomLevel);
        panStartX = e.clientX;
        panStartY = e.clientY;
        updateMagnifiedContentPosition();
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      if (isPanning) {
        isPanning = false;
        magnifiedContent.style.cursor = 'grab';
      }
    });
  
    // Zoom controls
    zoomInButton.addEventListener('click', () => {
      zoomLevel += 0.5;
      magnifiedContent.style.transform = `scale(${zoomLevel})`;
      updateMagnifiedContentPosition();
    });
  
    zoomOutButton.addEventListener('click', () => {
      zoomLevel = Math.max(1, zoomLevel - 0.5);
      magnifiedContent.style.transform = `scale(${zoomLevel})`;
      updateMagnifiedContentPosition();
    });
  
    // Close button
    closeButton.addEventListener('click', () => {
      magnifierWindow.remove();
      window.removeEventListener('scroll', updateMagnifiedContentPosition);
      window.removeEventListener('resize', updateMagnifiedContentPosition);
    });
  
    // Update magnified content position on scroll and resize
    window.addEventListener('scroll', updateMagnifiedContentPosition);
    window.addEventListener('resize', updateMagnifiedContentPosition);
  })();
  