const width = 620
const height = 480
const startTime = new Date(2023,1,1);
const endTime = new Date(2024,1,1);
const colors = [
    // r,  g,  b,  a
    [  0,  0,  0,255], // black
    [255,255,255,255], // white
    [255,  0,  0,255], // red
    [  0,255,  0,255], // green
    [  0,  0,255,255], // blue
  ];

function percentElapsed() {
    var totalTime = endTime - startTime;
    var currentTime = new Date() - startTime;
    var percentage = (currentTime / totalTime);
    return percentage;
  }
function getClosestColor(rgba){
    return colors.sort(color => {
        const r = color[0] - rgba[0];
        const g = color[1] - rgba[1];
        const b = color[2] - rgba[2];
        const a = color[3] - rgba[3];
        return Math.sqrt(r^2 + g^2 + b^2 + a^2);
    })[0];
}

document.addEventListener("DOMContentLoaded", function () {
    const generatedImage = document.getElementById("generated-image");
    const imageInput = document.getElementById("image-input");

    document.getElementById("timeSpanText").textContent = `This covers ${startTime.toDateString()} to ${endTime.toDateString()}`;

    document.getElementById("searchSpaceText").textContent = `This image is ${width}x${height} with ${colors.length} colors. This means there are ${formatToScientificNotation(power(colors.length, width*height).toString(), 5)} possible images that the Canvas will show at some point during its run time.`;

    // Generate and update the existing image at a set interval
    generatedImage.src = "data:image/png;base64," + generateImage(percentElapsed());
    console.log(`2^(255*255) = ${power(2,255*255)}`);
    let lastFrame = new Date();
    setInterval(() => {
        var percent = percentElapsed();
        generatedImage.src = "data:image/png;base64," + generateImage(percent);

        const thisFrame = new Date();
        const msSinceLastFrame = thisFrame - lastFrame;
        const fps = 1000/msSinceLastFrame;

        document.getElementById("fpsLabel").textContent = `${fps.toFixed(0)} fps`;
        console.log(`Calculated image from completion ${percent} in ${msSinceLastFrame} ms (${fps.toFixed(0)} fps)`);
        lastFrame = thisFrame;
    }, 1000/30);

    // Handle image upload
    imageInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("userImage").src = e.target.result;
                generateTextFromImage(file);
            };
            reader.readAsDataURL(file);
        }
    });
});

function power(base, exponent) {
    if (exponent === 0n) return 1n;
    bigExp = BigInt(exponent)

    let result = 1n;
    let baseBigInt = BigInt(base);

    while (bigExp > 0n) {
        if (bigExp % 2n === 1n)
        result *= baseBigInt;

        baseBigInt *= baseBigInt;
        bigExp /= 2n;
    }

    return result;
}
function formatToScientificNotation(numberStr, significantDigits = 2) {
    let exponent = 0;
    let coefficient = numberStr;

    // Handle negative numbers
    if (coefficient[0] === '-') {
        coefficient = coefficient.slice(1);
    }

    // Remove leading zeros
    coefficient = coefficient.replace(/^0+/, '');

    // Find the exponent and adjust coefficient
    const dotIndex = coefficient.indexOf('.');
    if (dotIndex !== -1) {
        exponent = dotIndex - 1;
        coefficient = coefficient.replace('.', '');
    } else {
        exponent = coefficient.length - 1;
    }

    // Ensure the coefficient is not longer than significantDigits
    if (coefficient.length > significantDigits) {
        coefficient = coefficient.slice(0, significantDigits);
    }

    // Format the result
    if (coefficient.length > 1) {
        coefficient = coefficient[0] + '.' + coefficient.slice(1);
    }

    const formattedNumber = coefficient + 'e' + exponent;
    return formattedNumber;
}

function generateImage(progress) {
    // Example: Generating a simple image with a base64-encoded PNG
    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if(progress < 0 || progress > 1){
        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    else{
        const imageData = context.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        for(let y = 0; y < canvas.height; y++) {
            for(let x = 0; x < canvas.width; x++) {
                progress *= colors.length;
                var colorIndex = Math.floor(progress);
                progress -= colorIndex;
                var i = (y * canvas.width) + x;
                let color = colors[colorIndex];
                data[i*4 + 0] = color[0];
                data[i*4 + 1] = color[1];
                data[i*4 + 2] = color[2];
                data[i*4 + 3] = color[3];
            }
        }
        context.putImageData(imageData, 0, 0);
    }
    return canvas.toDataURL("image/png").split(",")[1]; // Return the base64-encoded image data
}

function generateTextFromImage(imageFile) {
    // Example: Generate text based on the uploaded image's name
    document.getElementById("userImageLabel").textContent = `You uploaded a file: ${imageFile}`;
}

function setUserImage(imageFile){
    return imageFile;
}
