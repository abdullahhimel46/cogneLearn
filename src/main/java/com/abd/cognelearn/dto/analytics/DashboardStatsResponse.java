package com.cognelearn.dto.analytics;

import java.util.List;

/**
 * DashboardStatsResponse — all statistics and metrics shown on the user's dashboard.
 *
 * <p>Maps to the JavaScript {@code ProductivityAnalytics.calculateMetrics()} and
 * {@code ProductivityAnalytics.generateReport()} return values in {@code ProductivityAnalytics.js}.
 *
 * <p>Example JSON response:
 * <pre>
 * {
 *   "totalFocusMinutes": 340,
 *   "totalSessions": 15,
 *   "avgAttentionScore": 76,
 *   "todayFocusMinutes": 50,
 *   "totalPlaylists": 4,
 *   "focusScore": 85,
 *   "completionRate": 80,
 *   "maxStreak": 5,
 *   "recommendations": ["Great job! Keep up your excellent productivity habits!"]
 * }
 * </pre>
 *
 * @param totalFocusMinutes  total minutes studied across all sessions (JS: {@code totalFocusMinutes})
 * @param totalSessions      total number of study sessions (JS: {@code totalSessions})
 * @param avgAttentionScore  average attention score across all sessions (JS: {@code avgAttention})
 * @param todayFocusMinutes  minutes studied today (JS: {@code SimpleAnalytics.getTodayFocus()})
 * @param totalPlaylists     number of playlists the user has (JS: {@code totalPlaylists})
 * @param focusScore         completion rate score 0-100 (JS: {@code ProductivityAnalytics.calculateFocusScore()})
 * @param completionRate     percentage of sessions completed (JS: {@code getCompletionRate()})
 * @param maxStreak          longest consecutive daily study streak in days (JS: {@code maxStreak})
 * @param recommendations    personalized suggestions (JS: {@code generateRecommendations(metrics)})
 */
public record DashboardStatsResponse(
        int totalFocusMinutes,
        int totalSessions,
        int avgAttentionScore,
        int todayFocusMinutes,
        int totalPlaylists,
        int focusScore,
        int completionRate,
        int maxStreak,
        List<String> recommendations
) {
}
