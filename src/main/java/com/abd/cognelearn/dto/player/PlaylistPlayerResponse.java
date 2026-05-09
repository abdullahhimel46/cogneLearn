package com.cognelearn.dto.player;

import java.util.List;
import java.util.UUID;

/**
 * PlaylistPlayerResponse — structured payload for the custom Video.js playlist player.
 *
 * <p>This is the API contract consumed by the vanilla JS player page.
 * It keeps the frontend free from hardcoded playlist data.
 *
 * @param playlistId   the playlist UUID
 * @param playlistTitle the playlist title shown above the player
 * @param description   optional playlist description
 * @param videos        ordered list of videos for the gallery/player
 */
public record PlaylistPlayerResponse(
        UUID playlistId,
        String playlistTitle,
        String description,
        List<PlaylistPlayerVideoResponse> videos
) {
}