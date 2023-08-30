const width = 64
const height = 64
const startTime = new Date(2023,0,1);
const endTime = new Date(2024,0,1);
const colors = [
    // r,  g,  b,  a
    [  0,  0,  0,255], // black
    [128,128,128,255], // white
    [255,255,255,255], // white
    [255,  0,  0,255], // red
    [  0,255,  0,255], // green
    [255,255,  0,255], // yellow
    [  0,  0,255,255], // blue
    [255,  0,255,255], // magenta
    [  0,255,255,255], // cyan
  ];

function percentElapsed() {
    var totalTime = endTime - startTime;
    var currentTime = new Date() - startTime;
    var percentage = (currentTime / totalTime);
    return percentage;
  }
function getClosestColor(rgba){
    const sortedColors = colors.sort((colorA, colorB) => {
        const rA = colorA[0];
        const gA = colorA[1];
        const bA = colorA[2];
        const aA = colorA[3];
        
        const rB = colorB[0];
        const gB = colorB[1];
        const bB = colorB[2];
        const aB = colorB[3];
        
        const distanceA = Math.sqrt(
            Math.pow(rA - rgba[0], 2) +
            Math.pow(gA - rgba[1], 2) +
            Math.pow(bA - rgba[2], 2) +
            Math.pow(aA - rgba[3], 2)
        );
        
        const distanceB = Math.sqrt(
            Math.pow(rB - rgba[0], 2) +
            Math.pow(gB - rgba[1], 2) +
            Math.pow(bB - rgba[2], 2) +
            Math.pow(aB - rgba[3], 2)
        );
        
        return distanceA - distanceB;
    });

    const closestColor = sortedColors[0];
    return closestColor;
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
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function(){
                    console.log("revising image...");
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0, width, height);
                    var originalImgData = context.getImageData(0, 0, canvas.width, canvas.height).data;
                    
                    const imageData = context.createImageData(width, height);
                    const data = imageData.data;
                    console.log(`data length: ${data.length}`);
                    for(let i = 0;i<data.length;i+=4){
                        const newColor = getClosestColor([originalImgData[i+0],originalImgData[i+1],originalImgData[i+2],originalImgData[i+3]])
                        data[i+0] = newColor[0];
                        data[i+1] = newColor[1];
                        data[i+2] = newColor[2];
                        data[i+3] = newColor[3];
                    }
                    context.putImageData(imageData, 0, 0);

                    console.log("loading into web page...");
                    document.getElementById("userImage").src = "data:image/png;base64," + canvas.toDataURL("image/png").split(",")[1]; // You can change the format as needed
                    document.getElementById("userImage").removeAttribute("hidden");
                    document.getElementById("userImageLabel").textContent = `This image will appear at ${predictTime(data)}`;
                    document.getElementById("userImageLabel").removeAttribute("hidden");
                    console.log("done...");
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

function predictTime(imageData){
    let progress = 0;
    const pixels = Math.floor(imageData.length/4); // imageData.width * imageData.height; //
    for(let pixel=pixels-1;pixel>=0;pixel--){
        const dataStart = pixel * 4;
        const color = [
            imageData[dataStart+0],
            imageData[dataStart+1],
            imageData[dataStart+2],
            imageData[dataStart+3],
        ]
        const index = colors.findIndex(c => JSON.stringify(c) === JSON.stringify(color))
        progress += index;
        progress /= colors.length;
    }
    const length = endTime - startTime;
    return new Date(startTime.getTime() + (length * progress));
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
