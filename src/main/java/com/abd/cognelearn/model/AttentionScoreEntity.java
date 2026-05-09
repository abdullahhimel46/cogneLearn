package com.cognelearn.model;

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
 * AttentionScoreEntity — stores a single attention measurement from the face-api.js tracker.
 *
 * <p>Maps to the JavaScript {@code StudySession.addAttentionScore()} method and the
 * {@code AttentionMonitor.js} module. In JS, scores were stored inside the session object
 * in {@code localStorage}. Here, each score is its own row in {@code attention_scores}.
 *
 * <p>The face-api.js library (running in the browser) measures head pose and facial
 * expressions every ~1.5 seconds. It sends each score to the backend via:
 * {@code POST /api/v1/sessions/{sessionId}/attention}
 *
 * <p>Database table: {@code attention_scores}
 *
 * <pre>
 * JS equivalent:
 *   session.attentionScores.push(score);  // score is a number 0-100
 * </pre>
 */
@Entity
@Table(name = "attention_scores")
public class AttentionScoreEntity {

    /** Primary key — uniquely identifies this measurement. */
    @Id
    private UUID id;

    /**
     * The study session this score was recorded during.
     *
     * <p>{@code @ManyToOne} = "Many scores belong to One session".
     * Creates a {@code session_id} foreign key column in {@code attention_scores}.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private StudySessionEntity session;

    /**
     * The attention score, ranging from 0 (fully distracted) to 100 (fully focused).
     *
     * <p>Calculated by {@code AttentionMonitor.calculateAttentionLevel()} in the browser,
     * based on head yaw, pitch, face depth, and facial expressions.
     *
     * <p>In JS: {@code attentionLevel} (computed and sent to this endpoint)
     */
    @Column(nullable = false)
    private int score;

    /**
     * When this score was recorded.
     */
    @Column(nullable = false)
    private Instant createdAt;

    /** No-argument constructor required by JPA. */
    public AttentionScoreEntity() {
    }

    /**
     * Constructor for creating a new attention score measurement.
     *
     * @param id        a new random UUID
     * @param session   the session this score belongs to
     * @param score     the attention level (0–100)
     * @param createdAt {@code Instant.now()} when the score was received
     */
    public AttentionScoreEntity(UUID id, StudySessionEntity session, int score, Instant createdAt) {
        this.id = id;
        this.session = session;
        this.score = score;
        this.createdAt = createdAt;
    }

    // ── Getters and Setters ───────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public StudySessionEntity getSession() { return session; }
    public void setSession(StudySessionEntity session) { this.session = session; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
