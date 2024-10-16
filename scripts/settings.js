// DOMContentLoaded ensures the page loads before we implement the javascript
document.addEventListener("DOMContentLoaded", function () {
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
    chrome.storage.local.set({ voice: selectedVoice });
  });
});
