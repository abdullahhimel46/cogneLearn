package com.abd.cognelearn.controller;

import com.abd.cognelearn.service.PlaylistProxyService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to proxy YouTube API requests.
 */
@RestController
@RequestMapping("/api/v1/proxy")
public class PlaylistProxyController {

    private final PlaylistProxyService playlistProxyService;

    public PlaylistProxyController(PlaylistProxyService playlistProxyService) {
        this.playlistProxyService = playlistProxyService;
    }

    /**
     * Fetch all videos details from a YouTube playlist.
     */
    @GetMapping("/playlist")
    public ResponseEntity<Map<String, Object>> getPlaylist(@RequestParam String playlistId) {
        List<Map<String, String>> videos = playlistProxyService.fetchPlaylistVideos(playlistId);
        List<String> videoIds = videos.stream().map(v -> v.get("id")).toList();

        Map<String, Object> response = Map.of(
                "playlistId", playlistId,
                "videoIds", videoIds,
                "videos", videos,
                "count", videoIds.size()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Fetch video title from YouTube.
     */
    @GetMapping("/video")
    public ResponseEntity<Map<String, String>> getVideo(@RequestParam String videoId) {
        String title = playlistProxyService.fetchVideoTitle(videoId);
        return ResponseEntity.ok(Map.of("id", videoId, "title", title));
    }
}
