package com.cognelearn.dto.playlist;

import java.util.List;

/**
 * PlaylistUpdateRequest — the data the browser sends when updating an existing playlist.
 *
 * <p>All fields are optional (null means "don't change this field"). This allows partial
 * updates — the frontend only sends the fields it wants to change.
 *
 * <p>Maps to the JavaScript {@code Playlist.update(playlistId, updates)} call in {@code playlist.js}.
 *
 * <p>Example JSON body (update title only):
 * <pre>
 * { "title": "New Playlist Name" }
 * </pre>
 *
 * @param title       new title (null = keep existing title)
 * @param description new description (null = keep existing description)
 * @param videos      new video list (null = keep existing videos, empty list = clear all videos)
 */
public record PlaylistUpdateRequest(
        String title,
        String description,
        List<VideoItemRequest> videos
) {
}
