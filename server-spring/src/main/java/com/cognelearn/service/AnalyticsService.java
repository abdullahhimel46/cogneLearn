package com.cognelearn.service;

import com.cognelearn.dto.analytics.DashboardStatsResponse;
import com.cognelearn.dto.analytics.RecentSessionResponse;
import com.cognelearn.model.StudySessionEntity;
import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private final StudySessionRepository studySessionRepository;
    private final CurrentUserService currentUserService;

    public AnalyticsService(StudySessionRepository studySessionRepository, CurrentUserService currentUserService) {
        this.studySessionRepository = studySessionRepository;
        this.currentUserService = currentUserService;
    }

    public DashboardStatsResponse getDashboardStats() {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(user);

        int totalFocusMinutes = sessions.stream().mapToInt(StudySessionEntity::getCompletedDuration).sum();
        int totalSessions = sessions.size();
        int avgAttention = sessions.isEmpty() ? 0 : Math.round((float) sessions.stream()
                .mapToInt(this::averageAttention)
                .average().orElse(0));

        LocalDate today = LocalDate.now();
        int todayFocusMinutes = sessions.stream()
                .filter(session -> session.getStartTime() != null)
                .filter(session -> LocalDate.ofInstant(session.getStartTime(), ZoneId.systemDefault()).isEqual(today))
                .mapToInt(StudySessionEntity::getCompletedDuration)
                .sum();

        return new DashboardStatsResponse(totalFocusMinutes, totalSessions, avgAttention, todayFocusMinutes);
    }

    public List<RecentSessionResponse> getRecentSessions(int limit) {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(user);

        return sessions.stream()
                .sorted(Comparator.comparing(StudySessionEntity::getStartTime).reversed())
                .limit(limit)
                .map(session -> new RecentSessionResponse(
                        session.getStartTime() == null ? "" : session.getStartTime().toString(),
                        session.getCompletedDuration(),
                        averageAttention(session),
                        session.getCompletedDuration() > 0
                ))
                .toList();
    }

    private int averageAttention(StudySessionEntity session) {
        if (session.getAttentionScores().isEmpty()) {
            return 0;
        }
        double avg = session.getAttentionScores().stream()
                .mapToInt(score -> score.getScore())
                .average().orElse(0);
        return (int) Math.round(avg);
    }
}
