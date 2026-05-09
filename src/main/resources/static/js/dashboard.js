(function () {
    const state = {
        dashboard: null,
        sessions: [],
        playlists: [],
        chart: null,
        selectedRange: "week",
        analyticsLoaded: false,
        showAllSessions: false,
        showAllPlaylists: false,
        playlistItems: [],
        isAddingPlaylistItem: false,
        editingPlaylistId: null,
        pendingFocusPlaylistId: null,
        pendingFocusIntent: null,
        conflictTargetPlaylistId: null
    };

    const PLAYER_SESSION_STORAGE_KEY = "cognelearn_player_session";
    const PLAYER_LAUNCH_INTENT_KEY = "cognelearn_focus_launch_intent";

    const goals = {
        sessions: 3,
        minutes: 60
    };

    const dom = {
        body: document.body,
        userName: document.getElementById("userName"),
        currentDateTime: document.getElementById("currentDateTime"),
        todaySessions: document.getElementById("todaySessions"),
        todayFocus: document.getElementById("todayFocus"),
        totalFocusHours: document.getElementById("totalFocusHours"),
        totalSessions: document.getElementById("totalSessions"),
        avgAttention: document.getElementById("avgAttention"),
        dayStreak: document.getElementById("dayStreak"),
        todayMinutesPercent: document.getElementById("todayMinutesPercent"),
        todaySessionsPercent: document.getElementById("todaySessionsPercent"),
        todayMinutesProgress: document.getElementById("todayMinutesProgress"),
        todaySessionsProgress: document.getElementById("todaySessionsProgress"),
        journeyBanner: document.getElementById("journeyBanner"),
        recentSessionsBody: document.getElementById("recentSessionsBody"),
        playlistList: document.getElementById("playlistList"),
        startFocusBtn: document.getElementById("startFocusBtn"),
        sidebarFocusSessionBtn: document.getElementById("sidebarFocusSessionBtn"),
        addPlaylistTrigger: document.getElementById("addPlaylistTrigger"),
        themeToggle: document.getElementById("themeToggle"),
        menuToggle: document.getElementById("menuToggle"),
        appSidebar: document.getElementById("appSidebar"),
        appOverlay: document.getElementById("appOverlay"),
        analyticsSection: document.getElementById("analyticsSection"),
        floatingAnalyticsBtn: document.getElementById("floatingAnalyticsBtn"),
        showMoreSessionsBtn: document.getElementById("showMoreSessionsBtn"),
        showMorePlaylistsBtn: document.getElementById("showMorePlaylistsBtn"),
        playlistModal: document.getElementById("playlistModal"),
        editPlaylistModal: document.getElementById("editPlaylistModal"),
        editPlaylistTitle: document.getElementById("editPlaylistTitle"),
        playlistName: document.getElementById("playlistName"),
        videoUrlInput: document.getElementById("videoUrlInput"),
        addVideoBtn: document.getElementById("addVideoBtn"),
        videoInputError: document.getElementById("videoInputError"),
        videoInputStatus: document.getElementById("videoInputStatus"),
        addedVideosList: document.getElementById("addedVideosList"),
        addedVideosSummary: document.getElementById("addedVideosSummary"),
        addVideoLinks: document.getElementById("addVideoLinks"),
        removeVideoLinks: document.getElementById("removeVideoLinks"),
        focusSessionModal: document.getElementById("focusSessionModal"),
        focusDurationInput: document.getElementById("focusDurationInput"),
        focusCyclesInput: document.getElementById("focusCyclesInput"),
        focusSummaryText: document.getElementById("focusSummaryText"),
        confirmFocusSessionBtn: document.getElementById("confirmFocusSessionBtn"),
        playlistSelectorModal: document.getElementById("playlistSelectorModal"),
        playlistSelectorList: document.getElementById("playlistSelectorList"),
        resumeSessionModal: document.getElementById("resumeSessionModal"),
        resumeSessionSummary: document.getElementById("resumeSessionSummary"),
        resumeSessionBtn: document.getElementById("resumeSessionBtn"),
        startNewSessionBtn: document.getElementById("startNewSessionBtn"),
        conflictSessionModal: document.getElementById("conflictSessionModal"),
        conflictSessionHint: document.getElementById("conflictSessionHint"),
        previousSessionPlaylist: document.getElementById("previousSessionPlaylist"),
        previousSessionMeta: document.getElementById("previousSessionMeta"),
        currentSessionPlaylist: document.getElementById("currentSessionPlaylist"),
        startCurrentConflictBtn: document.getElementById("startCurrentConflictBtn"),
        resumePreviousConflictBtn: document.getElementById("resumePreviousConflictBtn"),
        discardPreviousConflictBtn: document.getElementById("discardPreviousConflictBtn"),
        chartCanvas: document.getElementById("focusAnalyticsChart"),
        segments: Array.from(document.querySelectorAll(".segment"))
    };

    function clampPercentage(value) {
        return Math.max(0, Math.min(100, value));
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function setProgress(node, percentage) {
        if (node) {
            node.style.width = `${clampPercentage(percentage)}%`;
        }
    }

    function getSessionDate(session) {
        return session.date || session.startTime || session.createdAt || null;
    }

    function getSessionDuration(session) {
        return session.completedDuration || session.duration || 0;
    }

    function getSessionAttentionAverage(session) {
        if (typeof session.avgFocus === "number") {
            return session.avgFocus;
        }

        if (Array.isArray(session.attentionScores) && session.attentionScores.length > 0) {
            const total = session.attentionScores.reduce((sum, score) => sum + (Number(score) || 0), 0);
            return Math.round(total / session.attentionScores.length);
        }

        return 0;
    }

    function getCurrentUserFirstName(me) {
        if (me && me.name) {
            return me.name.split(" ")[0];
        }

        const cached = Auth.getCurrentUser();
        if (cached && cached.name) {
            return cached.name.split(" ")[0];
        }

        return "User";
    }

    async function ensureLoggedIn() {
        try {
            const me = await Api.get("/api/v1/auth/me");
            localStorage.setItem("cognelearn_user", JSON.stringify(me));
            dom.userName.textContent = getCurrentUserFirstName(me);
            return true;
        } catch (error) {
            localStorage.removeItem("cognelearn_user");
            window.location.href = "login.html";
            return false;
        }
    }

    function updateDateTime() {
        const now = new Date();
        dom.currentDateTime.textContent = now.toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function extractDashboardValue(dashboard, primaryKey, fallbackKey) {
        if (!dashboard) {
            return 0;
        }

        if (typeof dashboard[primaryKey] === "number") {
            return dashboard[primaryKey];
        }

        if (fallbackKey && typeof dashboard[fallbackKey] === "number") {
            return dashboard[fallbackKey];
        }

        return 0;
    }

    function renderDashboardMetrics() {
        const dashboard = state.dashboard || {};
        const todayMinutes = extractDashboardValue(dashboard, "todayFocusMinutes");
        const totalMinutes = extractDashboardValue(dashboard, "totalFocusMinutes");
        const totalSessions = extractDashboardValue(dashboard, "totalSessions");
        const avgAttention = extractDashboardValue(dashboard, "avgAttention", "avgAttentionScore");
        const dayStreak = extractDashboardValue(dashboard, "streak", "maxStreak");
        const todaySessions = Math.min(totalSessions, goals.sessions);

        dom.todaySessions.textContent = todaySessions;
        dom.todayFocus.textContent = todayMinutes;
        dom.totalFocusHours.textContent = `${totalMinutes}m`;
        dom.totalSessions.textContent = totalSessions;
        dom.avgAttention.textContent = `${avgAttention}%`;
        dom.dayStreak.textContent = dayStreak;

        const minutesPercent = clampPercentage((todayMinutes / goals.minutes) * 100);
        const sessionsPercent = clampPercentage((todaySessions / goals.sessions) * 100);

        dom.todayMinutesPercent.textContent = `${Math.round(minutesPercent)}%`;
        dom.todaySessionsPercent.textContent = `${Math.round(sessionsPercent)}%`;
        setProgress(dom.todayMinutesProgress, minutesPercent);
        setProgress(dom.todaySessionsProgress, sessionsPercent);

        dom.journeyBanner.style.display = totalSessions > 0 ? "none" : "flex";
    }

    function formatShortDate(isoDate) {
        if (!isoDate) {
            return "-";
        }

        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
    }

    function formatShortTime(isoDate) {
        if (!isoDate) {
            return "-";
        }

        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    async function renderRecentSessions() {
        if (state.sessions.length === 0) {
            dom.recentSessionsBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">--</div>
                    <p>No sessions yet. Start your first focus session!</p>
                </div>
            `;
            dom.showMoreSessionsBtn.classList.add("hidden");
            return;
        }

        const visibleSessions = state.showAllSessions ? state.sessions : state.sessions.slice(0, 2);

        dom.recentSessionsBody.innerHTML = visibleSessions.map((session) => {
            const duration = getSessionDuration(session);
            const completed = session.completed === true || session.status === "completed" || session.status === "COMPLETED";
            const statusClass = completed ? "" : "is-incomplete";
            const statusLabel = completed ? "Completed" : "In Progress";
            const sessionDate = getSessionDate(session);

            return `
                <div class="session-row">
                    <div class="session-row__primary">
                        <div class="session-row__date">${formatShortDate(sessionDate)}</div>
                        <div class="session-row__time">${formatShortTime(sessionDate)}</div>
                    </div>
                    <div class="session-row__meta">${duration}m</div>
                    <div class="session-row__meta">${getSessionAttentionAverage(session)}% attention</div>
                    <div class="session-badge ${statusClass}">${statusLabel}</div>
                </div>
            `;
        }).join("");

        const hasMoreSessions = state.sessions.length > 2;
        dom.showMoreSessionsBtn.classList.toggle("hidden", !hasMoreSessions);
        dom.showMoreSessionsBtn.textContent = state.showAllSessions ? "Show Less" : "Show More";

        const sessionsWrap = dom.recentSessionsBody && dom.recentSessionsBody.closest
            ? dom.recentSessionsBody.closest(".scroll-row-wrap")
            : null;
        if (sessionsWrap) {
            sessionsWrap.classList.toggle("is-expanded", Boolean(state.showAllSessions && hasMoreSessions));
        }
    }

    function getPlaylistDisplayTitle(playlist) {
        return playlist.title || playlist.name || "Untitled Playlist";
    }

    function getPlaylistVideoCount(playlist) {
        return Array.isArray(playlist.videos) ? playlist.videos.length : 0;
    }

    function getPlaylistId(playlist) {
        return playlist.playlistId || playlist.id;
    }

    async function loadPlaylists() {
        const playlists = await Playlist.getAll();
        state.playlists = Array.isArray(playlists) ? playlists : [];

        if (!state.playlists.length) {
            dom.playlistList.innerHTML = '<p class="playlist-empty">No playlists yet. Add one to get started!</p>';
            dom.showMorePlaylistsBtn.classList.add("hidden");
            return;
        }

        const visiblePlaylists = state.showAllPlaylists ? state.playlists : state.playlists.slice(0, 2);

        dom.playlistList.innerHTML = visiblePlaylists.map((playlist) => {
            const playlistId = JSON.stringify(getPlaylistId(playlist));
            const title = getPlaylistDisplayTitle(playlist);
            const safeTitle = JSON.stringify(title);
            const escapedTitle = escapeHtml(title);
            const videoCount = getPlaylistVideoCount(playlist);

            return `
                <article class="playlist-card">
                    <div class="playlist-info">
                        <div>
                            <div class="playlist-title">${escapedTitle}</div>
                            <div class="playlist-meta">${videoCount} video${videoCount === 1 ? "" : "s"} for focus mode</div>
                        </div>
                        <div class="playlist-actions">
                            <button class="btn btn-primary btn-small" type="button" onclick='openFocusSessionModal(${playlistId})'>Focus Session</button>
                            <button class="btn btn-secondary btn-small" type="button" onclick='showEditPlaylistModal(${playlistId}, ${safeTitle})'>Edit</button>
                            <button class="btn btn-secondary btn-small" type="button" onclick='deletePlaylist(${playlistId}, ${safeTitle})'>Delete</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        const hasMorePlaylists = state.playlists.length > 2;
        dom.showMorePlaylistsBtn.classList.toggle("hidden", !hasMorePlaylists);
        dom.showMorePlaylistsBtn.textContent = state.showAllPlaylists ? "Show Less" : "Show More";

        if (dom.playlistList && dom.playlistList.classList) {
            dom.playlistList.classList.toggle("is-expanded", Boolean(state.showAllPlaylists && hasMorePlaylists));
        }
    }

    function aggregateWeekly(sessions) {
        const buckets = [];

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - offset);
            buckets.push({
                key: date.toISOString().slice(0, 10),
                label: date.toLocaleDateString("en-US", { weekday: "short" }),
                minutes: 0,
                focusTotal: 0,
                count: 0
            });
        }

        sessions.forEach((session) => {
            const date = new Date(getSessionDate(session));
            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key = date.toISOString().slice(0, 10);
            const bucket = buckets.find((item) => item.key === key);
            if (!bucket) {
                return;
            }

            bucket.minutes += getSessionDuration(session);
            bucket.focusTotal += getSessionAttentionAverage(session);
            bucket.count += 1;
        });

        return {
            labels: buckets.map((bucket) => bucket.label),
            minutesSeries: buckets.map((bucket) => bucket.minutes),
            attentionSeries: buckets.map((bucket) => bucket.count > 0 ? Math.round(bucket.focusTotal / bucket.count) : 0)
        };
    }

    function aggregateMonthly(sessions) {
        const buckets = [];

        for (let offset = 29; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - offset);
            buckets.push({
                key: date.toISOString().slice(0, 10),
                label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                minutes: 0,
                focusTotal: 0,
                count: 0
            });
        }

        sessions.forEach((session) => {
            const date = new Date(getSessionDate(session));
            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key = date.toISOString().slice(0, 10);
            const bucket = buckets.find((item) => item.key === key);
            if (!bucket) {
                return;
            }

            bucket.minutes += getSessionDuration(session);
            bucket.focusTotal += getSessionAttentionAverage(session);
            bucket.count += 1;
        });

        return {
            labels: buckets.map((bucket) => bucket.label),
            minutesSeries: buckets.map((bucket) => bucket.minutes),
            attentionSeries: buckets.map((bucket) => bucket.count > 0 ? Math.round(bucket.focusTotal / bucket.count) : 0)
        };
    }

    function loadAnalyticsData() {
        return state.selectedRange === "month"
            ? aggregateMonthly(state.sessions || [])
            : aggregateWeekly(state.sessions || []);
    }

    function renderAnalyticsChart() {
        if (!state.analyticsLoaded) {
            return;
        }

        if (!dom.chartCanvas || typeof Chart === "undefined") {
            return;
        }

        const { labels, minutesSeries, attentionSeries } = loadAnalyticsData();
        const computed = getComputedStyle(document.body);
        const primary = computed.getPropertyValue("--dashboard-primary").trim() || "#4f7cff";
        const success = computed.getPropertyValue("--dashboard-success").trim() || "#22c55e";
        const muted = computed.getPropertyValue("--dashboard-muted").trim() || "#6b7280";
        const border = computed.getPropertyValue("--dashboard-border").trim() || "#e5e7eb";

        if (state.chart) {
            state.chart.destroy();
        }

        state.chart = new Chart(dom.chartCanvas, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Focus Time (min)",
                        data: minutesSeries,
                        borderColor: primary,
                        backgroundColor: "rgba(79, 124, 255, 0.12)",
                        borderWidth: 3,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.38,
                        yAxisID: "y"
                    },
                    {
                        label: "Attention %",
                        data: attentionSeries,
                        borderColor: success,
                        backgroundColor: "rgba(34, 197, 94, 0.12)",
                        borderWidth: 3,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.38,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: "top",
                        align: "center",
                        labels: {
                            color: muted,
                            usePointStyle: true,
                            boxWidth: 10,
                            boxHeight: 10,
                            padding: 18,
                            font: {
                                family: "Inter",
                                weight: 600
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: muted,
                            font: {
                                family: "Inter"
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: border
                        },
                        ticks: {
                            color: muted,
                            font: {
                                family: "Inter"
                            }
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: 100,
                        position: "right",
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            color: muted,
                            font: {
                                family: "Inter"
                            }
                        }
                    }
                }
            }
        });
    }

    function openModal(modal) {
        if (!modal) {
            return;
        }
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    }

    function openSidebar() {
        dom.appSidebar.classList.add("is-open");
        dom.appOverlay.classList.add("is-visible");
    }

    function closeSidebar() {
        dom.appSidebar.classList.remove("is-open");
        dom.appOverlay.classList.remove("is-visible");
    }

    function toggleDrawer() {
        if (window.innerWidth <= 960) {
            if (dom.appSidebar.classList.contains("is-open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
            return;
        }

        dom.body.classList.toggle("sidebar-collapsed");
    }

    function toggleAnalyticsPanel() {
        state.analyticsLoaded = !state.analyticsLoaded;
        dom.analyticsSection.classList.toggle("hidden", !state.analyticsLoaded);
        if (dom.floatingAnalyticsBtn) {
            dom.floatingAnalyticsBtn.classList.toggle("is-active", state.analyticsLoaded);
            dom.floatingAnalyticsBtn.setAttribute("aria-expanded", String(state.analyticsLoaded));
            dom.floatingAnalyticsBtn.setAttribute("title", state.analyticsLoaded ? "Hide Focus Analytics" : "Show Focus Analytics");
        }

        if (state.analyticsLoaded) {
            renderAnalyticsChart();
            dom.analyticsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function bindEvents() {
        if (dom.startFocusBtn) {
            dom.startFocusBtn.addEventListener("click", function () {
                handleFocusSessionLaunch(null, "hero_cta");
            });
        }

        if (dom.sidebarFocusSessionBtn) {
            dom.sidebarFocusSessionBtn.addEventListener("click", function () {
                handleFocusSessionLaunch(null, "sidebar");
            });
        }

        if (dom.addPlaylistTrigger) {
            dom.addPlaylistTrigger.addEventListener("click", showAddPlaylistModal);
        }

        if (dom.addVideoBtn) {
            dom.addVideoBtn.addEventListener("click", function () {
                addPlaylistItemFromInput(dom.videoUrlInput.value);
            });
        }

        if (dom.videoUrlInput) {
            dom.videoUrlInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addPlaylistItemFromInput(dom.videoUrlInput.value);
                }
            });

            dom.videoUrlInput.addEventListener("paste", function () {
                window.setTimeout(function () {
                    const value = dom.videoUrlInput.value.trim();
                    if (value && !state.isAddingPlaylistItem) {
                        addPlaylistItemFromInput(value);
                    }
                }, 0);
            });
        }

        if (dom.themeToggle) {
            dom.themeToggle.addEventListener("click", function () {
                const isDark = dom.body.classList.toggle("dashboard-theme-dark");
                dom.themeToggle.setAttribute("aria-pressed", String(isDark));
                localStorage.setItem("cognelearn_dashboard_theme", isDark ? "dark" : "light");
                renderAnalyticsChart();
            });
        }

        if (dom.floatingAnalyticsBtn) {
            dom.floatingAnalyticsBtn.addEventListener("click", toggleAnalyticsPanel);
        }

        if (dom.showMoreSessionsBtn) {
            dom.showMoreSessionsBtn.addEventListener("click", async function () {
                state.showAllSessions = !state.showAllSessions;
                await renderRecentSessions();
            });
        }

        if (dom.showMorePlaylistsBtn) {
            dom.showMorePlaylistsBtn.addEventListener("click", async function () {
                state.showAllPlaylists = !state.showAllPlaylists;
                await loadPlaylists();
            });
        }

        if (dom.menuToggle) {
            dom.menuToggle.addEventListener("click", toggleDrawer);
        }

        if (dom.appOverlay) {
            dom.appOverlay.addEventListener("click", closeSidebar);
        }

        dom.segments.forEach((segment) => {
            segment.addEventListener("click", function () {
                state.selectedRange = segment.dataset.range || "week";
                dom.segments.forEach((item) => item.classList.toggle("is-active", item === segment));
                renderAnalyticsChart();
            });
        });

        [dom.playlistModal, dom.editPlaylistModal, dom.focusSessionModal, dom.playlistSelectorModal, dom.resumeSessionModal, dom.conflictSessionModal].forEach((modal) => {
            if (!modal) {
                return;
            }

            modal.addEventListener("click", function (event) {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });

        if (dom.focusDurationInput) {
            dom.focusDurationInput.addEventListener("input", updateFocusSummary);
        }

        if (dom.focusCyclesInput) {
            dom.focusCyclesInput.addEventListener("input", updateFocusSummary);
        }

        if (dom.confirmFocusSessionBtn) {
            dom.confirmFocusSessionBtn.addEventListener("click", startConfiguredFocusSession);
        }

        if (dom.resumeSessionBtn) {
            dom.resumeSessionBtn.addEventListener("click", resumeExistingSession);
        }

        if (dom.startNewSessionBtn) {
            dom.startNewSessionBtn.addEventListener("click", startNewSessionFromResumeModal);
        }

        if (dom.startCurrentConflictBtn) {
            dom.startCurrentConflictBtn.addEventListener("click", startNewSessionWithCurrentPlaylist);
        }

        if (dom.resumePreviousConflictBtn) {
            dom.resumePreviousConflictBtn.addEventListener("click", resumePreviousConflictSession);
        }

        if (dom.discardPreviousConflictBtn) {
            dom.discardPreviousConflictBtn.addEventListener("click", discardPreviousConflictSession);
        }

        window.addEventListener("storage", function (event) {
            if (event.key === "cognelearn_session_history") {
                syncSessionsFromStorage();
                renderRecentSessions();
                renderAnalyticsChart();
            }
        });
    }

    async function loadDashboardData() {
        try {
            state.dashboard = await SimpleAnalytics.getDashboard();
            state.sessions = await StudySession.getAll();
            syncSessionsFromStorage();
            renderDashboardMetrics();
            await renderRecentSessions();
            await loadPlaylists();
        } catch (error) {
            console.error(error);
            alert("Failed to load dashboard data. Please try again.");
        }
    }

    window.showAddPlaylistModal = function showAddPlaylistModal() {
        state.playlistItems = [];
        clearPlaylistInputError();
        clearPlaylistInputStatus();
        dom.videoUrlInput.value = "";
        renderAddedPlaylistItems();
        openModal(dom.playlistModal);
    };

    window.closePlaylistModal = function closePlaylistModal() {
        closeModal(dom.playlistModal);
        state.playlistItems = [];
        dom.videoUrlInput.value = "";
        clearPlaylistInputError();
        clearPlaylistInputStatus();
        renderAddedPlaylistItems();
        dom.playlistName.value = "";
    };

    window.showEditPlaylistModal = function showEditPlaylistModal(playlistId, playlistName) {
        state.editingPlaylistId = playlistId;
        dom.editPlaylistTitle.textContent = `Editing: ${playlistName}`;
        dom.addVideoLinks.value = "";
        dom.removeVideoLinks.value = "";
        openModal(dom.editPlaylistModal);
    };

    window.closeEditPlaylistModal = function closeEditPlaylistModal() {
        state.editingPlaylistId = null;
        dom.addVideoLinks.value = "";
        dom.removeVideoLinks.value = "";
        closeModal(dom.editPlaylistModal);
    };

    function getStoredPlayerSession() {
        try {
            const raw = localStorage.getItem(PLAYER_SESSION_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return sanitizeStoredSession(parsed);
        } catch (error) {
            console.error("Invalid stored player session", error);
            return null;
        }
    }

    function sanitizeStoredSession(session) {
        if (!session || !session.sessionId || !session.playlistId) {
            return null;
        }

        return {
            sessionId: session.sessionId,
            playlistId: session.playlistId,
            playlistName: session.playlistName || "Untitled Playlist",
            remainingTime: Math.max(0, Number(session.remainingTime) || 0),
            cyclesLeft: Math.max(1, Number(session.cyclesLeft) || Math.max(1, (Number(session.cycles) || 1) - ((Number(session.currentCycle) || 1) - 1))),
            status: session.status || "running",
            updatedAt: session.updatedAt || session.startedAt || new Date().toISOString(),
            duration: Math.max(5, Number(session.duration) || 25),
            cycles: Math.max(1, Number(session.cycles) || 1),
            currentCycle: Math.max(1, Number(session.currentCycle) || 1)
        };
    }

    function clearStoredPlayerSession() {
        localStorage.removeItem(PLAYER_SESSION_STORAGE_KEY);
        localStorage.removeItem("cognelearn_session");
    }

    function persistLaunchIntent(intent) {
        if (!intent) {
            localStorage.removeItem(PLAYER_LAUNCH_INTENT_KEY);
            return;
        }

        localStorage.setItem(PLAYER_LAUNCH_INTENT_KEY, JSON.stringify({
            type: intent.type || "launch",
            playlistId: intent.playlistId || null,
            sessionId: intent.sessionId || null,
            source: intent.source || "dashboard",
            createdAt: new Date().toISOString()
        }));
    }

    function updateResumeSummary(sessionConfig) {
        const staleLabel = isSessionStale(sessionConfig) ? " · outdated" : "";
        dom.resumeSessionSummary.textContent = `${formatRemainingTime(sessionConfig.remainingTime)} remaining · ${sessionConfig.cyclesLeft} cycle${sessionConfig.cyclesLeft === 1 ? "" : "s"} left${staleLabel}`;
    }

    function navigateToPlayer(entry) {
        const playlistId = entry && entry.playlistId;
        persistLaunchIntent({
            type: entry && entry.type ? entry.type : "launch",
            playlistId: playlistId,
            sessionId: entry && entry.sessionId ? entry.sessionId : null,
            source: entry && entry.source ? entry.source : "dashboard"
        });
        const target = playlistId ? `player.html?playlistId=${encodeURIComponent(playlistId)}` : "player.html";
        window.location.href = target;
    }

    function selectLatestPlaylist() {
        return state.playlists.length > 0 ? state.playlists[state.playlists.length - 1] : null;
    }

    function getPlaylistById(playlistId) {
        return state.playlists.find((playlist) => String(getPlaylistId(playlist)) === String(playlistId)) || null;
    }

    function getPlaylistNameById(playlistId) {
        const playlist = getPlaylistById(playlistId);
        return playlist ? getPlaylistDisplayTitle(playlist) : "Selected Playlist";
    }

    function formatRemainingTime(seconds) {
        const safeSeconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const remainder = safeSeconds % 60;
        if (minutes <= 0) {
            return `${remainder}s`;
        }
        return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
    }

    function isSessionStale(sessionConfig) {
        const updatedAt = new Date(sessionConfig.updatedAt || 0).getTime();
        if (!updatedAt) {
            return false;
        }
        return Date.now() - updatedAt > 24 * 60 * 60 * 1000;
    }

    function resolveTargetPlaylistId(preferredPlaylistId) {
        if (preferredPlaylistId) {
            return preferredPlaylistId;
        }

        if (state.playlists.length === 1) {
            return getPlaylistId(state.playlists[0]);
        }

        const latest = selectLatestPlaylist();
        return latest ? getPlaylistId(latest) : null;
    }

    function renderPlaylistSelector() {
        dom.playlistSelectorList.innerHTML = state.playlists.map((playlist) => {
            const title = escapeHtml(getPlaylistDisplayTitle(playlist));
            const videoCount = getPlaylistVideoCount(playlist);
            const playlistId = JSON.stringify(getPlaylistId(playlist));
            return `
                <button class="selection-item" type="button" onclick='selectFocusPlaylist(${playlistId})'>
                    <span class="selection-item__title">${title}</span>
                    <span class="selection-item__meta">${videoCount} video${videoCount === 1 ? "" : "s"}</span>
                </button>
            `;
        }).join("");
    }

    function proceedToFocusSetup(playlistId) {
        closeModal(dom.playlistSelectorModal);
        window.openFocusSessionSetup(playlistId || null);
    }

    function handleFocusSessionLaunch(preferredPlaylistId, source) {
        if (!state.playlists.length) {
            window.showAddPlaylistModal();
            return;
        }

        const unfinished = getStoredPlayerSession();
        const targetPlaylistId = resolveTargetPlaylistId(preferredPlaylistId);

        if (unfinished && unfinished.status !== "completed") {
            state.pendingFocusIntent = {
                playlistId: targetPlaylistId || null,
                source: source || "dashboard"
            };

            if (String(unfinished.playlistId) === String(targetPlaylistId)) {
                updateResumeSummary(unfinished);
                openModal(dom.resumeSessionModal);
                return;
            }

            state.conflictTargetPlaylistId = targetPlaylistId;
            dom.previousSessionPlaylist.textContent = unfinished.playlistName || "Previous Playlist";
            dom.previousSessionMeta.textContent = `${formatRemainingTime(unfinished.remainingTime)} remaining · ${unfinished.cyclesLeft} cycle${unfinished.cyclesLeft === 1 ? "" : "s"} left`;
            dom.currentSessionPlaylist.textContent = getPlaylistNameById(targetPlaylistId);
            dom.conflictSessionHint.textContent = isSessionStale(unfinished)
                ? "Previous session is outdated. Starting a new session is recommended."
                : "Choose whether to resume it or start fresh with your newly selected playlist.";
            openModal(dom.conflictSessionModal);
            return;
        }

        if (preferredPlaylistId) {
            proceedToFocusSetup(preferredPlaylistId);
            return;
        }

        if (state.playlists.length === 1) {
            proceedToFocusSetup(getPlaylistId(state.playlists[0]));
            return;
        }

        renderPlaylistSelector();
        openModal(dom.playlistSelectorModal);
    }

    function updateFocusSummary() {
        const duration = Math.max(5, Number(dom.focusDurationInput.value) || 25);
        const cycles = Math.max(1, Number(dom.focusCyclesInput.value) || 1);
        dom.focusSummaryText.textContent = `~${duration * cycles} minutes`;
    }

    function showPlaylistInputError(message) {
        dom.videoInputError.textContent = message;
        dom.videoInputError.classList.remove("hidden");
        dom.videoInputStatus.classList.add("hidden");
    }

    function clearPlaylistInputError() {
        dom.videoInputError.textContent = "";
        dom.videoInputError.classList.add("hidden");
    }

    function showPlaylistInputStatus(message) {
        dom.videoInputStatus.textContent = message;
        dom.videoInputStatus.classList.remove("hidden");
    }

    function clearPlaylistInputStatus() {
        dom.videoInputStatus.textContent = "";
        dom.videoInputStatus.classList.add("hidden");
    }

    function parseDurationSeconds(durationValue) {
        if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
            return Math.max(0, Math.round(durationValue));
        }

        if (typeof durationValue !== "string") {
            return 0;
        }

        const trimmed = durationValue.trim();
        if (!trimmed) {
            return 0;
        }

        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed);
        }

        const parts = trimmed.split(":").map((part) => Number(part));
        if (parts.some((part) => !Number.isFinite(part))) {
            return 0;
        }

        if (parts.length === 3) {
            return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        }

        if (parts.length === 2) {
            return (parts[0] * 60) + parts[1];
        }

        return 0;
    }

    function formatDurationShort(totalSeconds) {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    function getExistingRawItems() {
        const ids = new Set();
        state.playlistItems.forEach((item) => {
            ids.add(String(item.value || "").trim());
        });
        return ids;
    }

    function getFlattenedPlaylistVideos() {
        return state.playlistItems.map((item) => ({
            id: item.value,
            title: item.value || "YouTube Link",
            kind: "video"
        }));
    }

    function renderAddedPlaylistItems() {
        if (state.playlistItems.length === 0) {
            dom.addedVideosList.innerHTML = '<p class="added-items-empty">No videos added yet.</p>';
            dom.addedVideosSummary.textContent = "0 links";
            return;
        }

        dom.addedVideosList.innerHTML = state.playlistItems.map((item, index) => {
            return `
                <article class="added-item-card">
                    <div class="added-item-content">
                        <p class="added-item-title">${escapeHtml(item.value)}</p>
                    </div>
                    <button class="added-item-remove" type="button" onclick="removePlaylistItem(${index})" aria-label="Remove item">×</button>
                </article>
            `;
        }).join("");
        dom.addedVideosSummary.textContent = `${state.playlistItems.length} link${state.playlistItems.length === 1 ? "" : "s"}`;
    }

    window.removePlaylistItem = function removePlaylistItem(index) {
        state.playlistItems.splice(index, 1);
        renderAddedPlaylistItems();
    };

    function addPlaylistItemFromInput(rawInput) {
        const input = (rawInput || "").trim();
        if (!input) {
            return;
        }

        const existingItems = getExistingRawItems();
        if (existingItems.has(input)) {
            return;
        }

        state.playlistItems.push({ type: "raw", value: input });
        dom.videoUrlInput.value = "";
        clearPlaylistInputError();
        clearPlaylistInputStatus();
        renderAddedPlaylistItems();
    }

    function mergeSessionCollections(baseSessions, localSessions) {
        const merged = new Map();

        (baseSessions || []).forEach((session) => {
            const key = session.sessionId || `${getSessionDate(session)}-${getSessionDuration(session)}`;
            merged.set(key, session);
        });

        (localSessions || []).forEach((session, index) => {
            const key = session.sessionId || `${session.date || "local"}-${session.duration || 0}-${index}`;
            if (!merged.has(key)) {
                merged.set(key, session);
            }
        });

        state.sessions = Array.from(merged.values()).sort((left, right) => {
            return new Date(getSessionDate(right) || 0).getTime() - new Date(getSessionDate(left) || 0).getTime();
        });
    }

    function syncSessionsFromStorage() {
        const localHistory = JSON.parse(localStorage.getItem("cognelearn_session_history") || "[]");
        mergeSessionCollections(state.sessions, Array.isArray(localHistory) ? localHistory : []);
    }

    window.openFocusSessionModal = function openFocusSessionModal(playlistId) {
        handleFocusSessionLaunch(playlistId || null, "playlist_card");
    };

    window.selectFocusPlaylist = function selectFocusPlaylist(playlistId) {
        proceedToFocusSetup(playlistId);
    };

    window.closePlaylistSelectorModal = function closePlaylistSelectorModal() {
        closeModal(dom.playlistSelectorModal);
    };

    window.closeResumeSessionModal = function closeResumeSessionModal() {
        closeModal(dom.resumeSessionModal);
    };

    window.closeConflictSessionModal = function closeConflictSessionModal() {
        closeModal(dom.conflictSessionModal);
    };

    window.openFocusSessionSetup = function openFocusSessionSetup(playlistId) {
        state.pendingFocusPlaylistId = playlistId || null;
        dom.focusDurationInput.value = "25";
        dom.focusCyclesInput.value = "2";
        updateFocusSummary();
        openModal(dom.focusSessionModal);
    };

    window.closeFocusSessionModal = function closeFocusSessionModal() {
        state.pendingFocusPlaylistId = null;
        closeModal(dom.focusSessionModal);
    };

    function resumeExistingSession() {
        const unfinished = getStoredPlayerSession();
        if (!unfinished) {
            closeModal(dom.resumeSessionModal);
            return;
        }

        closeModal(dom.resumeSessionModal);
        navigateToPlayer({
            type: "resume",
            playlistId: unfinished.playlistId,
            sessionId: unfinished.sessionId,
            source: "resume_modal"
        });
    }

    function startNewSessionFromResumeModal() {
        const nextIntent = state.pendingFocusIntent;
        clearStoredPlayerSession();
        closeModal(dom.resumeSessionModal);
        handleFocusSessionLaunch(nextIntent && nextIntent.playlistId ? nextIntent.playlistId : null, nextIntent && nextIntent.source ? nextIntent.source : "resume_modal");
    }

    function resumePreviousConflictSession() {
        const unfinished = getStoredPlayerSession();
        if (!unfinished) {
            closeModal(dom.conflictSessionModal);
            return;
        }

        closeModal(dom.conflictSessionModal);
        navigateToPlayer({
            type: "resume",
            playlistId: unfinished.playlistId,
            sessionId: unfinished.sessionId,
            source: "conflict_modal"
        });
    }

    function startNewSessionWithCurrentPlaylist() {
        const targetPlaylistId = state.conflictTargetPlaylistId;
        clearStoredPlayerSession();
        closeModal(dom.conflictSessionModal);
        if (targetPlaylistId) {
            proceedToFocusSetup(targetPlaylistId);
        }
    }

    function discardPreviousConflictSession() {
        const targetPlaylistId = state.conflictTargetPlaylistId;
        clearStoredPlayerSession();
        closeModal(dom.conflictSessionModal);
        if (targetPlaylistId) {
            proceedToFocusSetup(targetPlaylistId);
        }
    }

    async function startConfiguredFocusSession() {
        const duration = Number(dom.focusDurationInput.value);
        const cycles = Number(dom.focusCyclesInput.value);
        const targetPlaylistId = state.pendingFocusPlaylistId;

        if (!Number.isFinite(duration) || duration < 5) {
            alert("Study duration must be at least 5 minutes.");
            dom.focusDurationInput.focus();
            return;
        }

        if (!Number.isFinite(cycles) || cycles < 1) {
            alert("Number of sessions must be at least 1.");
            dom.focusCyclesInput.focus();
            return;
        }

        try {
            const session = await StudySession.create({
                playlistId: targetPlaylistId,
                duration,
                cycles
            });

            localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, JSON.stringify({
                playlistId: targetPlaylistId,
                playlistName: getPlaylistNameById(targetPlaylistId),
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

            window.closeFocusSessionModal();
            navigateToPlayer({
                type: "new_session",
                playlistId: targetPlaylistId,
                sessionId: session && session.sessionId ? session.sessionId : null,
                source: "setup_modal"
            });
        } catch (error) {
            console.error(error);
            alert(error && error.message ? error.message : "Failed to start session.");
        }
    }

    function normalizeYouTubeInput(input) {
        if (!input) {
            return { videoId: null, playlistId: null };
        }

        if (Video.isValidYouTubeId(input)) {
            return { videoId: input, playlistId: null };
        }

        const url = toValidUrl(input);
        if (!url) {
            return { videoId: null, playlistId: null };
        }

        return {
            videoId: extractYouTubeVideoId(url),
            playlistId: extractYouTubePlaylistId(url)
        };
    }

    function toValidUrl(input) {
        try {
            return new URL(input);
        } catch (error) {
            try {
                return new URL(`https://${input}`);
            } catch (innerError) {
                return null;
            }
        }
    }

    function extractYouTubeVideoId(url) {
        const host = url.hostname.replace("www.", "");

        if (host === "youtu.be") {
            const id = url.pathname.split("/").filter(Boolean)[0];
            return Video.isValidYouTubeId(id) ? id : null;
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") {
                const id = url.searchParams.get("v");
                return Video.isValidYouTubeId(id) ? id : null;
            }

            if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
                const id = url.pathname.split("/")[2];
                return Video.isValidYouTubeId(id) ? id : null;
            }
        }

        return null;
    }

    function extractYouTubePlaylistId(url) {
        const host = url.hostname.replace("www.", "");
        if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
            return url.searchParams.get("list") || null;
        }
        return null;
    }

    async function fetchPlaylistVideoIds(playlistId) {
        const data = await Api.get(`/api/v1/proxy/playlist?playlistId=${encodeURIComponent(playlistId)}`);
        return data && Array.isArray(data.videoIds) ? data.videoIds : [];
    }

    window.updatePlaylistVideos = async function updatePlaylistVideos() {
        if (!state.editingPlaylistId) {
            alert("No playlist selected for editing.");
            return;
        }

        const addText = dom.addVideoLinks.value.trim();
        const removeText = dom.removeVideoLinks.value.trim();

        if (!addText && !removeText) {
            alert("Please add or remove at least one video.");
            return;
        }

        const addLines = addText.split("\n").map((line) => line.trim()).filter(Boolean);
        const removeLines = removeText.split("\n").map((line) => line.trim()).filter(Boolean);
        const addVideoIdSet = new Set();
        const addPlaylistIdSet = new Set();
        const removeVideoIdSet = new Set();

        addLines.forEach((line) => {
            const normalized = normalizeYouTubeInput(line);
            if (normalized.videoId) {
                addVideoIdSet.add(normalized.videoId);
            }
            if (normalized.playlistId) {
                addPlaylistIdSet.add(normalized.playlistId);
            }
        });

        removeLines.forEach((line) => {
            const normalized = normalizeYouTubeInput(line);
            if (normalized.videoId) {
                removeVideoIdSet.add(normalized.videoId);
            }
        });

        const playlistFallbacks = [];

        for (const playlistId of Array.from(addPlaylistIdSet)) {
            try {
                const playlistVideoIds = await fetchPlaylistVideoIds(playlistId);
                playlistVideoIds.forEach((id) => addVideoIdSet.add(id));
            } catch (error) {
                playlistFallbacks.push(playlistId);
            }
        }

        const addIds = Array.from(addVideoIdSet).filter((id) => Video.isValidYouTubeId(id));
        const removeIds = Array.from(removeVideoIdSet).filter((id) => Video.isValidYouTubeId(id));

        for (const [idx, id] of addIds.entries()) {
            await Playlist.addVideo(state.editingPlaylistId, {
                id,
                title: `Video ${idx + 1}`,
                kind: "video"
            });
        }

        for (const [idx, playlistId] of playlistFallbacks.entries()) {
            await Playlist.addVideo(state.editingPlaylistId, {
                id: playlistId,
                title: `Playlist ${idx + 1}`,
                kind: "playlist"
            });
        }

        for (const id of removeIds) {
            await Playlist.removeVideo(state.editingPlaylistId, id);
        }

        alert(`Playlist updated: ${addIds.length + playlistFallbacks.length} added, ${removeIds.length} removed.`);
        if (playlistFallbacks.length > 0) {
            alert("Some playlist links could not be expanded. They were added as playlist items instead.");
        }

        window.closeEditPlaylistModal();
        await loadPlaylists();
    };

    window.addPlaylist = async function addPlaylist() {
        const name = dom.playlistName.value.trim() || "Untitled Playlist";
        const videos = getFlattenedPlaylistVideos().map((video) => ({
            id: video.id,
            title: video.title || "Video",
            kind: "video"
        }));

        if (videos.length === 0) {
            return;
        }

        try {
            await Playlist.create({
                title: name,
                description: "",
                videos
            });
            showPlaylistInputStatus(`Playlist ready with ${videos.length} videos.`);
            window.closePlaylistModal();
            await loadPlaylists();
        } catch (error) {
            console.error(error);
        }
    };

    window.deletePlaylist = async function deletePlaylist(playlistId, playlistName) {
        if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"? This cannot be undone.`)) {
            return;
        }

        try {
            await Playlist.delete(playlistId);
            alert("Playlist deleted successfully!");
            await loadPlaylists();
        } catch (error) {
            console.error(error);
            alert(error && error.message ? error.message : "Failed to delete playlist.");
        }
    };

    window.goToPlayer = function goToPlayer(playlistId) {
        handleFocusSessionLaunch(playlistId, "playlist_thumb");
    };

    window.logout = function logout() {
        Auth.logout();
    };

    function restoreTheme() {
        const savedTheme = localStorage.getItem("cognelearn_dashboard_theme");
        if (savedTheme === "dark") {
            dom.body.classList.add("dashboard-theme-dark");
            dom.themeToggle.setAttribute("aria-pressed", "true");
        }
    }

    async function init() {
        bindEvents();
        restoreTheme();
        updateDateTime();
        updateFocusSummary();
        window.setInterval(updateDateTime, 60000);

        const ok = await ensureLoggedIn();
        if (ok) {
            await loadDashboardData();
            // Standard Karpathy level: Ensure visibility only after data is ready to prevent flash
            document.body.style.opacity = "1";
        }
    }

    init();
})();
