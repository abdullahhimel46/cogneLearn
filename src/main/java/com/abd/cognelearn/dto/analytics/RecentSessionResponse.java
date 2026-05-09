package com.cognelearn.dto.analytics;

/**
 * RecentSessionResponse — a lightweight summary of a single recent study session.
 *
 * <p>Maps to the JavaScript {@code SimpleAnalytics.getRecentSessions()} return format
 * and the {@code recentSessions} field in {@code ProductivityAnalytics.generateReport()}.
 *
 * <p>Example JSON response:
 * <pre>
 * {
 *   "date": "2024-01-15T09:00:00Z",
 *   "completedDuration": 25,
 *   "avgFocus": 78,
 *   "completed": true
 * }
 * </pre>
 *
 * @param date              ISO timestamp string of when the session started
 * @param completedDuration how many minutes were actually studied
 * @param avgFocus          the average attention score (0–100) for this session
 * @param completed         true if the session reached the planned duration, false if stopped early
 */
public record RecentSessionResponse(
        String date,
        int completedDuration,
        int avgFocus,
        boolean completed
) {
}
