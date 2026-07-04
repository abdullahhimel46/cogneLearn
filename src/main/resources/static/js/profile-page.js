/**
 * profile-page.js - Handles rendering user profile information.
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

    async function init() {
        const loggedIn = await ensureLoggedIn();
        if (!loggedIn) return;

        updateDateTime();
        setInterval(updateDateTime, 30000);

        await loadProfileInfo();
        document.body.style.opacity = "1";
    }

    async function ensureLoggedIn() {
        if (window.Auth && !Auth.getCurrentUser()) {
            window.location.href = "../auth/login.html";
            return false;
        }
        try {
            const me = await Api.get("/api/v1/auth/me");
            localStorage.setItem("cognelearn_user", JSON.stringify(me));
            if (me && me.id && window.LocalDB) {
                LocalDB.setUserScope(me.id);
            }
            if (dom.userName && me && me.name) {
                dom.userName.textContent = me.name.split(" ")[0];
            }
            return true;
        } catch (error) {
            localStorage.removeItem("cognelearn_user");
            window.location.href = "../auth/login.html";
            return false;
        }
    }

    function updateDateTime() {
        if (!dom.currentDateTime) return;
        const now = new Date();
        dom.currentDateTime.textContent = now.toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    async function loadProfileInfo() {
        const userStr = localStorage.getItem("cognelearn_user");
        if (userStr) {
            const user = JSON.parse(userStr);
            if (dom.profileName) dom.profileName.textContent = user.name || "N/A";
            if (dom.profileEmail) dom.profileEmail.textContent = user.email || "N/A";
            if (dom.profileJoined && user.createdAt) {
                const joinedDate = new Date(user.createdAt);
                dom.profileJoined.textContent = joinedDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Generate dynamic initials and gradient background based on name hash
            if (user.name) {
                const names = user.name.split(" ").filter(Boolean);
                let initials = "";
                if (names.length > 0) {
                    initials += names[0][0];
                    if (names.length > 1) {
                        initials += names[names.length - 1][0];
                    }
                }
                if (dom.userNameInitials) {
                    dom.userNameInitials.textContent = initials.toUpperCase() || "CL";
                }

                const gradients = [
                    "linear-gradient(135deg, #6366f1, #a855f7)", // Indigo to Purple
                    "linear-gradient(135deg, #ec4899, #f43f5e)", // Pink to Rose
                    "linear-gradient(135deg, #10b981, #3b82f6)", // Emerald to Blue
                    "linear-gradient(135deg, #f59e0b, #e11d48)", // Amber to Rose
                    "linear-gradient(135deg, #3b82f6, #06b6d4)", // Blue to Cyan
                    "linear-gradient(135deg, #8b5cf6, #ec4899)"  // Violet to Pink
                ];

                let hash = 0;
                for (let i = 0; i < user.name.length; i++) {
                    hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
                }
                const index = Math.abs(hash) % gradients.length;

                if (dom.profileAvatarContainer) {
                    dom.profileAvatarContainer.style.background = gradients[index];
                }
            }
        }

        if (window.LocalAnalytics) {
            const streaks = await LocalAnalytics.getAchievementCache();
            if (dom.streakDays) dom.streakDays.textContent = `${streaks.currentStreak || 0} days`;
            if (dom.bestStreakDays) dom.bestStreakDays.textContent = `${streaks.bestStreak || 0} days`;
        }
    }

    await init();
});
