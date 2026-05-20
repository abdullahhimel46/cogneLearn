(function () {
    const state = {
        playlists: [],
        playlistItems: [],
        isAddingPlaylistItem: false,
        editingPlaylistId: null
    };

    const dom = {
        body: document.body,
        playlistList: document.getElementById("playlistList"),
        appSidebar: document.getElementById("appSidebar"),
        appOverlay: document.getElementById("appOverlay"),
        menuToggle: document.getElementById("menuToggle"),
        themeToggle: document.getElementById("themeToggle"),
        sidebarFocusSessionBtn: document.getElementById("sidebarFocusSessionBtn"),
        playlistModal: document.getElementById("playlistModal"),
        editPlaylistModal: document.getElementById("editPlaylistModal"),
        playlistName: document.getElementById("playlistName"),
        videoUrlInput: document.getElementById("videoUrlInput"),
        addVideoBtn: document.getElementById("addVideoBtn"),
        videoInputError: document.getElementById("videoInputError"),
        videoInputStatus: document.getElementById("videoInputStatus"),
        addedVideosList: document.getElementById("addedVideosList"),
        addedVideosSummary: document.getElementById("addedVideosSummary"),
        addVideoLinks: document.getElementById("addVideoLinks"),
        removeVideoLinks: document.getElementById("removeVideoLinks"),
        editPlaylistTitle: document.getElementById("editPlaylistTitle")
    };

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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
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

    function openModal(modal) {
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
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
        if (typeof durationValue !== "string" || !durationValue.trim()) {
            return 0;
        }
        const trimmed = durationValue.trim();
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

    function toValidUrl(input) {
        try {
            return new URL(input);
        } catch (error) {
            return null;
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

    async function ensureLoggedIn() {
        try {
            const me = await Api.get("/api/v1/auth/me");
            localStorage.setItem("cognelearn_user", JSON.stringify(me));
            return true;
        } catch (error) {
            localStorage.removeItem("cognelearn_user");
            window.location.href = "login.html";
            return false;
        }
    }

    async function loadPlaylists() {
        const playlists = await Playlist.getAll();
        state.playlists = Array.isArray(playlists) ? playlists : [];

        if (!state.playlists.length) {
            dom.playlistList.innerHTML = '<p class="playlist-empty">No playlists yet. Add one to get started!</p>';
            return;
        }

        dom.playlistList.innerHTML = state.playlists.map((playlist) => {
            const playlistId = JSON.stringify(getPlaylistId(playlist));
            const title = getPlaylistDisplayTitle(playlist);
            const safeTitle = JSON.stringify(title);
            const escapedTitle = escapeHtml(title);
            const videoCount = getPlaylistVideoCount(playlist);

            return `
                <article class="playlist-card">
                    <div class="playlist-thumb" onclick='goToPlayer(${playlistId})' style="cursor:pointer;">
                        <div class="playlist-thumb__content">
                            <span class="playlist-thumb__badge">${videoCount} videos</span>
                            <div class="playlist-thumb__title">${escapedTitle}</div>
                        </div>
                    </div>
                    <div class="playlist-info">
                        <div>
                            <div class="playlist-title">${escapedTitle}</div>
                            <div class="playlist-meta">${videoCount} video${videoCount === 1 ? "" : "s"} curated for focus mode</div>
                        </div>
                        <div class="playlist-actions">
                            <button class="btn btn-primary btn-small" type="button" onclick='goToPlayer(${playlistId})'>Open</button>
                            <button class="btn btn-secondary btn-small" type="button" onclick='showEditPlaylistModal(${playlistId}, ${safeTitle})'>Edit</button>
                            <button class="btn btn-secondary btn-small" type="button" onclick='deletePlaylist(${playlistId}, ${safeTitle})'>Delete</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function normalizeYouTubeInput(input) {
        if (!input) {
            return { videoId: null, playlistId: null };
        }

        if (Video.isValidYouTubeId(input)) {
            return { videoId: input, playlistId: null };
        }

        let url;
        try {
            url = new URL(input);
        } catch (error) {
            try {
                url = new URL(`https://${input}`);
            } catch (innerError) {
                return { videoId: null, playlistId: null };
            }
        }

        const host = url.hostname.replace("www.", "");
        let videoId = null;
        let playlistId = null;

        if (host === "youtu.be") {
            videoId = url.pathname.split("/").filter(Boolean)[0] || null;
        } else if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v");
            } else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
                videoId = url.pathname.split("/")[2] || null;
            }
        }

        if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
            playlistId = url.searchParams.get("list") || null;
        }

        return {
            videoId: Video.isValidYouTubeId(videoId) ? videoId : null,
            playlistId
        };
    }

    async function fetchPlaylistVideoIds(playlistId) {
        const data = await Api.get(`/api/v1/proxy/playlist?playlistId=${encodeURIComponent(playlistId)}`);
        return data && Array.isArray(data.videoIds) ? data.videoIds : [];
    }

    function bindEvents() {
        if (dom.menuToggle) {
            dom.menuToggle.addEventListener("click", toggleDrawer);
        }

        if (dom.appOverlay) {
            dom.appOverlay.addEventListener("click", closeSidebar);
        }

        if (dom.themeToggle) {
            dom.themeToggle.addEventListener("click", function () {
                const isDark = dom.body.classList.toggle("dashboard-theme-dark");
                dom.themeToggle.setAttribute("aria-pressed", String(isDark));
                localStorage.setItem("cognelearn_dashboard_theme", isDark ? "dark" : "light");
            });
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

        if (dom.sidebarFocusSessionBtn) {
            dom.sidebarFocusSessionBtn.addEventListener("click", function () {
                window.location.href = "dashboard.html";
            });
        }

        [dom.playlistModal, dom.editPlaylistModal].forEach((modal) => {
            modal.addEventListener("click", function (event) {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });
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
            await Playlist.create({ title: name, description: "", videos });
            showPlaylistInputStatus(`Playlist ready with ${videos.length} videos.`);
            window.closePlaylistModal();
            await loadPlaylists();
        } catch (error) {
            console.error(error);
        }
    };

    window.updatePlaylistVideos = async function updatePlaylistVideos() {
        if (!state.editingPlaylistId) {
            alert("No playlist selected for editing.");
            return;
        }

        const addLines = dom.addVideoLinks.value.trim().split("\n").map((line) => line.trim()).filter(Boolean);
        const removeLines = dom.removeVideoLinks.value.trim().split("\n").map((line) => line.trim()).filter(Boolean);
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
            await Playlist.addVideo(state.editingPlaylistId, { id, title: `Video ${idx + 1}`, kind: "video" });
        }
        for (const [idx, id] of playlistFallbacks.entries()) {
            await Playlist.addVideo(state.editingPlaylistId, { id, title: `Playlist ${idx + 1}`, kind: "playlist" });
        }
        for (const id of removeIds) {
            await Playlist.removeVideo(state.editingPlaylistId, id);
        }

        window.closeEditPlaylistModal();
        await loadPlaylists();
    };

    window.deletePlaylist = async function deletePlaylist(playlistId, playlistName) {
        if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) {
            return;
        }
        await Playlist.delete(playlistId);
        await loadPlaylists();
    };

    window.goToPlayer = function goToPlayer(playlistId) {
        const target = playlistId ? `player.html?playlistId=${encodeURIComponent(playlistId)}` : "player.html";
        window.location.href = target;
    };

    window.logout = async function logout() {
        await Auth.logout();
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
        const ok = await ensureLoggedIn();
        if (ok) {
            await loadPlaylists();
        }
    }

    init();
})();
