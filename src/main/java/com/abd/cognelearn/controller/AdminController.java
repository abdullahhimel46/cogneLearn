package com.cognelearn.controller;

import com.cognelearn.dto.admin.AdminActivityDTO;
import com.cognelearn.dto.admin.AdminStatsDTO;
import com.cognelearn.dto.admin.AdminUserDTO;
import com.cognelearn.model.FeedbackEntity;
import com.cognelearn.model.SessionStatus;
import com.cognelearn.model.StudySessionEntity;
import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.FeedbackRepository;
import com.cognelearn.repository.PlaylistRepository;
import com.cognelearn.repository.StudySessionRepository;
import com.cognelearn.repository.UserRepository;
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
 * AdminController — provides real-time statistics and management capabilities
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
     * Fetch recent system activity (registrations and sessions).
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
        
        return activities;
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
