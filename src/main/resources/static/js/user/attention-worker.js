/**
 * attention-worker.js
 *
 * Runs attention inference off the UI thread.
 *
 * IMPORTANT PRIVACY GUARANTEE
 * - This worker only receives downscaled pixel frames (ImageData-like buffers)
 * - It never persists frames
 * - It only outputs a summarized attention score (0-100) + status string
 */

/* eslint-disable no-restricted-globals */

let faceapiReady = false;
let modelsReady = false;
let busy = false;
let modelsPath = "/public/models/face-api";

function safePost(message) {
    try {
        postMessage(message);
    } catch (e) {
        // ignore
    }
}

function loadFaceApiScript() {
    if (faceapiReady) return true;

    // face-api.js UMD build; in workers it should attach to self.faceapi.
    // If it fails in a browser, we gracefully fall back (client will detect).
    try {
        importScripts("https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js");
        if (self.faceapi) {
            faceapiReady = true;
            return true;
        }
    } catch (e) {
        faceapiReady = false;
    }

    return false;
}

async function loadModels() {
    if (!loadFaceApiScript()) {
        return false;
    }

    try {
        await self.faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
        await self.faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
        await self.faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
        modelsReady = true;
        return true;
    } catch (e) {
        modelsReady = false;
        return false;
    }
}

function calculateAttentionLevel(detection) {
    if (!detection || !detection.landmarks) {
        return 0;
    }

    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();

    if (!leftEye.length || !rightEye.length || !nose.length || !jaw.length) {
        return 0;
    }

    const eyeMidpointX = (leftEye[0].x + rightEye[3].x) / 2;
    const noseTipX = nose[3].x;
    const faceMaxX = jaw.reduce((acc, p) => Math.max(acc, p.x), 0);
    const faceMinX = jaw.reduce((acc, p) => Math.min(acc, p.x), Number.MAX_SAFE_INTEGER);
    const faceWidth = Math.max(1, faceMaxX - faceMinX);

    const yawOffset = Math.abs(noseTipX - eyeMidpointX);
    const yawThreshold = Math.max(faceWidth * 0.15, 1);
    const yawScore = Math.max(0, 100 - (yawOffset / yawThreshold) * 100);

    const eyeLineY = (leftEye[0].y + rightEye[3].y) / 2;
    const noseTipY = nose[3].y;
    const eyeToNoseDist = noseTipY - eyeLineY;
    const faceMaxY = jaw.reduce((acc, p) => Math.max(acc, p.y), 0);
    const faceHeight = Math.max(1, faceMaxY - eyeLineY);
    const currentPitchRatio = eyeToNoseDist / faceHeight;
    const pitchDiff = Math.abs(currentPitchRatio - 0.35);
    const pitchScore = Math.max(0, 100 - (pitchDiff / 0.25) * 100);

    // Expression impact
    let expressionScore = 80;
    if (detection.expressions) {
        const expr = detection.expressions;
        expressionScore = (
            (expr.neutral || 0) * 100 +
            (expr.happy || 0) * 80 +
            (expr.surprised || 0) * 50 +
            Math.max(expr.sad || 0, expr.angry || 0, expr.fearful || 0, expr.disgusted || 0) * -60
        );
        expressionScore = Math.max(0, Math.min(100, expressionScore));
    }

    const raw = yawScore * 0.35 + pitchScore * 0.35 + expressionScore * 0.30;
    return Math.round(Math.max(0, Math.min(100, raw)));
}

async function inferAttentionFromBuffer(payload) {
    if (!modelsReady || !self.faceapi) {
        return { level: 0, status: "models_not_ready", faceDetected: false };
    }

    const width = payload.width;
    const height = payload.height;
    const buffer = payload.data;

    if (!width || !height || !buffer) {
        return { level: 0, status: "invalid_frame", faceDetected: false };
    }

    const bytes = new Uint8ClampedArray(buffer);
    const imageData = new ImageData(bytes, width, height);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.putImageData(imageData, 0, 0);

    const detectorOptions = new self.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

    const detection = await self.faceapi
        .detectSingleFace(canvas, detectorOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

    if (!detection) {
        return { level: 0, status: "no_face_detected", faceDetected: false };
    }

    const level = calculateAttentionLevel(detection);
    const status = level > 70 ? "focused" : level > 40 ? "moderate" : "distracted";
    return { level, status, faceDetected: true };
}

self.onmessage = async function (event) {
    const msg = event && event.data ? event.data : {};

    if (msg.type === "init") {
        modelsPath = msg.modelsPath || modelsPath;
        safePost({ type: "capabilities", worker: true, offscreenCanvas: typeof OffscreenCanvas !== "undefined" });

        const ok = await loadModels();
        safePost({ type: "ready", ok });
        return;
    }

    if (msg.type === "frame") {
        if (busy) {
            // Drop frames to keep latency low.
            safePost({ type: "dropped" });
            return;
        }

        busy = true;
        try {
            const result = await inferAttentionFromBuffer(msg);
            safePost({
                type: "result",
                level: result.level,
                status: result.status,
                faceDetected: result.faceDetected,
                ts: msg.ts || Date.now()
            });
        } catch (e) {
            safePost({ type: "result", level: 0, status: "worker_error", faceDetected: false, error: String(e && e.message ? e.message : e), ts: msg.ts || Date.now() });
        } finally {
            busy = false;
        }
        return;
    }

    if (msg.type === "shutdown") {
        safePost({ type: "shutdown" });
        close();
    }
};
