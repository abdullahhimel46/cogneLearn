package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.PlaylistEntity;
import com.abd.cognelearn.model.UserEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * PlaylistRepository â€” handles all database operations for {@link PlaylistEntity}.
 *
 * <p>Extends {@link JpaRepository} to get free CRUD operations (save, find, delete, count, etc.).
 * The custom methods below are generated automatically by Spring Data from their names â€”
 * no SQL or implementation needed.
 *
 * <p>Maps to JS: all {@code localStorage} reads/writes in {@code playlist.js}.
 */
public interface PlaylistRepository extends JpaRepository<PlaylistEntity, UUID> {

    /**
     * Get all playlists belonging to a specific user.
     *
     * <p>Generated SQL: {@code SELECT * FROM playlists WHERE user_id = ?}
     *
     * <p>Maps to JS: {@code Playlist.getAll()} which reads {@code cognelearn_playlists_{userId}}.
     *
     * @param user the user whose playlists to retrieve
     * @return a list of all playlists for this user (empty list if none)
     */
    List<PlaylistEntity> findAllByUser(UserEntity user);

    /**
     * Get a specific playlist by its ID, but only if it belongs to the given user.
     *
     * <p>Generated SQL: {@code SELECT * FROM playlists WHERE id = ? AND user_id = ?}
     *
     * <p>The user check is CRITICAL for security â€” without it, a logged-in user could
     * read another user's private playlist by guessing its UUID.
     *
     * <p>Maps to JS: {@code Playlist.getById(playlistId)} (JS had no ownership check!).
     *
     * @param id   the playlist UUID to search for
     * @param user the user who must own the playlist
     * @return an Optional containing the playlist if found AND owned by user, or empty
     */
    Optional<PlaylistEntity> findByIdAndUser(UUID id, UserEntity user);

    /**
     * Count how many playlists a user has.
     *
     * <p>Generated SQL: {@code SELECT COUNT(*) FROM playlists WHERE user_id = ?}
     *
     * <p>Used by {@code AnalyticsService} to calculate {@code totalPlaylists} in the dashboard.
     *
     * @param user the user to count playlists for
     * @return the number of playlists owned by this user
     */
    long countByUser(UserEntity user);
}
