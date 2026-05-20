package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.admin.AdminActivityDTO;
import com.abd.cognelearn.dto.admin.AdminStatsDTO;
import com.abd.cognelearn.dto.admin.AdminUserDTO;
import com.abd.cognelearn.dto.admin.MilestoneDTO;
import com.abd.cognelearn.model.SessionStatus;
import com.abd.cognelearn.model.StudySessionEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.PlaylistRepository;
import com.abd.cognelearn.repository.StudySessionRepository;
import com.abd.cognelearn.repository.UserEventRepository;
import com.abd.cognelearn.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * AdminController â€” provides real-time statistics and management capabilities
 * for the Admin Panel. Fetches data directly from the H2 database.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserEventRepository userEventRepository;

    /**
     * Fetch global dashboard statistics.
     */
    @GetMapping("/stats")
    public AdminStatsDTO getStats() {
        long totalUsers = userRepository.count();
        long totalPlaylists = playlistRepository.count();
        long activeSessions = studySessionRepository.countByStatus(SessionStatus.ACTIVE);
        
        return new AdminStatsDTO(totalUsers, activeSessions, totalPlaylists, "OK");
    }

    /**
     * Fetch all streak milestones.
     */
    @GetMapping("/milestones")
    public List<MilestoneDTO> getMilestones() {
        return userEventRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp")).stream()
                .filter(e -> e.getEventType().startsWith("STREAK_"))
                .map(e -> {
                    String name = userRepository.findById(e.getUserId())
                            .map(UserEntity::getName)
                            .orElse("Unknown User");
                    String desc = translateEventType(e.getEventType());
                    return new MilestoneDTO(name, desc, formatTimeAgo(e.getTimestamp()));
                })
                .collect(Collectors.toList());
    }

    /**
     * Fetch all users for the management table.
     */
    @GetMapping("/users")
    public List<AdminUserDTO> getUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(u -> {
                    List<StudySessionEntity> sessions = studySessionRepository.findAllByUser(u);
                    
                    int totalFocusTime = sessions.stream()
                            .mapToInt(StudySessionEntity::getCompletedDuration)
                            .sum();
                            
                    Instant lastActive = sessions.stream()
                            .map(StudySessionEntity::getStartTime)
                            .filter(java.util.Objects::nonNull)
                            .max(java.util.Comparator.naturalOrder())
                            .orElse(null);
                            
                    int streak = calculateUserStreak(sessions);
                    String status = u.isActive() ? "active" : "inactive";
                    
                    return new AdminUserDTO(
                            u.getId(),
                            u.getName(),
                            u.getEmail(),
                            u.getCreatedAt(),
                            u.isActive(),
                            status,
                            u.getCreatedAt(),
                            lastActive,
                            totalFocusTime,
                            sessions.size(),
                            streak
                    );
                })
                .collect(Collectors.toList());
    }

    private int calculateUserStreak(List<StudySessionEntity> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return 0;
        }

        // Collect unique study dates (sorted automatically by TreeMap)
        java.util.Map<java.time.LocalDate, Boolean> studyDays = new java.util.TreeMap<>();
        for (StudySessionEntity session : sessions) {
            if (session.getStartTime() != null) {
                java.time.LocalDate date = java.time.LocalDate.ofInstant(session.getStartTime(), java.time.ZoneId.systemDefault());
                studyDays.put(date, true);
            }
        }

        java.util.List<java.time.LocalDate> sortedDates = new java.util.ArrayList<>(studyDays.keySet());
        if (sortedDates.isEmpty()) return 0;

        int maxStreak = 1;
        int currentStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            java.time.LocalDate previousDate = sortedDates.get(i - 1);
            java.time.LocalDate currentDate = sortedDates.get(i);

            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(previousDate, currentDate);

            if (daysBetween == 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    /**
     * Enable or disable a user account.
     */
    @PostMapping("/users/{id}/toggle-active")
    public void toggleUserActive(@PathVariable UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    /**
     * Fetch recent system activity (registrations, sessions, and milestones).
     */
    @GetMapping("/activity")
    public List<AdminActivityDTO> getActivity() {
        List<AdminActivityDTO> activities = new ArrayList<>();
        
        // 1. Recent registrations
        userRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .forEach(u -> activities.add(new AdminActivityDTO("New user registered: " + u.getName(), formatTimeAgo(u.getCreatedAt()))));
        
        // 2. Recent session events
        studySessionRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "startTime")))
                .forEach(s -> {
                    String statusText = (s.getStatus() == SessionStatus.COMPLETED) ? "Session completed" : "Session active";
                    activities.add(new AdminActivityDTO(statusText + " (User: " + s.getUser().getName() + ")", formatTimeAgo(s.getStartTime())));
                });

        // 3. Privacy-First Milestone Events
        userEventRepository.findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "timestamp")))
                .forEach(e -> {
                    userRepository.findById(e.getUserId()).ifPresent(u -> {
                        String eventDescription = translateEventType(e.getEventType());
                        activities.add(new AdminActivityDTO(u.getName() + " " + eventDescription, formatTimeAgo(e.getTimestamp())));
                    });
                });
        
        return activities.stream()
                .limit(15)
                .collect(Collectors.toList());
    }

    private String translateEventType(String type) {
        return switch (type) {
            case "STREAK_7" -> "achieved a 7-day focus streak (motivational email pending admin review).";
            case "STREAK_30" -> "reached a 30-day focus streak (motivational email pending admin review).";
            case "LOW_FOCUS" -> "signaled a focus milestone (motivational email pending admin review).";
            case "INACTIVITY", "INACTIVE_USER" -> "signaled inactivity (motivational email pending admin review).";
            default -> "triggered an event: " + type;
        };
    }

    /**
     * Simple "time ago" formatter for the activity list.
     */
    private String formatTimeAgo(Instant instant) {
        if (instant == null) return "Unknown";
        long seconds = Duration.between(instant, Instant.now()).getSeconds();
        if (seconds < 0) seconds = 0; // handle slight clock drift
        
        if (seconds < 60) return seconds + " sec ago";
        if (seconds < 3600) return (seconds / 60) + " min ago";
        if (seconds < 86400) return (seconds / 3600) + " hr ago";
        return (seconds / 86400) + " days ago";
    }
}
