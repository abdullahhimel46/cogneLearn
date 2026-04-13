package com.cognelearn.controller;

import com.cognelearn.dto.playlist.PlaylistRequest;
import com.cognelearn.dto.playlist.PlaylistResponse;
import com.cognelearn.dto.playlist.PlaylistUpdateRequest;
import com.cognelearn.dto.playlist.VideoItemRequest;
import com.cognelearn.service.PlaylistService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/playlists")
public class PlaylistController {
    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<PlaylistResponse> list() {
        return playlistService.listPlaylists();
    }

    @GetMapping("/{playlistId}")
    public PlaylistResponse get(@PathVariable UUID playlistId) {
        return playlistService.getPlaylist(playlistId);
    }

    @PostMapping
    public PlaylistResponse create(@Valid @RequestBody PlaylistRequest request) {
        return playlistService.createPlaylist(request);
    }

    @PatchMapping("/{playlistId}")
    public PlaylistResponse update(@PathVariable UUID playlistId, @RequestBody PlaylistUpdateRequest request) {
        return playlistService.updatePlaylist(playlistId, request);
    }

    @PostMapping("/{playlistId}/videos")
    public PlaylistResponse addVideo(@PathVariable UUID playlistId, @Valid @RequestBody VideoItemRequest request) {
        return playlistService.addVideo(playlistId, request);
    }

    @DeleteMapping("/{playlistId}/videos/{videoId}")
    public PlaylistResponse removeVideo(@PathVariable UUID playlistId, @PathVariable String videoId) {
        return playlistService.removeVideo(playlistId, videoId);
    }

    @DeleteMapping("/{playlistId}")
    public void delete(@PathVariable UUID playlistId) {
        playlistService.deletePlaylist(playlistId);
    }
}
