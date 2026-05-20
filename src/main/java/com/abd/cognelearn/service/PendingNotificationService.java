package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.admin.PendingNotificationResponse;
import com.abd.cognelearn.model.NotificationStatus;
import com.abd.cognelearn.model.PendingNotification;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.PendingNotificationRepository;
import com.abd.cognelearn.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PendingNotificationService {

    private final PendingNotificationRepository pendingNotificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public PendingNotificationService(PendingNotificationRepository pendingNotificationRepository,
                                      UserRepository userRepository,
                                      EmailService emailService) {
        this.pendingNotificationRepository = pendingNotificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Queues a notification when the event type maps to a known template.
     *
     * @return true if a row was persisted
     */
    @Transactional
    public boolean enqueueFromEvent(UUID userId, String rawEventType) {
        if (userId == null || rawEventType == null) {
            return false;
        }
        String normalized = rawEventType.trim().toUpperCase();
        Optional<String> suggestion = MilestoneMessageCatalog.suggestedMessage(normalized);
        if (suggestion.isEmpty()) {
            return false;
        }
        PendingNotification row = new PendingNotification(
                UUID.randomUUID(),
                userId,
                normalized,
                suggestion.get(),
                NotificationStatus.PENDING,
                Instant.now()
        );
        pendingNotificationRepository.save(row);
        return true;
    }

    @Transactional(readOnly = true)
    public List<PendingNotificationResponse> listPending() {
        List<PendingNotification> pending = pendingNotificationRepository
                .findByStatusOrderByCreatedAtDesc(NotificationStatus.PENDING);
        if (pending.isEmpty()) {
            return List.of();
        }
        List<UUID> userIds = pending.stream().map(PendingNotification::getUserId).distinct().toList();
        Map<UUID, UserEntity> byId = new HashMap<>();
        userRepository.findAllById(userIds).forEach(u -> byId.put(u.getId(), u));

        List<PendingNotificationResponse> out = new ArrayList<>(pending.size());
        for (PendingNotification n : pending) {
            UserEntity user = byId.get(n.getUserId());
            String name = user != null ? user.getName() : "Unknown user";
            String email = user != null ? user.getEmail() : "";
            out.add(new PendingNotificationResponse(
                    n.getId(),
                    name,
                    email,
                    n.getEventType(),
                    MilestoneMessageCatalog.emailSubject(n.getEventType()),
                    n.getSuggestedMessage(),
                    n.getCreatedAt()
            ));
        }
        return out;
    }

    /**
     * Sends SMTP using the approved or overridden body, then marks the row SENT.
     */
    @Transactional
    public void sendApproved(UUID notificationId, String optionalSubjectOverride, String optionalMessageOverride) {
        PendingNotification row = pendingNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        if (row.getStatus() != NotificationStatus.PENDING) {
            throw new IllegalStateException("Notification is not pending.");
        }
        UserEntity user = userRepository.findById(row.getUserId())
                .orElseThrow(() -> new IllegalStateException("User not found for notification."));

        String body = (optionalMessageOverride != null && !optionalMessageOverride.isBlank())
                ? optionalMessageOverride.trim()
                : row.getSuggestedMessage();
        String subject = (optionalSubjectOverride != null && !optionalSubjectOverride.isBlank())
                ? optionalSubjectOverride.trim()
                : MilestoneMessageCatalog.emailSubject(row.getEventType());

        emailService.sendApprovedMotivationalEmail(user.getEmail(), user.getName(), subject, body);

        row.setStatus(NotificationStatus.SENT);
        row.setSentAt(Instant.now());
        pendingNotificationRepository.save(row);
    }

    public String sendCustomEmail(UUID userId, String subject, String message) {
        if (userId == null) {
            throw new IllegalArgumentException("Recipient user is required.");
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        String safeSubject = subject == null ? "" : subject.trim();
        String safeMessage = message == null ? "" : message.trim();
        if (safeSubject.isBlank() || safeMessage.isBlank()) {
            throw new IllegalArgumentException("Subject and message are required.");
        }
        emailService.sendApprovedMotivationalEmail(user.getEmail(), user.getName(), safeSubject, safeMessage);
        return user.getEmail();
    }
}
