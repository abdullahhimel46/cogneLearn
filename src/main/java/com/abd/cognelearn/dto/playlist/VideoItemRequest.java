package com.abd.cognelearn.dto.playlist;

import jakarta.validation.constraints.NotBlank;

/**
 * VideoItemRequest â€” the data the browser sends when adding a video to a playlist.
 *
 * <p>Maps to the JavaScript {@code Playlist.addVideo(playlistId, videoData)} call in
 * {@code playlist.js} and {@code Video.js}.
 *
 * <p>Example JSON body from browser:
 * <pre>
 * {
 *   "id": "dQw4w9WgXcQ",
 *   "title": "Spring Boot Crash Course",
 *   "kind": "video",
 *   "subtitle": "Amigoscode"
 * }
 * </pre>
 *
 * @param id       the YouTube video ID (11-character string after ?v= in URL)
 * @param title    the human-readable video title
 * @param kind     the media type â€” usually "video" (kept for future types like "short")
 * @param subtitle optional channel name or description (can be null)
 */
public record VideoItemRequest(

        /**
         * The YouTube video ID. Must not be blank.
         * Example: {@code "dQw4w9WgXcQ"} from {@code https://youtube.com/watch?v=dQw4w9WgXcQ}
         *
         * <p>Maps to JS: {@code videoData.id}
         */
        @NotBlank(message = "Video ID is required")
        String id,

        /**
         * The video's display title.
         *
         * <p>Maps to JS: {@code videoData.title}
         */
        @NotBlank(message = "Video title is required")
        String title,

        /**
         * The media type. Usually "video". Null is treated as "video" in PlaylistService.
         *
         * <p>Maps to JS: {@code videoData.kind}
         */
        String kind,

        /**
         * Optional channel name or additional description. Can be null.
         */
        String subtitle
) {
}
