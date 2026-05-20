package com.abd.cognelearn.config;

import com.abd.cognelearn.model.*;
import com.abd.cognelearn.repository.*;
import com.abd.cognelearn.service.MilestoneMessageCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * DataInitializer — seeds the database with initial demo data if empty.
 *
 * NOTE: This is meant for local/demo use. Disable in tests/CI with:
 *   cognelearn.seed-demo-data=false
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "cognelearn.seed-demo-data", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserEventRepository userEventRepository;
    private final PendingNotificationRepository pendingNotificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        int fixed = userRepository.fixNullRoles();
        if (fixed > 0) {
            System.out.println("Role repair: backfilled " + fixed + " user(s) with default role 'USER'.");
        }
        userRepository.setRoleByEmail("admin@cognelearn.app", "ADMIN");

        if (userRepository.count() > 0) {
            seedPendingMotivationalEmailsIfEmpty();
            seedActivityLogs("System Admin", "Abdullah Himel", "Nadia Islam");
            return;
        }

        System.out.println("Seeding initial demo data for Admin Panel...");

        UserEntity admin = new UserEntity(
                UUID.randomUUID(),
                "System Admin",
                "admin@cognelearn.app",
                passwordEncoder.encode("admin123"),
                Instant.now().minus(30, ChronoUnit.DAYS),
                true
        );

        UserEntity himel = new UserEntity(
                UUID.randomUUID(),
                "Abdullah Himel",
                "himel@cognelearn.app",
                passwordEncoder.encode("password"),
                Instant.now().minus(15, ChronoUnit.DAYS),
                true
        );

        UserEntity nadia = new UserEntity(
                UUID.randomUUID(),
                "Nadia Islam",
                "nadia@example.com",
                passwordEncoder.encode("password"),
                Instant.now().minus(5, ChronoUnit.DAYS),
                true
        );

        admin.setRole("ADMIN");
        userRepository.save(admin);
        userRepository.save(himel);
        userRepository.save(nadia);

        playlistRepository.save(new PlaylistEntity(
                UUID.randomUUID(),
                himel,
                "Spring Boot Mastery",
                "A comprehensive guide to Spring Boot 3.x",
                Instant.now().minus(10, ChronoUnit.DAYS)
        ));

        playlistRepository.save(new PlaylistEntity(
                UUID.randomUUID(),
                nadia,
                "Advanced UI Design",
                "Mastering CSS Grids and Flexbox",
                Instant.now().minus(2, ChronoUnit.DAYS)
        ));

        studySessionRepository.save(new StudySessionEntity(
                UUID.randomUUID(), himel, null, "dQw4w9WgXcQ",
                Instant.now().minus(2, ChronoUnit.HOURS), 25, Instant.now().minus(2, ChronoUnit.HOURS)
        ));

        userEventRepository.save(new UserEvent(himel.getId(), "STREAK_7"));
        userEventRepository.save(new UserEvent(himel.getId(), "LOW_FOCUS"));
        userEventRepository.save(new UserEvent(nadia.getId(), "STREAK_30"));
        userEventRepository.save(new UserEvent(nadia.getId(), "INACTIVE_USER"));

        seedPendingForUser(himel.getId(), "STREAK_7", Instant.now().minus(3, ChronoUnit.HOURS));
        seedPendingForUser(himel.getId(), "LOW_FOCUS", Instant.now().minus(90, ChronoUnit.MINUTES));
        seedPendingForUser(nadia.getId(), "STREAK_30", Instant.now().minus(5, ChronoUnit.HOURS));
        seedPendingForUser(nadia.getId(), "INACTIVE_USER", Instant.now().minus(30, ChronoUnit.MINUTES));

        seedActivityLogs(admin.getName(), himel.getName(), nadia.getName());

        System.out.println("Data seeding complete.");
    }

    private void seedActivityLogs(String adminName, String himelName, String nadiaName) {
        if (activityLogRepository.count() >= 15) return;
        activityLogRepository.deleteAll();

        activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("User Registration").description("Abdullah Himel created a new account").userName(himelName).source("Web App").createdAt(Instant.now().minus(15, ChronoUnit.DAYS)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("User Registration").description("Nadia Islam created a new account").userName(nadiaName).source("Web App").createdAt(Instant.now().minus(5, ChronoUnit.DAYS)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("Playlist Created").description("Spring Boot Mastery playlist created").userName(himelName).source("Web App").createdAt(Instant.now().minus(10, ChronoUnit.DAYS)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("Session Started").description("Study session started for playlist").userName(himelName).source("Web App").createdAt(Instant.now().minus(2, ChronoUnit.HOURS)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.WARNING).title("Low Focus Detected").description("User signaled low focus").userName(himelName).source("AI Engine").createdAt(Instant.now().minus(90, ChronoUnit.MINUTES)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("Admin Login").description("System Admin logged into dashboard").userName(adminName).source("Admin Panel").createdAt(Instant.now().minus(10, ChronoUnit.MINUTES)).build());
        activityLogRepository.save(ActivityLog.builder().type(LogType.ERROR).title("Failed Login").description("Multiple failed login attempts").userName("Unknown").source("Web App").createdAt(Instant.now().minus(5, ChronoUnit.MINUTES)).build());
        
        // Extra logs to trigger pagination
        for (int i = 1; i <= 8; i++) {
            activityLogRepository.save(ActivityLog.builder().type(LogType.INFO).title("Routine Check").description("System routine check " + i).userName("System").source("Internal").createdAt(Instant.now().minus(i * 10, ChronoUnit.MINUTES)).build());
        }
    }

    private void seedPendingMotivationalEmailsIfEmpty() {
        List<PendingNotification> pending = pendingNotificationRepository
                .findByStatusOrderByCreatedAtDesc(NotificationStatus.PENDING);
        if (!pending.isEmpty()) {
            return;
        }

        userRepository.findByEmailIgnoreCase("himel@cognelearn.app").ifPresent(himel -> {
            seedPendingForUser(himel.getId(), "STREAK_7", Instant.now().minus(3, ChronoUnit.HOURS));
            seedPendingForUser(himel.getId(), "LOW_FOCUS", Instant.now().minus(90, ChronoUnit.MINUTES));
        });
        userRepository.findByEmailIgnoreCase("nadia@example.com").ifPresent(nadia -> {
            seedPendingForUser(nadia.getId(), "STREAK_30", Instant.now().minus(5, ChronoUnit.HOURS));
            seedPendingForUser(nadia.getId(), "INACTIVE_USER", Instant.now().minus(30, ChronoUnit.MINUTES));
        });

        if (pendingNotificationRepository.findByStatusOrderByCreatedAtDesc(NotificationStatus.PENDING).isEmpty()) {
            return;
        }
        System.out.println("Seeded demo pending motivational emails.");
    }

    private void seedPendingForUser(UUID userId, String eventType, Instant createdAt) {
        MilestoneMessageCatalog.suggestedMessage(eventType).ifPresent(message ->
                pendingNotificationRepository.save(new PendingNotification(
                        UUID.randomUUID(),
                        userId,
                        eventType,
                        message,
                        NotificationStatus.PENDING,
                        createdAt
                ))
        );
    }
}
