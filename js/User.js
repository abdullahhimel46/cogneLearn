/**
 * User Module - Manages user authentication and profile
 */
const User = {
    /**
<<<<<<< HEAD
     * Generate a stable userId from email (same email = same userId always)
     * @param {String} email
     * @returns {String}
     */
    _emailToUserId: function(email) {
        // Simple deterministic hash: prefix + email slug
        // Same email will ALWAYS produce the same userId
        const slug = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return 'user_' + slug;
    },

    /**
     * Create or retrieve a user by email.
     * If the email matches the stored user, return the existing user (preserving their data).
     * If the email is different (new user), create a fresh user.
=======
     * Create a new user
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
     * @param {Object} userData - {name, email, password}
     * @returns {Object} User object with userId
     */
    create: function(userData) {
<<<<<<< HEAD
        const existingRaw = localStorage.getItem('cognelearn_user');
        const existing = existingRaw ? JSON.parse(existingRaw) : null;

        // Same email → return existing user to preserve their data
        if (existing && existing.email === userData.email) {
            // Update name if provided (e.g., signup re-login)
            if (userData.name && userData.name !== existing.name) {
                existing.name = userData.name;
                localStorage.setItem('cognelearn_user', JSON.stringify(existing));
            }
            return existing;
        }

        // Different email → new user, fresh data (different userId = isolated namespace)
        const user = {
            userId: this._emailToUserId(userData.email),
            name: userData.name || userData.email.split('@')[0],
=======
        const user = {
            userId: 'user_' + Date.now(),
            name: userData.name,
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
            email: userData.email,
            password: userData.password || '',
            createdAt: new Date().toISOString()
        };
<<<<<<< HEAD

        localStorage.setItem('cognelearn_user', JSON.stringify(user));
=======
        
        const key = 'cognelearn_user';
        localStorage.setItem(key, JSON.stringify(user));
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        return user;
    },

    /**
     * Get current logged-in user
     * @returns {Object|null} Current user or null if not logged in
     */
    getCurrentUser: function() {
        const user = localStorage.getItem('cognelearn_user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Check if user is logged in
     * @returns {Boolean}
     */
    isLoggedIn: function() {
        return !!localStorage.getItem('cognelearn_user');
    },

    /**
     * Create a new playlist for current user
     * @param {Object} playlistData - {title, description, videos}
     * @returns {Object} Created playlist with playlistId
     */
    createPlaylist: function(playlistData) {
        return Playlist.create(playlistData);
    },

    /**
     * Start a study session for a video
     * @param {String} playlistId
     * @param {Number} focusTime - Duration in minutes
     * @returns {Object} Created study session
     */
    startStudySession: function(playlistId, focusTime = 25) {
        return StudySession.create({
            playlistId: playlistId,
            focusTime: focusTime
        });
    },

    /**
<<<<<<< HEAD
     * Logout user — clears session token but NOT user data
     * (data is keyed by userId, so it persists for next login with same email)
=======
     * Logout user
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
     */
    logout: function() {
        localStorage.removeItem('cognelearn_user');
        localStorage.removeItem('cognelearn_session');
    }
};
