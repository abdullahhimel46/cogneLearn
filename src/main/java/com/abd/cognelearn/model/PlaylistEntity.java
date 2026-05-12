package com.abd.cognelearn.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * PlaylistEntity â€” represents a study playlist owned by a user.
 *
 * <p>Maps to the JavaScript {@code playlist.js} module. In JS, playlists were stored
 * in {@code localStorage}. Here, each playlist is a row in the {@code playlists} table.
 *
 * <p>A playlist:
 * <ul>
 *   <li>Belongs to exactly ONE user ({@code @ManyToOne} â†’ many playlists per user)</li>
 *   <li>Contains ZERO or MORE videos ({@code @OneToMany} â†’ one playlist, many videos)</li>
 * </ul>
 *
 * <p>Database table: {@code playlists}
 *
 * <pre>
 * JS equivalent:
 *   const playlist = { playlistId, userId, title, description, videos, totalFocusMinutes, createdAt };
 *   localStorage.setItem('cognelearn_playlists_' + userId, JSON.stringify(playlists));
 * </pre>
 */
@Entity
@Table(name = "playlists")
public class PlaylistEntity {

    /**
     * Primary key â€” uniquely identifies each playlist.
     */
    @Id
    private UUID id;

    /**
     * The user who owns this playlist.
     *
     * <p>{@code @ManyToOne} = "Many playlists belong to One user".
     * {@code FetchType.LAZY} = don't load the user data automatically when loading a playlist
     * (this saves database queries when you only need playlist info, not user info).
     * {@code @JoinColumn(name = "user_id")} = the foreign key column linking to the users table.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /**
     * The title of the playlist (e.g., "Java Spring Boot Tutorials").
     */
    @Column(nullable = false)
    private String title;

    /**
     * A short description of what the playlist covers. Can be empty but not null.
     */
    @Column(nullable = false)
    private String description;

    /**
     * When this playlist was first created.
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Total minutes the user has spent studying with this playlist.
     * Starts at 0 and increases as study sessions complete.
     *
     * <p>Maps to JS: {@code playlist.totalFocusMinutes}
     */
    @Column(nullable = false)
    private int totalFocusMinutes;

    /**
     * The list of videos in this playlist, ordered by when they were added.
     *
     * <p>{@code @OneToMany} = "One playlist has Many videos".
     * {@code mappedBy = "playlist"} = the relationship is defined by the {@code playlist}
     * field in {@link VideoItemEntity} (not by a separate join table).
     * {@code CascadeType.ALL} = if we delete a playlist, all its videos are deleted too.
     * {@code orphanRemoval = true} = if we remove a video from this list, delete it from the DB.
     */
    @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")   // Always retrieve videos in the order they were added
    private List<VideoItemEntity> videos = new ArrayList<>();  // Never null, starts empty

    /** No-argument constructor required by JPA. */
    public PlaylistEntity() {
    }

    /**
     * Constructor for creating a new playlist.
     *
     * @param id          a new random UUID
     * @param user        the owning user
     * @param title       the playlist title
     * @param description a short description (use empty string "" if none)
     * @param createdAt   the current time
     */
    public PlaylistEntity(UUID id, UserEntity user, String title, String description, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
        this.createdAt = createdAt;
        this.totalFocusMinutes = 0;  // starts at zero
    }

    // â”€â”€ Getters and Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public int getTotalFocusMinutes() { return totalFocusMinutes; }
    public void setTotalFocusMinutes(int totalFocusMinutes) { this.totalFocusMinutes = totalFocusMinutes; }

    public List<VideoItemEntity> getVideos() { return videos; }
    public void setVideos(List<VideoItemEntity> videos) { this.videos = videos; }
}
