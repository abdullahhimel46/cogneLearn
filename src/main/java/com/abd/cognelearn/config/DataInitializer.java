package com.abd.cognelearn.config;

import com.cognelearn.model.*;
import com.cognelearn.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * DataInitializer — seeds the H2 database with initial demo data if empty.
 * This ensures the Admin Panel has visible data immediately upon startup.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final StudySessionRepository studySessionRepository;
    private final FeedbackRepository feedbackRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Only seed if the database is empty
        if (userRepository.count() > 0) return;

        System.out.println("🌱 Seeding initial demo data for Admin Panel...");

        // 1. Seed Users
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

        userRepository.save(admin);
        userRepository.save(himel);
        userRepository.save(nadia);

        // 2. Seed Playlists
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

        // 3. Seed Feedback
        feedbackRepository.save(new FeedbackEntity(
                "The attention tracking feature is a game changer! It really helps me stay focused.", 
                "Nadia Islam", 
                Instant.now().minus(1, ChronoUnit.DAYS)
        ));
        
        feedbackRepository.save(new FeedbackEntity(
                "Can we get a feature to export study logs to PDF?", 
                "Abdullah Himel", 
                Instant.now().minus(4, ChronoUnit.HOURS)
        ));
        
        feedbackRepository.save(new FeedbackEntity(
                "The UI is absolutely stunning. Love the glassmorphism effects!", 
                null, // Anonymous
                Instant.now().minus(45, ChronoUnit.MINUTES)
        ));

        // 4. Seed Study Sessions
        studySessionRepository.save(new StudySessionEntity(
                UUID.randomUUID(), himel, null, "dQw4w9WgXcQ", 
                Instant.now().minus(2, ChronoUnit.HOURS), 25, Instant.now().minus(2, ChronoUnit.HOURS)
        ));

        System.out.println("✅ Data seeding complete.");
    }
}
