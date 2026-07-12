package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.analytics.DashboardStatsResponse;
import com.abd.cognelearn.dto.analytics.RecentSessionResponse;
import com.abd.cognelearn.model.SessionStatus;
import com.abd.cognelearn.model.StudySessionEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.PlaylistRepository;
import com.abd.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to calculate productivity statistics for the dashboard.
 */
@Service
public class AnalyticsService {

    private final StudySessionRepository studySessionRepository;
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    public AnalyticsService(
            StudySessionRepository studySessionRepository,
            PlaylistRepository playlistRepository,
            CurrentUserService currentUserService
    ) {
        this.studySessionRepository = studySessionRepository;
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Calculate all dashboard statistics for the current user.
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(user);

        int totalFocusMinutes = sessions.stream()
                .mapToInt(StudySessionEntity::getCompletedDuration)
                .sum();

        int totalSessions = sessions.size();

        int avgAttentionScore = sessions.isEmpty() ? 0 :
                (int) Math.round(sessions.stream()
                        .mapToInt(this::averageAttentionForSession)
                        .average()
                        .orElse(0));

        LocalDate today = LocalDate.now();
        int todayFocusMinutes = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .filter(s -> LocalDate.ofInstant(s.getStartTime(), ZoneId.systemDefault()).isEqual(today))
                .mapToInt(StudySessionEntity::getCompletedDuration)
                .sum();

        int totalPlaylists = (int) playlistRepository.countByUser(user);
        int focusScore = calculateFocusScore(sessions);
        int completionRate = calculateCompletionRate(sessions);
        int maxStreak = calculateMaxStreak(sessions);

        List<String> recommendations = generateRecommendations(
                focusScore, totalSessions, avgAttentionScore, completionRate
        );

        return new DashboardStatsResponse(
                totalFocusMinutes,
                totalSessions,
                avgAttentionScore,
                todayFocusMinutes,
                totalPlaylists,
                focusScore,
                completionRate,
                maxStreak,
                recommendations
        );
    }

    /**
     * Get the most recent sessions for the current user.
     */
    @Transactional(readOnly = true)
    public List<RecentSessionResponse> getRecentSessions(int limit) {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(user);

        return sessions.stream()
                .sorted(Comparator.comparing(StudySessionEntity::getStartTime).reversed())
                .limit(limit)
                .map(session -> new RecentSessionResponse(
                        session.getStartTime() == null ? "" : session.getStartTime().toString(),
                        session.getCompletedDuration(),
                        averageAttentionForSession(session),
                        session.getCompletedDuration() >= (session.getDuration() * 0.8)
                ))
                .toList();
    }

    private int averageAttentionForSession(StudySessionEntity session) {
        if (session.getAttentionScores().isEmpty()) {
            return 0;
        }
        double avg = session.getAttentionScores().stream()
                .mapToInt(score -> score.getScore())
                .average()
                .orElse(0);
        return (int) Math.round(avg);
    }

    private int calculateFocusScore(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }
        double avgCompletionPercent = sessions.stream()
                .mapToDouble(s -> s.getDuration() > 0
                        ? ((double) s.getCompletedDuration() / s.getDuration()) * 100.0
                        : 0.0)
                .average()
                .orElse(0);
        return (int) Math.min(100, Math.round(avgCompletionPercent));
    }

    private int calculateCompletionRate(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }
        long completedCount = sessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .count();
        return (int) Math.round(((double) completedCount / sessions.size()) * 100.0);
    }

    private int calculateMaxStreak(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }

        Map<LocalDate, Boolean> studyDays = new TreeMap<>();
        for (StudySessionEntity session : sessions) {
            if (session.getStartTime() != null) {
                LocalDate date = LocalDate.ofInstant(session.getStartTime(), ZoneId.systemDefault());
                studyDays.put(date, true);
            }
        }

        List<LocalDate> sortedDates = new ArrayList<>(studyDays.keySet());

        int maxStreak = 1;
        int currentStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            LocalDate previousDate = sortedDates.get(i - 1);
            LocalDate currentDate = sortedDates.get(i);

            long daysBetween = ChronoUnit.DAYS.between(previousDate, currentDate);

            if (daysBetween == 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    private List<String> generateRecommendations(
            int focusScore, int totalSessions, int avgAttention, int completionRate
    ) {
        List<String> tips = new ArrayList<>();

        if (focusScore < 50) {
            tips.add("Try shorter study sessions to maintain focus.");
        }
        if (totalSessions < 5) {
            tips.add("Build consistency! Try to study at the same time each day.");
        }
        if (completionRate < 70) {
            tips.add("Work on completing more of your planned sessions.");
        }
        if (avgAttention < 60 && totalSessions > 0) {
            tips.add("Your attention score is low. Try reducing distractions in your study environment.");
        }

        if (tips.isEmpty()) {
            tips.add("Great job! Keep up your excellent productivity habits!");
        }

        return tips;
    }
}
