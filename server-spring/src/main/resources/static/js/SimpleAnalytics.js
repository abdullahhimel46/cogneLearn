/**
 * SimpleAnalytics Module - REST-backed analytics
 */
const SimpleAnalytics = {
    getDashboard: async function() {
        return await Api.get('/api/v1/analytics/dashboard');
    },

    getRecentSessions: async function(limit = 5) {
        return await Api.get(`/api/v1/analytics/recent-sessions?limit=${limit}`);
    },

    getTotalFocusTime: async function() {
        const data = await this.getDashboard();
        return data.totalFocusMinutes || 0;
    },

    getAverageFocus: async function() {
        const data = await this.getDashboard();
        return data.avgAttention || 0;
    },

    getTodayFocus: async function() {
        const data = await this.getDashboard();
        return data.todayFocusMinutes || 0;
    },

    getSessionCount: async function() {
        const data = await this.getDashboard();
        return data.totalSessions || 0;
    }
};
