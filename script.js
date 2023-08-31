const width  = 64;
const height = width;
// 5x5 to be able to actually reproduce the entire image based on the time
const startTime = new Date(2023,0,1);
const endTime = new Date(2033,0,1);
const colors = [
    // r,  g,  b,  a
    [  0,  0,  0,255], // black
    // [ 64, 64, 64,255], // grey 1/4
    // [128,128,128,255], // grey 1/2
    // [192,192,192,255], // grey 3/4
    [255,255,255,255], // white
    [255,  0,  0,255], // red
    [  0,255,  0,255], // green
    [  0,  0,255,255], // blue
    // [255,255,  0,255], // yellow
    // [255,  0,255,255], // magenta
    // [  0,255,255,255], // cyan
  ];

function percentElapsed() {
    var totalTime = endTime - startTime;
    var currentTime = new Date() - startTime;
    var percentage = (currentTime / totalTime);
    return percentage;
  }
function getClosestColor(rgba){
    const sortedColors = [...colors];
    sortedColors.sort((colorA, colorB) => {
        const distanceA = Math.sqrt(
            Math.pow(colorA[0] - rgba[0], 2) +
            Math.pow(colorA[1] - rgba[1], 2) +
            Math.pow(colorA[2] - rgba[2], 2) +
            Math.pow(colorA[3] - rgba[3], 2)
        );
        
        const distanceB = Math.sqrt(
            Math.pow(colorB[0] - rgba[0], 2) +
            Math.pow(colorB[1] - rgba[1], 2) +
            Math.pow(colorB[2] - rgba[2], 2) +
            Math.pow(colorB[3] - rgba[3], 2)
        );
        
        return distanceA - distanceB;
    });
    return sortedColors[0];
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("timeSpanText").textContent = `This Canvas is time constrained to display all possible values between ${startTime.toDateString()} and ${endTime.toDateString()}`;

    const totalImages = power(colors.length, width*height);
    const totalSeconds = (endTime-startTime)/1000;
    document.getElementById("searchSpaceText").textContent = `This image is ${width}x${height} with ${colors.length} colors. 
    This means there are ${formatToScientificNotation(totalImages.toString(), 5)} possible images that the Canvas will show at some point during its run time. 
    It will show ${formatToScientificNotation((totalImages/BigInt(totalSeconds)).toString(), 5)} images per second to keep that pace. 
    For reference, there are between 1e78 to 1e82 atoms in the known universe.`;

    // Generate and update the existing image at a set interval
    document.getElementById("generated-image").src = "data:image/png;base64," + generateImage(percentElapsed());
    let lastFrame = new Date();
    setInterval(() => {
        document.getElementById("generated-image").src = "data:image/png;base64," + generateImage(percentElapsed());

        const thisFrame = new Date();
        const msSinceLastFrame = thisFrame - lastFrame;
        const fps = 1000/msSinceLastFrame;

        document.getElementById("fpsLabel").textContent = `${fps.toFixed(2)} fps`;
        lastFrame = thisFrame;
    }, 1000/20); // rate limit because it hurts to look at at full speed

    // Handle image upload
    document.getElementById("image-input").addEventListener("input", function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function(){
                    // hide user content
                    document.getElementById("userContentContainer").setAttribute("hidden","hidden");
                    
                    console.trace("revising image...");
                    const userImageCanvas = document.createElement('canvas');
                    userImageCanvas.width = width;
                    userImageCanvas.height = height;
                    const userImageContext = userImageCanvas.getContext('2d');
                    userImageContext.drawImage(img, 0, 0, width, height);
                    var originalImgData = userImageContext.getImageData(0, 0, userImageCanvas.width, userImageCanvas.height).data;
                    
                    const imageData = userImageContext.createImageData(width, height);
                    const data = imageData.data;

                    for(let i = 0;i<data.length;i+=4){
                        const newColor = getClosestColor([originalImgData[i+0],originalImgData[i+1],originalImgData[i+2],originalImgData[i+3]])
                        data[i+0] = newColor[0];
                        data[i+1] = newColor[1];
                        data[i+2] = newColor[2];
                        data[i+3] = newColor[3];
                    }
                    userImageContext.putImageData(imageData, 0, 0);

                    console.trace("loading into web page...");
                    document.getElementById("userImage").src = "data:image/png;base64," + userImageCanvas.toDataURL("image/png").split(",")[1]; // You can change the format as needed
                    document.getElementById("userImageLabel").textContent = `This image will appear at ${predictTime(data)}`;
                    console.trace("done...");

                    // show user content
                    document.getElementById("userContentContainer").removeAttribute("hidden");
                }
                img.src = e.target.result;
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

function pixelToProgress(index, color){
    const weight = Math.pow(colors.length, index+1);
    if(weight === Infinity)
        return 0;
    const colorIdx = colors.findIndex(c => JSON.stringify(c) === JSON.stringify(color));
    const value = colorIdx / weight;
    return value;
}

function progressToPixel(index, progress){
    const weight = Math.pow(colors.length, index+1);
    if(weight === Infinity)
        return colors[Math.floor(Math.random() * colors.length)]; // :)
    const value = progress * weight % colors.length;
    const colorIdx = Math.floor(value);
    return colors[colorIdx];
}

function predictTime(imageData){
    let progress = 0;
    const pixels = Math.floor(imageData.length/4);
    for(let pixel = 0; pixel < pixels; pixel++){
        const dataStart = pixel * 4;
        const color = [
            imageData[dataStart+0],
            imageData[dataStart+1],
            imageData[dataStart+2],
            imageData[dataStart+3],
        ]
        progress += pixelToProgress(pixel, color);
    }
    console.log(`User image occurs at progress ${progress}`);
    const length = endTime - startTime;
    return new Date(startTime.getTime() + (length * progress));
}

function generateImage(progress) {
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
                const i = (y * canvas.width) + x;
                const color = progressToPixel(i, progress);
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
