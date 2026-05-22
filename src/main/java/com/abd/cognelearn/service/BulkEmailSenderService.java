package com.abd.cognelearn.service;

import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.LogType;
import com.abd.cognelearn.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkEmailSenderService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final EmailService emailService;

    private final EmailTrackingService emailTrackingService;

    public long getAudienceCount(EmailCategory category) {
        // Placeholder audience resolution logic
        if (category == EmailCategory.INACTIVE_USER) {
            // e.g., created more than 3 days ago
            Instant threeDaysAgo = Instant.now().minus(3, ChronoUnit.DAYS);
            return userRepository.count(); // Simulated logic due to lack of lastLogin field
        } else if (category == EmailCategory.LOW_FOCUS) {
            return Math.max(0, userRepository.count() / 3); // Simulated ~33% users
        } else if (category == EmailCategory.STREAK) {
            return Math.max(0, userRepository.count() / 5); // Simulated ~20% users
        }
        return 0;
    }

    @Async
    public void sendBulkEmail(EmailCategory category, String subject, String body) {
        long audienceCount = getAudienceCount(category);
        log.info("Sending bulk email for category {} to {} users. Subject: {}", category, audienceCount, subject);

        // Simulate delay for email dispatching
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Centralized logging
        activityLogService.log(
                LogType.INFO,
                "Bulk Email Sent",
                "Sent " + category.name() + " email to " + audienceCount + " users",
                "System Admin",
                "Email System"
        );
        
        log.info("Bulk email dispatch completed.");
    }

    @Async
    public void sendBulkCampaign(java.util.List<com.abd.cognelearn.controller.EmailCampaignController.Recipient> recipients,
                                 EmailCategory category,
                                 String subject,
                                 String message) {
        log.info("Sending bulk campaign email to {} users. Subject: {}", recipients.size(), subject);

        for (com.abd.cognelearn.controller.EmailCampaignController.Recipient r : recipients) {
            log.info("Processing recipient: {} <{}>", r.getName(), r.getEmail());

            // try to resolve the user by email (case-insensitive)
            var userOpt = userRepository.findByEmailIgnoreCase(r.getEmail());
            if (userOpt.isEmpty()) {
                log.warn("No user found for email {}, skipping", r.getEmail());
                continue;
            }

            var user = userOpt.get();
            java.util.UUID userId = user.getId();

            // rate limit check
            if (!emailTrackingService.canSendEmailToday(userId)) {
                log.info("Skipping {} <{}>: already sent email in last 24h", r.getName(), r.getEmail());
                continue;
            }

            try {
                emailService.sendApprovedMotivationalEmail(r.getEmail(), r.getName(), subject, message);
                // record successful send
                emailTrackingService.recordEmailSent(userId, category);
            } catch (Exception e) {
                log.error("Failed to send email to {} <{}>: {}", r.getName(), r.getEmail(), e.getMessage());
            }
        }

        try {
            Thread.sleep(1500); // simulation delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Centralized logging
        activityLogService.log(
                LogType.INFO,
                "Bulk Email Campaign",
                "Sent campaign '" + subject + "' to " + recipients.size() + " users",
                "System Admin",
                "Email System"
        );

        log.info("Bulk campaign dispatch completed.");
    }
}
