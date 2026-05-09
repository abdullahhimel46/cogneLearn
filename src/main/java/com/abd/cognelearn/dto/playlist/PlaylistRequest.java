package com.cognelearn.dto.playlist;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * PlaylistRequest — the data the browser sends when creating a new playlist.
 *
 * <p>Maps to the JavaScript {@code Playlist.create(playlistData)} call in {@code playlist.js}.
 *
 * <p>Example JSON body from browser:
 * <pre>
 * {
 *   "title": "Java Spring Boot Tutorials",
 *   "description": "A collection of beginner Spring Boot videos",
 *   "videos": [
 *     { "id": "dQw4w9WgXcQ", "title": "Spring Boot Intro", "kind": "video" }
 *   ]
 * }
 * </pre>
 *
 * @param title       the playlist title (required)
 * @param description optional short description (can be null; stored as empty string)
 * @param videos      optional initial list of video items (can be null or empty)
 */
public record PlaylistRequest(

        /** The playlist title. {@code @NotBlank} rejects empty or whitespace-only titles. */
        @NotBlank(message = "Playlist title is required")
        String title,

        /** Optional description. null is treated as empty string in PlaylistService. */
        String description,

        /**
         * Optional pre-populated video list.
         * Maps to JS: {@code playlistData.videos} array passed to {@code Playlist.create()}.
         */
        List<VideoItemRequest> videos
) {
}
