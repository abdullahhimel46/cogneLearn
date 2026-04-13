/**
 * StudySession Module - REST-backed sessions
 */
const StudySession = {
    create: async function(sessionData) {
        const payload = {
            playlistId: sessionData.playlistId || null,
            videoId: sessionData.videoId || '',
            duration: sessionData.focusTime || sessionData.duration || 25
        };

        const session = await Api.post('/api/v1/sessions', payload);
        localStorage.setItem('cognelearn_session', JSON.stringify(session));
        return session;
    },

    getAll: async function() {
        return await Api.get('/api/v1/sessions');
    },

    getById: async function(sessionId) {
        return await Api.get(`/api/v1/sessions/${sessionId}`);
    },

    getCurrentSession: function() {
        const session = localStorage.getItem('cognelearn_session');
        return session ? JSON.parse(session) : null;
    },

    start: async function(sessionId) {
        return await this.getById(sessionId);
    },

    end: async function(sessionId, completedMinutes = 0) {
        const session = await Api.patch(`/api/v1/sessions/${sessionId}/complete`, {
            completedDuration: completedMinutes
        });
        localStorage.removeItem('cognelearn_session');
        return session;
    },

    addAttentionScore: async function(sessionId, score) {
        return await Api.post(`/api/v1/sessions/${sessionId}/attention`, {
            score: score
        });
    }
};
