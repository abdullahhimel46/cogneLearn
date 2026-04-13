/**
 * SimpleAnalytics Module - Minimal localStorage-based session analytics
 * Uses userId-based keys so each user has isolated data.
 */
const SimpleAnalytics = {
    _key: function() {
        const user = typeof User !== 'undefined' ? User.getCurrentUser() : null;
        return user ? 'sessions_' + user.userId : 'sessions_guest';
    },

    getSessions: function() {
        return JSON.parse(localStorage.getItem(this._key())) || [];
    },

    saveSession: function(session) {
        const sessions = this.getSessions();
        sessions.push(session);
        localStorage.setItem(this._key(), JSON.stringify(sessions));
    },

    getTotalFocusTime: function() {
        return this.getSessions().reduce((sum, s) => sum + (s.duration || 0), 0);
    },

    getAverageFocus: function() {
        const sessions = this.getSessions();
        if (sessions.length === 0) return 0;
        const total = sessions.reduce((sum, s) => sum + (s.avgFocus || 0), 0);
        return Math.round(total / sessions.length);
    },

    getTodayFocus: function() {
        const sessions = this.getSessions();
        const today = new Date().toISOString().split('T')[0];
        return sessions
            .filter(s => s.date === today)
            .reduce((sum, s) => sum + (s.duration || 0), 0);
    },

    getSessionCount: function() {
        return this.getSessions().length;
    },

    getRecentSessions: function(limit = 5) {
        return this.getSessions().slice(-limit).reverse();
    }
};
