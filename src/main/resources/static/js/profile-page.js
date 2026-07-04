/**
 * profile-page.js - Handles rendering user profile information.
 * Optimized: renders instantly from localStorage cache, refreshes in background.
 */
document.addEventListener("DOMContentLoaded", async function () {
    const dom = {
        userName: document.getElementById("userName"),
        currentDateTime: document.getElementById("currentDateTime"),
        profileName: document.getElementById("profileName"),
        profileEmail: document.getElementById("profileEmail"),
        profileJoined: document.getElementById("profileJoined"),
        streakDays: document.getElementById("streakDays"),
        bestStreakDays: document.getElementById("bestStreakDays"),
        profileAvatarContainer: document.getElementById("profileAvatarContainer"),
        userNameInitials: document.getElementById("userNameInitials")
    };

    const themeKey = "cognelearn_dashboard_theme";
    const themeClass = "dashboard-theme-dark";

    async function init() {
        // Show page immediately — don't wait for any network calls
        document.body.style.opacity = "1";

        // Restore theme instantly from localStorage (no flicker)
        const savedTheme = localStorage.getItem(themeKey);
        if (savedTheme === "dark") document.body.classList.add(themeClass);

        updateDateTime();
        setInterval(updateDateTime, 30000);

        // Step 1: Render instantly from cached data (zero network wait)
        const cached = localStorage.getItem("cognelearn_user");
        if (cached) {
            try {
                renderProfile(JSON.parse(cached));
            } catch (_) {}
        } else {
            // No cache at all — must wait for login check
            const loggedIn = await verifySession();
            if (!loggedIn) return;
        }

        // Step 2: Refresh session silently in background
        refreshSessionInBackground();

        // Step 3: Load streaks from local storage (no network)
        loadStreaks();
    }

    async function verifySession() {
        try {
            const me = await Api.get("/api/v1/auth/me");
            localStorage.setItem("cognelearn_user", JSON.stringify(me));
            if (me && me.id && window.LocalDB) LocalDB.setUserScope(me.id);
            renderProfile(me);
            return true;
        } catch (e) {
            localStorage.removeItem("cognelearn_user");
            window.location.href = "../auth/login.html";
            return false;
        }
    }

    function refreshSessionInBackground() {
        // Fire and forget — silently refresh user data in background
        if (!window.Api) return;
        Api.get("/api/v1/auth/me").then(me => {
            if (!me) return;
            localStorage.setItem("cognelearn_user", JSON.stringify(me));
            if (me.id && window.LocalDB) LocalDB.setUserScope(me.id);
            renderProfile(me);
        }).catch(() => {
            // If session expired, redirect on next navigation — don't disrupt current view
            localStorage.removeItem("cognelearn_user");
        });
    }

    function renderProfile(user) {
        if (!user) return;
        if (dom.userName && user.name) dom.userName.textContent = user.name.split(" ")[0];
        if (dom.profileName) dom.profileName.textContent = user.name || "N/A";
        if (dom.profileEmail) dom.profileEmail.textContent = user.email || "N/A";
        if (dom.profileJoined && user.createdAt) {
            dom.profileJoined.textContent = new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric"
            });
        }

        // Dynamic gradient avatar from name
        if (user.name) {
            const names = user.name.split(" ").filter(Boolean);
            let initials = names[0]?.[0] || "";
            if (names.length > 1) initials += names[names.length - 1][0];
            if (dom.userNameInitials) dom.userNameInitials.textContent = initials.toUpperCase() || "CL";

            const gradients = [
                "linear-gradient(135deg, #6366f1, #a855f7)",
                "linear-gradient(135deg, #ec4899, #f43f5e)",
                "linear-gradient(135deg, #10b981, #3b82f6)",
                "linear-gradient(135deg, #f59e0b, #e11d48)",
                "linear-gradient(135deg, #3b82f6, #06b6d4)",
                "linear-gradient(135deg, #8b5cf6, #ec4899)"
            ];
            let hash = 0;
            for (let i = 0; i < user.name.length; i++) {
                hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            if (dom.profileAvatarContainer) {
                dom.profileAvatarContainer.style.background = gradients[Math.abs(hash) % gradients.length];
            }
        }
    }

    function loadStreaks() {
        if (window.LocalAnalytics) {
            LocalAnalytics.getAchievementCache().then(streaks => {
                if (dom.streakDays) dom.streakDays.textContent = `${streaks.currentStreak || 0} days`;
                if (dom.bestStreakDays) dom.bestStreakDays.textContent = `${streaks.bestStreak || 0} days`;
            }).catch(() => {});
        }
    }

    function updateDateTime() {
        if (!dom.currentDateTime) return;
        const now = new Date();
        dom.currentDateTime.textContent = now.toLocaleString("en-US", {
            weekday: "long", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    }

    await init();
});
