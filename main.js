const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const ctx = canvasElement.getContext('2d');

const overlayImage = new Image();
overlayImage.src = 'body-overlay.png';

let overlayReady = false;
overlayImage.onload = () => {
    overlayReady = true;
};

async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user'
            },
            audio: false
        });
        webcamElement.srcObject = stream;
        webcamElement.addEventListener('loadedmetadata', () => {
            handleResize(); // Initial setup
            window.addEventListener('resize', handleResize);
        });
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        alert("Could not access webcam. Please allow access and refresh the page.");
    }
}

function drawOverlay() {
    // Clear previous drawing
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (overlayReady) {
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;
        
        const imageAspectRatio = overlayImage.naturalWidth / overlayImage.naturalHeight;
        
        // Scale the overlay to be 80% of the canvas height
        let drawHeight = canvasHeight * 0.8;
        let drawWidth = drawHeight * imageAspectRatio;

        // If the overlay becomes too wide, scale it down based on width instead
        if (drawWidth > canvasWidth * 0.9) {
            drawWidth = canvasWidth * 0.9;
            drawHeight = drawWidth / imageAspectRatio;
        }

        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2;
        
        ctx.globalAlpha = 0.7; // Make the overlay slightly transparent
        ctx.drawImage(overlayImage, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
    }
}

function handleResize() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    drawOverlay(); // Redraw the overlay whenever the window is resized
}

setupWebcam();

