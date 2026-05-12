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
 * AnalyticsService â€” calculates productivity statistics for the dashboard.
 *
 * <p>Maps to two JavaScript modules:
 * <ul>
 *   <li>{@code ProductivityAnalytics.js} â€” focus score, completion rate, streak, recommendations</li>
 *   <li>{@code SimpleAnalytics.js} â€” total focus time, today's focus, recent sessions</li>
 * </ul>
 *
 * <p>All methods are read-only (no data modification) so they are annotated with
 * {@code @Transactional(readOnly = true)} for better performance.
 */
@Service
public class AnalyticsService {

    private final StudySessionRepository studySessionRepository;
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    /**
     * Constructor â€” Spring injects all required dependencies.
     *
     * @param studySessionRepository for loading all user sessions
     * @param playlistRepository     for counting user's playlists
     * @param currentUserService     for getting the logged-in user
     */
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
     *
     * <p>Maps to JS: {@code ProductivityAnalytics.generateReport()} which calls:
     * <ul>
     *   <li>{@code calculateMetrics()} for summary stats</li>
     *   <li>{@code SimpleAnalytics.getTodayFocus()} for today's minutes</li>
     *   <li>{@code generateRecommendations(metrics)} for tips</li>
     * </ul>
     *
     * @return a complete dashboard stats object
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        UserEntity user = currentUserService.requireUser();

        // Step 1: Load all sessions for this user from the database
        List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(user);

        // Step 2: Basic totals
        int totalFocusMinutes = sessions.stream()
                .mapToInt(StudySessionEntity::getCompletedDuration)
                .sum();

        int totalSessions = sessions.size();

        // Step 3: Average attention score across all sessions
        // (Maps to JS: sessions.reduce to sum attentionScores / sessions.length)
        int avgAttentionScore = sessions.isEmpty() ? 0 :
                (int) Math.round(sessions.stream()
                        .mapToInt(this::averageAttentionForSession)
                        .average()
                        .orElse(0));

        // Step 4: Today's focus minutes
        // (Maps to JS: SimpleAnalytics.getTodayFocus())
        LocalDate today = LocalDate.now();
        int todayFocusMinutes = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .filter(s -> LocalDate.ofInstant(s.getStartTime(), ZoneId.systemDefault()).isEqual(today))
                .mapToInt(StudySessionEntity::getCompletedDuration)
                .sum();

        // Step 5: Total playlists count
        // (Maps to JS: Playlist.getAll().length)
        int totalPlaylists = (int) playlistRepository.countByUser(user);

        // Step 6: Focus score â€” avg completion rate (completedDuration / duration * 100)
        // (Maps to JS: ProductivityAnalytics.calculateFocusScore())
        int focusScore = calculateFocusScore(sessions);

        // Step 7: Completion rate â€” percentage of sessions that reached their planned time
        // (Maps to JS: ProductivityAnalytics.getCompletionRate())
        int completionRate = calculateCompletionRate(sessions);

        // Step 8: Max streak â€” longest run of consecutive days with at least one session
        // (Maps to JS: the streak loop in ProductivityAnalytics.calculateMetrics())
        int maxStreak = calculateMaxStreak(sessions);

        // Step 9: Personalized recommendations based on the metrics
        // (Maps to JS: ProductivityAnalytics.generateRecommendations(metrics))
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
     *
     * <p>Maps to JS: {@code SimpleAnalytics.getRecentSessions(limit)}
     *
     * @param limit maximum number of sessions to return (default 5)
     * @return list of recent sessions, newest first
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
                        // A session is "completed" if it used at least 80% of planned time
                        session.getCompletedDuration() >= (session.getDuration() * 0.8)
                ))
                .toList();
    }

    // â”€â”€ Private calculation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // These are internal methods â€” they are not exposed as API endpoints.
    // Each one maps directly to a JS method in ProductivityAnalytics.js

    /**
     * Calculate the average attention score for a single session.
     * Returns 0 if no scores were recorded.
     *
     * <p>Maps to JS: the inline average calculation in the dashboard rendering code.
     *
     * @param session the session to calculate the average for
     * @return average attention score (0â€“100)
     */
    private int averageAttentionForSession(StudySessionEntity session) {
        if (session.getAttentionScores().isEmpty()) {
            return 0;  // no face tracking data for this session
        }
        double avg = session.getAttentionScores().stream()
                .mapToInt(score -> score.getScore())
                .average()
                .orElse(0);
        return (int) Math.round(avg);
    }

    /**
     * Calculate the overall focus score.
     * The focus score is the average percentage of planned time actually completed.
     * A score of 100 means the user always completes their full planned sessions.
     *
     * <p>Maps to JS: {@code ProductivityAnalytics.calculateFocusScore()}
     *
     * @param sessions all sessions for the user
     * @return focus score 0â€“100
     */
    private int calculateFocusScore(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }
        // For each session: completedDuration / plannedDuration * 100 â†’ then average
        double avgCompletionPercent = sessions.stream()
                .mapToDouble(s -> s.getDuration() > 0
                        ? ((double) s.getCompletedDuration() / s.getDuration()) * 100.0
                        : 0.0)
                .average()
                .orElse(0);
        // Cap at 100 (in case completedDuration somehow exceeds planned duration)
        return (int) Math.min(100, Math.round(avgCompletionPercent));
    }

    /**
     * Calculate the percentage of sessions that were fully completed (status = COMPLETED).
     *
     * <p>Maps to JS: {@code ProductivityAnalytics.getCompletionRate()}
     *
     * @param sessions all sessions for the user
     * @return completion rate 0â€“100
     */
    private int calculateCompletionRate(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }
        long completedCount = sessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .count();
        return (int) Math.round(((double) completedCount / sessions.size()) * 100.0);
    }

    /**
     * Calculate the longest streak of consecutive days with at least one study session.
     *
     * <p>Maps to JS: the streak calculation loop in {@code ProductivityAnalytics.calculateMetrics()}.
     *
     * <p>Algorithm:
     * <ol>
     *   <li>Group sessions by date (only unique dates matter)</li>
     *   <li>Sort dates chronologically</li>
     *   <li>Walk through dates, counting consecutive days</li>
     *   <li>Reset counter when there's a gap of more than 1 day</li>
     * </ol>
     *
     * @param sessions all sessions for the user
     * @return the longest consecutive daily study streak (in days)
     */
    private int calculateMaxStreak(List<StudySessionEntity> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }

        // Step 1: Collect unique study dates (sorted automatically by TreeMap)
        Map<LocalDate, Boolean> studyDays = new TreeMap<>();
        for (StudySessionEntity session : sessions) {
            if (session.getStartTime() != null) {
                LocalDate date = LocalDate.ofInstant(session.getStartTime(), ZoneId.systemDefault());
                studyDays.put(date, true);
            }
        }

        List<LocalDate> sortedDates = new ArrayList<>(studyDays.keySet());

        // Step 2: Walk through dates and find the longest consecutive run
        int maxStreak = 1;
        int currentStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            LocalDate previousDate = sortedDates.get(i - 1);
            LocalDate currentDate = sortedDates.get(i);

            long daysBetween = ChronoUnit.DAYS.between(previousDate, currentDate);

            if (daysBetween == 1) {
                // Consecutive day â€” extend the streak
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                // Gap detected â€” streak is broken, reset counter
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    /**
     * Generate personalized study tips based on the user's performance metrics.
     *
     * <p>Maps to JS: {@code ProductivityAnalytics.generateRecommendations(metrics)}
     *
     * @param focusScore      the user's focus/completion score (0â€“100)
     * @param totalSessions   how many sessions they've done
     * @param avgAttention    their average attention score (0â€“100)
     * @param completionRate  percentage of sessions completed (0â€“100)
     * @return a list of recommendation strings
     */
    private List<String> generateRecommendations(
            int focusScore, int totalSessions, int avgAttention, int completionRate
    ) {
        List<String> tips = new ArrayList<>();

        // Check each metric and add relevant advice (same logic as JS version)
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

        // If everything looks great, give a positive message
        if (tips.isEmpty()) {
            tips.add("Great job! Keep up your excellent productivity habits!");
        }

        return tips;
    }
}
