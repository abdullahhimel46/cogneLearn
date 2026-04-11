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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PlaylistService {
    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    public PlaylistService(PlaylistRepository playlistRepository, CurrentUserService currentUserService) {
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
    }

    public List<PlaylistResponse> listPlaylists() {
        UserEntity user = currentUserService.requireUser();
        return playlistRepository.findAllByUser(user).stream().map(this::toResponse).toList();
    }

    public PlaylistResponse getPlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        return toResponse(playlist);
    }

    public PlaylistResponse createPlaylist(PlaylistRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = new PlaylistEntity(
                UUID.randomUUID(),
                user,
                request.title(),
                request.description() == null ? "" : request.description(),
                Instant.now()
        );

        List<VideoItemEntity> videos = mapVideos(playlist, request.videos());
        playlist.setVideos(videos);
        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    public PlaylistResponse updatePlaylist(UUID playlistId, PlaylistUpdateRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));

        if (request.title() != null) {
            playlist.setTitle(request.title());
        }
        if (request.description() != null) {
            playlist.setDescription(request.description());
        }
        if (request.videos() != null) {
            playlist.getVideos().clear();
            playlist.getVideos().addAll(mapVideos(playlist, request.videos()));
        }

        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    public PlaylistResponse addVideo(UUID playlistId, VideoItemRequest request) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));

        boolean exists = playlist.getVideos().stream()
                .anyMatch(video -> video.getExternalId().equals(request.id()));
        if (!exists) {
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

    public PlaylistResponse removeVideo(UUID playlistId, String videoId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));

        playlist.getVideos().removeIf(video -> video.getExternalId().equals(videoId));
        playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    public void deletePlaylist(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        playlistRepository.delete(playlist);
    }

    private List<VideoItemEntity> mapVideos(PlaylistEntity playlist, List<VideoItemRequest> videos) {
        List<VideoItemEntity> result = new ArrayList<>();
        if (videos == null) {
            return result;
        }
        for (VideoItemRequest item : videos) {
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
        List<VideoItemResponse> videos = playlist.getVideos().stream()
                .map(video -> new VideoItemResponse(video.getExternalId(), video.getTitle(), video.getKind(), video.getSubtitle()))
                .toList();
        return new PlaylistResponse(
                playlist.getId(),
                playlist.getTitle(),
                playlist.getDescription(),
                playlist.getCreatedAt(),
                playlist.getTotalFocusMinutes(),
                videos
        );
    }
}
