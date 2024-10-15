// DOMContentLoaded ensures the page loads before we implement the javascript
document.addEventListener("DOMContentLoaded", function () {
  const rateSlider = document.getElementById("rate");
  const rateValue = document.getElementById("rateValue");

  // Load saved rate from chrome.storage to display the user's currently saved rate.
  chrome.storage.local.get("rate", function (result) {
    const savedRate = result.rate || 1.0; // Default rate is 1.0 if nothing is saved
    rateSlider.value = savedRate;
    rateValue.textContent = savedRate;
  });

  // Update the displayed value when the slider changes.
  rateSlider.addEventListener("input", function () {
    rateValue.textContent = rateSlider.value;
  });

  // Save rate to chrome.storage when user changes slider.
  rateSlider.addEventListener("change", function () {
    chrome.storage.local.set({ rate: parseFloat(rateSlider.value) });
  });
});
