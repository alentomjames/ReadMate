// DOMContentLoaded ensures the page loads before we implement the javascript
document.addEventListener("DOMContentLoaded", function () {

  // Apply the stored theme mode
  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme = result.theme || "light";
    document.body.classList.add(`${savedTheme}-mode`);
  });


  const rateSlider = document.getElementById("rate");
  const rateValue = document.getElementById("rateValue");

  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");

  // Populate the voice selection dropdown with available voices
  chrome.tts.getVoices(function (voices) {
    voices.forEach(function (voice) {
      const option = document.createElement("option");
      option.value = voice.voiceName;
      option.textContent = `${voice.voiceName} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
  });

  // Load saved user data from chrome.storage to display the user's previous selections.
  chrome.storage.local.get(["rate", "volume", "voice"], function (result) {
    const savedRate = result.rate || 1.0; // Default rate is 1.0 if nothing is saved
    const savedVolume = result.volume || 1.0; // Default volume is 1.0 if nothing is saved
    const savedVoice = result.voice || ""; // Default voice is empty if nothing is saved

    rateSlider.value = savedRate;
    rateValue.textContent = savedRate;
    volumeSlider.value = savedVolume;
    volumeValue.textContent = savedVolume;
    voiceSelect.value = savedVoice;
  });

  // Update the displayed value when the rate slider changes.
  rateSlider.addEventListener("input", function () {
    rateValue.textContent = rateSlider.value;
  });

  // Update the displayed value when the volume slider changes.
  volumeSlider.addEventListener("input", function () {
    volumeValue.textContent = volumeSlider.value;
  });

  // Save rate to chrome.storage when user changes slider.
  rateSlider.addEventListener("change", function () {
    chrome.storage.local.set({ rate: parseFloat(rateSlider.value) });
  });

  // Save volume to chrome.storage when user changes slider.
  volumeSlider.addEventListener("change", function () {
    chrome.storage.local.set({ volume: parseFloat(volumeSlider.value) });
  });

  // Save the selected voice when the user chooses one
  voiceSelect.addEventListener("change", function () {
    const selectedVoice = voiceSelect.value;
    chrome.tts.getVoices((voices) => {
      const voice = voices.find((v) => v.voiceName === selectedVoice);

      if (voice && (!voice.eventTypes || !voice.eventTypes.includes("word"))) {
        // Create warning popup
        const warningPopup = document.createElement("div");
        warningPopup.id = "_voice_warning";
        warningPopup.innerText = `The selected voice "${selectedVoice}" may not show active word highlights.`;
        Object.assign(warningPopup.style, {
          position: "absolute",
          top: "50%",
          left: "50%",
          padding: "10px 15px",
          backgroundColor: "rgba(255,0,0,0.9)",
          color: "white",
          fontSize: "14px",
          borderRadius: "5px",
          opacity: "1",
          transform: "translate(-50%, -50%)",
          transition: "opacity 1s ease-in-out",
          zIndex: 2147483647,
          textAlign: "center",
        });

        document.body.appendChild(warningPopup);

        // Remove the warning popup after a few seconds
        setTimeout(() => {
          warningPopup.style.opacity = "0";
          setTimeout(() => {
            warningPopup.remove();
          }, 1000); // Wait for fade-out
        }, 3000); // Display for 3 seconds
      }

      // Save the voice selection even if it doesn't support word highlighting
      chrome.storage.local.set({ voice: selectedVoice });
    });
  });
});


