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

@Entity
@Table(name = "study_sessions")
public class StudySessionEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id")
    private PlaylistEntity playlist;

    @Column
    private String videoId;

    @Column(nullable = false)
    private Instant startTime;

    @Column
    private Instant endTime;

    @Column(nullable = false)
    private int duration;

    @Column(nullable = false)
    private int completedDuration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AttentionScoreEntity> attentionScores = new ArrayList<>();

    public StudySessionEntity() {
    }

    public StudySessionEntity(UUID id, UserEntity user, PlaylistEntity playlist, String videoId, Instant startTime, int duration, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.playlist = playlist;
        this.videoId = videoId;
        this.startTime = startTime;
        this.duration = duration;
        this.completedDuration = 0;
        this.status = SessionStatus.ACTIVE;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public PlaylistEntity getPlaylist() {
        return playlist;
    }

    public void setPlaylist(PlaylistEntity playlist) {
        this.playlist = playlist;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public int getCompletedDuration() {
        return completedDuration;
    }

    public void setCompletedDuration(int completedDuration) {
        this.completedDuration = completedDuration;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<AttentionScoreEntity> getAttentionScores() {
        return attentionScores;
    }

    public void setAttentionScores(List<AttentionScoreEntity> attentionScores) {
        this.attentionScores = attentionScores;
    }
}
