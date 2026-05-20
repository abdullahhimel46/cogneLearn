package com.abd.cognelearn.dto.admin;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin-facing view of a queued notification. Exposes identity + milestone only.
 */
public record PendingNotificationResponse(
        UUID id,
        String userName,
        String userEmail,
        String eventType,
        String emailSubject,
        String suggestedMessage,
        Instant createdAt
) {
}
