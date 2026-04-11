package com.cognelearn.dto.analytics;

public record DashboardStatsResponse(
        int totalFocusMinutes,
        int totalSessions,
        int avgAttention,
        int todayFocusMinutes
) {
}
