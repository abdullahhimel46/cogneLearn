/**
 * ProductivityAnalytics Module - Calculates and tracks productivity metrics
 */
const ProductivityAnalytics = {
    /**
     * Calculate focus score based on sessions
     * @returns {Number} Focus score 0-100
     */
    calculateFocusScore: function() {
        const sessions = StudySession.getAll();
        if (sessions.length === 0) return 0;

        // Focus score based on completed duration vs planned duration
        const completionRates = sessions.map(s => 
            s.completedDuration && s.duration 
                ? (s.completedDuration / s.duration) * 100
                : 0
        );

        return Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length);
    },

    /**
     * Calculate completion rate for playlists
     * @returns {Number} Completion rate 0-100
     */
    getCompletionRate: function() {
        const playlists = Playlist.getAll();
        if (playlists.length === 0) return 0;

        const sessions = StudySession.getAll();
        const completedSessions = sessions.filter(s => s.status === 'completed').length;

        return Math.round((completedSessions / Math.max(sessions.length, 1)) * 100);
    },

    /**
     * Get detailed productivity metrics
     * @returns {Object} Metrics object
     */
    calculateMetrics: function() {
        const sessions = StudySession.getAll();
        const playlists = Playlist.getAll();

        const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.completedDuration || 0), 0);
        const avgSessionDuration = sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + (s.completedDuration || 0), 0) / sessions.length)
            : 0;

        const focusScore = this.calculateFocusScore();
        const completionRate = this.getCompletionRate();

        // Calculate streak (consecutive days with sessions)
        const sessionsByDay = {};
        sessions.forEach(s => {
            const date = new Date(s.startTime).toDateString();
            sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
        });

        const sortedDates = Object.keys(sessionsByDay).sort();
        let streak = 0;
        let maxStreak = 0;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, currentStreak);

        return {
            totalSessions: sessions.length,
            totalFocusMinutes: totalFocusMinutes,
            avgSessionDuration: avgSessionDuration,
            focusScore: focusScore,
            completionRate: completionRate,
            maxStreak: maxStreak,
            totalPlaylists: playlists.length
        };
    },

    /**
     * Generate a detailed productivity report
     * @returns {Object} Report object
     */
    generateReport: function() {
        const metrics = this.calculateMetrics();
        const sessions = StudySession.getAll();

        // Calculate by time period
        const today = new Date().toDateString();
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

        const todaysSessions = sessions.filter(s => new Date(s.startTime).toDateString() === today);
        const thisWeekSessions = sessions.filter(s => new Date(s.startTime) >= thisWeekStart);

        const todaysFocusMinutes = todaysSessions.reduce((sum, s) => sum + (s.completedDuration || 0), 0);
        const thisWeekFocusMinutes = thisWeekSessions.reduce((sum, s) => sum + (s.completedDuration || 0), 0);

        return {
            period: {
                today: today,
                thisWeek: thisWeekStart.toDateString()
            },
            summary: metrics,
            dailyBreakdown: {
                todaysFocusMinutes: todaysFocusMinutes,
                todaysSessions: todaysSessions.length,
                thisWeekFocusMinutes: thisWeekFocusMinutes,
                thisWeekSessions: thisWeekSessions.length
            },
            recentSessions: sessions.slice(-5).reverse(),
            recommendations: this.generateRecommendations(metrics)
        };
    },

    /**
     * Generate personalized recommendations
     * @param {Object} metrics
     * @returns {Array} Array of recommendations
     */
    generateRecommendations: function(metrics) {
        const recommendations = [];

        if (metrics.focusScore < 50) {
            recommendations.push('Try shorter study sessions to maintain focus');
        }

        if (metrics.avgSessionDuration < 20) {
            recommendations.push('Consider extending your study sessions for better learning outcomes');
        }

        if (metrics.totalSessions < 5) {
            recommendations.push('Build consistency! Try to study at the same time each day');
        }

        if (metrics.completionRate < 70) {
            recommendations.push('Work on completing more of your planned sessions');
        }

        if (recommendations.length === 0) {
            recommendations.push('Great job! Keep up your excellent productivity habits!');
        }

        return recommendations;
    }
};
