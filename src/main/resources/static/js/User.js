/**
 * User Module - Manages user authentication and profile
 */
const User = {
    /**
     * Create a new user
     * @param {Object} userData - {name, email, password}
     * @returns {Object} User object with userId
     */
    create: function(userData) {
        const user = {
            userId: 'user_' + Date.now(),
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('cognelearn_user', JSON.stringify(user));
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
        // Session auth is cookie-based. We treat a cached user as a UI hint only.
        // Real protection is enforced server-side.
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
     * Logout user
     */
    logout: function() {
        localStorage.removeItem('cognelearn_user');
        localStorage.removeItem('cognelearn_session');
    }
};
