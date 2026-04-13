package com.cognelearn.controller;

import com.cognelearn.service.PlaylistProxyService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/playlist")
public class PlaylistProxyController {
    private final PlaylistProxyService playlistProxyService;

    public PlaylistProxyController(PlaylistProxyService playlistProxyService) {
        this.playlistProxyService = playlistProxyService;
    }

    @GetMapping
    public Map<String, Object> getPlaylist(@RequestParam String playlistId) {
        List<String> videoIds = playlistProxyService.fetchPlaylistVideoIds(playlistId);
        return Map.of("playlistId", playlistId, "videoIds", videoIds, "cached", false);
    }
}
