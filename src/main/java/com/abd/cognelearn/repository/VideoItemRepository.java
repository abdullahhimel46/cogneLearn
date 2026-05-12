package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.PlaylistEntity;
import com.abd.cognelearn.model.VideoItemEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * VideoItemRepository â€” handles database operations for {@link VideoItemEntity}.
 *
 * <p>Usually not queried directly â€” most video operations go through the parent
 * {@link PlaylistEntity}'s {@code videos} collection (managed via JPA cascade).
 * This repository is provided for direct queries when needed.
 *
 * <p>Maps to JS: {@code playlist.videos} array operations in {@code playlist.js}.
 */
public interface VideoItemRepository extends JpaRepository<VideoItemEntity, UUID> {

    /**
     * Get all video items in a specific playlist.
     *
     * <p>Generated SQL: {@code SELECT * FROM video_items WHERE playlist_id = ?}
     *
     * <p>Maps to JS: {@code playlist.videos} â€” the list of videos in a playlist.
     *
     * @param playlist the playlist to get videos for
     * @return list of video items in the playlist
     */
    List<VideoItemEntity> findAllByPlaylist(PlaylistEntity playlist);
}
