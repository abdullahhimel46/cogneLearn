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
 * PlaylistController â€” REST API endpoints for playlist management.
 *
 * <p>Base path: {@code /api/v1/playlists}
 *
 * <p>Maps to the JavaScript {@code playlist.js} module. Each HTTP endpoint below
 * corresponds to one (or more) JS methods:
 *
 * <pre>
 *   GET    /api/v1/playlists                      â†’ Playlist.getAll()
 *   GET    /api/v1/playlists/{id}                 â†’ Playlist.getById(id)
 *   POST   /api/v1/playlists                      â†’ Playlist.create(data)
 *   PATCH  /api/v1/playlists/{id}                 â†’ Playlist.update(id, data)
 *   DELETE /api/v1/playlists/{id}                 â†’ Playlist.delete(id)
 *   POST   /api/v1/playlists/{id}/videos          â†’ Playlist.addVideo(id, video)
 *   DELETE /api/v1/playlists/{id}/videos/{videoId}â†’ Playlist.removeVideo(id, videoId)
 * </pre>
 *
 * <p>All endpoints require the user to be logged in (enforced by Spring Security).
 *
 * <p>HTTP verb guide:
 * <ul>
 *   <li>GET = read data (safe, no side effects)</li>
 *   <li>POST = create a new resource</li>
 *   <li>PATCH = partially update an existing resource</li>
 *   <li>DELETE = remove a resource</li>
 * </ul>
 */
@RestController                          // Marks this as a REST controller â€” returns JSON
@RequestMapping("/api/v1/playlists")     // All methods are under /api/v1/playlists
public class PlaylistController {

    // The service handles all the actual work â€” the controller just routes requests
    private final PlaylistService playlistService;

    /**
     * Constructor â€” Spring injects PlaylistService automatically.
     *
     * @param playlistService the service with all playlist business logic
     */
    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    /**
     * Get all playlists for the logged-in user.
     *
     * <p>GET /api/v1/playlists
     *
     * @return 200 OK with list of playlists (empty list if none)
     */
    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> list() {
        return ResponseEntity.ok(playlistService.listPlaylists());
    }

    /**
     * Get a specific playlist by its UUID.
     *
     * <p>GET /api/v1/playlists/{playlistId}
     *
     * @param playlistId the UUID in the URL path
     * @return 200 OK with the playlist, or 400/404 if not found
     */
    @GetMapping("/{playlistId}")
    public ResponseEntity<PlaylistResponse> get(@PathVariable UUID playlistId) {
        return ResponseEntity.ok(playlistService.getPlaylist(playlistId));
    }

    /**
     * Create a new playlist.
     *
     * <p>POST /api/v1/playlists
     * Returns 201 Created (not the default 200) because we created a new resource.
     *
     * @param request the JSON body with title, description, optional videos
     * @return 201 Created with the new playlist
     */
    @PostMapping
    public ResponseEntity<PlaylistResponse> create(@Valid @RequestBody PlaylistRequest request) {
        PlaylistResponse created = playlistService.createPlaylist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing playlist (title, description, or videos).
     *
     * <p>PATCH /api/v1/playlists/{playlistId}
     * PATCH means partial update â€” only fields you send are updated.
     *
     * @param playlistId the UUID of the playlist to update
     * @param request    the fields to change (null = keep existing)
     * @return 200 OK with the updated playlist
     */
    @PatchMapping("/{playlistId}")
    public ResponseEntity<PlaylistResponse> update(
            @PathVariable UUID playlistId,
            @RequestBody PlaylistUpdateRequest request
    ) {
        return ResponseEntity.ok(playlistService.updatePlaylist(playlistId, request));
    }

    /**
     * Add a video to an existing playlist.
     *
     * <p>POST /api/v1/playlists/{playlistId}/videos
     *
     * @param playlistId the UUID of the target playlist
     * @param request    the video data (id, title, kind)
     * @return 200 OK with the updated playlist including the new video
     */
    @PostMapping("/{playlistId}/videos")
    public ResponseEntity<PlaylistResponse> addVideo(
            @PathVariable UUID playlistId,
            @Valid @RequestBody VideoItemRequest request
    ) {
        return ResponseEntity.ok(playlistService.addVideo(playlistId, request));
    }

    /**
     * Remove a video from a playlist.
     *
     * <p>DELETE /api/v1/playlists/{playlistId}/videos/{videoId}
     *
     * @param playlistId the UUID of the playlist
     * @param videoId    the YouTube video ID to remove
     * @return 200 OK with the updated playlist
     */
    @DeleteMapping("/{playlistId}/videos/{videoId}")
    public ResponseEntity<PlaylistResponse> removeVideo(
            @PathVariable UUID playlistId,
            @PathVariable String videoId
    ) {
        return ResponseEntity.ok(playlistService.removeVideo(playlistId, videoId));
    }

    /**
     * Delete an entire playlist (and all its videos).
     *
     * <p>DELETE /api/v1/playlists/{playlistId}
     * Returns 204 No Content â€” successful delete has no response body.
     *
     * @param playlistId the UUID of the playlist to delete
     * @return 204 No Content
     */
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<Void> delete(@PathVariable UUID playlistId) {
        playlistService.deletePlaylist(playlistId);
        return ResponseEntity.noContent().build();  // 204 No Content â€” standard for DELETE
    }
}
