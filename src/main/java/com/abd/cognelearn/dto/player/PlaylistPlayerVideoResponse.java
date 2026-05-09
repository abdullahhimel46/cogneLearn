package com.cognelearn.dto.player;

/**
 * PlaylistPlayerVideoResponse — one gallery item for the custom player.
 *
 * @param id        internal video item id
 * @param title     display title
 * @param youtubeId YouTube video id used by Video.js YouTube tech
 * @param thumbnail  thumbnail URL for the gallery
 * @param duration   optional display duration
 */
public record PlaylistPlayerVideoResponse(
        String id,
        String title,
        String youtubeId,
        String thumbnail,
        String duration
) {
}