/**
 * StudySession Module - Manages study sessions with timing and analytics
 */
const StudySession = {
    /**
     * Create a new study session
     * @param {Object} sessionData - {playlistId, focusTime, videoId}
     * @returns {Object} Study session object with sessionId
     */
    create: function(sessionData) {
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
        localStorage.setItem('cognelearn_session', JSON.stringify(session));

        return session;
    },

    /**
     * Get all sessions for current user
     * @returns {Array} Array of sessions
     */
    getAll: function() {
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
    getById: function(sessionId) {
        const sessions = this.getAll();
        return sessions.find(s => s.sessionId === sessionId) || null;
    },

    /**
     * Get current active session
     * @returns {Object|null}
     */
    getCurrentSession: function() {
        const session = localStorage.getItem('cognelearn_session');
        return session ? JSON.parse(session) : null;
    },

    /**
     * Start the session
     * @param {String} sessionId
     */
    start: function(sessionId) {
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
        
        sessions = sessions.map(s => 
            s.sessionId === sessionId ? { ...s, status: 'active', startTime: new Date().toISOString() } : s
        );

        localStorage.setItem(key, JSON.stringify(sessions));
    },

    /**
     * End the session
     * @param {String} sessionId
     * @param {Number} completedMinutes - Actual time spent
     */
    end: function(sessionId, completedMinutes = 0) {
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
        
        sessions = sessions.map(s => 
            s.sessionId === sessionId 
                ? { 
                    ...s, 
                    status: 'completed',
                    endTime: new Date().toISOString(),
                    completedDuration: completedMinutes
                } 
                : s
        );

        localStorage.setItem(key, JSON.stringify(sessions));
        localStorage.removeItem('cognelearn_session');
    },

    /**
     * Add attention score to session
     * @param {String} sessionId
     * @param {Number} score - 0-100
     */
    addAttentionScore: function(sessionId, score) {
        const user = User.getCurrentUser();
        if (!user) return;

        const key = 'cognelearn_sessions_' + user.userId;
        let sessions = JSON.parse(localStorage.getItem(key)) || [];
        
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
