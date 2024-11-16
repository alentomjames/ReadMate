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

    if (sentenceHexDisplay) {
        sentenceHexDisplay.textContent = sentenceHex;
        sentenceHexDisplay.style.backgroundColor = sentenceHex;
    }

    if (activeHexDisplay) {
        activeHexDisplay.textContent = activeHex;
        activeHexDisplay.style.backgroundColor = activeHex;
    }

    colorPicker.on('color:change', function (color) {
        sentenceHex = color.hexString; 
        activeHex = color.hexString; 
    });

    const editSentenceColorBtn = document.getElementById("editSentenceColorBtn");
    if (editSentenceColorBtn) {
        editSentenceColorBtn.addEventListener("click", function () {
            if (sentenceHexDisplay) {
                sentenceHexDisplay.textContent = sentenceHex; 
                sentenceHexDisplay.style.backgroundColor = sentenceHex; 
            }
        });
    }

    const editActiveColorBtn = document.getElementById("editActiveColorBtn");
    if (editActiveColorBtn) {
        editActiveColorBtn.addEventListener("click", function () {
            if (activeHexDisplay) {
                activeHexDisplay.textContent = activeHex; 
                activeHexDisplay.style.backgroundColor = activeHex; 
            }
        });
    }
});
