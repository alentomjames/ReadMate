function createMagnifier() {
    // Inject the Bootstrap Icons CSS if not already present
    if (!document.querySelector('link[href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css"]')) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'stylesheet';
        iconLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css';
        document.head.appendChild(iconLink);
    }

    const magnifier = document.createElement('div');
    magnifier.id = 'readmate-magnifier';
    magnifier.innerHTML = `
      <div class="magnifier-header">
        <i class="bi bi-search" style="font-size: 1.2em; margin-right: 10px;"></i> <!-- Icon as header -->
        <div class="zoom-controls">
          <button class="zoom-in"><i class="bi bi-plus"></i></button> <!-- Plus icon for zoom-in -->
          <button class="zoom-out"><i class="bi bi-dash"></i></button> <!-- Dash icon for zoom-out -->
        </div>
        <button class="close-magnifier" style="margin-left: auto;"><i class="bi bi-x"></i></button> <!-- Close icon -->
      </div>
      <div class="magnifier-content"></div>
    `;
    
    document.body.appendChild(magnifier);
    
    // Make the magnifier draggable
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    const header = magnifier.querySelector('.magnifier-header');
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      initialX = e.clientX - magnifier.offsetLeft;
      initialY = e.clientY - magnifier.offsetTop;
      
      if (e.target.classList.contains('close-magnifier')) return;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        magnifier.style.left = `${currentX}px`;
        magnifier.style.top = `${currentY}px`;
        updateMagnification();
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Handle magnification
    const content = magnifier.querySelector('.magnifier-content');
    let scale = 2; // Initial scale factor

    function updateMagnification() {
      const rect = magnifier.getBoundingClientRect();
      const x = rect.left;
      const y = rect.top;

      content.style.position = 'absolute';
      content.style.left = `-${x}px`;
      content.style.top = `-${y}px`;
      content.style.width = '100vw';
      content.style.height = '100vh';
      content.style.transform = `scale(${scale})`;
      content.style.transformOrigin = `${x}px ${y}px`;
      content.style.pointerEvents = 'none';

      while (content.firstChild) content.removeChild(content.firstChild);

      const screenshot = document.documentElement.cloneNode(true);
      const magnifierInClone = screenshot.querySelector('#readmate-magnifier');
      if (magnifierInClone) magnifierInClone.remove();
      content.appendChild(screenshot);
    }

    // Zoom In and Zoom Out functionality
    magnifier.querySelector('.zoom-in').addEventListener('click', () => {
      scale += 0.1; // Increase scale
      updateMagnification();
    });

    magnifier.querySelector('.zoom-out').addEventListener('click', () => {
      scale = Math.max(1, scale - 0.1); // Decrease scale but prevent going below 1
      updateMagnification();
    });

    // Close button functionality
    const closeButton = magnifier.querySelector('.close-magnifier');
    closeButton.addEventListener('click', () => {
      magnifier.remove();
    });
    
    // Initial position and magnification
    magnifier.style.left = '50px';
    magnifier.style.top = '50px';
    updateMagnification();

}


  
  // Function to handle the popup button click
  function setupMagnifierButton() {
    const magnifyBtn = document.getElementById('magnifyBtn');
    if (magnifyBtn) {
      magnifyBtn.addEventListener('click', async () => {
        try {
          // Get the current active tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          // Execute the magnifier creation in the tab
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: createMagnifier
          });
          
          // Close the popup after creating the magnifier
          window.close();
        } catch (error) {
          console.error('Error creating magnifier:', error);
        }
      });
    }
  }
  
  // Initialize the button when the popup loads
  document.addEventListener('DOMContentLoaded', setupMagnifierButton);
  