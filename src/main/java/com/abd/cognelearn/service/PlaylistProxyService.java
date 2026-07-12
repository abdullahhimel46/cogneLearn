package com.abd.cognelearn.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service to proxy YouTube playlist requests and cache results.
 */
@Service
public class PlaylistProxyService {

    private final String apiKey;
    private final long cacheTtlMs;
    private final ObjectMapper objectMapper;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final HttpClient httpClient;

    public PlaylistProxyService(
            @Value("${YOUTUBE_API_KEY:}") String apiKey,
            @Value("${playlistProxy.cacheTtlMs:600000}") long cacheTtlMs,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.cacheTtlMs = cacheTtlMs;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Fetch all video details from a YouTube playlist (with caching).
     */
    public List<Map<String, String>> fetchPlaylistVideos(String playlistId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "YouTube API key not configured. Set the YOUTUBE_API_KEY environment variable."
            );
        }

        CacheEntry cached = cache.get(playlistId);
        if (cached != null && !cached.isExpired(cacheTtlMs)) {
            return cached.videos();
        }

        List<Map<String, String>> videos = new ArrayList<>();
        String pageToken = "";

        try {
            do {
                String url = "https://www.googleapis.com/youtube/v3/playlistItems"
                         + "?part=snippet"
                         + "&maxResults=50"
                         + "&playlistId=" + URLEncoder.encode(playlistId, StandardCharsets.UTF_8)
                         + "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                         + (pageToken.isEmpty() ? "" : "&pageToken=" + URLEncoder.encode(pageToken, StandardCharsets.UTF_8));

                HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 400) {
                    throw new IllegalStateException(
                            "YouTube API error: HTTP " + response.statusCode() +
                            ". Check that your playlist is public and the API key is valid."
                    );
                }

                JsonNode root = objectMapper.readTree(response.body());
                JsonNode items = root.get("items");
                if (items != null && items.isArray()) {
                    for (JsonNode item : items) {
                        JsonNode videoIdNode = item.at("/snippet/resourceId/videoId");
                        JsonNode titleNode = item.at("/snippet/title");
                        if (!videoIdNode.isMissingNode() && !videoIdNode.asText().isBlank()) {
                            String videoId = videoIdNode.asText();
                            String title = (titleNode != null && !titleNode.isMissingNode()) ? titleNode.asText("Video") : "Video";
                            videos.add(Map.of("id", videoId, "title", title));
                        }
                    }
                }

                JsonNode nextToken = root.get("nextPageToken");
                pageToken = (nextToken != null) ? nextToken.asText("") : "";

            } while (!pageToken.isEmpty());

        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Failed to fetch playlist from YouTube. Details: " + ex.getMessage()
            );
        }

        cache.put(playlistId, new CacheEntry(System.currentTimeMillis(), videos));
        return videos;
    }

    public List<String> fetchPlaylistVideoIds(String playlistId) {
        return fetchPlaylistVideos(playlistId).stream()
                .map(v -> v.get("id"))
                .toList();
    }

    private record CacheEntry(long fetchedAt, List<Map<String, String>> videos) {
        boolean isExpired(long ttlMs) {
            return System.currentTimeMillis() - fetchedAt > ttlMs;
        }
    }
}
