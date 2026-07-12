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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for managing study sessions.
 */
@Service
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;
    private final boolean storeAttentionOnServer;

    public StudySessionService(
            StudySessionRepository studySessionRepository,
            PlaylistRepository playlistRepository,
            CurrentUserService currentUserService,
            @Value("${cognelearn.attention.store-on-server:false}") boolean storeAttentionOnServer
    ) {
        this.studySessionRepository = studySessionRepository;
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
        this.storeAttentionOnServer = storeAttentionOnServer;
    }

    /**
     * Get all study sessions for the current user.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> listSessions() {
        UserEntity user = currentUserService.requireUser();
        return studySessionRepository.findAllByUser(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get a specific session by ID.
     */
    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with id: " + sessionId));
        return toResponse(session);
    }

    /**
     * Create and start a new study session.
     */
    @Transactional
    public SessionResponse createSession(SessionCreateRequest request) {
        UserEntity user = currentUserService.requireUser();

        PlaylistEntity playlist = null;
        if (request.playlistId() != null && !request.playlistId().isBlank()) {
            playlist = playlistRepository.findByIdAndUser(UUID.fromString(request.playlistId()), user)
                    .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + request.playlistId()));
        }

        StudySessionEntity session = new StudySessionEntity(
                UUID.randomUUID(),
                user,
                playlist,
                request.videoId(),
                Instant.now(),
                request.duration(),
                Instant.now()
        );

        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Pause an active session.
     */
    @Transactional
    public SessionResponse pauseSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Can only pause an ACTIVE session. Current status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.PAUSED);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Resume a paused session.
     */
    @Transactional
    public SessionResponse resumeSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (session.getStatus() != SessionStatus.PAUSED) {
            throw new IllegalArgumentException("Can only resume a PAUSED session. Current status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.ACTIVE);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Mark a session as completed.
     */
    @Transactional
    public SessionResponse completeSession(UUID sessionId, SessionCompleteRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        session.setCompletedDuration(request.completedDuration());
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(Instant.now());
        studySessionRepository.save(session);

        if (session.getPlaylist() != null) {
            PlaylistEntity playlist = session.getPlaylist();
            int newTotal = playlist.getTotalFocusMinutes() + request.completedDuration();
            playlist.setTotalFocusMinutes(newTotal);
            playlistRepository.save(playlist);
        }

        return toResponse(session);
    }

    /**
     * Record a single attention score reading.
     */
    @Transactional
    public SessionResponse addAttentionScore(UUID sessionId, AttentionScoreRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!storeAttentionOnServer) {
            return toResponse(session);
        }

        AttentionScoreEntity scoreEntity = new AttentionScoreEntity(
                UUID.randomUUID(),
                session,
                request.score(),
                Instant.now()
        );

        session.getAttentionScores().add(scoreEntity);
        studySessionRepository.save(session);
        return toResponse(session);
    }

    /**
     * Check if the current user has an active session.
     */
    @Transactional(readOnly = true)
    public boolean hasActiveSession() {
        UserEntity user = currentUserService.requireUser();
        List<StudySessionEntity> activeSessions = studySessionRepository
                .findAllByUserAndStatus(user, SessionStatus.ACTIVE);
        return !activeSessions.isEmpty();
    }

    /**
     * Seed initial mock study sessions.
     */
    @Transactional
    public void seedSessionData() {
        UserEntity user = currentUserService.requireUser();

        Instant startTime1 = Instant.now().minus(2, java.time.temporal.ChronoUnit.DAYS);
        Instant endTime1 = startTime1.plus(25, java.time.temporal.ChronoUnit.MINUTES);
        StudySessionEntity s1 = new StudySessionEntity(
                UUID.randomUUID(), user, null, "dQw4w9WgXcQ",
                startTime1, 25, startTime1
        );
        s1.setStatus(SessionStatus.COMPLETED);
        s1.setEndTime(endTime1);
        s1.setCompletedDuration(25);
        int[] scores1 = {80, 85, 78, 82, 88, 75, 83, 81, 84, 80};
        for (int i = 0; i < scores1.length; i++) {
            s1.getAttentionScores().add(new AttentionScoreEntity(
                    UUID.randomUUID(), s1, scores1[i], startTime1.plus(i * 2, java.time.temporal.ChronoUnit.MINUTES)
            ));
        }
        studySessionRepository.save(s1);

        Instant startTime2 = Instant.now().minus(1, java.time.temporal.ChronoUnit.DAYS);
        Instant endTime2 = startTime2.plus(25, java.time.temporal.ChronoUnit.MINUTES);
        StudySessionEntity s2 = new StudySessionEntity(
                UUID.randomUUID(), user, null, "dQw4w9WgXcQ",
                startTime2, 25, startTime2
        );
        s2.setStatus(SessionStatus.COMPLETED);
        s2.setEndTime(endTime2);
        s2.setCompletedDuration(20);
        int[] scores2 = {60, 65, 58, 70, 68, 55, 63, 61, 64, 60};
        for (int i = 0; i < scores2.length; i++) {
            s2.getAttentionScores().add(new AttentionScoreEntity(
                    UUID.randomUUID(), s2, scores2[i], startTime2.plus(i * 2, java.time.temporal.ChronoUnit.MINUTES)
            ));
        }
        studySessionRepository.save(s2);

        Instant startTime3 = Instant.now().minus(30, java.time.temporal.ChronoUnit.MINUTES);
        Instant endTime3 = startTime3.plus(25, java.time.temporal.ChronoUnit.MINUTES);
        StudySessionEntity s3 = new StudySessionEntity(
                UUID.randomUUID(), user, null, "dQw4w9WgXcQ",
                startTime3, 25, startTime3
        );
        s3.setStatus(SessionStatus.COMPLETED);
        s3.setEndTime(endTime3);
        s3.setCompletedDuration(25);
        int[] scores3 = {90, 92, 89, 95, 91, 88, 93, 91, 94, 90};
        for (int i = 0; i < scores3.length; i++) {
            s3.getAttentionScores().add(new AttentionScoreEntity(
                    UUID.randomUUID(), s3, scores3[i], startTime3.plus(i * 2, java.time.temporal.ChronoUnit.MINUTES)
            ));
        }
        studySessionRepository.save(s3);
    }

    private SessionResponse toResponse(StudySessionEntity session) {
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
                session.getStatus().name().toLowerCase(),
                session.getCreatedAt(),
                scores
        );
    }
}
