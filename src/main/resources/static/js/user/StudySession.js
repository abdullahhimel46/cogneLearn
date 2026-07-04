/**
 * StudySession Module - REST-backed sessions (minimal metadata) + local analytics.
 *
 * Privacy-first: attention samples are stored locally (IndexedDB) and never streamed
 * to the backend. The backend only receives tiny event signals via /api/v1/events.
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
        // Legacy method name kept for compatibility with older UI code.
        // New behavior: store locally only.
        if (window.LocalAnalytics) {
            await LocalAnalytics.recordAttentionSample(String(sessionId), Number(score) || 0, Date.now());
        }
        return { ok: true };
    },

    getSessionHistory: function() {
        // Backward compatible cache (UI may still read it). Source of truth is IndexedDB.
        const history = localStorage.getItem('cognelearn_session_history');
        return history ? JSON.parse(history) : [];
    },

    recordSessionHistory: function(session) {
        if (!session) {
            return;
        }

        // Persist to IndexedDB (source of truth).
        if (window.LocalAnalytics && String(session.status || '').toLowerCase() === 'completed') {
            LocalAnalytics.finalizeCompletedSession(session)
                .then(function (record) {
                    // Maintain a small backward-compatible cache in localStorage for existing UI.
                    // (Can be removed once all views read from IndexedDB.)
                    const history = StudySession.getSessionHistory();
                    const date = (record && record.endTime) || (record && record.startTime) || session.endTime || session.startTime || session.createdAt || new Date().toISOString();
                    const averageAttention = record && typeof record.avgAttention === 'number' ? record.avgAttention : 0;

                    history.unshift({
                        sessionId: session.sessionId || null,
                        date: date,
                        duration: session.completedDuration || session.duration || 0,
                        focusPercent: averageAttention,
                        avgFocus: averageAttention,
                        completed: true
                    });
                    localStorage.setItem('cognelearn_session_history', JSON.stringify(history.slice(0, 180)));
                })
                .catch(function () { });
        }

        // Notify any open dashboards.
        window.dispatchEvent(new CustomEvent('cognelearn:local-analytics-updated'));
    }
};
