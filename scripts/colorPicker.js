document.addEventListener("DOMContentLoaded", function () {
    const colorPicker = new iro.ColorPicker("#colorWheelContainer", {
        width: 100,
        layout: [
            { component: iro.ui.Wheel, options: {} },
            { component: iro.ui.Slider, options: { sliderType: 'value', layoutDirection: 'vertical'} },
        ],
        layoutDirection: "horizontal",
    });

    let sentenceHex = "#FFFFFF"; 
    let activeHex = "#FFFFFF"; 

    const sentenceHexDisplay = document.getElementById("selectedSentenceColorHex");
    const activeHexDisplay = document.getElementById("selectedActiveColorHex");

    chrome.storage.local.get(['sentenceColor', 'activeColor'], function(result) {
    
    if (result.sentenceColor) {
        if (sentenceHexDisplay) {
            sentenceHexDisplay.textContent = sentenceHex;
            sentenceHexDisplay.style.backgroundColor = sentenceHex;
        }
    }
    if (result.activeColor) {
        if (activeHexDisplay) {
            activeHexDisplay.textContent = activeHex;
            activeHexDisplay.style.backgroundColor = activeHex;
        }
    }
    colorPicker.color.hexString = sentenceHex;
    });


    colorPicker.on('color:change', function (color) {
        sentenceHex = color.hexString; 
        activeHex = color.hexString; 
    });

    const editSentenceColorBtn = document.getElementById("editSentenceColorBtn");
    if (editSentenceColorBtn) {
        editSentenceColorBtn.addEventListener("click", function () {
            sentenceHex = colorPicker.color.hexString;
            if (sentenceHexDisplay) {
                sentenceHexDisplay.textContent = sentenceHex; 
                sentenceHexDisplay.style.backgroundColor = sentenceHex; 
            }
            //Store the color to chrome storage
            chrome.storage.local.set({ 'sentenceColor': sentenceHex }, function() {
                console.log('Sentence color saved:', sentenceHex);
            });
        });
    }

    const editActiveColorBtn = document.getElementById("editActiveColorBtn");
    if (editActiveColorBtn) {
        editActiveColorBtn.addEventListener("click", function () {
            activeHex = colorPicker.color.hexString;

            if (activeHexDisplay) {
                activeHexDisplay.textContent = activeHex; 
                activeHexDisplay.style.backgroundColor = activeHex; 
            }
            //Store the color to chrome storage
            chrome.storage.local.set({ 'activeColor': activeHex  }, function() {
                console.log('Active color saved:', activeHex);
            });
        });
    }
});
