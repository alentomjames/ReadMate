document.addEventListener("DOMContentLoaded", function () {
  // DOM elements for rate, volume, and voice
  const rateSlider = document.getElementById("rate");
  const rateValue = document.getElementById("rateValue");
  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");
  const voiceSelect = document.getElementById("voiceSelect");

  // DOM elements for sentence and active highlight colors
  const sentenceColorSpan = document.getElementById("selectedSentenceColorHex");
  const activeColorSpan = document.getElementById("selectedActiveColorHex");
  const editSentenceColorBtn = document.getElementById("editSentenceColorBtn");
  const editActiveColorBtn = document.getElementById("editActiveColorBtn");

  // Apply the stored theme mode
  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme = result.theme || "light";
    document.body.classList.add(`${savedTheme}-mode`);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.theme && namespace === "local") {
      const newTheme = changes.theme.newValue;
      document.body.classList.remove("light-mode", "dark-mode");
      document.body.classList.add(`${newTheme}-mode`);
    }
  });

  // Load saved values for sliders and voice
  chrome.storage.local.get(["rate", "volume", "voice"], function (result) {
    const savedRate = result.rate || 1.0;
    const savedVolume = result.volume || 1.0;
    const savedVoice = result.voice || "";

    rateSlider.value = savedRate;
    rateValue.textContent = savedRate;
    volumeSlider.value = savedVolume;
    volumeValue.textContent = savedVolume;
    voiceSelect.value = savedVoice;
  });

  // Populate the voice dropdown
  chrome.tts.getVoices(function (voices) {
    voices.forEach(function (voice) {
      const option = document.createElement("option");
      option.value = voice.voiceName;
      option.textContent = `${voice.voiceName} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
  });

  // Update displayed rate when slider changes
  rateSlider.addEventListener("input", function () {
    rateValue.textContent = rateSlider.value;
  });

  // Update displayed volume when slider changes
  volumeSlider.addEventListener("input", function () {
    volumeValue.textContent = volumeSlider.value;
  });

  // Save rate and volume to storage when sliders are changed
  rateSlider.addEventListener("change", function () {
    chrome.storage.local.set({ rate: parseFloat(rateSlider.value) });
  });

  volumeSlider.addEventListener("change", function () {
    chrome.storage.local.set({ volume: parseFloat(volumeSlider.value) });
  });

  // Save the selected voice
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

  // Load saved highlight colors and apply to the background of the spans
  chrome.storage.local.get(
    ["sentenceHighlightColor", "activeHighlightColor"],
    (result) => {
      const savedSentenceColor = result.sentenceHighlightColor || "#FFFFFF";
      const savedActiveColor = result.activeHighlightColor || "#FFFFFF";

      // Update span text and background colors
      sentenceColorSpan.textContent = savedSentenceColor;
      sentenceColorSpan.style.backgroundColor = savedSentenceColor;

      activeColorSpan.textContent = savedActiveColor;
      activeColorSpan.style.backgroundColor = savedActiveColor;
    }
  );

  // Save and update the background color for Sentence Highlight
  editSentenceColorBtn.addEventListener("click", () => {
    const currentColor = sentenceColorSpan.textContent;
    chrome.storage.local.set({ sentenceHighlightColor: currentColor }, () => {
      console.log(`Sentence highlight color saved: ${currentColor}`);
    });
    sentenceColorSpan.style.backgroundColor = currentColor;
  });

  // Save and update the background color for Active Highlight
  editActiveColorBtn.addEventListener("click", () => {
    const currentColor = activeColorSpan.textContent;
    chrome.storage.local.set({ activeHighlightColor: currentColor }, () => {
      console.log(`Active highlight color saved: ${currentColor}`);
    });
    activeColorSpan.style.backgroundColor = currentColor;
  });
});
