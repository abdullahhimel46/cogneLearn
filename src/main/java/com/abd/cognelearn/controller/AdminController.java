package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.admin.AdminActivityDTO;
import com.abd.cognelearn.dto.admin.AdminStatsDTO;
import com.abd.cognelearn.dto.admin.AdminUserDTO;
import com.abd.cognelearn.dto.admin.MilestoneDTO;
import com.abd.cognelearn.model.FeedbackEntity;
import com.abd.cognelearn.model.SessionStatus;
import com.abd.cognelearn.model.StudySessionEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.FeedbackRepository;
import com.abd.cognelearn.repository.PlaylistRepository;
import com.abd.cognelearn.repository.StudySessionRepository;
import com.abd.cognelearn.repository.UserEventRepository;
import com.abd.cognelearn.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
public class AdminController {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final FeedbackRepository feedbackRepository;
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
     * Fetch all feedback submitted by users.
     */
    @GetMapping("/feedback")
    public List<FeedbackEntity> getFeedback() {
        return feedbackRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
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
                .map(u -> new AdminUserDTO(u.getId(), u.getName(), u.getEmail(), u.getCreatedAt(), u.isActive()))
                .collect(Collectors.toList());
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
            case "STREAK_7" -> "achieved a 7-day focus streak!";
            case "STREAK_30" -> "reached a massive 30-day focus streak!";
            case "LOW_FOCUS" -> "received a focus health tip.";
            case "INACTIVE_USER" -> "was sent a re-engagement reminder.";
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
