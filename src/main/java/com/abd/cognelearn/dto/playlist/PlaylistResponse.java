package com.abd.cognelearn.dto.playlist;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * PlaylistResponse â€” the playlist data sent back to the browser in API responses.
 *
 * <p>Maps to the JavaScript playlist object structure in {@code playlist.js}:
 * <pre>
 * JS: { playlistId, userId, title, description, videos, totalFocusMinutes, createdAt }
 * </pre>
 *
 * <p>Example JSON response:
 * <pre>
 * {
 *   "playlistId": "550e8400-e29b-41d4-a716-446655440000",
 *   "title": "Java Spring Boot Tutorials",
 *   "description": "Beginner-friendly Spring videos",
 *   "createdAt": "2024-01-15T10:30:00Z",
 *   "totalFocusMinutes": 120,
 *   "videos": [...]
 * }
 * </pre>
 *
 * @param playlistId        the unique UUID of this playlist
 * @param title             the playlist title
 * @param description       the playlist description
 * @param createdAt         when the playlist was created
 * @param totalFocusMinutes total minutes studied using this playlist
 * @param videos            the ordered list of videos in this playlist
 */
public record PlaylistResponse(
        UUID playlistId,
        String title,
        String description,
        Instant createdAt,
        int totalFocusMinutes,
        List<VideoItemResponse> videos
) {
}
