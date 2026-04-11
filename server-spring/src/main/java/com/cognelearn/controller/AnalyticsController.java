package com.cognelearn.controller;

import com.cognelearn.dto.analytics.DashboardStatsResponse;
import com.cognelearn.dto.analytics.RecentSessionResponse;
import com.cognelearn.service.AnalyticsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public DashboardStatsResponse dashboard() {
        return analyticsService.getDashboardStats();
    }

    @GetMapping("/recent-sessions")
    public List<RecentSessionResponse> recent(@RequestParam(defaultValue = "5") int limit) {
        return analyticsService.getRecentSessions(limit);
    }
}
