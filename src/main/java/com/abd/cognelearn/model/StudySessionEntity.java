package com.cognelearn.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * StudySessionEntity — represents a single timed study session.
 *
 * <p>Maps to the JavaScript {@code StudySession.js} and {@code SessionManager.js} modules.
 * In JS, sessions were stored in {@code localStorage}. Here, each session is a row in the
 * {@code study_sessions} table.
 *
 * <p>A study session:
 * <ul>
 *   <li>Belongs to exactly ONE user</li>
 *   <li>Optionally belongs to ONE playlist (user may start a free session without a playlist)</li>
 *   <li>Has a lifecycle: ACTIVE → PAUSED → COMPLETED (see {@link SessionStatus})</li>
 *   <li>Collects multiple attention scores during the session (from the face-api.js tracker)</li>
 * </ul>
 *
 * <p>Database table: {@code study_sessions}
 *
 * <pre>
 * JS equivalent:
 *   const session = {
 *     sessionId, userId, playlistId, videoId,
 *     startTime, endTime, duration, completedDuration,
 *     status: 'active', attentionScores: []
 *   };
 * </pre>
 */
@Entity
@Table(name = "study_sessions")
public class StudySessionEntity {

    /** Primary key — uniquely identifies each study session. */
    @Id
    private UUID id;

    /**
     * The user who started this session.
     *
     * <p>{@code @ManyToOne} = "Many sessions belong to One user".
     * This creates a {@code user_id} foreign key column.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /**
     * The playlist being studied. Can be null if the user didn't select a playlist.
     *
     * <p>In JS: {@code session.playlistId} (stored as a string; here it's a full object reference)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id")   // nullable — playlist is optional
    private PlaylistEntity playlist;

    /**
     * The specific YouTube video ID being watched at session start.
     * Can be null if no specific video was selected.
     *
     * <p>In JS: {@code session.videoId}
     */
    @Column
    private String videoId;

    /**
     * When the session started (set at creation time).
     *
     * <p>In JS: {@code session.startTime = new Date().toISOString()}
     */
    @Column(nullable = false)
    private Instant startTime;

    /**
     * When the session ended. Null while the session is still active or paused.
     *
     * <p>In JS: {@code session.endTime = new Date().toISOString()} (set on completion)
     */
    @Column
    private Instant endTime;

    /**
     * The planned session length in minutes (e.g., 25 for a standard Pomodoro).
     *
     * <p>In JS: {@code session.duration} (stored as minutes)
     */
    @Column(nullable = false)
    private int duration;

    /**
     * How many minutes the user actually studied (updated when session completes).
     * Starts at 0. Will be less than {@code duration} if the user stopped early.
     *
     * <p>In JS: {@code session.completedDuration}
     */
    @Column(nullable = false)
    private int completedDuration;

    /**
     * The current lifecycle state of this session.
     *
     * <p>{@code @Enumerated(EnumType.STRING)} stores the enum as its name ("ACTIVE", "PAUSED",
     * "COMPLETED") instead of a number. This makes the database readable by humans.
     *
     * <p>In JS: {@code session.status} (was a string: 'active', 'paused', 'completed')
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    /** Record creation timestamp (when the session object was first saved). */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * All attention scores recorded during this session by the face-api.js tracker.
     *
     * <p>Each score is a number 0-100 recorded every ~1.5 seconds.
     * Stored in a separate {@code attention_scores} table, linked back here.
     *
     * <p>In JS: {@code session.attentionScores = [85, 72, 90, ...]}
     */
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AttentionScoreEntity> attentionScores = new ArrayList<>();

    /** No-argument constructor required by JPA. */
    public StudySessionEntity() {
    }

    /**
     * Constructor for creating a new study session.
     *
     * @param id         a new random UUID
     * @param user       the user starting the session
     * @param playlist   the selected playlist (can be null)
     * @param videoId    the selected video ID (can be null or empty)
     * @param startTime  {@code Instant.now()} at session creation
     * @param duration   planned duration in minutes
     * @param createdAt  {@code Instant.now()} at session creation
     */
    public StudySessionEntity(UUID id, UserEntity user, PlaylistEntity playlist, String videoId,
                               Instant startTime, int duration, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.playlist = playlist;
        this.videoId = videoId;
        this.startTime = startTime;
        this.duration = duration;
        this.completedDuration = 0;         // starts at 0
        this.status = SessionStatus.ACTIVE;  // always starts as ACTIVE
        this.createdAt = createdAt;
    }

    // ── Getters and Setters ───────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public PlaylistEntity getPlaylist() { return playlist; }
    public void setPlaylist(PlaylistEntity playlist) { this.playlist = playlist; }

    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public int getCompletedDuration() { return completedDuration; }
    public void setCompletedDuration(int completedDuration) { this.completedDuration = completedDuration; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<AttentionScoreEntity> getAttentionScores() { return attentionScores; }
    public void setAttentionScores(List<AttentionScoreEntity> attentionScores) { this.attentionScores = attentionScores; }
}
