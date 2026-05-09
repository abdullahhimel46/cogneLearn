/**
 * StudySession Module - REST-backed sessions
 */
const StudySession = {
    create: async function(sessionData) {
        const payload = {
            playlistId: sessionData.playlistId || null,
            videoId: sessionData.videoId || '',
            duration: sessionData.focusTime || sessionData.duration || 25,
            cycles: sessionData.cycles || 1
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
        return await Api.patch(`/api/v1/sessions/${sessionId}/resume`, {});
    },

    end: async function(sessionId, completedMinutes = 0) {
        const session = await Api.patch(`/api/v1/sessions/${sessionId}/complete`, {
            completedDuration: completedMinutes
        });
        localStorage.removeItem('cognelearn_session');
        this.recordSessionHistory(session);
        return session;
    },

    addAttentionScore: async function(sessionId, score) {
        const session = await Api.post(`/api/v1/sessions/${sessionId}/attention`, {
            score: score
        });
        const current = this.getCurrentSession();
        if (current && String(current.sessionId) === String(sessionId)) {
            localStorage.setItem('cognelearn_session', JSON.stringify(session));
        }
        return session;
    },

    getSessionHistory: function() {
        const history = localStorage.getItem('cognelearn_session_history');
        return history ? JSON.parse(history) : [];
    },

    recordSessionHistory: function(session) {
        if (!session) {
            return;
        }

        const history = this.getSessionHistory();
        const averageAttention = Array.isArray(session.attentionScores) && session.attentionScores.length > 0
            ? Math.round(session.attentionScores.reduce((sum, score) => sum + (Number(score) || 0), 0) / session.attentionScores.length)
            : 0;

        history.unshift({
            sessionId: session.sessionId || null,
            date: session.endTime || session.startTime || session.createdAt || new Date().toISOString(),
            duration: session.completedDuration || session.duration || 0,
            focusPercent: averageAttention,
            avgFocus: averageAttention,
            attentionSamples: Array.isArray(session.attentionScores) ? session.attentionScores : [],
            completed: String(session.status || '').toLowerCase() === 'completed'
        });

        localStorage.setItem('cognelearn_session_history', JSON.stringify(history.slice(0, 180)));
    }
};
