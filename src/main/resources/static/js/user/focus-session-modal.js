(function () {
    const STORAGE_KEY = "cognelearn_player_session";

    const FocusSessionModal = {
        playlistId: null,
        onStart: null,

        async init() {
            if (document.getElementById("focusSessionModal")) {
                this.bindEvents();
                return;
            }

            // Determine level depth prefix
            const pathname = window.location.pathname;
            const cleanPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
            const segments = cleanPath.split('/');
            if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
                segments.pop();
            }
            const depth = segments.filter(Boolean).length;
            const prefix = '../'.repeat(depth);

            try {
                const res = await fetch(prefix + 'fragment/focus-session-modal.html');
                if (!res.ok) throw new Error("Failed to fetch modal fragment");
                const html = await res.text();
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html.trim();
                const modalNode = tempDiv.firstChild;
                document.body.appendChild(modalNode);
                
                this.bindEvents();
            } catch (err) {
                console.error("Failed to load Focus Session Modal HTML:", err);
            }
        },

        bindEvents() {
            const modal = document.getElementById("focusSessionModal");
            const durationInput = document.getElementById("focusDurationInput");
            const cyclesInput = document.getElementById("focusCyclesInput");
            const summaryText = document.getElementById("focusSummaryText");
            const confirmBtn = document.getElementById("confirmFocusSessionBtn");
            const closeBtn = document.getElementById("closeFocusSessionModalBtn");
            const cancelBtn = document.getElementById("cancelFocusSessionModalBtn");
            const durationError = document.getElementById("focusDurationError");
            const cyclesError = document.getElementById("focusCyclesError");

            const validateInputs = () => {
                if (!durationInput || !cyclesInput) return;
                const duration = Number(durationInput.value);
                const cycles = Number(cyclesInput.value);

                const isDurationValid = Number.isFinite(duration) && duration >= 1;
                const isCyclesValid = Number.isFinite(cycles) && cycles >= 1;

                // Duration validation UI
                if (durationInput.value === "" || isDurationValid) {
                    durationInput.classList.remove("is-invalid");
                    if (durationError) durationError.classList.add("hidden");
                } else {
                    durationInput.classList.add("is-invalid");
                    if (durationError) durationError.classList.remove("hidden");
                }

                // Cycles validation UI
                if (cyclesInput.value === "" || isCyclesValid) {
                    cyclesInput.classList.remove("is-invalid");
                    if (cyclesError) cyclesError.classList.add("hidden");
                } else {
                    cyclesInput.classList.add("is-invalid");
                    if (cyclesError) cyclesError.classList.remove("hidden");
                }

                const currentConfirmBtn = document.getElementById("confirmFocusSessionBtn");
                if (currentConfirmBtn) {
                    currentConfirmBtn.disabled = !isDurationValid || !isCyclesValid;
                }
            };

            const updateSummary = () => {
                if (!durationInput || !cyclesInput || !summaryText) return;
                const duration = Math.max(5, Number(durationInput.value) || 25);
                const cycles = Math.max(1, Number(cyclesInput.value) || 1);
                summaryText.textContent = `~${duration * cycles} minutes`;
                validateInputs();
            };

            if (durationInput) durationInput.addEventListener("input", updateSummary);
            if (cyclesInput) cyclesInput.addEventListener("input", updateSummary);

            const close = () => {
                this.playlistId = null;
                if (modal) {
                    modal.classList.add("hidden");
                    modal.setAttribute("aria-hidden", "true");
                }
            };

            if (closeBtn) closeBtn.addEventListener("click", close);
            if (cancelBtn) cancelBtn.addEventListener("click", close);
            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) close();
                });
            }

            if (confirmBtn) {
                // Remove existing click listeners by cloning (if re-binding)
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

                newConfirmBtn.addEventListener("click", async () => {
                    const duration = Number(durationInput.value);
                    const cycles = Number(cyclesInput.value);

                    if (this.onStart) {
                        this.onStart({ playlistId: this.playlistId, duration, cycles });
                    } else {
                        // Default behavior: create session and navigate to player
                        try {
                            const session = await StudySession.create({
                                playlistId: this.playlistId,
                                duration,
                                cycles
                            });

                            let playlistName = "Selected Playlist";
                            if (window.Playlist && typeof Playlist.getById === "function") {
                                try {
                                    const pl = await Playlist.getById(this.playlistId);
                                    if (pl) {
                                        playlistName = pl.title || pl.name || "Selected Playlist";
                                    }
                                } catch (e) {
                                    console.warn("Failed to fetch playlist details", e);
                                }
                            }

                            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                                playlistId: this.playlistId,
                                playlistName: playlistName,
                                duration,
                                cycles,
                                currentCycle: 1,
                                remainingTime: duration * 60,
                                cyclesLeft: cycles,
                                startedAt: new Date().toISOString(),
                                status: "running",
                                updatedAt: new Date().toISOString(),
                                sessionId: session && session.sessionId ? session.sessionId : null
                            }));

                            // Save launch intent for player
                            localStorage.setItem("cognelearn_focus_launch_intent", JSON.stringify({
                                type: "new_session",
                                playlistId: this.playlistId,
                                sessionId: session && session.sessionId ? session.sessionId : null,
                                source: "setup_modal",
                                createdAt: new Date().toISOString()
                            }));

                            close();
                            
                            // Determine relative path to player.html
                            const pathname = window.location.pathname;
                            const isSubpage = pathname.includes('/pages/user/');
                            let target = isSubpage ? '../player.html' : 'pages/player.html';
                            
                            target += `?playlistId=${encodeURIComponent(this.playlistId || '')}`;
                            if (session && session.sessionId) {
                                target += `&sessionId=${encodeURIComponent(session.sessionId)}`;
                            }
                            window.location.href = target;
                        } catch (error) {
                            console.error(error);
                            alert(error && error.message ? error.message : "Failed to start session.");
                        }
                    }
                });
            }
        },

        open(playlistId, onStartCallback) {
            this.playlistId = playlistId || null;
            this.onStart = onStartCallback || null;

            const modal = document.getElementById("focusSessionModal");
            if (modal) {
                const durationInput = document.getElementById("focusDurationInput");
                const cyclesInput = document.getElementById("focusCyclesInput");
                const summaryText = document.getElementById("focusSummaryText");

                if (durationInput) durationInput.value = "25";
                if (cyclesInput) cyclesInput.value = "2";
                if (summaryText) summaryText.textContent = "~50 minutes";

                modal.classList.remove("hidden");
                modal.setAttribute("aria-hidden", "false");
            } else {
                this.init().then(() => {
                    this.open(playlistId, onStartCallback);
                });
            }
        },

        close() {
            const modal = document.getElementById("focusSessionModal");
            if (modal) {
                modal.classList.add("hidden");
                modal.setAttribute("aria-hidden", "true");
            }
        }
    };

    window.FocusSessionModal = FocusSessionModal;

    // Auto-init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FocusSessionModal.init());
    } else {
        FocusSessionModal.init();
    }
})();
