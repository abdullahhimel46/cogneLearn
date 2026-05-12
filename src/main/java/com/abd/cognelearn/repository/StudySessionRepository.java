package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.SessionStatus;
import com.abd.cognelearn.model.StudySessionEntity;
import com.abd.cognelearn.model.UserEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * StudySessionRepository â€” handles all database operations for {@link StudySessionEntity}.
 *
 * <p>Extends {@link JpaRepository} for free CRUD. Custom query methods below are derived
 * automatically by Spring Data from their names â€” no SQL needed.
 *
 * <p>Maps to JS: {@code StudySession.getAll()}, {@code StudySession.getById()},
 * {@code SessionManager.hasActive()}, and other methods in {@code StudySession.js}.
 */
public interface StudySessionRepository extends JpaRepository<StudySessionEntity, UUID> {
    long countByStatus(SessionStatus status);

    /**
     * Get all study sessions for a user, most recent first.
     *
     * <p>Generated SQL: {@code SELECT * FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC}
     *
     * <p>Maps to JS: {@code StudySession.getAll()} which reads {@code cognelearn_sessions_{userId}}.
     *
     * @param user the user whose sessions to retrieve
     * @return list of sessions (empty if none)
     */
    List<StudySessionEntity> findAllByUser(UserEntity user);

    /**
     * Get a specific session by ID, only if it belongs to the given user.
     *
     * <p>The ownership check (AND user_id = ?) prevents one user from reading another's sessions.
     *
     * <p>Maps to JS: {@code StudySession.getById(sessionId)}.
     *
     * @param id   the session UUID
     * @param user the required owner
     * @return the session if found and owned by user, otherwise empty
     */
    Optional<StudySessionEntity> findByIdAndUser(UUID id, UserEntity user);

    /**
     * Get all sessions that started after a given timestamp.
     *
     * <p>Generated SQL: {@code SELECT * FROM study_sessions WHERE user_id = ? AND start_time > ?}
     *
     * <p>Used by {@code AnalyticsService} to calculate "today's sessions" and "this week's sessions".
     *
     * @param user      the session owner
     * @param startTime the cutoff time (sessions AFTER this time are returned)
     * @return list of sessions in the specified time window
     */
    List<StudySessionEntity> findAllByUserAndStartTimeAfter(UserEntity user, Instant startTime);

    /**
     * Find sessions with a specific status (ACTIVE, PAUSED, or COMPLETED) for a user.
     *
     * <p>Used to check: "does this user have an active session right now?"
     * (equivalent to {@code SessionManager.hasActive()} in JS)
     *
     * <p>Generated SQL: {@code SELECT * FROM study_sessions WHERE user_id = ? AND status = ?}
     *
     * @param user   the session owner
     * @param status the status to filter by
     * @return list of matching sessions
     */
    List<StudySessionEntity> findAllByUserAndStatus(UserEntity user, SessionStatus status);

    /**
     * Unlinks a playlist from all associated study sessions to prevent FK constraint failures
     * when a playlist is deleted, preserving the study duration historical records.
     *
     * @param playlistId the target playlist ID to detach
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE StudySessionEntity s SET s.playlist = null WHERE s.playlist.id = :playlistId")
    void unlinkPlaylistFromSessions(@org.springframework.data.repository.query.Param("playlistId") UUID playlistId);
}
