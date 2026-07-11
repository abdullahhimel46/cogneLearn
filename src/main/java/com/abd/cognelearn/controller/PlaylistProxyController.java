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
 * PlaylistProxyController â€” proxies YouTube API requests to avoid exposing the API key.
 *
 * <p>Base path: {@code /api/v1/proxy}
 *
 * <p>Maps to the JavaScript YouTube proxy in {@code server/index.js}:
 * <pre>
 *   GET /api?playlistId=PLxxxxxx â†’ fetchPlaylistItems() in server/index.js
 * </pre>
 * In the Java version:
 * <pre>
 *   GET /api/v1/proxy/playlist?playlistId=PLxxxxxx â†’ PlaylistProxyService.fetchPlaylistVideoIds()
 * </pre>
 *
 * <p>WHY do we need a proxy?
 * The YouTube Data API key is a secret. If we call YouTube directly from the browser,
 * the API key would be visible to anyone who opens the browser DevTools â†’ Network tab.
 * Instead, the browser calls OUR backend (which has the key as an environment variable),
 * and our backend calls YouTube on the browser's behalf â€” the key is never exposed.
 *
 * <p>This endpoint is public (no login required) because the JS app loads YouTube data
 * before the user logs in (e.g., on the discover/search page).
 */
@RestController
@RequestMapping("/api/v1/proxy")
public class PlaylistProxyController {

    private final PlaylistProxyService playlistProxyService;

    /**
     * Constructor â€” Spring injects the proxy service.
     *
     * @param playlistProxyService the service that calls YouTube's API
     */
    public PlaylistProxyController(PlaylistProxyService playlistProxyService) {
        this.playlistProxyService = playlistProxyService;
    }

    /**
     * Fetch all video IDs from a YouTube playlist.
     *
     * <p>GET /api/v1/proxy/playlist?playlistId=PLxxxxxx
     *
     * <p>Maps to JS: the {@code GET /api?playlistId=} call in {@code server/index.js}.
     *
     * <p>Example URL: {@code /api/v1/proxy/playlist?playlistId=PLbpi6ZahtOH6Ar_3GPy3workSH6rnp}
     *
     * <p>Example response:
     * <pre>
     * {
     *   "playlistId": "PLbpi6ZahtOH6Ar_3GPy3workSH6rnp",
     *   "videoIds": ["dQw4w9WgXcQ", "xLZwMSzIAp0", "..."],
     *   "count": 42
     * }
     * </pre>
     *
     * @param playlistId the YouTube playlist ID (from the URL after ?list=)
     * @return 200 OK with the playlist ID and list of video IDs
     */
    @GetMapping("/playlist")
    public ResponseEntity<Map<String, Object>> getPlaylist(@RequestParam String playlistId) {
        // Delegate to the service which handles caching and the actual HTTP call to YouTube
        List<Map<String, String>> videos = playlistProxyService.fetchPlaylistVideos(playlistId);
        List<String> videoIds = videos.stream().map(v -> v.get("id")).toList();

        // Return the playlistId, video IDs, full videos details, and a count for convenience
        Map<String, Object> response = Map.of(
                "playlistId", playlistId,
                "videoIds", videoIds,
                "videos", videos,
                "count", videoIds.size()
        );
        return ResponseEntity.ok(response);
    }
}
