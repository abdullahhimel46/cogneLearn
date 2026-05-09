/**
 * AttentionMonitor Module - Tracks and monitors user attention levels
 * Enhanced with full face-api.js model suite (expressions, age, gender, etc.)
 */
const AttentionMonitor = {
    detectionIntervalMs: 1500,
    modelsPath: "/public/models/face-api",
    stream: null,
    videoElement: null,
    detectionHandle: null,
    modelsReady: false,
    onUpdate: null,
    isTracking: false,
    sessionRunning: false,
    ssdLoaded: false,
    descriptorSupportLogged: false,
    currentScore: 0,
    recentScores: [],
    allScores: [],
    sampleCount: 0,
    distractedCount: 0,
    lastDetection: null,

    trackAttention: function (detection) {
        if (!detection) {
            return {
                level: 0,
                status: "no_face_detected",
                faceDetected: false,
                expressions: { dominant: "unknown", scores: {} },
                timestamp: new Date().toISOString()
            };
        }

        const attentionLevel = this.calculateAttentionLevel(detection);
        const expressionData = this.analyzeExpressions(detection);

        return {
            level: attentionLevel,
            status: attentionLevel > 70 ? "focused" : attentionLevel > 40 ? "moderate" : "distracted",
            faceDetected: true,
            expressions: expressionData,
            timestamp: new Date().toISOString()
        };
    },

    analyzeExpressions: function (detection) {
        if (!detection || !detection.expressions) {
            return { dominant: "unknown", scores: {} };
        }

        const expressions = detection.expressions;
        const dominant = Object.keys(expressions).reduce(function (a, b) {
            return expressions[a] > expressions[b] ? a : b;
        });

        return {
            dominant: dominant,
            scores: {
                neutral: Math.round((expressions.neutral || 0) * 100),
                happy: Math.round((expressions.happy || 0) * 100),
                sad: Math.round((expressions.sad || 0) * 100),
                angry: Math.round((expressions.angry || 0) * 100),
                fearful: Math.round((expressions.fearful || 0) * 100),
                disgusted: Math.round((expressions.disgusted || 0) * 100),
                surprised: Math.round((expressions.surprised || 0) * 100)
            }
        };
    },

    calculateAttentionLevel: function (detection) {
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
        const faceWidth = jaw.reduce(function (acc, p) { return Math.max(acc, p.x); }, 0) -
            jaw.reduce(function (acc, p) { return Math.min(acc, p.x); }, Number.MAX_SAFE_INTEGER);
        const yawOffset = Math.abs(noseTipX - eyeMidpointX);
        const yawThreshold = Math.max(faceWidth * 0.15, 1);
        const yawScore = Math.max(0, 100 - yawOffset / yawThreshold * 100);

        const eyeLineY = (leftEye[0].y + rightEye[3].y) / 2;
        const noseTipY = nose[3].y;
        const eyeToNoseDist = noseTipY - eyeLineY;
        const faceHeight = jaw.reduce(function (acc, p) { return Math.max(acc, p.y); }, 0) - eyeLineY;
        const currentPitchRatio = eyeToNoseDist / Math.max(1, faceHeight);
        const pitchDiff = Math.abs(currentPitchRatio - 0.35);
        const pitchScore = Math.max(0, 100 - pitchDiff / 0.25 * 100);

        const eyeDistance = Math.sqrt(
            Math.pow(rightEye[3].x - leftEye[0].x, 2) +
            Math.pow(rightEye[3].y - leftEye[0].y, 2)
        );
        const normalizedEyeDistance = Math.min(100, Math.max(0, (eyeDistance - 40) / 70 * 100));
        const depthScore = normalizedEyeDistance > 30 ? 100 : 50;

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

        return Math.round(Math.max(0, Math.min(100, (
            yawScore * 0.30 +
            pitchScore * 0.30 +
            expressionScore * 0.30 +
            depthScore * 0.10
        ))));
    },

    alertDistraction: function (attentionLevel) {
        if (attentionLevel < 20) {
            return {
                severity: "critical",
                message: "You appear distracted. Take a moment to refocus or take a break.",
                timestamp: new Date().toISOString()
            };
        }

        if (attentionLevel < 40) {
            return {
                severity: "warning",
                message: "Your attention seems low. Try to refocus on the study material.",
                timestamp: new Date().toISOString()
            };
        }

        return null;
    },

    getSessionAttentionStats: function (sessionId) {
        const session = StudySession.getById(sessionId);
        if (!session || !session.attentionScores || session.attentionScores.length === 0) {
            return { avgLevel: 0, maxLevel: 0, minLevel: 0, count: 0, dominantExpressions: {} };
        }

        const scores = session.attentionScores;
        const dominantExpressions = {};
        if (session.expressions && Array.isArray(session.expressions)) {
            session.expressions.forEach(function (expr) {
                dominantExpressions[expr] = (dominantExpressions[expr] || 0) + 1;
            });
        }

        return {
            avgLevel: Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length),
            maxLevel: Math.max.apply(null, scores),
            minLevel: Math.min.apply(null, scores),
            count: scores.length,
            dominantExpressions: dominantExpressions
        };
    },

    getAttentionTrend: function (days) {
        const lookback = days || 7;
        const sessions = StudySession.getAll();
        const now = new Date();
        const startDate = new Date(now.getTime() - lookback * 24 * 60 * 60 * 1000);
        const relevantSessions = sessions.filter(function (s) { return new Date(s.startTime) >= startDate; });
        const trendData = {};

        relevantSessions.forEach(function (s) {
            const date = new Date(s.startTime).toDateString();
            if (!trendData[date]) {
                trendData[date] = { date: date, avgAttention: 0, sessionCount: 0, scores: [] };
            }
            trendData[date].scores.push.apply(trendData[date].scores, s.attentionScores || []);
            trendData[date].sessionCount++;
        });

        return Object.values(trendData).map(function (day) {
            return {
                date: day.date,
                avgAttention: day.scores.length > 0
                    ? Math.round(day.scores.reduce(function (a, b) { return a + b; }, 0) / day.scores.length)
                    : 0,
                sessionCount: day.sessionCount
            };
        });
    },

    syncWindowTracker: function () {
        window.attentionTracker = {
            modelsLoaded: this.modelsReady,
            stream: this.stream,
            video: this.videoElement,
            isTracking: this.isTracking,
            sessionRunning: this.sessionRunning,
            detectionInterval: this.detectionHandle,
            currentScore: this.currentScore,
            recentScores: this.recentScores,
            allScores: this.allScores,
            descriptorSupportLogged: this.descriptorSupportLogged,
            sampleCount: this.sampleCount,
            distractedCount: this.distractedCount,
            ssdLoaded: this.ssdLoaded,
            lastDetection: this.lastDetection
        };
    },

    updateOptionalUI: function (isTracking, statusText) {
        const toggleButton = document.getElementById("toggleAttentionBtn");
        const statusNode = document.getElementById("attentionStatus");

        if (toggleButton) {
            toggleButton.textContent = isTracking ? "Stop Tracking" : "Start Attention Tracking";
        }

        if (statusNode && statusText) {
            statusNode.textContent = statusText;
        }
    },

    loadModels: async function () {
        if (this.modelsReady) {
            return true;
        }
        if (!window.faceapi) {
            throw new Error("face-api.js is not available.");
        }

        console.log("Loading face-api.js models from local folder...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);

        if (faceapi.nets.faceLandmark68TinyNet && faceapi.nets.faceLandmark68TinyNet.loadFromUri) {
            await faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.modelsPath);
        }

        await faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath);
        await faceapi.nets.ageGenderNet.loadFromUri(this.modelsPath);

        if (faceapi.nets.faceRecognitionNet && faceapi.nets.faceRecognitionNet.loadFromUri) {
            await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath);
        }

        if (faceapi.nets.mtcnn && faceapi.nets.mtcnn.loadFromUri) {
            try {
                await faceapi.nets.mtcnn.loadFromUri(this.modelsPath);
            } catch (error) {
                console.log("MTCNN model unavailable, continuing without it.");
            }
        }

        if (faceapi.nets.ssdMobilenetv1 && faceapi.nets.ssdMobilenetv1.loadFromUri) {
            try {
                await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);
                this.ssdLoaded = true;
            } catch (error) {
                this.ssdLoaded = false;
                console.log("SSD MobileNet model unavailable, using Tiny Face Detector fallback.");
            }
        }

        this.modelsReady = true;
        this.syncWindowTracker();
        return true;
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

        // Avoid hanging forever on permission prompts / device issues.
        this.stream = await Promise.race([
            getStream,
            new Promise(function (_, reject) {
                window.setTimeout(function () { reject(new Error("Camera request timed out.")); }, 8000);
            })
        ]);

        video.srcObject = this.stream;

        // Some browsers don't reliably fire onloadedmetadata for hidden video elements.
        try {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () { });
            }
        } catch (error) {
            // ignore, we still try to detect once video is ready
        }

        await Promise.race([
            new Promise(function (resolve) {
                const done = function () {
                    video.removeEventListener("loadedmetadata", done);
                    video.removeEventListener("canplay", done);
                    resolve();
                };
                video.addEventListener("loadedmetadata", done, { once: true });
                video.addEventListener("canplay", done, { once: true });
            }),
            new Promise(function (resolve) { window.setTimeout(resolve, 600); })
        ]);

        // Ensure we actually have frames coming in.
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

    smoothAttentionScore: function (score, maxSamples) {
        const sampleWindow = maxSamples || 10;
        this.recentScores.push(score);
        if (this.recentScores.length > sampleWindow) {
            this.recentScores.shift();
        }

        const sum = this.recentScores.reduce(function (a, b) { return a + b; }, 0);
        return Math.round(sum / Math.max(this.recentScores.length, 1));
    },

    recordAttentionSample: function (score) {
        this.sampleCount += 1;
        this.allScores.push(score);
        if (score < 40) {
            this.distractedCount += 1;
        }

        const focusElem = document.getElementById("sessionInfoFocus");
        if (focusElem) {
            const avg = Math.round(
                this.allScores.reduce(function (a, b) { return a + b; }, 0) /
                Math.max(this.allScores.length, 1)
            );
            focusElem.textContent = avg + "%";
        }

        this.syncWindowTracker();
    },

    buildDetectionTask: function () {
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

        let task = faceapi
            .detectSingleFace(this.videoElement, detectorOptions)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        if (faceapi.nets.faceRecognitionNet && typeof task.withFaceDescriptors === "function") {
            task = task.withFaceDescriptors();
        } else if (!this.descriptorSupportLogged) {
            console.log("Face descriptors not available in this build.");
            this.descriptorSupportLogged = true;
        }

        return task;
    },

    detectOnce: async function () {
        if (!this.isTracking || !this.videoElement || !window.faceapi) {
            return {
                level: 0,
                status: "no_face_detected",
                faceDetected: false,
                expressions: { dominant: "unknown", scores: {} },
                timestamp: new Date().toISOString()
            };
        }

        const detection = await this.buildDetectionTask();
        if (!detection) {
            const noFaceScore = this.smoothAttentionScore(0, 10);
            this.currentScore = noFaceScore;
            this.recordAttentionSample(noFaceScore);
            this.lastDetection = {
                score: noFaceScore,
                expressions: null,
                ageAndGender: null,
                timestamp: new Date().toISOString()
            };
            this.syncWindowTracker();

            return {
                level: noFaceScore,
                status: "no_face_detected",
                faceDetected: false,
                expressions: { dominant: "unknown", scores: {} },
                timestamp: this.lastDetection.timestamp
            };
        }

        const attentionData = this.trackAttention(detection);
        const smoothedScore = this.smoothAttentionScore(attentionData.level, 10);
        const expressions = detection.expressions || {};
        const topExpression = Object.keys(expressions).length > 0
            ? Object.keys(expressions).reduce(function (a, b) { return expressions[a] > expressions[b] ? a : b; })
            : "unknown";
        const ageAndGender = typeof detection.age === "number" ? {
            age: Math.round(detection.age),
            gender: detection.gender || "unknown",
            genderProbability: Math.round((detection.genderProbability || 0) * 100)
        } : null;

        this.currentScore = smoothedScore;
        this.recordAttentionSample(smoothedScore);
        this.lastDetection = {
            score: smoothedScore,
            expressions: expressions,
            ageAndGender: ageAndGender,
            timestamp: attentionData.timestamp
        };
        this.syncWindowTracker();

        console.log("Attention Score:", smoothedScore + "%", "|", topExpression, "|", attentionData.status);

        return {
            level: smoothedScore,
            status: smoothedScore > 70 ? "focused" : smoothedScore > 40 ? "moderate" : "distracted",
            faceDetected: true,
            expressions: this.analyzeExpressions(detection),
            ageAndGender: ageAndGender,
            timestamp: attentionData.timestamp
        };
    },

    updateAttentionUI: function (score, rawStatus) {
        const fillElement = document.getElementById("attentionFill");
        const percentElement = document.getElementById("attentionPercent");
        const statusElement = document.getElementById("attentionStatus");

        if (!fillElement) return;

        fillElement.style.width = score + "%";
        if (percentElement) percentElement.textContent = score + "%";

        let status = "";
        fillElement.classList.remove("attention-good", "attention-mid", "attention-low");
        if (score >= 70) {
            status = "🟢 Focused";
            fillElement.classList.add("attention-good");
        } else if (score >= 30) {
            status = "🟡 Steady Focus";
            fillElement.classList.add("attention-mid");
        } else {
            status = "🔴 Looking Away";
            fillElement.classList.add("attention-low");
        }

        if (statusElement) statusElement.textContent = status;
    },

    emitUpdate: function (result) {
        console.log("Attention Level:", {
            level: result.level,
            status: result.status,
            expressions: result.expressions || null,
            ageAndGender: result.ageAndGender || null,
            timestamp: result.timestamp
        });

        this.updateAttentionUI(result.level, result.status);

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
            try {
                const result = await self.detectOnce();
                self.emitUpdate(result);
            } catch (error) {
                console.error("Detection error:", error);
                self.emitUpdate({
                    level: self.smoothAttentionScore(0, 10),
                    status: "camera_error",
                    faceDetected: false,
                    expressions: { dominant: "unknown", scores: {} },
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        };

        tick();
        this.detectionHandle = window.setInterval(tick, this.detectionIntervalMs);
        this.syncWindowTracker();
    },

    start: async function (onUpdate) {
        this.onUpdate = onUpdate || this.onUpdate;
        console.log("Requesting camera access...");
        try {
            await Promise.race([
                this.loadModels(),
                new Promise(function (_, reject) {
                    window.setTimeout(function () { reject(new Error("Model load timed out.")); }, 12000);
                })
            ]);
            await this.startCamera();
        } catch (error) {
            this.updateOptionalUI(false, "Camera unavailable");
            this.syncWindowTracker();
            throw error;
        }
        this.isTracking = true;
        this.sessionRunning = true;
        this.runDetectionLoop();
        this.updateOptionalUI(true, "Tracking started...");
        this.syncWindowTracker();
        console.log("Attention tracking started");
    },

    pause: function () {
        if (this.detectionHandle) {
            window.clearInterval(this.detectionHandle);
            this.detectionHandle = null;
        }
        this.isTracking = false;
        this.sessionRunning = false;
        this.updateOptionalUI(false, "Tracking paused");
        this.emitUpdate({
            level: 0,
            status: "paused",
            timestamp: new Date().toISOString()
        });
        this.syncWindowTracker();
    },

    resume: async function (onUpdate) {
        this.onUpdate = onUpdate || this.onUpdate;
        await this.start(this.onUpdate);
    },

    stop: function () {
        this.pause();

        if (this.stream) {
            this.stream.getTracks().forEach(function (track) { track.stop(); });
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.srcObject = null;
        }

        this.isTracking = false;
        this.sessionRunning = false;
        this.updateOptionalUI(false);
        this.syncWindowTracker();
        console.log("Attention tracking stopped");
    },

    setSessionRunning: function (isRunning) {
        this.sessionRunning = !!isRunning;
        this.syncWindowTracker();
    },

    toggle: async function (onUpdate) {
        if (!this.isTracking) {
            try {
                await this.start(onUpdate);
            } catch (error) {
                console.error("Error starting attention tracking:", error);
                this.updateOptionalUI(false, "Camera unavailable");
                throw error;
            }
            return;
        }

        this.stop();
    },

    handleVisibilityChange: function () {
        if (document.hidden) {
            if (this.detectionHandle) {
                window.clearInterval(this.detectionHandle);
                this.detectionHandle = null;
                this.syncWindowTracker();
            }
            return;
        }

        if (this.isTracking && this.sessionRunning && !this.detectionHandle) {
            this.runDetectionLoop();
        }
    }
};

window.loadFaceAPIModels = function () {
    return AttentionMonitor.loadModels();
};

window.toggleAttentionTracking = function () {
    return AttentionMonitor.toggle(AttentionMonitor.onUpdate);
};

AttentionMonitor.syncWindowTracker();
document.addEventListener("visibilitychange", function () {
    AttentionMonitor.handleVisibilityChange();
});
