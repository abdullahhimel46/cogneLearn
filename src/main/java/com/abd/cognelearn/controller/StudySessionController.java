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
 * StudySessionController â€” REST API endpoints for study session management.
 *
 * <p>Base path: {@code /api/v1/sessions}
 *
 * <p>Maps to the JavaScript session modules:
 * <pre>
 *   POST   /api/v1/sessions                         â†’ StudySession.create() + SessionManager.start()
 *   GET    /api/v1/sessions                         â†’ StudySession.getAll()
 *   GET    /api/v1/sessions/{id}                    â†’ StudySession.getById(id)
 *   PATCH  /api/v1/sessions/{id}/pause              â†’ SessionController.pause()
 *   PATCH  /api/v1/sessions/{id}/resume             â†’ SessionController.resume()
 *   PATCH  /api/v1/sessions/{id}/complete           â†’ StudySession.end() + SessionController.stop()
 *   POST   /api/v1/sessions/{id}/attention          â†’ StudySession.addAttentionScore()
 *   GET    /api/v1/sessions/active                  â†’ SessionManager.hasActive()
 * </pre>
 *
 * <p>All endpoints require the user to be logged in (session cookie required).
 */
@RestController
@RequestMapping("/api/v1/sessions")
public class StudySessionController {

    private final StudySessionService studySessionService;

    /**
     * Constructor â€” Spring injects StudySessionService.
     *
     * @param studySessionService the service with all session business logic
     */
    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    /**
     * Get all study sessions for the logged-in user.
     *
     * <p>GET /api/v1/sessions â€” Maps to JS: {@code StudySession.getAll()}
     *
     * @return 200 OK with list of all sessions
     */
    @GetMapping
    public ResponseEntity<List<SessionResponse>> list() {
        return ResponseEntity.ok(studySessionService.listSessions());
    }

    /**
     * Check if the current user has an active running session.
     *
     * <p>GET /api/v1/sessions/active â€” Maps to JS: {@code SessionManager.hasActive()}
     *
     * <p>IMPORTANT: This endpoint must be declared BEFORE {@code /{sessionId}} or Spring
     * will try to parse "active" as a UUID and fail. /active is a more specific path.
     *
     * @return 200 OK with {@code { "active": true/false }}
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Boolean>> hasActiveSession() {
        boolean active = studySessionService.hasActiveSession();
        return ResponseEntity.ok(Map.of("active", active));
    }

    /**
     * Get a specific session by its UUID.
     *
     * <p>GET /api/v1/sessions/{sessionId} â€” Maps to JS: {@code StudySession.getById(sessionId)}
     *
     * @param sessionId the UUID of the session
     * @return 200 OK with the session data
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> get(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.getSession(sessionId));
    }

    /**
     * Create and start a new study session.
     *
     * <p>POST /api/v1/sessions
     * Returns 201 Created because we created a new resource.
     *
     * @param request the session data (playlistId, videoId, duration, cycles)
     * @return 201 Created with the new session
     */
    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SessionCreateRequest request) {
        SessionResponse session = studySessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    /**
     * Pause a running session.
     *
     * <p>PATCH /api/v1/sessions/{sessionId}/pause
     * Maps to JS: {@code SessionController.pause()} which changes status to 'paused'.
     *
     * @param sessionId the UUID of the session to pause
     * @return 200 OK with updated session
     */
    @PatchMapping("/{sessionId}/pause")
    public ResponseEntity<SessionResponse> pause(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.pauseSession(sessionId));
    }

    /**
     * Resume a paused session.
     *
     * <p>PATCH /api/v1/sessions/{sessionId}/resume
     * Maps to JS: {@code SessionController.resume()} which changes status back to 'running'.
     *
     * @param sessionId the UUID of the session to resume
     * @return 200 OK with updated session
     */
    @PatchMapping("/{sessionId}/resume")
    public ResponseEntity<SessionResponse> resume(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(studySessionService.resumeSession(sessionId));
    }

    /**
     * Complete a session and record the actual time studied.
     *
     * <p>PATCH /api/v1/sessions/{sessionId}/complete
     * Maps to JS: {@code SessionController.stop()} â†’ {@code StudySession.end(sessionId, completedMins)}
     *
     * @param sessionId the UUID of the session to complete
     * @param request   contains the actual minutes completed
     * @return 200 OK with the completed session
     */
    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<SessionResponse> complete(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SessionCompleteRequest request
    ) {
        return ResponseEntity.ok(studySessionService.completeSession(sessionId, request));
    }

    /**
     * Add a single attention score reading from the face-api.js tracker.
     *
     * <p>POST /api/v1/sessions/{sessionId}/attention
     * Maps to JS: {@code StudySession.addAttentionScore(sessionId, score)}
     * The browser calls this endpoint approximately every 1.5 seconds during a session.
     *
     * @param sessionId the UUID of the active session
     * @param request   the attention score (0â€“100)
     * @return 200 OK with the updated session including the new score
     */
    @PostMapping("/{sessionId}/attention")
    public ResponseEntity<SessionResponse> addAttention(
            @PathVariable UUID sessionId,
            @Valid @RequestBody AttentionScoreRequest request
    ) {
        return ResponseEntity.ok(studySessionService.addAttentionScore(sessionId, request));
    }

    /**
     * Seed initial mock study sessions with attention scores for development/testing.
     *
     * <p>POST /api/v1/sessions/seed
     *
     * @return a message indicating successful seeding
     */
    @PostMapping("/seed")
    public ResponseEntity<java.util.Map<String, String>> seedSessions() {
        studySessionService.seedSessionData();
        return ResponseEntity.ok(java.util.Map.of("message", "Mock study sessions and attention scores seeded successfully"));
    }
}
