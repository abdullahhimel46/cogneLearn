package com.abd.cognelearn.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * VideoItemEntity â€” represents a single YouTube video inside a playlist.
 *
 * <p>Maps to the JavaScript {@code Video.js} module and the {@code playlist.addVideo()} method.
 * Each VideoItemEntity is one row in the {@code video_items} table and belongs to exactly
 * one {@link PlaylistEntity}.
 *
 * <p>Database table: {@code video_items}
 *
 * <pre>
 * JS equivalent:
 *   playlist.videos.push({ id: youtubeVideoId, title: 'Video Title', kind: 'video' });
 *   localStorage.setItem('cognelearn_playlists_' + userId, JSON.stringify(playlists));
 * </pre>
 */
@Entity
@Table(name = "video_items")
public class VideoItemEntity {

    /** Primary key â€” uniquely identifies this video item row. */
    @Id
    private UUID id;

    /**
     * The playlist that contains this video.
     *
     * <p>{@code @ManyToOne} = "Many video items belong to One playlist".
     * This creates a {@code playlist_id} foreign-key column in the {@code video_items} table.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    /**
     * The YouTube video ID (the part after {@code ?v=} in a YouTube URL).
     * For example: {@code dQw4w9WgXcQ} from {@code https://youtube.com/watch?v=dQw4w9WgXcQ}.
     *
     * <p>Maps to JS: {@code video.id}
     */
    @Column(nullable = false)
    private String externalId;

    /**
     * The human-readable title of the video (e.g., "Spring Boot Tutorial #1").
     *
     * <p>Maps to JS: {@code video.title}
     */
    @Column(nullable = false)
    private String title;

    /**
     * The type of media. Currently always "video", but kept for future use (e.g., "playlist", "short").
     *
     * <p>Maps to JS: {@code video.kind}
     */
    @Column(nullable = false)
    private String kind;

    /**
     * Optional subtitle or description for the video. Can be null.
     */
    @Column
    private String subtitle;

    /**
     * When this video was added to the playlist.
     */
    @Column(nullable = false)
    private Instant createdAt;

    /** No-argument constructor required by JPA. */
    public VideoItemEntity() {
    }

    /**
     * Full constructor for creating a new video item.
     *
     * @param id         a new random UUID
     * @param playlist   the playlist this video belongs to
     * @param externalId the YouTube video ID
     * @param title      the video title
     * @param kind       the media type (use "video")
     * @param subtitle   optional subtitle (can be null)
     * @param createdAt  when the video was added
     */
    public VideoItemEntity(UUID id, PlaylistEntity playlist, String externalId, String title, String kind, String subtitle, Instant createdAt) {
        this.id = id;
        this.playlist = playlist;
        this.externalId = externalId;
        this.title = title;
        this.kind = kind;
        this.subtitle = subtitle;
        this.createdAt = createdAt;
    }

    /**
     * Helper method â€” checks that a YouTube video ID has the correct format.
     * YouTube IDs are always exactly 11 characters: letters, numbers, hyphens, or underscores.
     *
     * <p>Maps to JS: {@code Video.isValidYouTubeId(id)}
     *
     * @param youtubeId the ID to validate
     * @return {@code true} if the ID looks valid, {@code false} otherwise
     */
    public static boolean isValidYouTubeId(String youtubeId) {
        // Regex: exactly 11 characters [a-z A-Z 0-9 _ -]
        return youtubeId != null && youtubeId.matches("[a-zA-Z0-9_-]{11}");
    }

    // â”€â”€ Getters and Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public PlaylistEntity getPlaylist() { return playlist; }
    public void setPlaylist(PlaylistEntity playlist) { this.playlist = playlist; }

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
