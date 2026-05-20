package com.abd.cognelearn.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Queued milestone signal awaiting admin approval before SMTP send.
 * Stores only high-level event metadata — never raw analytics or biometric data.
 */
@Entity
@Table(name = "pending_notifications")
public class PendingNotification {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, length = 4000)
    private String suggestedMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant sentAt;

    public PendingNotification() {
    }

    public PendingNotification(UUID id, UUID userId, String eventType, String suggestedMessage,
                               NotificationStatus status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.eventType = eventType;
        this.suggestedMessage = suggestedMessage;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSuggestedMessage() {
        return suggestedMessage;
    }

    public void setSuggestedMessage(String suggestedMessage) {
        this.suggestedMessage = suggestedMessage;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
