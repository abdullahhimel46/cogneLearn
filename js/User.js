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
            password: userData.password || '',
            createdAt: new Date().toISOString()
        };
        
        const key = 'cognelearn_user';
        localStorage.setItem(key, JSON.stringify(user));
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
     * Logout user
     */
    logout: function() {
        localStorage.removeItem('cognelearn_user');
        localStorage.removeItem('cognelearn_session');
    }
};
