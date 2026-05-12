package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.session.AttentionScoreRequest;
import com.abd.cognelearn.dto.session.SessionCompleteRequest;
import com.abd.cognelearn.dto.session.SessionCreateRequest;
import com.abd.cognelearn.dto.session.SessionResponse;
import com.abd.cognelearn.model.AttentionScoreEntity;
import com.abd.cognelearn.model.PlaylistEntity;
import com.abd.cognelearn.model.SessionStatus;
import com.abd.cognelearn.model.StudySessionEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.PlaylistRepository;
import com.abd.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * StudySessionService â€” manages all study session operations.
 *
 * <p>A "study session" represents one timed focus period (like a Pomodoro block).
 * This service maps to multiple JavaScript modules:
 * <ul>
 *   <li>{@code StudySession.js} â€” create, get, end sessions</li>
 *   <li>{@code SessionManager.js} â€” active session tracking</li>
 *   <li>{@code SessionController.js} â€” timer lifecycle (start, pause, resume, complete)</li>
 * </ul>
 *
 * <p>{@code @Service} tells Spring this is a service bean to manage automatically.
 * {@code @Transactional} on methods tells JPA to wrap the database operations in a
 * transaction â€” if anything fails, ALL changes are rolled back (all-or-nothing).
 */
@Service
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    /**
     * Constructor â€” Spring injects all required dependencies automatically.
     *
     * @param studySessionRepository repository for session DB operations
     * @param playlistRepository     repository for playlist lookups
     * @param currentUserService     helper to get the logged-in user
     */
    public StudySessionService(
            StudySessionRepository studySessionRepository,
            PlaylistRepository playlistRepository,
            CurrentUserService currentUserService
    ) {
        this.studySessionRepository = studySessionRepository;
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Get all study sessions for the currently logged-in user.
     *
     * <p>Maps to JS: {@code StudySession.getAll()}
     *
     * @return list of all sessions for the current user
     */
    @Transactional(readOnly = true)  // readOnly = true is a performance hint (no writes)
    public List<SessionResponse> listSessions() {
        UserEntity user = currentUserService.requireUser();
        return studySessionRepository.findAllByUser(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get a specific session by its UUID.
     *
     * <p>Maps to JS: {@code StudySession.getById(sessionId)}
     *
     * @param sessionId the UUID of the session to retrieve
     * @return the session, or throws IllegalArgumentException if not found
     */
    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with id: " + sessionId));
        return toResponse(session);
    }

    /**
     * Create a new study session and immediately start it.
     *
     * <p>Maps to JS: {@code StudySession.create(sessionData)} + {@code SessionManager.start()}
     *
     * @param request the session data from the browser
     * @return the newly created session
     */
    @Transactional
    public SessionResponse createSession(SessionCreateRequest request) {
        UserEntity user = currentUserService.requireUser();

        // Step 1: Look up the playlist if a playlistId was provided
        // (playlist is optional â€” user can study without selecting one)
        PlaylistEntity playlist = null;
        if (request.playlistId() != null && !request.playlistId().isBlank()) {
            playlist = playlistRepository.findByIdAndUser(UUID.fromString(request.playlistId()), user)
                    .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + request.playlistId()));
        }

        // Step 2: Build the new session object
        StudySessionEntity session = new StudySessionEntity(
                UUID.randomUUID(),           // generate a new unique ID
                user,                        // link to the current user
                playlist,                    // link to the playlist (or null)
                request.videoId(),           // the video being watched (or null)
                Instant.now(),               // record the start time
                request.duration(),          // planned duration in minutes
                Instant.now()                // creation timestamp
        );

        // Step 3: Save to the database (INSERT INTO study_sessions ...)
        studySessionRepository.save(session);

        // Step 4: Return the session as a response DTO
        return toResponse(session);
    }

    /**
     * Pause an active session.
     *
     * <p>Maps to JS: {@code SessionController.pause()} and then
     * the session status in {@code StudySession.js} changing to 'paused'.
     *
     * @param sessionId the UUID of the session to pause
     * @return the updated session
     */
    @Transactional
    public SessionResponse pauseSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Only allow pausing an active session
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Can only pause an ACTIVE session. Current status: " + session.getStatus());
        }

        // Update status to PAUSED
        session.setStatus(SessionStatus.PAUSED);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Resume a paused session.
     *
     * <p>Maps to JS: {@code SessionController.resume()} which changes session status back to 'running'.
     *
     * @param sessionId the UUID of the session to resume
     * @return the updated session
     */
    @Transactional
    public SessionResponse resumeSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Only allow resuming a paused session
        if (session.getStatus() != SessionStatus.PAUSED) {
            throw new IllegalArgumentException("Can only resume a PAUSED session. Current status: " + session.getStatus());
        }

        // Update status back to ACTIVE
        session.setStatus(SessionStatus.ACTIVE);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Mark a session as completed and record how long the user actually studied.
     *
     * <p>Maps to JS: {@code SessionController.stop()} â†’ {@code StudySession.end(sessionId, completedMinutes)}
     * and updates {@code playlist.totalFocusMinutes} like {@code Playlist.addSession()}.
     *
     * @param sessionId the UUID of the session to complete
     * @param request   contains the actual minutes completed
     * @return the completed session
     */
    @Transactional
    public SessionResponse completeSession(UUID sessionId, SessionCompleteRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Step 1: Record the actual completed time and mark as done
        session.setCompletedDuration(request.completedDuration());
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(Instant.now());
        studySessionRepository.save(session);

        // Step 2: Update the playlist's total focus minutes
        // (Maps to JS: Playlist.addSession() which increments playlist.totalFocusMinutes)
        if (session.getPlaylist() != null) {
            PlaylistEntity playlist = session.getPlaylist();
            int newTotal = playlist.getTotalFocusMinutes() + request.completedDuration();
            playlist.setTotalFocusMinutes(newTotal);
            playlistRepository.save(playlist);
        }

        return toResponse(session);
    }

    /**
     * Record a single attention score reading from the face-api.js tracker.
     *
     * <p>Maps to JS: {@code StudySession.addAttentionScore(sessionId, score)}
     * The browser calls this endpoint periodically while the session is running.
     *
     * @param sessionId the UUID of the active session
     * @param request   contains the score (0â€“100)
     * @return the updated session with the new score appended to attentionScores
     */
    @Transactional
    public SessionResponse addAttentionScore(UUID sessionId, AttentionScoreRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Create a new score record and link it to the session
        AttentionScoreEntity scoreEntity = new AttentionScoreEntity(
                UUID.randomUUID(),    // unique ID for this score measurement
                session,              // the parent session
                request.score(),      // the 0-100 attention value
                Instant.now()         // when it was recorded
        );

        // Add it to the session's list (cascade will persist it)
        session.getAttentionScores().add(scoreEntity);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Check if the current user has an active (running) session right now.
     *
     * <p>Maps to JS: {@code SessionManager.hasActive()}
     *
     * @return true if the user has a session with status ACTIVE
     */
    @Transactional(readOnly = true)
    public boolean hasActiveSession() {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> activeSessions = studySessionRepository
                .findAllByUserAndStatus(user, SessionStatus.ACTIVE);
        return !activeSessions.isEmpty();
    }

    /**
     * Convert a {@link StudySessionEntity} database object into a {@link SessionResponse} DTO.
     *
     * <p>This is an internal helper used by all public methods above.
     * We extract only the data safe to send to the browser (no sensitive internal fields).
     *
     * @param session the entity loaded from the database
     * @return a response DTO ready to be serialized to JSON
     */
    private SessionResponse toResponse(StudySessionEntity session) {
        // Collect all attention scores into a simple List<Integer>
        List<Integer> scores = session.getAttentionScores()
                .stream()
                .map(AttentionScoreEntity::getScore)
                .toList();

        return new SessionResponse(
                session.getId(),
                session.getPlaylist() != null ? session.getPlaylist().getId().toString() : null,
                session.getVideoId(),
                session.getStartTime(),
                session.getEndTime(),
                session.getDuration(),
                session.getCompletedDuration(),
                session.getStatus().name().toLowerCase(),  // "ACTIVE" â†’ "active" (matches JS)
                session.getCreatedAt(),
                scores
        );
    }
}
