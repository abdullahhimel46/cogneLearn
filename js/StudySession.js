/**
 * StudySession Module - Manages study sessions with timing and analytics
 */
const StudySession = {
    /**
     * Create a new study session
     * @param {Object} sessionData - {playlistId, focusTime, videoId}
     * @returns {Object} Study session object with sessionId
     */
<<<<<<< HEAD
    create: function (sessionData) {
=======
    create: function(sessionData) {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const user = User.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        const session = {
            sessionId: 'session_' + Date.now(),
            userId: user.userId,
            playlistId: sessionData.playlistId,
            videoId: sessionData.videoId || '',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: sessionData.focusTime || 25, // in minutes
            completedDuration: 0, // actual duration completed
            status: 'active', // active, paused, completed
            attentionScores: [],
            createdAt: new Date().toISOString()
        };

        // Store in localStorage with user context
        const key = 'cognelearn_sessions_' + user.userId;
        const sessions = JSON.parse(localStorage.getItem(key)) || [];
        sessions.push(session);
        localStorage.setItem(key, JSON.stringify(sessions));

        // Store current session
<<<<<<< HEAD
        localStorage.setItem('cognelearn_current_study_session', JSON.stringify(session));
=======
        localStorage.setItem('cognelearn_session', JSON.stringify(session));
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2

        return session;
    },

    /**
     * Get all sessions for current user
     * @returns {Array} Array of sessions
     */
<<<<<<< HEAD
    getAll: function () {
=======
    getAll: function() {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const user = User.getCurrentUser();
        if (!user) return [];

        const key = 'cognelearn_sessions_' + user.userId;
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    /**
     * Get session by ID
     * @param {String} sessionId
     * @returns {Object|null}
     */
<<<<<<< HEAD
    getById: function (sessionId) {
=======
    getById: function(sessionId) {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const sessions = this.getAll();
        return sessions.find(s => s.sessionId === sessionId) || null;
    },

    /**
     * Get current active session
     * @returns {Object|null}
     */
<<<<<<< HEAD
    getCurrentSession: function () {
        const session = localStorage.getItem('cognelearn_current_study_session');
=======
    getCurrentSession: function() {
        const session = localStorage.getItem('cognelearn_session');
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        return session ? JSON.parse(session) : null;
    },

    /**
     * Start the session
     * @param {String} sessionId
     */
<<<<<<< HEAD
    start: function (sessionId) {
=======
    start: function(sessionId) {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
<<<<<<< HEAD

        sessions = sessions.map(s =>
=======
        
        sessions = sessions.map(s => 
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
            s.sessionId === sessionId ? { ...s, status: 'active', startTime: new Date().toISOString() } : s
        );

        localStorage.setItem(key, JSON.stringify(sessions));
    },

    /**
     * End the session
     * @param {String} sessionId
     * @param {Number} completedMinutes - Actual time spent
     */
<<<<<<< HEAD
    end: function (sessionId, completedMinutes = 0) {
=======
    end: function(sessionId, completedMinutes = 0) {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
<<<<<<< HEAD

        sessions = sessions.map(s =>
            s.sessionId === sessionId
                ? {
                    ...s,
                    status: 'completed',
                    endTime: new Date().toISOString(),
                    completedDuration: completedMinutes
                }
=======
        
        sessions = sessions.map(s => 
            s.sessionId === sessionId 
                ? { 
                    ...s, 
                    status: 'completed',
                    endTime: new Date().toISOString(),
                    completedDuration: completedMinutes
                } 
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
                : s
        );

        localStorage.setItem(key, JSON.stringify(sessions));
<<<<<<< HEAD
        localStorage.removeItem('cognelearn_current_study_session');
=======
        localStorage.removeItem('cognelearn_session');
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
    },

    /**
     * Add attention score to session
     * @param {String} sessionId
     * @param {Number} score - 0-100
     */
<<<<<<< HEAD
    addAttentionScore: function (sessionId, score) {
=======
    addAttentionScore: function(sessionId, score) {
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
<<<<<<< HEAD

=======
        
>>>>>>> 02969bfb1a776114dea2523d765b5c3ef98bf7b2
        sessions = sessions.map(s => {
            if (s.sessionId === sessionId) {
                return {
                    ...s,
                    attentionScores: [...(s.attentionScores || []), score]
                };
            }
            return s;
        });

        localStorage.setItem(key, JSON.stringify(sessions));
    }
};
