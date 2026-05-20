package com.abd.cognelearn.service;

import com.abd.cognelearn.model.ActivityLog;
import com.abd.cognelearn.model.LogType;
import com.abd.cognelearn.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * ActivityLogService — centralized logging service.
 * All application components must use log() to write activity logs.
 * No other class should insert into activity_logs directly.
 */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository repository;

    /**
     * Centralized log write method.
     * Title and description are generated at write time — no runtime formatting later.
     */
    public void log(LogType type, String title, String description, String userName, String source) {
        repository.save(ActivityLog.builder()
                .type(type)
                .title(title)
                .description(description)
                .userName(userName)
                .source(source)
                .createdAt(Instant.now())
                .build());
    }

    /** Dashboard endpoint — strictly top 5 only. Never paginated. */
    public List<ActivityLog> getLatestLogs() {
        return repository.findTop5ByOrderByCreatedAtDesc();
    }

    /** Logs page endpoint — strictly paginated. Never used by dashboard. */
    public Page<ActivityLog> getLogs(int page, int size) {
        return repository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    /**
     * Aggregated stats for charts.
     * Charts must call this — never parse raw logs on the frontend.
     */
    public Map<String, Object> getStats() {
        long registrations = repository.countByTitleContainingIgnoreCase("Registration");
        long sessions = repository.countByTitleContainingIgnoreCase("Session");
        long playlists = repository.countByTitleContainingIgnoreCase("Playlist");
        long alerts = repository.countByTypeIn(List.of(LogType.WARNING, LogType.ERROR));
        long adminActions = repository.countByTitleContainingIgnoreCase("Admin");

        long today = repository.countByCreatedAtAfter(Instant.now().minusSeconds(86400));
        long thisWeek = repository.countByCreatedAtAfter(Instant.now().minusSeconds(86400 * 7));
        long older = repository.count() - thisWeek;

        return Map.of(
                "registrations", registrations,
                "sessions", sessions,
                "playlists", playlists,
                "alerts", alerts,
                "adminActions", adminActions,
                "today", today,
                "thisWeek", thisWeek,
                "older", older > 0 ? older : 0
        );
    }
}
