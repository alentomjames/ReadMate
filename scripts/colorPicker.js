document.addEventListener("DOMContentLoaded", function() {
    let colorPicker = new iro.ColorPicker("#colorWheelContainer", {
        width: 100,
        color: "#f00",
        borderWidth: 2,
        borderColor: "#fff"
    });

    colorPicker.on("color:change", function(color) {
        document.getElementById("selectedColor").style.backgroundColor = color.hexString;
        document.getElementById("selectedColor").textContent = color.hexString;
    });
});