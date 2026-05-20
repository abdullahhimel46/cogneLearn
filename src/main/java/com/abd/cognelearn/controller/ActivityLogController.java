package com.abd.cognelearn.controller;

import com.abd.cognelearn.model.ActivityLog;
import com.abd.cognelearn.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ActivityLogController {

    private final ActivityLogService service;

    // Dashboard endpoint (FAST - TOP 5)
    @GetMapping("/latest")
    public List<ActivityLog> getLatestLogs() {
        return service.getLatestLogs();
    }

    // Aggregated stats for dashboard charts
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return service.getStats();
    }

    // Full logs (Paginated)
    @GetMapping
    public Page<ActivityLog> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getLogs(page, size);
    }
}
