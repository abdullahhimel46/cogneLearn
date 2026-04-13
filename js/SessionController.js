/**
 * ============================================================
 * SessionController — Central Brain
 * ============================================================
 * Single source of control for the entire study session.
 * Timer, Video, and Attention are ONLY managed through here.
 * No direct cross-calls between services are allowed.
 *
 * ATTENTION IS A BACKGROUND SERVICE — no UI button needed.
 * Camera starts/pauses/resumes/stops automatically with session.
 * ============================================================
 */

// ─── Global Session State ─────────────────────────────────────────────────────
const sessionState = {
    status: 'idle',   // idle | running | paused | completed
    duration: 1500,   // seconds (25 min default)
    timeLeft: 1500,
    playlistId: null,
    cyclesTotal: 1,
    currentCycle: 1
};

// ─── Timer Service ────────────────────────────────────────────────────────────
const TimerService = {
    _interval: null,

    start() {
        if (this._interval) return; // Guard: never double-start

        this._interval = setInterval(() => {
            if (sessionState.status !== 'running') return;

            sessionState.timeLeft--;
            TimerService._updateUI(sessionState.timeLeft);

            if (sessionState.timeLeft <= 0) {
                SessionController.onCycleComplete();
            }
        }, 1000);
    },

    pause() {
        clearInterval(this._interval);
        this._interval = null;
    },

    resume() {
        this.start();
    },

    stop() {
        clearInterval(this._interval);
        this._interval = null;
    },

    _updateUI(timeLeft) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const el = document.getElementById('timerDisplay');
        if (el) el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
};

// ─── Video Service ────────────────────────────────────────────────────────────
const VideoService = {
    _player: null,
    _ready: false,
    _suppressStateChangeEvent: false,

    setPlayer(player) {
        this._player = player;
        this._ready = true;

        player.addEventListener('onStateChange', (e) => {
            if (VideoService._suppressStateChangeEvent) return;

            if (e.data === YT.PlayerState.PAUSED && sessionState.status === 'running') {
                console.log('🎬 Video manually paused — syncing SessionController');
                SessionController.pause();
            }

            if (e.data === YT.PlayerState.PLAYING && sessionState.status === 'paused') {
                console.log('▶️ Video manually played — syncing SessionController');
                SessionController.resume();
            }
        });
    },

    play() {
        if (!this._ready || !this._player) {
            console.warn('⚠️ VideoService: player not ready');
            return;
        }
        try {
            this._suppressStateChangeEvent = true;
            this._player.playVideo();
            setTimeout(() => { this._suppressStateChangeEvent = false; }, 600);
        } catch (e) {
            console.error('VideoService.play error:', e);
        }
    },

    pause() {
        if (!this._ready || !this._player) return;
        try {
            this._suppressStateChangeEvent = true;
            this._player.pauseVideo();
            setTimeout(() => { this._suppressStateChangeEvent = false; }, 600);
        } catch (e) {
            console.error('VideoService.pause error:', e);
        }
    }
};

// ─── Attention Service (Headless Background Service) ──────────────────────────
/**
 * Fully autonomous. No UI button required.
 *
 * Camera lifecycle:
 *   start()  → load models + open camera + start detection loop
 *   pause()  → stop detection loop only (camera stays open — fast resume)
 *   resume() → restart detection loop
 *   stop()   → stop loop + close camera completely
 */
const AttentionService = {
    _isRunning: false,
    _cameraReady: false,   // camera + models loaded at least once
    _loop: null,
    _intervalMs: 1500,
    _video: null,          // persistent hidden <video> element
    _stream: null,         // persistent MediaStream

    // ── Start (full cold start) ───────────────────────────────────────────────
    async start() {
        if (this._isRunning) return;

        AttentionService._setUI('initializing');

        try {
            // 1. Load face-api.js models (idempotent — skips if already loaded)
            await AttentionService._loadModels();

            // 2. Open camera (idempotent — reuse if stream still alive)
            await AttentionService._openCamera();

            // 3. Sync into the legacy attentionTracker object so detectAttention() works
            window.attentionTracker.isTracking    = true;
            window.attentionTracker.modelsLoaded  = true;
            window.attentionTracker.video         = this._video;
            window.attentionTracker.stream        = this._stream;

            // 4. Start detection loop
            this._isRunning = true;
            this._startLoop();

            AttentionService._setUI('active');
            console.log('👁️ AttentionService: camera ON, detection started');

        } catch (err) {
            console.warn('⚠️ AttentionService: could not start —', err.message);
            AttentionService._setUI('unavailable');
            // Session continues without attention tracking — non-blocking
        }
    },

    // ── Pause (loop off, camera stays on) ────────────────────────────────────
    pause() {
        if (!this._isRunning) return;

        this._isRunning = false;
        this._stopLoop();

        // Keep camera open for instant resume
        window.attentionTracker.isTracking = false;

        AttentionService._setUI('paused');
        console.log('⏸️ AttentionService: detection paused (camera stays on)');
    },

    // ── Resume (restart loop, no camera re-init needed) ──────────────────────
    resume() {
        if (this._isRunning) return;
        if (!this._cameraReady) {
            // Camera was never opened — fall back to a full start
            this.start();
            return;
        }

        this._isRunning = true;
        window.attentionTracker.isTracking = true;
        window.attentionTracker.video      = this._video;

        this._startLoop();

        AttentionService._setUI('active');
        console.log('▶️ AttentionService: detection resumed');
    },

    // ── Stop (full shutdown — kill camera) ───────────────────────────────────
    stop() {
        this._isRunning = false;
        this._stopLoop();

        // Kill the physical camera stream
        if (this._stream) {
            this._stream.getTracks().forEach(t => t.stop());
            this._stream = null;
        }
        if (this._video) {
            this._video.pause();
            this._video.srcObject = null;
        }

        this._cameraReady = false;

        // Sync legacy tracker
        window.attentionTracker.isTracking = false;
        window.attentionTracker.stream     = null;
        window.attentionTracker.video      = null;

        AttentionService._setUI('idle');
        console.log('🛑 AttentionService: camera OFF');
    },

    // ── Internal: load face-api.js models ────────────────────────────────────
    async _loadModels() {
        if (window.attentionTracker && window.attentionTracker.modelsLoaded) return;

        console.log('📦 AttentionService: loading face-api.js models...');
        const MODEL_URL = '../public/models/face-api.js';

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        if (window.attentionTracker) window.attentionTracker.modelsLoaded = true;
        console.log('✅ AttentionService: models loaded');
    },

    // ── Internal: open camera + create hidden <video> ─────────────────────────
    async _openCamera() {
        if (this._cameraReady && this._stream && this._stream.active) {
            console.log('📷 AttentionService: camera already open, reusing');
            return;
        }

        console.log('📷 AttentionService: requesting camera...');
        this._stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
        });

        // Reuse or create the persistent hidden <video> element
        if (!this._video) {
            this._video = document.createElement('video');
            this._video.muted      = true;
            this._video.autoplay   = true;
            this._video.playsInline = true;
            this._video.style.display = 'none';
            document.body.appendChild(this._video);
        }

        this._video.srcObject = this._stream;

        await new Promise((resolve, reject) => {
            this._video.onloadedmetadata = () => {
                this._video.play().then(resolve).catch(reject);
            };
            this._video.onerror = reject;
        });

        this._cameraReady = true;
        console.log('✅ AttentionService: camera ready');
    },

    // ── Internal: detection loop ──────────────────────────────────────────────
    _startLoop() {
        this._stopLoop(); // clear any existing loop
        this._loop = setInterval(() => {
            if (!this._isRunning) return;
            if (typeof detectAttention === 'function') detectAttention();
        }, this._intervalMs);
    },

    _stopLoop() {
        if (this._loop) {
            clearInterval(this._loop);
            this._loop = null;
        }
    },

    // ── Internal: UI feedback ─────────────────────────────────────────────────
    _setUI(state) {
        const statusEl    = document.getElementById('attentionStatus');
        const indicatorEl = document.getElementById('trackingIndicator');

        const states = {
            initializing: { status: '🎥 Initializing camera...', indicator: false },
            active:       { status: '',                           indicator: true  },
            paused:       { status: '',                           indicator: false },
            idle:         { status: 'Ready to start',            indicator: false },
            unavailable:  { status: '⚠️ Camera unavailable',     indicator: false }
        };

        const cfg = states[state] || states.idle;
        if (statusEl  && cfg.status) statusEl.textContent = cfg.status;
        if (indicatorEl) indicatorEl.style.display = cfg.indicator ? 'block' : 'none';
    },

    /** Returns true only when camera + models are ready */
    isReady() {
        return this._cameraReady && this._stream && this._stream.active;
    }
};

// ─── Session Controller (Central Brain) ──────────────────────────────────────
const SessionController = {

    configure({ duration, cycles, playlistId }) {
        sessionState.duration     = duration * 60;
        sessionState.timeLeft     = duration * 60;
        sessionState.cyclesTotal  = cycles;
        sessionState.currentCycle = 1;
        sessionState.playlistId   = playlistId;
        sessionState.status       = 'idle';
        TimerService._updateUI(sessionState.timeLeft);
    },

    restoreFromSaved({ duration, cycles, timeLeft, currentCycle, playlistId }) {
        sessionState.duration     = duration * 60;
        sessionState.timeLeft     = timeLeft;
        sessionState.cyclesTotal  = cycles;
        sessionState.currentCycle = currentCycle;
        sessionState.playlistId   = playlistId;
        sessionState.status       = 'idle';
        TimerService._updateUI(sessionState.timeLeft);
    },

    // ── Start (async — waits for camera init) ─────────────────────────────────
    async start() {
        if (sessionState.status === 'running') return;

        sessionState.status = 'running';

        TimerService.start();
        VideoService.play();

        // Non-blocking — session runs even if camera is denied
        AttentionService.start().catch(err => {
            console.warn('Attention tracking unavailable:', err.message);
        });

        this._updateButtonUI('running');
        this._updateTimerStatus('🎯 Focus Time — Keep going!');
        console.log('🚀 SessionController: START');
    },

    // ── Pause ─────────────────────────────────────────────────────────────────
    pause() {
        if (sessionState.status !== 'running') return;

        sessionState.status = 'paused';

        TimerService.pause();
        VideoService.pause();
        AttentionService.pause();

        this._updateButtonUI('paused');
        this._updateTimerStatus('⏸ Paused');
        console.log('⏸️ SessionController: PAUSE');
    },

    // ── Resume ────────────────────────────────────────────────────────────────
    resume() {
        if (sessionState.status !== 'paused') return;

        sessionState.status = 'running';

        TimerService.resume();
        VideoService.play();
        AttentionService.resume();

        this._updateButtonUI('running');
        this._updateTimerStatus('🎯 Focus Time — Keep going!');
        console.log('▶️ SessionController: RESUME');
    },

    // ── Stop (full end) ───────────────────────────────────────────────────────
    stop() {
        sessionState.status = 'completed';

        TimerService.stop();
        VideoService.pause();
        AttentionService.stop();

        this._updateButtonUI('idle');
        this._updateTimerStatus('✅ Session Complete!');
        this._saveSessionLog();
        console.log('🏁 SessionController: STOP');
    },

    // ── Cycle Complete ────────────────────────────────────────────────────────
    onCycleComplete() {
        if (sessionState.currentCycle < sessionState.cyclesTotal) {
            sessionState.currentCycle++;
            sessionState.timeLeft = sessionState.duration;

            TimerService._updateUI(sessionState.timeLeft);
            this._updateSessionInfoUI();
            this._updateTimerStatus(`🔄 Cycle ${sessionState.currentCycle}/${sessionState.cyclesTotal} — Keep going!`);
            console.log(`🔄 Cycle ${sessionState.currentCycle} started`);
        } else {
            this.stop();
            if (typeof showSummaryModal === 'function') showSummaryModal();
        }
    },

    // ── Save log ──────────────────────────────────────────────────────────────
    _saveSessionLog() {
        const totalDurationSecs = sessionState.duration * sessionState.cyclesTotal;
        const completedSecs     = totalDurationSecs - Math.max(sessionState.timeLeft, 0);
        const completedMins     = Math.round(completedSecs / 60);
        const completed         = sessionState.timeLeft <= 0;

        const currentSession = (typeof StudySession !== 'undefined')
            ? StudySession.getCurrentSession() : null;

        if (currentSession) {
            StudySession.end(currentSession.sessionId, completedMins);
            const score = window.attentionTracker && window.attentionTracker.currentScore;
            if (score > 0) StudySession.addAttentionScore(currentSession.sessionId, score);
        }

        if (typeof SimpleAnalytics !== 'undefined') {
            const allScores      = (window.attentionTracker && window.attentionTracker.allScores) || [];
            const avgFocus       = allScores.length > 0
                ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
            const distractedCount = (window.attentionTracker && window.attentionTracker.distractedCount) || 0;
            const distractedMins  = Math.round((distractedCount * (AttentionService._intervalMs / 1000)) / 60);

            SimpleAnalytics.saveSession({
                sessionId:     currentSession ? currentSession.sessionId : `sess_${Date.now()}`,
                date:          new Date().toISOString().split('T')[0],
                duration:      completedMins,
                avgFocus,
                distractedTime: distractedMins,
                completed
            });
        }

        if (typeof SessionManager !== 'undefined') SessionManager.complete();
        console.log('💾 Session log saved');
    },

    // ── UI Helpers ────────────────────────────────────────────────────────────
    _updateButtonUI(status) {
        const startBtn  = document.getElementById('startTimerBtn');
        const pauseBtn  = document.getElementById('pauseTimerBtn');
        const resumeBtn = document.getElementById('resumeTimerBtn');
        if (!startBtn) return;

        if (status === 'running') {
            startBtn.style.display  = 'none';
            pauseBtn.style.display  = 'inline-block';
            if (resumeBtn) resumeBtn.style.display = 'none';
        } else if (status === 'paused') {
            startBtn.style.display  = 'none';
            pauseBtn.style.display  = 'none';
            if (resumeBtn) resumeBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display  = 'inline-block';
            pauseBtn.style.display  = 'none';
            if (resumeBtn) resumeBtn.style.display = 'none';
        }
    },

    _updateTimerStatus(msg) {
        const el = document.getElementById('timerStatus');
        if (el) el.textContent = msg;
    },

    _updateSessionInfoUI() {
        const el = document.getElementById('sessionInfoCurrent');
        if (el) el.textContent = sessionState.currentCycle;
    }
};

// ─── Tab Visibility — Auto Pause ─────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
    if (document.hidden && sessionState.status === 'running') {
        console.log('🌑 Tab hidden — auto-pausing session');
        SessionController.pause();
    }
});
