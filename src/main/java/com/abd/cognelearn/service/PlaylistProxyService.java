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
 * PlaylistProxyService â€” fetches YouTube playlist data on behalf of the browser.
 *
 * <p>Maps to the YouTube API proxy in {@code server/index.js}:
 * <pre>
 *   JS server/index.js: app.get('/api', async (req, res) => {
 *     const { playlistId } = req.query;
 *     // ... fetch from YouTube API ...
 *   });
 * </pre>
 *
 * <p>WHY is this needed?
 * The YouTube Data API requires an API key. If we called YouTube from the browser directly,
 * the API key would be visible in browser DevTools. Instead:
 * <ol>
 *   <li>The API key is stored as an environment variable {@code YOUTUBE_API_KEY}</li>
 *   <li>The browser calls our backend: {@code GET /api/v1/proxy/playlist?playlistId=...}</li>
 *   <li>Our backend calls YouTube with the secret key</li>
 *   <li>We return only the video IDs to the browser (the key is never exposed)</li>
 * </ol>
 *
 * <p>Results are CACHED in memory for 10 minutes (configurable) to avoid hitting
 * YouTube's API rate limits. This matches the caching in the original Node.js server.
 *
 * <p>To provide a YouTube API key, set the environment variable:
 * <pre>
 *   Windows: $env:YOUTUBE_API_KEY = "AIzaSyXXXXXXXXXX"
 *   Unix:    export YOUTUBE_API_KEY=AIzaSyXXXXXXXXXX
 * </pre>
 */
@Service
public class PlaylistProxyService {

    /** The YouTube Data API v3 key (loaded from the YOUTUBE_API_KEY environment variable). */
    private final String apiKey;

    /** How long to cache results in milliseconds (default 10 minutes = 600,000ms). */
    private final long cacheTtlMs;

    /** Jackson's JSON parser â€” used to read the YouTube API response. */
    private final ObjectMapper objectMapper;

    /**
     * A thread-safe in-memory cache: playlistId â†’ list of video IDs.
     * {@code ConcurrentHashMap} is safe for multi-threaded use (multiple requests at once).
     */
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /** The Java built-in HTTP client for making requests to YouTube's API. */
    private final HttpClient httpClient;

    /**
     * Constructor â€” Spring injects config values from {@code application.yml} using {@code @Value}.
     *
     * <p>{@code @Value("${YOUTUBE_API_KEY:}")} reads from the environment variable {@code YOUTUBE_API_KEY}.
     * The {@code :} after the variable name means "use empty string as default if not set".
     *
     * @param apiKey      the YouTube API key (from env var {@code YOUTUBE_API_KEY})
     * @param cacheTtlMs  cache time-to-live in milliseconds (from {@code playlistProxy.cacheTtlMs} in yml)
     * @param objectMapper the Jackson JSON mapper (Spring auto-creates this bean)
     */
    public PlaylistProxyService(
            @Value("${YOUTUBE_API_KEY:}") String apiKey,
            @Value("${playlistProxy.cacheTtlMs:600000}") long cacheTtlMs,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.cacheTtlMs = cacheTtlMs;
        this.objectMapper = objectMapper;

        // Build the HTTP client with a 10-second connection timeout
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Fetch all video IDs from a YouTube playlist.
     *
     * <p>Maps to JS: the fetch logic inside the Express route in {@code server/index.js}.
     * The Node.js version used axios; here we use Java's built-in HttpClient.
     *
     * <p>Handles pagination: YouTube returns at most 50 items per page.
     * If the playlist has more than 50 videos, we follow {@code nextPageToken} links
     * to fetch all pages automatically.
     *
     * <p>Results are cached for {@code cacheTtlMs} ms. If the same playlistId is requested
     * again within the TTL window, the cached result is returned instantly.
     *
     * @param playlistId the YouTube playlist ID (e.g., {@code PLbpi6ZahtOH6Ar_...})
     * @return a list of YouTube video IDs in playlist order
     * @throws IllegalStateException if the API key is not set, or YouTube returns an error
     */
    public List<Map<String, String>> fetchPlaylistVideos(String playlistId) {
        // Step 1: Check if the API key is configured
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "YouTube API key not configured. Set the YOUTUBE_API_KEY environment variable."
            );
        }

        // Step 2: Check the cache first (avoid unnecessary API calls)
        CacheEntry cached = cache.get(playlistId);
        if (cached != null && !cached.isExpired(cacheTtlMs)) {
            // Cache hit ─ return the stored result immediately
            return cached.videos();
        }

        // Step 3: Fetch from YouTube (cache miss or expired)
        List<Map<String, String>> videos = new ArrayList<>();
        String pageToken = "";  // empty string = first page

        try {
            // YouTube paginates results ─ loop until there are no more pages
            do {
                // Step 3a: Build the YouTube API URL with part=snippet
                String url = "https://www.googleapis.com/youtube/v3/playlistItems"
                        + "?part=snippet"
                        + "&maxResults=50"
                        + "&playlistId=" + URLEncoder.encode(playlistId, StandardCharsets.UTF_8)
                        + "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                        + (pageToken.isEmpty() ? "" : "&pageToken=" + URLEncoder.encode(pageToken, StandardCharsets.UTF_8));

                // Step 3b: Make the HTTP GET request to YouTube
                HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                // Step 3c: Check for HTTP errors (4xx, 5xx)
                if (response.statusCode() >= 400) {
                    throw new IllegalStateException(
                            "YouTube API error: HTTP " + response.statusCode() +
                            ". Check that your playlist is public and the API key is valid."
                    );
                }

                // Step 3d: Parse the JSON response and extract video IDs and titles
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

                // Step 3e: Check if there's another page
                JsonNode nextToken = root.get("nextPageToken");
                pageToken = (nextToken != null) ? nextToken.asText("") : "";

            } while (!pageToken.isEmpty());  // keep fetching until no more pages

        } catch (IllegalStateException ex) {
            throw ex;  // re-throw our own exceptions as-is
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Failed to fetch playlist from YouTube. Details: " + ex.getMessage()
            );
        }

        // Step 4: Store the results in the cache for future requests
        cache.put(playlistId, new CacheEntry(System.currentTimeMillis(), videos));

        return videos;
    }

    public List<String> fetchPlaylistVideoIds(String playlistId) {
        return fetchPlaylistVideos(playlistId).stream()
                .map(v -> v.get("id"))
                .toList();
    }

    /**
     * CacheEntry ─ stores a list of video details with the timestamp they were fetched.
     *
     * <p>This is a private record (only used inside PlaylistProxyService).
     * Records automatically generate {@code equals()}, {@code hashCode()}, and {@code toString()}.
     *
     * @param fetchedAt  the {@code System.currentTimeMillis()} when this entry was cached
     * @param videos     the list of videos fetched from YouTube (id and title maps)
     */
    private record CacheEntry(long fetchedAt, List<Map<String, String>> videos) {

        /**
         * Check if this cache entry has expired.
         *
         * @param ttlMs cache time-to-live in milliseconds
         * @return true if the entry is older than the TTL (should be refreshed)
         */
        boolean isExpired(long ttlMs) {
            return System.currentTimeMillis() - fetchedAt > ttlMs;
        }
    }
}
