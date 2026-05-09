package com.cognelearn.controller;

import com.cognelearn.dto.analytics.DashboardStatsResponse;
import com.cognelearn.dto.analytics.RecentSessionResponse;
import com.cognelearn.service.AnalyticsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * AnalyticsController — REST API endpoints for productivity analytics.
 *
 * <p>Base path: {@code /api/v1/analytics}
 *
 * <p>Maps to the JavaScript analytics modules:
 * <pre>
 *   GET /api/v1/analytics/dashboard      → ProductivityAnalytics.generateReport()
 *   GET /api/v1/analytics/recent         → SimpleAnalytics.getRecentSessions(limit)
 * </pre>
 *
 * <p>All endpoints are GET requests (read-only — no data is modified).
 * Spring Security requires login to access these.
 */
@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Constructor — Spring injects AnalyticsService.
     *
     * @param analyticsService the service that calculates all metrics
     */
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get all dashboard statistics for the logged-in user.
     *
     * <p>GET /api/v1/analytics/dashboard
     *
     * <p>Maps to JS: {@code ProductivityAnalytics.generateReport()} which returns
     * totalSessions, totalFocusMinutes, avgAttention, focusScore, completionRate,
     * maxStreak, todayFocusMinutes, and recommendations.
     *
     * @return 200 OK with complete dashboard stats
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> dashboard() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    /**
     * Get the most recent study sessions for the dashboard.
     *
     * <p>GET /api/v1/analytics/recent?limit=5
     *
     * <p>Maps to JS: {@code SimpleAnalytics.getRecentSessions(limit)}
     *
     * <p>The {@code limit} parameter is optional. Use {@code ?limit=10} in the URL
     * to get more sessions. Default is 5.
     *
     * @param limit how many sessions to return (default 5, can be overridden via query param)
     * @return 200 OK with list of recent sessions
     */
    @GetMapping({"/recent", "/recent-sessions"})
    public ResponseEntity<List<RecentSessionResponse>> recent(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getRecentSessions(limit));
    }
}
