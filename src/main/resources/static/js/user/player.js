function initPlayer() {
    const DEFAULT_DURATION_MINUTES = 25;
    const DEFAULT_CYCLES = 2;
    const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, CUED: 5 };
    const STORAGE_KEY = "cognelearn_player_session";
    const LAUNCH_INTENT_KEY = "cognelearn_focus_launch_intent";

    const state = {
        playlistId: null,
        playlistName: "Untitled Playlist",
        playlistItems: [],
        currentIndex: 0,
        timerSeconds: DEFAULT_DURATION_MINUTES * 60,
        timerHandle: null,
        timerRunning: false,
        focusScore: 0,
        playerMode: "html5",
        currentVideoToken: 0,
        suppressPauseSync: false,
        sessionConfig: null,
        activeSessionId: null,
        completedCycles: 0,
        lastAttentionPersistedAt: 0,
        awaitingPlaybackStart: false,
        playbackStartTimeoutHandle: null,
        lifecycle: "IDLE"
    };

    const dom = {
        video: document.getElementById("mainVideo"),
        videoShell: document.querySelector(".video-shell"),
        playButton: document.getElementById("centerPlayButton"),
        playlist: document.getElementById("playlistContainer"),
        timerDisplay: document.getElementById("timerDisplay"),
        pauseButton: document.getElementById("pauseButton"),
        resetButton: document.getElementById("resetButton"),
        focusFill: document.getElementById("focusFill"),
        focusLabel: document.getElementById("focusLabel"),
        logoutLink: document.getElementById("logoutLink"),
        modal: document.getElementById("playerSessionModal"),
        modalClose: document.getElementById("playerModalClose"),
        modalDuration: document.getElementById("playerDurationInput"),
        modalCycles: document.getElementById("playerCyclesInput"),
        modalSummary: document.getElementById("playerSummaryText"),
        modalStart: document.getElementById("playerSessionStart"),
        modalCancel: document.getElementById("playerSessionCancel")
    };

    let youtubePlayer = null;
    let player = null;

    function getPlaylistIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("playlistId") || params.get("playlist") || null;
    }

    function formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    }

    function updateTimerUI() {
        dom.timerDisplay.textContent = formatTimer(state.timerSeconds);
        dom.pauseButton.textContent = state.timerRunning ? "Pause" : "Resume";
    }

    function setLifecycle(nextState) {
        state.lifecycle = nextState;
        console.log("[player] lifecycle ->", nextState);
    }

    function updateSessionSummary() {
        const minutes = Math.max(5, Number(dom.modalDuration.value) || DEFAULT_DURATION_MINUTES);
        const cycles = Math.max(1, Number(dom.modalCycles.value) || DEFAULT_CYCLES);
        dom.modalSummary.textContent = `~${minutes * cycles} minutes`;
    }

    function openSessionModal() {
        setLifecycle("IDLE");
        dom.modal.classList.remove("hidden");
        dom.modal.setAttribute("aria-hidden", "false");
        updateSessionSummary();
    }

    function closeSessionModal() {
        dom.modal.classList.add("hidden");
        dom.modal.setAttribute("aria-hidden", "true");
    }

    function readLaunchIntent() {
        const raw = localStorage.getItem(LAUNCH_INTENT_KEY);
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            console.error("Invalid player launch intent", error);
            return null;
        }
    }

    function clearLaunchIntent() {
        localStorage.removeItem(LAUNCH_INTENT_KEY);
    }

    function restoreSessionConfig() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.playlistId && String(parsed.playlistId) === String(state.playlistId)) {
                return parsed;
            }
        } catch (error) {
            console.error("Invalid player session config", error);
        }

        return null;
    }

    function getAnyStoredSessionConfig() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed && parsed.playlistId ? parsed : null;
        } catch (error) {
            console.error("Invalid player session config", error);
            return null;
        }
    }

    function getRedirectReason(context) {
        const reasons = [];
        if (!context.playlistId) {
            reasons.push("missing playlist");
        }
        if (!context.sessionConfig) {
            reasons.push("missing session config");
        }
        return reasons.join(", ") || "unknown";
    }

    function redirectToDashboard(reason) {
        console.warn("[player] Redirecting to dashboard because:", reason);
        clearLaunchIntent();
        window.location.href = "user/dashboard.html";
    }

    function resolveLaunchContext() {
        const playlistIdFromUrl = getPlaylistIdFromUrl();
        const launchIntent = readLaunchIntent();
        const storedSession = getAnyStoredSessionConfig();
        const playlistId = playlistIdFromUrl
            || (launchIntent && launchIntent.playlistId)
            || (storedSession && storedSession.playlistId)
            || null;

        state.playlistId = playlistId;
        const sessionConfig = playlistId ? restoreSessionConfig() : null;

        if (!playlistId || !sessionConfig) {
            return {
                valid: false,
                playlistId: playlistId,
                sessionConfig: sessionConfig,
                launchIntent: launchIntent
            };
        }

        return {
            valid: true,
            playlistId: playlistId,
            sessionConfig: sessionConfig,
            launchIntent: launchIntent
        };
    }

    function persistSessionConfig() {
        if (!state.sessionConfig) {
            return;
        }

        state.sessionConfig.remainingTime = state.timerSeconds;
        state.sessionConfig.cyclesLeft = Math.max(1, state.sessionConfig.cycles - state.completedCycles);
        state.sessionConfig.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessionConfig));
    }

    function clearSessionConfig() {
        state.sessionConfig = null;
        localStorage.removeItem(STORAGE_KEY);
        clearLaunchIntent();
    }

    function applySessionConfig(config) {
        state.sessionConfig = {
            playlistId: config.playlistId || state.playlistId,
            playlistName: config.playlistName || "Untitled Playlist",
            duration: Math.max(5, Number(config.duration) || DEFAULT_DURATION_MINUTES),
            cycles: Math.max(1, Number(config.cycles) || DEFAULT_CYCLES),
            currentCycle: Math.max(1, Number(config.currentCycle) || 1),
            remainingTime: Math.max(0, Number(config.remainingTime) || (Number(config.duration) || DEFAULT_DURATION_MINUTES) * 60),
            cyclesLeft: Math.max(1, Number(config.cyclesLeft) || Math.max(1, (Number(config.cycles) || DEFAULT_CYCLES) - ((Number(config.currentCycle) || 1) - 1))),
            startedAt: config.startedAt || new Date().toISOString(),
            status: config.status || "running",
            updatedAt: config.updatedAt || new Date().toISOString(),
            sessionId: config.sessionId || null
        };
        state.activeSessionId = state.sessionConfig.sessionId;
        state.completedCycles = Math.max(0, state.sessionConfig.currentCycle - 1);
        state.timerSeconds = state.sessionConfig.remainingTime;
        Pomodoro.WORK_TIME = state.sessionConfig.duration * 60;
        Pomodoro.state.timeLeft = state.timerSeconds;
        Pomodoro.state.sessionsCompleted = state.completedCycles;
        updateTimerUI();
        persistSessionConfig();
        setLifecycle("READY");
    }

    function setFocusUI(percent, status) {
        const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
        dom.focusFill.style.width = safePercent + "%";
        dom.focusFill.parentElement.setAttribute("aria-valuenow", String(safePercent));

        dom.focusFill.classList.remove("attention-good", "attention-mid", "attention-low");
        dom.focusLabel.classList.remove("attention-good", "attention-mid", "attention-low");

        if (status === "camera_error") {
            dom.focusLabel.textContent = "Camera unavailable";
            dom.focusFill.classList.add("attention-low");
            dom.focusLabel.classList.add("attention-low");
            return;
        }

        if (status === "paused" || status === "Paused") {
            dom.focusLabel.textContent = "Tracking Paused";
            return;
        }

        if (status === "camera_starting") {
            dom.focusLabel.textContent = "Initializing Camera...";
            return;
        }

        let labelText = "";
        if (status === "no_face_detected") {
            labelText = "No face detected";
        }

        let colorClass = "attention-low";
        if (safePercent >= 65) {
            colorClass = "attention-good";
        } else if (safePercent >= 20) {
            colorClass = "attention-mid";
        }

        dom.focusFill.classList.add(colorClass);
        dom.focusLabel.classList.add(colorClass);
        dom.focusLabel.textContent = labelText || (safePercent >= 65 ? "Focused" : safePercent >= 20 ? "Steady" : "Needs attention");
    }

    function parseYouTubeInfo(value) {
        if (!value) {
            return null;
        }
        const trimmed = String(value).trim();
        
        const videoMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (videoMatch) return { type: 'video', id: videoMatch[1] };
        
        const listMatch = trimmed.match(/[?&]list=([^"&?\/\s]+)/i);
        if (listMatch) return { type: 'playlist', id: listMatch[1] };
        
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return { type: 'video', id: trimmed };
        if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed)) return { type: 'playlist', id: trimmed };
        
        return null;
    }

    function normalizePlaylistVideos(playlistResponse) {
        const videos = (playlistResponse && playlistResponse.videos) || [];
        return videos.map(function (video, index) {
            const rawId = video.externalId || video.id;
            const ytInfo = parseYouTubeInfo(rawId);
            const isVideo = ytInfo && ytInfo.type === 'video';
            const isPlaylist = ytInfo && ytInfo.type === 'playlist';
            
            return {
                index: index,
                id: rawId,
                title: video.title || "Untitled video",
                subtitle: video.subtitle || (ytInfo ? (isPlaylist ? "YouTube Playlist" : "YouTube video") : "Playlist item"),
                kind: video.kind || "video",
                youtubeId: isVideo ? ytInfo.id : null,
                youtubePlaylistId: isPlaylist ? ytInfo.id : null,
                mediaUrl: video.url || video.mediaUrl || "",
                thumbnail: isVideo
                    ? "https://i.ytimg.com/vi/" + ytInfo.id + "/hqdefault.jpg"
                    : (isPlaylist ? "https://placehold.co/160x90/ff0000/ffffff?text=YT+Playlist" : "https://placehold.co/160x90?text=Video")
            };
        });
    }

    function renderPlaylist() {
        if (state.playlistItems.length === 0) {
            dom.playlist.innerHTML = '<div class="playlist-item"><div class="item-text"><div class="item-title">No videos in this playlist</div><div class="item-subtitle">Add videos from dashboard and try again.</div></div></div>';
            return;
        }

        dom.playlist.innerHTML = state.playlistItems.map(function (item, index) {
            const activeClass = state.currentIndex === index ? " active" : "";
            return "" +
                '<article class="playlist-item' + activeClass + '" data-index="' + index + '">' +
                '  <div class="thumb-wrap">' +
                '    <span class="thumb-index">' + (index + 1) + "</span>" +
                '    <img src="' + item.thumbnail + '" alt="' + item.title + '">' +
                "  </div>" +
                '  <div class="item-text">' +
                '    <div class="item-title">' + item.title + "</div>" +
                '    <div class="item-subtitle">' + item.subtitle + "</div>" +
                "  </div>" +
                "</article>";
        }).join("");

        const items = dom.playlist.querySelectorAll(".playlist-item[data-index]");
        items.forEach(function (node) {
            node.addEventListener("click", function () {
                const index = Number(node.getAttribute("data-index"));
                loadVideo(index, state.timerRunning);
            });
        });
    }

    function getYouTubeContainer() {
        let frame = document.getElementById("youtubeFrame");
        if (!frame) {
            frame = document.createElement("div");
            frame.id = "youtubeFrame";
            frame.style.width = "100%";
            frame.style.height = "100%";
            frame.style.position = "absolute";
            frame.style.left = "0";
            frame.style.top = "0";
            frame.style.display = "none";
            dom.videoShell.appendChild(frame);
        }
        return frame;
    }

    function syncPlayButton() {
        const shouldHide = state.playerMode === "youtube" || (state.timerRunning && player && !player.isPaused());
        dom.playButton.style.display = shouldHide ? "none" : "inline-flex";
    }

    function ensureYouTubeApi() {
        if (window.YT && window.YT.Player) {
            return Promise.resolve();
        }
        if (window.__cogneLearnYouTubePromise) {
            return window.__cogneLearnYouTubePromise;
        }
        window.__cogneLearnYouTubePromise = new Promise(function (resolve) {
            const existing = document.getElementById("youtube-iframe-api");
            if (!existing) {
                const script = document.createElement("script");
                script.id = "youtube-iframe-api";
                script.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(script);
            }
            const previousHandler = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () {
                if (typeof previousHandler === "function") {
                    previousHandler();
                }
                resolve();
            };
        });
        return window.__cogneLearnYouTubePromise;
    }

    function showHtml5Player() {
        state.playerMode = "html5";
        dom.video.style.display = "block";
        getYouTubeContainer().style.display = "none";
    }

    function showYouTubePlayer() {
        state.playerMode = "youtube";
        suppressPauseWhile(function () { dom.video.pause(); });
        dom.video.removeAttribute("src");
        dom.video.load();
        dom.video.style.display = "none";
        getYouTubeContainer().style.display = "block";
    }

    function startTimerInterval() {
        if (state.timerHandle) {
            return;
        }

        state.timerHandle = window.setInterval(function () {
            if (!state.timerRunning) {
                return;
            }

            if (state.timerSeconds <= 0) {
                state.timerSeconds = 0;
                updateTimerUI();
                completeCurrentCycle();
                return;
            }

            state.timerSeconds -= 1;
            if (state.sessionConfig) {
                state.sessionConfig.remainingTime = state.timerSeconds;
                persistSessionConfig();
            }
            Pomodoro.state.timeLeft = state.timerSeconds;
            updateTimerUI();
        }, 1000);
    }

    function stopTimerInterval() {
        if (state.timerHandle) {
            window.clearInterval(state.timerHandle);
            state.timerHandle = null;
        }
    }

    function persistAttentionSample(score) {
        if (!state.activeSessionId) {
            return;
        }

        const now = Date.now();
        if (now - state.lastAttentionPersistedAt < 5000) {
            return;
        }

        state.lastAttentionPersistedAt = now;
        StudySession.addAttentionScore(state.activeSessionId, score).catch(function (error) {
            console.error("Failed to save attention score", error);
        });
    }

    function applyAttentionResult(result) {
        state.focusScore = result && typeof result.level === "number" ? result.level : 0;
        setFocusUI(state.focusScore, result && result.status);
        if (state.timerRunning) {
            persistAttentionSample(state.focusScore);
        }
    }

    function startAttentionTracking() {
        if (typeof AttentionMonitor === "undefined") {
            return;
        }

        AttentionMonitor.setSessionRunning(true);
        setFocusUI(0, "camera_starting");
        AttentionMonitor.resume(applyAttentionResult).catch(function (error) {
            console.error("Attention tracking failed to start", error);
            applyAttentionResult({ level: 0, status: "camera_error" });
        });
    }

    function stopAttentionTracking() {
        if (typeof AttentionMonitor !== "undefined") {
            AttentionMonitor.setSessionRunning(false);
            AttentionMonitor.pause();
            setFocusUI(0, "paused");
        }
    }

    function suppressPauseWhile(task) {
        state.suppressPauseSync = true;
        try {
            task();
        } finally {
            window.setTimeout(function () {
                state.suppressPauseSync = false;
            }, 0);
        }
    }

    function setTimerRunning(shouldRun, options) {
        const syncPlayer = !options || options.syncPlayer !== false;
        console.log("[player] setTimerRunning", { shouldRun: shouldRun, syncPlayer: syncPlayer, timerRunning: state.timerRunning });
        if (typeof AttentionMonitor !== "undefined") {
            AttentionMonitor.setSessionRunning(shouldRun);
        }

        if (state.timerRunning === shouldRun) {
            updateTimerUI();
            if (syncPlayer && player) {
                shouldRun ? player.play() : suppressPauseWhile(function () { player.pause(); });
            }
            return;
        }

        state.timerRunning = shouldRun;
        setLifecycle(shouldRun ? "RUNNING" : "PAUSED");
        updateTimerUI();
        shouldRun ? startTimerInterval() : stopTimerInterval();
        shouldRun ? startAttentionTracking() : stopAttentionTracking();

        if (syncPlayer && player) {
            shouldRun ? player.play() : suppressPauseWhile(function () { player.pause(); });
        }

        if (state.activeSessionId) {
            const sessionAction = shouldRun ? StudySession.start(state.activeSessionId) : Api.patch(`/api/v1/sessions/${state.activeSessionId}/pause`, {});
            Promise.resolve(sessionAction).catch(function (error) {
                console.error("Failed to sync session state", error);
            });
        }
    }

    function ensureCurrentMediaReady() {
        if (state.playlistItems.length === 0) {
            return Promise.resolve(false);
        }

        return loadVideo(state.currentIndex, false).then(function () {
            setLifecycle("READY");
            console.log("[player] player ready", { index: state.currentIndex });
            return true;
        });
    }

    function requestSynchronizedRun(source) {
        console.log("[player] auto-start requested", {
            source: source,
            lifecycle: state.lifecycle,
            timerRunning: state.timerRunning
        });
        beginPlaybackStartWindow();
        setTimerRunning(true);
    }

    function clearPlaybackStartTimeout() {
        if (state.playbackStartTimeoutHandle) {
            window.clearTimeout(state.playbackStartTimeoutHandle);
            state.playbackStartTimeoutHandle = null;
        }
    }

    function beginPlaybackStartWindow() {
        state.awaitingPlaybackStart = true;
        clearPlaybackStartTimeout();
        state.playbackStartTimeoutHandle = window.setTimeout(function () {
            if (!state.awaitingPlaybackStart) {
                return;
            }
            handleAutoplayBlocked();
        }, 4000);
    }

    function resolvePlaybackStartWindow() {
        state.awaitingPlaybackStart = false;
        clearPlaybackStartTimeout();
    }

    function handleAutoplayBlocked() {
        resolvePlaybackStartWindow();
        setLifecycle("PAUSED");
        if (state.timerRunning) {
            setTimerRunning(false, { syncPlayer: false });
        } else {
            stopAttentionTracking();
        }
        syncPlayButton();
        dom.focusLabel.textContent = "Press play to begin your session";
    }

    function playNextVideo() {
        if (state.playlistItems.length === 0) {
            return;
        }
        loadVideo((state.currentIndex + 1) % state.playlistItems.length, state.timerRunning);
    }

    function createPlayerAdapter() {
        const listeners = { play: [], pause: [], ended: [] };
        let pendingYouTubeReady = null;

        function emit(name) {
            listeners[name].forEach(function (fn) { fn(); });
        }

        dom.video.addEventListener("play", function () { emit("play"); });
        dom.video.addEventListener("pause", function () { emit("pause"); });
        dom.video.addEventListener("ended", function () { emit("ended"); });

        function onYouTubeStateChange(event) {
            if (!event) {
                return;
            }
            if (event.data === YT_STATE.PLAYING) {
                if (pendingYouTubeReady) {
                    pendingYouTubeReady();
                    pendingYouTubeReady = null;
                }
                emit("play");
                return;
            }
            if (event.data === YT_STATE.PAUSED) {
                emit("pause");
                return;
            }
            if (event.data === YT_STATE.CUED) {
                if (pendingYouTubeReady) {
                    pendingYouTubeReady();
                    pendingYouTubeReady = null;
                }
                return;
            }
            if (event.data === YT_STATE.ENDED) {
                emit("ended");
            }
        }

        function ensureYouTubePlayer(item, autoplay) {
            const frame = getYouTubeContainer();
            return ensureYouTubeApi().then(function () {
                return new Promise(function (resolve) {
                    if (!youtubePlayer) {
                        const playerOpts = {
                            width: "100%",
                            height: "100%",
                            host: "https://www.youtube-nocookie.com",
                            playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, playsinline: 1, modestbranding: 1 },
                            events: { onReady: resolve, onStateChange: onYouTubeStateChange }
                        };
                        
                        if (item.youtubeId) {
                            playerOpts.videoId = item.youtubeId;
                        } else if (item.youtubePlaylistId) {
                            playerOpts.playerVars.listType = 'playlist';
                            playerOpts.playerVars.list = item.youtubePlaylistId;
                        }
                        
                        youtubePlayer = new YT.Player(frame.id, playerOpts);
                        return;
                    }
                    resolve();
                });
            }).then(function () {
                return new Promise(function (resolve) {
                    pendingYouTubeReady = resolve;
                    if (item.youtubePlaylistId) {
                        if (autoplay && youtubePlayer && youtubePlayer.loadPlaylist) {
                            youtubePlayer.loadPlaylist({ list: item.youtubePlaylistId });
                            return;
                        }
                        if (youtubePlayer && youtubePlayer.cuePlaylist) {
                            youtubePlayer.cuePlaylist({ list: item.youtubePlaylistId });
                            return;
                        }
                    } else if (item.youtubeId) {
                        if (autoplay && youtubePlayer && youtubePlayer.loadVideoById) {
                            youtubePlayer.loadVideoById(item.youtubeId);
                            return;
                        }
                        if (youtubePlayer && youtubePlayer.cueVideoById) {
                            youtubePlayer.cueVideoById(item.youtubeId);
                            return;
                        }
                    }
                    resolve();
                });
            });
        }

        return {
            on: function (name, fn) {
                if (listeners[name]) {
                    listeners[name].push(fn);
                }
            },
            load: function (item, autoplay) {
                const token = ++state.currentVideoToken;
                if (item.youtubeId || item.youtubePlaylistId) {
                    showYouTubePlayer();
                    return ensureYouTubePlayer(item, autoplay).then(function () { return token; });
                }
                showHtml5Player();
                dom.video.poster = item.thumbnail;
                dom.video.src = item.mediaUrl || "";
                dom.video.load();
                if (!item.mediaUrl) {
                    syncPlayButton();
                    return Promise.resolve(token);
                }

                return new Promise(function (resolve) {
                    const handleReady = function () {
                        dom.video.removeEventListener("canplay", handleReady);
                        dom.video.removeEventListener("loadedmetadata", handleReady);
                        resolve(token);
                    };

                    dom.video.addEventListener("canplay", handleReady, { once: true });
                    dom.video.addEventListener("loadedmetadata", handleReady, { once: true });
                });
            },
            play: function () {
                if (state.playerMode === "youtube") {
                    if (youtubePlayer && youtubePlayer.playVideo) {
                        if (youtubePlayer.unMute) {
                            youtubePlayer.unMute();
                        }
                        youtubePlayer.playVideo();
                    }
                    return Promise.resolve(true);
                }
                if (dom.video.src) {
                    dom.video.muted = false;
                    return dom.video.play().then(function () {
                        return true;
                    }).catch(function (error) {
                        console.warn("Playback failed or was blocked:", error);
                        syncPlayButton();
                        return false;
                    });
                }
                return Promise.resolve(false);
            },
            pause: function () {
                if (state.playerMode === "youtube") {
                    if (youtubePlayer && youtubePlayer.pauseVideo) {
                        youtubePlayer.pauseVideo();
                    }
                    return;
                }
                dom.video.pause();
            },
            isPaused: function () {
                if (state.playerMode === "youtube") {
                    return !youtubePlayer || !youtubePlayer.getPlayerState || youtubePlayer.getPlayerState() !== YT_STATE.PLAYING;
                }
                return dom.video.paused;
            }
        };
    }

    function loadVideo(index, shouldAutoplay) {
        if (index < 0 || index >= state.playlistItems.length || !player) {
            return Promise.resolve(false);
        }
        state.currentIndex = index;
        renderPlaylist();
        console.log("[player] loadVideo", { index: index, shouldAutoplay: shouldAutoplay });
        return player.load(state.playlistItems[index], shouldAutoplay).then(function (token) {
            if (token !== state.currentVideoToken) {
                return false;
            }
            if (!shouldAutoplay && !state.timerRunning) {
                suppressPauseWhile(function () { player.pause(); });
            }
            syncPlayButton();
            return true;
        });
    }

    function handlePlayerPlay() {
        resolvePlaybackStartWindow();
        console.log("[player] player play success", { lifecycle: state.lifecycle, timerRunning: state.timerRunning });
        syncPlayButton();
        if (!state.timerRunning && state.sessionConfig) {
            console.log("[player] resume handler invoked");
            setTimerRunning(true, { syncPlayer: false });
        }
        startAttentionTracking();
    }

    function handlePlayerPause() {
        syncPlayButton();
        if (state.suppressPauseSync) {
            return;
        }
        if (state.awaitingPlaybackStart) {
            return;
        }
        if (state.timerRunning) {
            setTimerRunning(false, { syncPlayer: false });
        }
    }

    function handlePlayerEnded() {
        syncPlayButton();
        playNextVideo();
    }

    function resetTimer() {
        if (!state.sessionConfig) {
            openSessionModal();
            return;
        }
        state.timerSeconds = state.sessionConfig.duration * 60;
        state.sessionConfig.remainingTime = state.timerSeconds;
        Pomodoro.state.timeLeft = state.timerSeconds;
        updateTimerUI();
        persistSessionConfig();
        setTimerRunning(false);
    }

    async function handleLogout(event) {
        event.preventDefault();
        clearSessionConfig();
        if (typeof Auth !== "undefined" && Auth.logout) {
            await Auth.logout();
            return;
        }
        window.location.replace("auth/login.html");
    }

    function showPlaylistLoadError(message) {
        dom.playlist.innerHTML = '<div class="playlist-item"><div class="item-text"><div class="item-title">Failed to load playlist</div><div class="item-subtitle">' + message + "</div></div></div>";
    }

    async function loadPlaylistFromServer() {
        if (!state.playlistId) {
            dom.playlist.innerHTML = '<div class="playlist-item"><div class="item-text"><div class="item-title">No playlist selected</div><div class="item-subtitle">Start the timer and add a playlist from the dashboard when you are ready.</div></div></div>';
            return;
        }

        try {
            await Api.get("/api/v1/auth/me");
            const playlist = await Playlist.getById(state.playlistId);
            state.playlistName = playlist.title || playlist.name || "Untitled Playlist";
            state.playlistItems = normalizePlaylistVideos(playlist);
            renderPlaylist();
            if (state.playlistItems.length > 0) {
                loadVideo(0, false);
            }
        } catch (error) {
            if (error && (error.status === 401 || error.status === 403)) {
                window.location.href = "auth/login.html";
                return;
            }
            showPlaylistLoadError(error && error.message ? error.message : "Please try again.");
        }
    }

    function saveCompletedSessionToHistory(session) {
        StudySession.recordSessionHistory(session);
    }

    async function completeCurrentCycle() {
        setTimerRunning(false);
        state.completedCycles += 1;

        if (state.activeSessionId) {
            try {
                const completedSession = await StudySession.end(state.activeSessionId, state.sessionConfig.duration);
                saveCompletedSessionToHistory(completedSession);
            } catch (error) {
                console.error("Failed to complete session", error);
            }
        }

        if (!state.sessionConfig) {
            return;
        }

        if (state.completedCycles >= state.sessionConfig.cycles) {
            clearSessionConfig();
            alert("Focus session complete. Great work.");
            return;
        }

        try {
            const nextSession = await StudySession.create({
                playlistId: state.playlistId,
                duration: state.sessionConfig.duration,
                cycles: state.sessionConfig.cycles
            });

            state.sessionConfig.currentCycle = state.completedCycles + 1;
            state.sessionConfig.remainingTime = state.sessionConfig.duration * 60;
            state.sessionConfig.cyclesLeft = Math.max(1, state.sessionConfig.cycles - state.completedCycles);
            state.sessionConfig.startedAt = new Date().toISOString();
            state.sessionConfig.updatedAt = new Date().toISOString();
            state.sessionConfig.sessionId = nextSession.sessionId;
            state.activeSessionId = nextSession.sessionId;
            state.timerSeconds = state.sessionConfig.remainingTime;
            Pomodoro.state.timeLeft = state.timerSeconds;
            persistSessionConfig();
            updateTimerUI();
            if (state.playlistItems.length > 0) {
                await ensureCurrentMediaReady();
                requestSynchronizedRun("cycle_continue");
            }
        } catch (error) {
            console.error("Failed to create next cycle", error);
            alert("The next focus cycle could not be started.");
        }
    }

    async function beginConfiguredSession() {
        const duration = Number(dom.modalDuration.value);
        const cycles = Number(dom.modalCycles.value);

        if (!Number.isFinite(duration) || duration < 5) {
            alert("Study duration must be at least 5 minutes.");
            dom.modalDuration.focus();
            return;
        }

        if (!Number.isFinite(cycles) || cycles < 1) {
            alert("Number of sessions must be at least 1.");
            dom.modalCycles.focus();
            return;
        }

        try {
            const created = await StudySession.create({
                playlistId: state.playlistId,
                duration: duration,
                cycles: cycles
            });

            applySessionConfig({
                playlistId: state.playlistId,
                playlistName: state.playlistName,
                duration: duration,
                cycles: cycles,
                currentCycle: 1,
                remainingTime: duration * 60,
                cyclesLeft: cycles,
                startedAt: new Date().toISOString(),
                status: "running",
                updatedAt: new Date().toISOString(),
                sessionId: created.sessionId
            });

            localStorage.setItem(LAUNCH_INTENT_KEY, JSON.stringify({
                type: "new_session",
                playlistId: state.playlistId,
                sessionId: created.sessionId,
                source: "player_modal",
                createdAt: new Date().toISOString()
            }));

            closeSessionModal();
            if (state.playlistItems.length > 0) {
                await ensureCurrentMediaReady();
                requestSynchronizedRun("new_session");
            } else {
                handleAutoplayBlocked();
            }
        } catch (error) {
            console.error(error);
            alert(error && error.message ? error.message : "Failed to start session.");
        }
    }

    function bindEvents() {
        dom.playButton.addEventListener("click", function () {
            if (!state.sessionConfig) {
                openSessionModal();
                return;
            }
            console.log("[player] resume handler invoked");
            requestSynchronizedRun("manual_resume");
        });

        dom.pauseButton.addEventListener("click", function () {
            if (!state.sessionConfig) {
                openSessionModal();
                return;
            }
            setTimerRunning(!state.timerRunning);
        });

        dom.resetButton.addEventListener("click", resetTimer);
        if (dom.logoutLink) {
            dom.logoutLink.addEventListener("click", handleLogout);
        }
        dom.modalStart.addEventListener("click", beginConfiguredSession);
        dom.modalCancel.addEventListener("click", function () {
            closeSessionModal();
            if (!state.sessionConfig) {
                redirectToDashboard("session setup canceled before a valid session existed");
            }
        });
        dom.modalClose.addEventListener("click", function () {
            closeSessionModal();
            if (!state.sessionConfig) {
                redirectToDashboard("session setup closed before a valid session existed");
            }
        });
        dom.modal.addEventListener("click", function (event) {
            if (event.target === dom.modal) {
                closeSessionModal();
            }
        });
        dom.modalDuration.addEventListener("input", updateSessionSummary);
        dom.modalCycles.addEventListener("input", updateSessionSummary);

        window.addEventListener("beforeunload", function () {
            if (typeof AttentionMonitor !== "undefined") {
                AttentionMonitor.stop();
            }
            if (state.sessionConfig) {
                state.sessionConfig.remainingTime = state.timerSeconds;
                persistSessionConfig();
            }
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden && state.timerRunning) {
                setTimerRunning(false);
            }
        });
    }

    async function init() {
        const launchContext = resolveLaunchContext();
        console.log("[player] init source", {
            playlistIdFromUrl: getPlaylistIdFromUrl(),
            resolvedPlaylistId: launchContext.playlistId,
            launchIntent: launchContext.launchIntent
        });

        if (!launchContext.valid) {
            redirectToDashboard(getRedirectReason(launchContext));
            return;
        }

        setLifecycle("LOADING");
        player = createPlayerAdapter();
        player.on("play", handlePlayerPlay);
        player.on("pause", handlePlayerPause);
        player.on("ended", handlePlayerEnded);
        bindEvents();
        updateTimerUI();
        updateSessionSummary();
        setFocusUI(state.focusScore, "camera_starting");
        applySessionConfig(launchContext.sessionConfig);
        await loadPlaylistFromServer();
        await ensureCurrentMediaReady();
        requestSynchronizedRun("resume_or_restore");
    }

    init();
}

if (document.readyState === 'loading' || (document.getElementById('sidebar-container') && !document.getElementById('sidebar-container').innerHTML)) {
    document.addEventListener('componentsLoaded', initPlayer);
} else {
    initPlayer();
}
