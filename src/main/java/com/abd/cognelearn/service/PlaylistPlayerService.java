package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.player.PlaylistPlayerResponse;
import com.abd.cognelearn.dto.player.PlaylistPlayerVideoResponse;
import com.abd.cognelearn.model.PlaylistEntity;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.model.VideoItemEntity;
import com.abd.cognelearn.repository.PlaylistRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * PlaylistPlayerService â€” prepares playlist data for the custom Video.js player page.
 */
@Service
public class PlaylistPlayerService {

    private final PlaylistRepository playlistRepository;
    private final CurrentUserService currentUserService;

    public PlaylistPlayerService(PlaylistRepository playlistRepository, CurrentUserService currentUserService) {
        this.playlistRepository = playlistRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PlaylistPlayerResponse getPlaylistForPlayer(UUID playlistId) {
        UserEntity user = currentUserService.requireUser();
        PlaylistEntity playlist = resolvePlaylist(user, playlistId);

        List<PlaylistPlayerVideoResponse> videos = playlist.getVideos().stream()
                .map(this::toVideoResponse)
                .toList();

        return new PlaylistPlayerResponse(
                playlist.getId(),
                playlist.getTitle(),
                playlist.getDescription(),
                videos
        );
    }

    private PlaylistEntity resolvePlaylist(UserEntity user, UUID playlistId) {
        if (playlistId != null) {
            return playlistRepository.findByIdAndUser(playlistId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Playlist not found: " + playlistId));
        }

        return playlistRepository.findAllByUser(user).stream()
                .sorted(Comparator.comparing(PlaylistEntity::getCreatedAt).reversed())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No playlists found for the current user."));
    }

    private PlaylistPlayerVideoResponse toVideoResponse(VideoItemEntity video) {
        String youtubeId = video.getExternalId();
        return new PlaylistPlayerVideoResponse(
                video.getId().toString(),
                video.getTitle(),
                youtubeId,
                "https://img.youtube.com/vi/" + youtubeId + "/hqdefault.jpg",
                null
        );
    }
}