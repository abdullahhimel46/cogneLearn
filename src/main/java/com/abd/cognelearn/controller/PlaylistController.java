package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.playlist.PlaylistRequest;
import com.abd.cognelearn.dto.playlist.PlaylistResponse;
import com.abd.cognelearn.dto.playlist.PlaylistUpdateRequest;
import com.abd.cognelearn.dto.playlist.VideoItemRequest;
import com.abd.cognelearn.service.PlaylistService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for playlist management.
 */
@RestController                          // Marks this as a REST controller â€” returns JSON
@RequestMapping("/api/v1/playlists")     // All methods are under /api/v1/playlists
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    /**
     * Get all playlists for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> list() {
        return ResponseEntity.ok(playlistService.listPlaylists());
    }

    /**
     * Get a specific playlist by ID.
     */
    @GetMapping("/{playlistId}")
    public ResponseEntity<PlaylistResponse> get(@PathVariable UUID playlistId) {
        return ResponseEntity.ok(playlistService.getPlaylist(playlistId));
    }

    /**
     * Create a new playlist.
     */
    @PostMapping
    public ResponseEntity<PlaylistResponse> create(@Valid @RequestBody PlaylistRequest request) {
        PlaylistResponse created = playlistService.createPlaylist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update fields of an existing playlist.
     */
    @PatchMapping("/{playlistId}")
    public ResponseEntity<PlaylistResponse> update(
            @PathVariable UUID playlistId,
            @RequestBody PlaylistUpdateRequest request
    ) {
        return ResponseEntity.ok(playlistService.updatePlaylist(playlistId, request));
    }

    /**
     * Add a video to a playlist.
     */
    @PostMapping("/{playlistId}/videos")
    public ResponseEntity<PlaylistResponse> addVideo(
            @PathVariable UUID playlistId,
            @Valid @RequestBody VideoItemRequest request
    ) {
        return ResponseEntity.ok(playlistService.addVideo(playlistId, request));
    }

    /**
     * Remove a video from a playlist by ID.
     */
    @DeleteMapping("/{playlistId}/videos/{videoId}")
    public ResponseEntity<PlaylistResponse> removeVideo(
            @PathVariable UUID playlistId,
            @PathVariable String videoId
    ) {
        return ResponseEntity.ok(playlistService.removeVideo(playlistId, videoId));
    }

    /**
     * Delete a playlist.
     */
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<Void> delete(@PathVariable UUID playlistId) {
        playlistService.deletePlaylist(playlistId);
        return ResponseEntity.noContent().build();
    }
}
