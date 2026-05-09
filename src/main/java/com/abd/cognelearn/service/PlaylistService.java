package com.cognelearn.service;

import com.cognelearn.dto.playlist.PlaylistRequest;
import com.cognelearn.dto.playlist.PlaylistResponse;
import com.cognelearn.dto.playlist.PlaylistUpdateRequest;
import com.cognelearn.dto.playlist.VideoItemRequest;
import com.cognelearn.dto.playlist.VideoItemResponse;
import com.cognelearn.model.PlaylistEntity;
import com.cognelearn.model.UserEntity;
import com.cognelearn.model.VideoItemEntity;
import com.cognelearn.repository.PlaylistRepository;
import com.cognelearn.repository.StudySessionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * PlaylistService — manages all playlist and video operations.
 *
 * <p>Maps to the JavaScript {@code playlist.js} module. All CRUD operations
 * (Create, Read, Update, Delete) for playlists and their videos are handled here.
 *
 * <p>Key difference from JS: ownership is enforced at the database query level.
 * Every method checks that the logged-in user owns the playlist before any operation.
 * In the old JS version, any user who guessed a playlistId could theoretically access it.
 */
@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final CurrentUserService currentUserService;

    /**
     * Constructor — Spring injects required dependencies.
     *
     * @param playlistRepository     the JPA repository for playlist operations
     * @param studySessionRepository the JPA repository for study session operations
     * @param currentUserService     helper to get the logged-in user
     */
    public PlaylistService(PlaylistRepository playlistRepository,
                           StudySessionRepository studySessionRepository,
                           CurrentUserService currentUserService) {
        this.playlistRepository = playlistRepository;
        this.studySessionRepository = studySessionRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Get all playlists belonging to the current user.
     *
     * <p>Maps to JS: {@code Playlist.getAll()}
     *
     * @return list of all playlists (empty list if none)
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
     * Get a specific playlist by its UUID.
     *
     * <p>Maps to JS: {@code Playlist.getById(playlistId)}
     *
     * @param playlistId the UUID of the playlist
     * @return the playlist data
     * @throws IllegalArgumentException if not found or not owned by current user
     */
    @Transactional(readOnly = true)
    public PlaylistResponse getPlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));
        return toResponse(playlist);
    }

    /**
     * Create a new playlist for the current user.
     *
     * <p>Maps to JS: {@code Playlist.create(playlistData)}
     *
     * @param request the playlist data from the browser
     * @return the newly created playlist
     */
    @Transactional
    public PlaylistResponse createPlaylist(PlaylistRequest request) {
        UserEntity user = currentUserService.requireUser();

        // Step 1: Create the playlist entity
        PlaylistEntity playlist = new PlaylistEntity(
                UUID.randomUUID(),
                user,
                request.title(),
                request.description() == null ? "" : request.description(),
                Instant.now()
        );

        // Step 2: Add initial videos if any were provided
        List<VideoItemEntity> videos = mapVideoRequests(playlist, request.videos());
        playlist.setVideos(videos);

        // Step 3: Save to database
        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Update an existing playlist's title, description, or videos.
     *
     * <p>Maps to JS: {@code Playlist.update(playlistId, updates)}
     * Only fields provided (non-null) are updated.
     *
     * @param playlistId the UUID of the playlist to update
     * @param request    the fields to update (null fields = no change)
     * @return the updated playlist
     */
    @Transactional
    public PlaylistResponse updatePlaylist(UUID playlistId, PlaylistUpdateRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        // Only update fields that were provided in the request (partial update)
        if (request.title() != null) {
            playlist.setTitle(request.title());
        }
        if (request.description() != null) {
            playlist.setDescription(request.description());
        }
        if (request.videos() != null) {
            // Replace the entire video list
            playlist.getVideos().clear();
            playlist.getVideos().addAll(mapVideoRequests(playlist, request.videos()));
        }

        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Add a video to an existing playlist.
     *
     * <p>Maps to JS: {@code Playlist.addVideo(playlistId, videoData)}
     * Duplicate video IDs are silently ignored (same behavior as JS version).
     *
     * @param playlistId the UUID of the target playlist
     * @param request    the video data to add
     * @return the updated playlist
     */
    @Transactional
    public PlaylistResponse addVideo(UUID playlistId, VideoItemRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        // Check for duplicates (same as JS: if (!p.videos.some(v => v.id === videoData.id)))
        boolean alreadyExists = playlist.getVideos().stream()
                .anyMatch(video -> video.getExternalId().equals(request.id()));

        if (!alreadyExists) {
            // Add the new video to the list
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
     * Remove a video from a playlist by its YouTube video ID.
     *
     * <p>Maps to JS: {@code Playlist.removeVideo(playlistId, videoId)}
     *
     * @param playlistId the UUID of the playlist
     * @param videoId    the YouTube video ID to remove (e.g., "dQw4w9WgXcQ")
     * @return the updated playlist
     */
    @Transactional
    public PlaylistResponse removeVideo(UUID playlistId, String videoId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));

        // Remove the video by its YouTube ID
        // (orphanRemoval = true on PlaylistEntity means this deletes the DB row too)
        playlist.getVideos().removeIf(video -> video.getExternalId().equals(videoId));
        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    /**
     * Delete an entire playlist and all its videos.
     *
     * <p>Maps to JS: {@code Playlist.delete(playlistId)}
     * Videos are automatically deleted too (CascadeType.ALL on PlaylistEntity).
     *
     * @param playlistId the UUID of the playlist to delete
     */
    @Transactional
    public void deletePlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));
        
        studySessionRepository.unlinkPlaylistFromSessions(playlistId);
        
        playlistRepository.delete(playlist);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Convert a list of {@link VideoItemRequest} DTOs to {@link VideoItemEntity} objects.
     * This is an internal helper used during playlist creation and update.
     *
     * @param playlist  the playlist these videos belong to
     * @param requests  list of video request DTOs (can be null)
     * @return a list of VideoItemEntity objects (empty if input was null)
     */
    private List<VideoItemEntity> mapVideoRequests(PlaylistEntity playlist, List<VideoItemRequest> requests) {
        List<VideoItemEntity> result = new ArrayList<>();
        if (requests == null) {
            return result;  // return empty list if no videos were provided
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

    /**
     * Convert a {@link PlaylistEntity} database object into a {@link PlaylistResponse} DTO.
     * This method is used by all public service methods to build API responses.
     *
     * @param playlist the entity loaded from the database
     * @return a response DTO safe to serialize to JSON
     */
    private PlaylistResponse toResponse(PlaylistEntity playlist) {
        // Map each VideoItemEntity to a VideoItemResponse DTO
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
