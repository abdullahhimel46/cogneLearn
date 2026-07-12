package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.session.AttentionScoreRequest;
import com.abd.cognelearn.dto.session.SessionCompleteRequest;
import com.abd.cognelearn.dto.session.SessionCreateRequest;
import com.abd.cognelearn.dto.session.SessionResponse;
import com.abd.cognelearn.service.StudySessionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for study session management.
 */
@RestController
@RequestMapping("/api/v1/sessions")
public class StudySessionController {

    private final StudySessionService studySessionService;

    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    /**
     * Get all study sessions for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<List<SessionResponse>> list() {
        return ResponseEntity.ok(studySessionService.listSessions());
    }

    /**
     * Check if the current user has an active running session.
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Boolean>> hasActiveSession() {
        boolean active = studySessionService.hasActiveSession();
        return ResponseEntity.ok(Map.of("active", active));
    }

    /**
     * Get a specific session by ID.
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> get(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.getSession(sessionId));
    }

    /**
     * Create and start a new study session.
     */
    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SessionCreateRequest request) {
        SessionResponse session = studySessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    /**
     * Pause a running session.
     */
    @PatchMapping("/{sessionId}/pause")
    public ResponseEntity<SessionResponse> pause(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.pauseSession(sessionId));
    }

    /**
     * Resume a paused session.
     */
    @PatchMapping("/{sessionId}/resume")
    public ResponseEntity<SessionResponse> resume(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.resumeSession(sessionId));
    }

    /**
     * Complete a session and record the actual time studied.
     */
    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<SessionResponse> complete(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SessionCompleteRequest request
    ) {
        return ResponseEntity.ok(studySessionService.completeSession(sessionId, request));
    }

    /**
     * Add a single attention score reading.
     */
    @PostMapping("/{sessionId}/attention")
    public ResponseEntity<SessionResponse> addAttention(
            @PathVariable UUID sessionId,
            @Valid @RequestBody AttentionScoreRequest request
    ) {
        return ResponseEntity.ok(studySessionService.addAttentionScore(sessionId, request));
    }

    @PostMapping("/seed")
    public ResponseEntity<java.util.Map<String, String>> seedSessions() {
        studySessionService.seedSessionData();
        return ResponseEntity.ok(java.util.Map.of("message", "Mock study sessions and attention scores seeded successfully"));
    }
}
