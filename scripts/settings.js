// DOMContentLoaded ensures the page loads before we implement the javascript
document.addEventListener("DOMContentLoaded", function () {
  const rateSlider = document.getElementById("rate");
  const rateValue = document.getElementById("rateValue");

  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");

  // Load saved rate from chrome.storage to display the user's currently saved rate.
  chrome.storage.local.get("rate", function (result) {
    const savedRate = result.rate || 1.0; // Default rate is 1.0 if nothing is saved
    rateSlider.value = savedRate;
    rateValue.textContent = savedRate;
  });

  // Load saved volume from chrome.storage to display the user's currently saved volume.
  chrome.storage.local.get("volume", function (result) {
    const savedVolume = result.volume || 1.0; // Default volume is 1.0 if nothing is saved
    volumeSlider.value = savedVolume;
    volumeValue.textContent = savedVolume;
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
});
