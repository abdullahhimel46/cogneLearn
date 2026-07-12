package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.playlist.PlaylistRequest;
import com.abd.cognelearn.dto.playlist.PlaylistResponse;
import com.abd.cognelearn.dto.playlist.PlaylistUpdateRequest;
import com.abd.cognelearn.dto.playlist.VideoItemRequest;
import com.abd.cognelearn.dto.playlist.VideoItemResponse;
import com.abd.cognelearn.model.PlaylistEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.model.VideoItemEntity;
import com.abd.cognelearn.repository.PlaylistRepository;
import com.abd.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for playlist and video operations.
 */
@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final CurrentUserService currentUserService;

    public PlaylistService(PlaylistRepository playlistRepository,
                           StudySessionRepository studySessionRepository,
                           CurrentUserService currentUserService) {
        this.playlistRepository = playlistRepository;
        this.studySessionRepository = studySessionRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Get all playlists belonging to the current user.
     */
    @Transactional(readOnly = true)
    public List<PlaylistResponse> listPlaylists() {
        UserEntity user = currentUserService.requireUser();
        return playlistRepository.findAllByUser(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get a specific playlist by ID.
     */
    @Transactional(readOnly = true)
    public PlaylistResponse getPlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));
        return toResponse(playlist);
    }

    /**
     * Create a new playlist.
     */
    @Transactional
    public PlaylistResponse createPlaylist(PlaylistRequest request) {
        UserEntity user = currentUserService.requireUser();

        PlaylistEntity playlist = new PlaylistEntity(
                UUID.randomUUID(),
                user,
                request.title(),
                request.description() == null ? "" : request.description(),
                Instant.now()
        );

        List<VideoItemEntity> videos = mapVideoRequests(playlist, request.videos());
        playlist.setVideos(videos);

        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Update an existing playlist.
     */
    @Transactional
    public PlaylistResponse updatePlaylist(UUID playlistId, PlaylistUpdateRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        if (request.title() != null) {
            playlist.setTitle(request.title());
        }
        if (request.description() != null) {
            playlist.setDescription(request.description());
        }
        if (request.videos() != null) {
            playlist.getVideos().clear();
            playlist.getVideos().addAll(mapVideoRequests(playlist, request.videos()));
        }

        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Add a video to an existing playlist.
     */
    @Transactional
    public PlaylistResponse addVideo(UUID playlistId, VideoItemRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        boolean alreadyExists = playlist.getVideos().stream()
                .anyMatch(video -> video.getExternalId().equals(request.id()));

        if (!alreadyExists) {
            playlist.getVideos().add(new VideoItemEntity(
                    UUID.randomUUID(),
                    playlist,
                    request.id(),
                    request.title(),
                    request.kind() == null ? "video" : request.kind(),
                    request.subtitle(),
                    Instant.now()
            ));
            playlistRepository.save(playlist);
        }

        return toResponse(playlist);
    }

    /**
     * Remove a video from a playlist.
     */
    @Transactional
    public PlaylistResponse removeVideo(UUID playlistId, String videoId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        playlist.getVideos().removeIf(video -> video.getExternalId().equals(videoId));
        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Delete a playlist and unlink from sessions.
     */
    @Transactional
    public void deletePlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));
        
        studySessionRepository.unlinkPlaylistFromSessions(playlistId);
        playlistRepository.delete(playlist);
    }

    private List<VideoItemEntity> mapVideoRequests(PlaylistEntity playlist, List<VideoItemRequest> requests) {
        List<VideoItemEntity> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }
        for (VideoItemRequest item : requests) {
            result.add(new VideoItemEntity(
                    UUID.randomUUID(),
                    playlist,
                    item.id(),
                    item.title(),
                    item.kind() == null ? "video" : item.kind(),
                    item.subtitle(),
                    Instant.now()
            ));
        }
        return result;
    }

    private PlaylistResponse toResponse(PlaylistEntity playlist) {
        List<VideoItemResponse> videoResponses = playlist.getVideos().stream()
                .map(video -> new VideoItemResponse(
                        video.getExternalId(),
                        video.getTitle(),
                        video.getKind(),
                        video.getSubtitle()
                ))
                .toList();

        return new PlaylistResponse(
                playlist.getId(),
                playlist.getTitle(),
                playlist.getDescription(),
                playlist.getCreatedAt(),
                playlist.getTotalFocusMinutes(),
                videoResponses
        );
    }
}
