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

@Entity
@Table(name = "attention_scores")
public class AttentionScoreEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private StudySessionEntity session;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private Instant createdAt;

    public AttentionScoreEntity() {
    }

    public AttentionScoreEntity(UUID id, StudySessionEntity session, int score, Instant createdAt) {
        this.id = id;
        this.session = session;
        this.score = score;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public StudySessionEntity getSession() {
        return session;
    }

    public void setSession(StudySessionEntity session) {
        this.session = session;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
