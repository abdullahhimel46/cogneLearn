package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.player.PlaylistPlayerResponse;
import com.abd.cognelearn.service.PlaylistPlayerService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * PlaylistPlayerController â€” serves the data contract used by the custom player page.
 */
@RestController
@RequestMapping("/api/playlist")
public class PlaylistPlayerController {

    private final PlaylistPlayerService playlistPlayerService;

    public PlaylistPlayerController(PlaylistPlayerService playlistPlayerService) {
        this.playlistPlayerService = playlistPlayerService;
    }

    @GetMapping
    public ResponseEntity<PlaylistPlayerResponse> getPlaylist(
            @RequestParam(required = false) UUID playlistId
    ) {
        return ResponseEntity.ok(playlistPlayerService.getPlaylistForPlayer(playlistId));
    }
}