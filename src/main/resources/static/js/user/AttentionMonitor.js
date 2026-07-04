/**
 * AttentionMonitor (v2) - privacy-first attention inference.
 *
 * - Uses a Web Worker for ML inference when possible.
 * - Falls back to main-thread inference if worker/models are unavailable.
 * - Emits ONLY summarized metrics: { level: 0-100, status, faceDetected, timestamp }
 */
const AttentionMonitor = {
    detectionIntervalMs: 1500,
    modelsPath: "/public/models/face-api",

    stream: null,
    videoElement: null,
    detectionHandle: null,
    onUpdate: null,
    isTracking: false,
    sessionRunning: false,

    // Worker state
    worker: null,
    workerReady: false,
    pendingWorkerFrame: false,
    workerSupported: typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined",

    // Fallback main-thread state
    modelsReady: false,
    recentScores: [],
    currentScore: 0,

    syncWindowTracker: function () {
        window.attentionTracker = {
            workerSupported: this.workerSupported,
            workerReady: this.workerReady,
            stream: this.stream,
            isTracking: this.isTracking,
            sessionRunning: this.sessionRunning,
            detectionInterval: this.detectionHandle,
            currentScore: this.currentScore
        };
    },

    ensureVideoElement: function () {
        if (this.videoElement) {
            return this.videoElement;
        }

        const video = document.createElement("video");
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("playsinline", "true");
        video.style.position = "fixed";
        video.style.width = "1px";
        video.style.height = "1px";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        video.style.left = "-9999px";
        video.style.top = "-9999px";
        document.body.appendChild(video);
        this.videoElement = video;
        return video;
    },

    startCamera: async function () {
        if (this.stream) {
            return this.stream;
        }

        const video = this.ensureVideoElement();
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API unavailable (getUserMedia not supported).");
        }

        const getStream = navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            },
            audio: false
        });

        this.stream = await Promise.race([
            getStream,
            new Promise(function (_, reject) {
                window.setTimeout(function () { reject(new Error("Camera request timed out.")); }, 8000);
            })
        ]);

        video.srcObject = this.stream;
        try {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () { });
            }
        } catch (e) {
            // ignore
        }

        await Promise.race([
            new Promise(function (resolve) {
                const done = function () {
                    resolve();
                };
                video.addEventListener("loadedmetadata", done, { once: true });
                video.addEventListener("canplay", done, { once: true });
            }),
            new Promise(function (resolve) { window.setTimeout(resolve, 600); })
        ]);

        // Ensure frames are available.
        await Promise.race([
            new Promise(function (resolve, reject) {
                const start = Date.now();
                const check = function () {
                    if (video.readyState >= 2 && (video.videoWidth || 0) > 0 && (video.videoHeight || 0) > 0) {
                        resolve();
                        return;
                    }
                    if (Date.now() - start > 6000) {
                        reject(new Error("Camera video not ready."));
                        return;
                    }
                    window.setTimeout(check, 150);
                };
                check();
            }),
            new Promise(function (_, reject) {
                window.setTimeout(function () { reject(new Error("Camera readiness timed out.")); }, 6500);
            })
        ]);

        this.syncWindowTracker();
        return this.stream;
    },

    initWorker: function () {
        if (!this.workerSupported || this.worker) {
            return;
        }

        try {
            this.worker = new Worker("/js/user/attention-worker.js");
            const self = this;
            this.worker.onmessage = function (event) {
                const msg = event && event.data ? event.data : {};
                if (msg.type === "ready") {
                    self.workerReady = !!msg.ok;
                    self.syncWindowTracker();
                    return;
                }
                if (msg.type === "result") {
                    self.pendingWorkerFrame = false;
                    self.emitUpdate({
                        level: typeof msg.level === "number" ? msg.level : 0,
                        status: msg.status || "unknown",
                        faceDetected: !!msg.faceDetected,
                        timestamp: new Date(msg.ts || Date.now()).toISOString()
                    });
                }
                if (msg.type === "dropped") {
                    self.pendingWorkerFrame = false;
                }
            };
            this.worker.postMessage({ type: "init", modelsPath: this.modelsPath });
        } catch (e) {
            this.worker = null;
            this.workerReady = false;
        }
    },

    loadModelsFallback: async function () {
        if (this.modelsReady) return true;
        if (!window.faceapi) {
            return false;
        }
        await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);
        await faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath);
        this.modelsReady = true;
        return true;
    },

    smoothAttentionScore: function (score, maxSamples) {
        const sampleWindow = maxSamples || 10;
        this.recentScores.push(score);
        if (this.recentScores.length > sampleWindow) {
            this.recentScores.shift();
        }
        const sum = this.recentScores.reduce(function (a, b) { return a + b; }, 0);
        return Math.round(sum / Math.max(this.recentScores.length, 1));
    },

    captureFrameBuffer: function () {
        const video = this.videoElement;
        if (!video || video.readyState < 2) {
            return null;
        }

        const width = 224;
        const height = 224;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        return { width, height, data: imageData.data.buffer };
    },

    calculateAttentionLevelFallback: function (detection) {
        if (!detection || !detection.landmarks) return 0;
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
        if (!leftEye.length || !rightEye.length || !nose.length || !jaw.length) return 0;

        const eyeMidpointX = (leftEye[0].x + rightEye[3].x) / 2;
        const noseTipX = nose[3].x;
        const faceMaxX = jaw.reduce(function (acc, p) { return Math.max(acc, p.x); }, 0);
        const faceMinX = jaw.reduce(function (acc, p) { return Math.min(acc, p.x); }, Number.MAX_SAFE_INTEGER);
        const faceWidth = Math.max(1, faceMaxX - faceMinX);
        const yawOffset = Math.abs(noseTipX - eyeMidpointX);
        const yawThreshold = Math.max(faceWidth * 0.15, 1);
        const yawScore = Math.max(0, 100 - (yawOffset / yawThreshold) * 100);

        const eyeLineY = (leftEye[0].y + rightEye[3].y) / 2;
        const noseTipY = nose[3].y;
        const eyeToNoseDist = noseTipY - eyeLineY;
        const faceMaxY = jaw.reduce(function (acc, p) { return Math.max(acc, p.y); }, 0);
        const faceHeight = Math.max(1, faceMaxY - eyeLineY);
        const currentPitchRatio = eyeToNoseDist / faceHeight;
        const pitchDiff = Math.abs(currentPitchRatio - 0.35);
        const pitchScore = Math.max(0, 100 - (pitchDiff / 0.25) * 100);

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
    },

    detectOnceFallback: async function () {
        if (!this.isTracking || !this.videoElement || !window.faceapi) {
            return { level: 0, status: "no_face_detected", faceDetected: false, timestamp: new Date().toISOString() };
        }

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        const detection = await faceapi
            .detectSingleFace(this.videoElement, detectorOptions)
            .withFaceLandmarks()
            .withFaceExpressions();

        if (!detection) {
            const score = this.smoothAttentionScore(0, 10);
            this.currentScore = score;
            return { level: score, status: "no_face_detected", faceDetected: false, timestamp: new Date().toISOString() };
        }

        const level = this.smoothAttentionScore(this.calculateAttentionLevelFallback(detection), 10);
        this.currentScore = level;
        return { level, status: level > 70 ? "focused" : level > 40 ? "moderate" : "distracted", faceDetected: true, timestamp: new Date().toISOString() };
    },

    emitUpdate: function (result) {
        if (typeof this.onUpdate === "function") {
            this.onUpdate(result);
        }
    },

    runDetectionLoop: function () {
        if (this.detectionHandle) {
            return;
        }
        const self = this;

        const tick = async function () {
            if (!self.isTracking || !self.sessionRunning) {
                return;
            }

            // Prefer worker pipeline.
            if (self.worker && self.workerReady) {
                if (self.pendingWorkerFrame) {
                    return;
                }
                const frame = self.captureFrameBuffer();
                if (!frame) {
                    self.emitUpdate({ level: 0, status: "camera_starting", faceDetected: false, timestamp: new Date().toISOString() });
                    return;
                }
                self.pendingWorkerFrame = true;
                try {
                    self.worker.postMessage({
                        type: "frame",
                        width: frame.width,
                        height: frame.height,
                        data: frame.data,
                        ts: Date.now()
                    }, [frame.data]);
                } catch (e) {
                    self.pendingWorkerFrame = false;
                }
                return;
            }

            // Fallback pipeline.
            try {
                const result = await self.detectOnceFallback();
                self.emitUpdate(result);
            } catch (e) {
                self.emitUpdate({ level: 0, status: "camera_error", faceDetected: false, timestamp: new Date().toISOString() });
            }
        };

        tick();
        this.detectionHandle = window.setInterval(tick, this.detectionIntervalMs);
        this.syncWindowTracker();
    },

    start: async function (onUpdate) {
        this.onUpdate = onUpdate || this.onUpdate;
        this.initWorker();

        await this.startCamera();

        // Prepare fallback models in the background; worker remains preferred.
        if (!this.workerReady) {
            try {
                await Promise.race([
                    this.loadModelsFallback(),
                    new Promise(function (_, reject) {
                        window.setTimeout(function () { reject(new Error("Model load timed out.")); }, 12000);
                    })
                ]);
            } catch (e) {
                // ignore
            }
        }

        this.isTracking = true;
        this.sessionRunning = true;
        this.runDetectionLoop();
        this.syncWindowTracker();
    },

    pause: function () {
        this.isTracking = false;
        this.sessionRunning = false;
        if (this.detectionHandle) {
            window.clearInterval(this.detectionHandle);
            this.detectionHandle = null;
        }
        this.pendingWorkerFrame = false;
        this.emitUpdate({ level: 0, status: "paused", faceDetected: false, timestamp: new Date().toISOString() });
        this.syncWindowTracker();
    },

    resume: async function (onUpdate) {
        this.onUpdate = onUpdate || this.onUpdate;
        await this.start(this.onUpdate);
    },

    stop: function () {
        this.pause();

        if (this.worker) {
            try {
                this.worker.postMessage({ type: "shutdown" });
            } catch (e) {
                // ignore
            }
            try {
                this.worker.terminate();
            } catch (e) {
                // ignore
            }
        }
        this.worker = null;
        this.workerReady = false;

        if (this.stream) {
            this.stream.getTracks().forEach(function (track) { track.stop(); });
            this.stream = null;
        }
        if (this.videoElement) {
            try {
                this.videoElement.pause();
            } catch (e) {
                // ignore
            }
            this.videoElement.srcObject = null;
        }
        this.syncWindowTracker();
    },

    setSessionRunning: function (isRunning) {
        this.sessionRunning = !!isRunning;
        this.syncWindowTracker();
    },

    toggle: async function (onUpdate) {
        if (!this.isTracking) {
            await this.start(onUpdate);
            return;
        }
        this.stop();
    },

    handleVisibilityChange: function () {
        if (document.hidden) {
            if (this.detectionHandle) {
                window.clearInterval(this.detectionHandle);
                this.detectionHandle = null;
            }
            this.pendingWorkerFrame = false;
            this.syncWindowTracker();
            return;
        }
        if (this.isTracking && this.sessionRunning && !this.detectionHandle) {
            this.runDetectionLoop();
        }
    }
};


window.toggleAttentionTracking = function () {
    return AttentionMonitor.toggle(AttentionMonitor.onUpdate);
};

AttentionMonitor.syncWindowTracker();
document.addEventListener("visibilitychange", function () {
    AttentionMonitor.handleVisibilityChange();
});
