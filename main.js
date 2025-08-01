import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const loadingElement = document.getElementById('loading');
const ctx = canvasElement.getContext('2d');

let detector;
let rafId;

const KEYPOINT_CONFIDENCE_THRESHOLD = 0.5;

async function setupApp() {
    try {
        await tf.setBackend('webgl');
        const model = poseDetection.SupportedModels.MoveNet;
        detector = await poseDetection.createDetector(model);
        
        const video = await setupWebcam();
        await video.play();
        handleResize(); // Initial resize to set canvas dimensions
        window.addEventListener('resize', handleResize);
        
        loadingElement.style.display = 'none'; // Hide loading screen
        runDetection(); // Start detection loop
    } catch (error) {
        console.error("Initialization failed:", error);
        loadingElement.textContent = "Failed to load. Please check console for errors.";
    }
}

async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user'
            },
            audio: false
        });
        webcamElement.srcObject = stream;

        return new Promise((resolve) => {
            webcamElement.addEventListener('loadedmetadata', () => {
                resolve(webcamElement);
            });
        });
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        alert("Could not access webcam. Please allow access and refresh the page.");
        throw err;
    }
}

async function runDetection() {
    if (detector && !webcamElement.paused && !webcamElement.ended) {
        const poses = await detector.estimatePoses(webcamElement, {
            flipHorizontal: false 
        });

        drawResults(poses);
    }
    rafId = requestAnimationFrame(runDetection);
}

function drawResults(poses) {
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const { videoWidth, videoHeight } = webcamElement;
    if (!videoWidth || !videoHeight) return;

    // Calculate scale and offset to match canvas with video's `object-fit: cover`
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasElement.width / canvasElement.height;
    let scale = 1, offsetX = 0, offsetY = 0;

    if (videoAspect > canvasAspect) { // Video is wider than canvas
        scale = canvasElement.height / videoHeight;
        offsetX = (canvasElement.width - videoWidth * scale) / 2;
    } else { // Video is taller than canvas
        scale = canvasElement.width / videoWidth;
        offsetY = (canvasElement.height - videoHeight * scale) / 2;
    }

    if (poses && poses.length > 0) {
        for (const pose of poses) {
            drawKeypoints(pose.keypoints, scale, offsetX, offsetY);
            drawSkeleton(pose.keypoints, scale, offsetX, offsetY);
        }
    }
}

function drawKeypoints(keypoints, scale, offsetX, offsetY) {
    ctx.fillStyle = 'lime';
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;

    for (const keypoint of keypoints) {
        if (keypoint.score > KEYPOINT_CONFIDENCE_THRESHOLD) {
            const x = canvasElement.width - (keypoint.x * scale + offsetX);
            const y = keypoint.y * scale + offsetY;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawSkeleton(keypoints, scale, offsetX, offsetY) {
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 3;

    adjacentPairs.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (kp1.score > KEYPOINT_CONFIDENCE_THRESHOLD && kp2.score > KEYPOINT_CONFIDENCE_THRESHOLD) {
            ctx.beginPath();
            ctx.moveTo(canvasElement.width - (kp1.x * scale + offsetX), kp1.y * scale + offsetY);
            ctx.lineTo(canvasElement.width - (kp2.x * scale + offsetX), kp2.y * scale + offsetY);
            ctx.stroke();
        }
    });
}

function handleResize() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
}

setupApp();