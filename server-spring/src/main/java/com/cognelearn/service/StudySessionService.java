package com.cognelearn.service;

import com.cognelearn.dto.session.AttentionScoreRequest;
import com.cognelearn.dto.session.SessionCompleteRequest;
import com.cognelearn.dto.session.SessionCreateRequest;
import com.cognelearn.dto.session.SessionResponse;
import com.cognelearn.model.AttentionScoreEntity;
import com.cognelearn.model.PlaylistEntity;
import com.cognelearn.model.SessionStatus;
import com.cognelearn.model.StudySessionEntity;
import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.PlaylistRepository;
import com.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class StudySessionService {
    private final StudySessionRepository studySessionRepository;
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    public StudySessionService(StudySessionRepository studySessionRepository, PlaylistRepository playlistRepository, CurrentUserService currentUserService) {
        this.studySessionRepository = studySessionRepository;
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
    }

    public List<SessionResponse> listSessions() {
        UserEntity user = currentUserService.requireUser();
        return studySessionRepository.findAllByUser(user).stream().map(this::toResponse).toList();
    }

    public SessionResponse getSession(UUID sessionId) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        return toResponse(session);
    }

    public SessionResponse createSession(SessionCreateRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = null;
        if (request.playlistId() != null && !request.playlistId().isBlank()) {
            playlist = playlistRepository.findByIdAndUser(UUID.fromString(request.playlistId()), user)
                    .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
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

    public SessionResponse completeSession(UUID sessionId, SessionCompleteRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.setCompletedDuration(request.completedDuration());
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(Instant.now());
        studySessionRepository.save(session);

        if (session.getPlaylist() != null) {
            PlaylistEntity playlist = session.getPlaylist();
            playlist.setTotalFocusMinutes(playlist.getTotalFocusMinutes() + request.completedDuration());
            playlistRepository.save(playlist);
        }

        return toResponse(session);
    }

    public SessionResponse addAttentionScore(UUID sessionId, AttentionScoreRequest request) {
        UserEntity user = currentUserService.requireUser();
        StudySessionEntity session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.getAttentionScores().add(new AttentionScoreEntity(
                UUID.randomUUID(),
                session,
                request.score(),
                Instant.now()
        ));
        studySessionRepository.save(session);
        return toResponse(session);
    }

    private SessionResponse toResponse(StudySessionEntity session) {
        List<Integer> scores = session.getAttentionScores().stream().map(AttentionScoreEntity::getScore).toList();
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
