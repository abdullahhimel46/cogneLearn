package com.cognelearn.service;

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

@Service
public class PlaylistProxyService {
    private final String apiKey;
    private final long cacheTtlMs;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public PlaylistProxyService(
            @Value("${YOUTUBE_API_KEY:}") String apiKey,
            @Value("${playlistProxy.cacheTtlMs}") long cacheTtlMs,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.cacheTtlMs = cacheTtlMs;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public List<String> fetchPlaylistVideoIds(String playlistId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing YOUTUBE_API_KEY");
        }

        CacheEntry cached = cache.get(playlistId);
        if (cached != null && !cached.isExpired(cacheTtlMs)) {
            return cached.videoIds;
        }

        List<String> videoIds = new ArrayList<>();
        String pageToken = "";

        try {
            do {
                String url = "https://www.googleapis.com/youtube/v3/playlistItems" +
                        "?part=contentDetails" +
                        "&maxResults=50" +
                        "&playlistId=" + URLEncoder.encode(playlistId, StandardCharsets.UTF_8) +
                        "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8) +
                        (pageToken.isEmpty() ? "" : "&pageToken=" + URLEncoder.encode(pageToken, StandardCharsets.UTF_8));

                HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 400) {
                    throw new IllegalStateException("YouTube API error: " + response.statusCode());
                }

                JsonNode root = objectMapper.readTree(response.body());
                JsonNode items = root.get("items");
                if (items != null && items.isArray()) {
                    for (JsonNode item : items) {
                        JsonNode videoId = item.at("/contentDetails/videoId");
                        if (!videoId.isMissingNode()) {
                            videoIds.add(videoId.asText());
                        }
                    }
                }
                JsonNode nextToken = root.get("nextPageToken");
                pageToken = nextToken != null ? nextToken.asText("") : "";
            } while (!pageToken.isEmpty());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to fetch playlist");
        }

        cache.put(playlistId, new CacheEntry(System.currentTimeMillis(), videoIds));
        return videoIds;
    }

    private record CacheEntry(long timestamp, List<String> videoIds) {
        boolean isExpired(long ttlMs) {
            return System.currentTimeMillis() - timestamp > ttlMs;
        }
    }
}
