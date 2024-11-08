var isPaused = false;

/* This is adding click functionality to the button in the in the extension popup.
  The button can show:
    - A play button if awaiting a click, if TTS is currently paused, or if there is a click, but no text was highlighted.
    - A pause button  if the TTS is currently speaking.
*/
document.getElementById("ttsBtn").addEventListener("click", () => {
  try {
    chrome.tts.isSpeaking((speaking) => {
      if (speaking) {
        try {
          if (isPaused) {
            chrome.tts.resume();
            isPaused = false;
            document.getElementById("ttsBtn").innerHTML =
              '<i class="bi bi-pause-circle-fill" style= "color: #396396;"></i>';
          } else {
            chrome.tts.pause();
            isPaused = true;
            document.getElementById("ttsBtn").innerHTML =
              '<i class="bi bi-play-circle-fill"></i>';
          }
        } catch (error) {
          console.error("Error while pausing/resuming TTS:", error);
          alert(
            "An error occurred while trying to pause or resume the reading."
          );
        }
      } else {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || !tabs[0]) {
              console.error(
                "Error querying active tab:",
                chrome.runtime.lastError
              );
              alert("Failed to access the active tab. Please try again.");
              return;
            }
            try {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tabs[0].id },
                  function: () => window.getSelection().toString(),
                },
                (results) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error executing script:",
                      chrome.runtime.lastError
                    );
                    alert("Failed to extract selected text. Please try again.");
                    return;
                  }

                  const selectedText =
                    results && results[0] && results[0].result;

                  // If the text exists, show the pause button for initial button press. Else show the play button.
                  if (selectedText) {
                    try {
                      chrome.runtime.sendMessage({ text: selectedText });
                      document.getElementById("ttsBtn").innerHTML =
                        '<i class="bi bi-pause-circle-fill"></i>';
                    } catch (error) {
                      console.error("Error sending text to TTS:", error);
                      alert("Failed to send the selected text to TTS.");
                    }
                  } else {
                    alert(
                      "No text selected. Please highlight some text before clicking."
                    );
                    document.getElementById("ttsBtn").innerHTML =
                      '<i class="bi bi-play-circle-fill"></i>';
                  }
                }
              );
            } catch (error) {
              console.error("Error during script execution:", error);
              alert(
                "An error occurred while executing the script to get selected text."
              );
            }
          });
        } catch (error) {
          console.error("Error querying active tab:", error);
          alert("An error occurred while accessing the active tab.");
        }
      }
    });
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    alert("An unexpected error occurred. Please try again.");
  }
});

// The slow button sends a skipSentence request with forward set to false.
document.getElementById("slowBtn").addEventListener("click", () => {
  try {
    chrome.runtime.sendMessage(
      { skipSentence: true, forward: false },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(
            "Failed to reverse skip. Please try again."
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to process the rate change request.");
          alert(
            "n issue occurred while trying to skip the sentence. Please try again."
          );
        } else {
          console.log("Sentence reverse skipped successfully.");
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
  }
});

// The fast button sends a skipSentence request with forward set to true.
document.getElementById("fastBtn").addEventListener("click", () => {
  try {
    chrome.runtime.sendMessage(
      { skipSentence: true, forward: true },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          alert(
            "Failed to skip the current sentence. Please try again."
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to skip the sentence.");
          alert(
            "An issue occurred while trying to skip the sentence. Please try again."
          );
        } else {
          console.log("Sentence skipped successfully.");
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    // alert("An unexpected error occurred. Please try again.");
  }
});

// The stop button sends a stop request to the background script.
document.getElementById("stopBtn").addEventListener("click", () => {
  try {
    chrome.runtime.sendMessage({ stop: true }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Failed to stop reading the script. Please try again.");
        return;
      }

      if (!response || !response.success) {
        console.log(
          "An issue occurred while trying to stop reading the script. Please try again."
        );
      } else {
        console.log("Reading has been successfully stopped.");
        // alert("The reading has stopped and reset successfully.");
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    // alert("An unexpected error occurred. Please try again.");
  }
});

// This opens the settings window.
document.getElementById("settingsBtn").addEventListener("click", () => {
  try {
    chrome.windows.create(
      {
        url: "src/settings.html",
        type: "popup",
        width: 400,
        height: 200,
      },
      (window) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error opening settings window:",
            chrome.runtime.lastError
          );
          alert("Failed to open the settings window. Please try again.");
        } else {
          console.log("Settings window opened successfully:", window);
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error while opening the settings window:", error);
    alert(
      "An unexpected error occurred while opening the settings window. Please try again."
    );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      try {
        // Use the window.close() method to close the popup
        window.close();
      } catch (error) {
        console.error("Error while closing the popup:", error);
        alert("An unexpected error occurred while trying to close the popup.");
      }
    });
  } else {
    console.error("Close button element not found.");
  }
});

// This listens for requests from the background script to reset the button (can be expanded upon later)
chrome.runtime.onMessage.addListener((request) => {
  try {
    if (request.ttsEnded) {
      resetTTSButton();
    }
  } catch (error) {
    console.error("Error handling the message from background script:", error);
  }
});

// This function gets the highlighted text and sends it to the background service worker.
function getHighlightedText() {
  try {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({ text: selectedText }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending highlighted text:",
            chrome.runtime.lastError
          );
          alert("Failed to send the highlighted text. Please try again.");
          return;
        }

        if (!response || !response.success) {
          console.error(
            "Background script failed to process the highlighted text."
          );
          alert(
            "An issue occurred while processing the highlighted text. Please try again."
          );
        } else {
          console.log("Highlighted text sent successfully.");
        }
      });
    } else {
      alert("No text selected. Please highlight text before sending.");
    }
  } catch (error) {
    console.error("Unexpected error while getting highlighted text:", error);
    alert(
      "An unexpected error occurred while processing the selected text. Please try again."
    );
  }
}

// This function resets the primary TTS Button text to "Read Aloud"
function resetTTSButton() {
  try {
    const ttsBtn = document.getElementById("ttsBtn");
    if (ttsBtn) {
      ttsBtn.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
      isPaused = false;
      console.log("TTS button reset to 'Read Aloud'.");
    } else {
      console.error("TTS button element not found.");
      alert("Unable to reset the TTS button. Please refresh the page.");
    }
  } catch (error) {
    console.error("Unexpected error while resetting the TTS button:", error);
    alert(
      "An unexpected error occurred while resetting the TTS button. Please try again."
    );
  }
}


document.getElementById("magnifyBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.runtime.sendMessage({ action: "activateMagnifier", tabId: tabId }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        console.error("Failed to activate magnifier:", chrome.runtime.lastError);
        alert("Failed to activate magnifier. Please try again.");
      } else {
        console.log("Magnifier activated successfully.");
      }
    });
  });
});