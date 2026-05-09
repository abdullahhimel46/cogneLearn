package com.cognelearn.dto.playlist;

/**
 * VideoItemResponse — a video item sent back to the browser in playlist responses.
 *
 * <p>Maps to the JavaScript video object stored in {@code playlist.videos}:
 * <pre>
 * JS: { id: youtubeVideoId, title: 'Video Title', kind: 'video' }
 * </pre>
 *
 * @param id       the YouTube video ID
 * @param title    the video title
 * @param kind     the media type (usually "video")
 * @param subtitle optional channel name or description
 */
public record VideoItemResponse(
        String id,
        String title,
        String kind,
        String subtitle
) {
}
