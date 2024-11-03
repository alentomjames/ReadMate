const sentenceColorPicker = new iro.ColorPicker("#sentenceColorWheelContainer", {
    width: 100,
    layout: [
        {
            component: iro.ui.Wheel,
            options: {},
        },
        {
            component: iro.ui.Slider,
            options: {
                id: 'sentenceBrightness',
                sliderType: 'value',
                orientation: 'vertical'
            }
        },
    ]
});

sentenceColorPicker.on('color:change', function(color) {
    const hexColor = color.hexString;
    console.log("Selected Sentence Color (Hex):", hexColor);
    const sentenceHexDisplay = document.getElementById("selectedSentenceColorHex");
    sentenceHexDisplay.textContent = hexColor;
    sentenceHexDisplay.style.backgroundColor = hexColor; 
});

const activeColorPicker = new iro.ColorPicker("#activeColorWheelContainer", {
    width: 100,
    layout: [
        {
            component: iro.ui.Wheel,
            options: {},
        },
        {
            component: iro.ui.Slider,
            options: {
                id: 'activeBrightness',
                sliderType: 'value',
                orientation: 'vertical'
            }
        },
    ]
});

activeColorPicker.on('color:change', function(color) {
    const hexColor = color.hexString;
    console.log("Selected Active Color (Hex):", hexColor);
    const activeHexDisplay = document.getElementById("selectedActiveColorHex");
    activeHexDisplay.textContent = hexColor;
    activeHexDisplay.style.backgroundColor = hexColor; 
});
