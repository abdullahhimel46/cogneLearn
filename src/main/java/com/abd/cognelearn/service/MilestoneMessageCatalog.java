package com.abd.cognelearn.service;

import java.util.Optional;

/**
 * Central copy for milestone-driven motivational emails. No analytics payloads —
 * only human-readable text derived from the event type keyword.
 */
public final class MilestoneMessageCatalog {

    private MilestoneMessageCatalog() {
    }

    public static Optional<String> suggestedMessage(String normalizedEventType) {
        if (normalizedEventType == null || normalizedEventType.isBlank()) {
            return Optional.empty();
        }
        return switch (normalizedEventType) {
            case "STREAK_7" -> Optional.of(
                    "\uD83D\uDD25 Congratulations on maintaining a 7-day learning streak!");
            case "STREAK_30" -> Optional.of(
                    "Congratulations on maintaining a 30-day learning streak — outstanding consistency.");
            case "LOW_FOCUS" -> Optional.of(
                    "Consistency matters more than perfection. Keep moving forward.");
            case "INACTIVITY", "INACTIVE_USER" -> Optional.of(
                    "We noticed you have been inactive recently. Even a small study session can restart your momentum.");
            default -> Optional.empty();
        };
    }

    public static String emailSubject(String normalizedEventType) {
        if (normalizedEventType == null || normalizedEventType.isBlank()) {
            return "A note from cogneLearn";
        }
        return switch (normalizedEventType) {
            case "STREAK_7" -> "Your 7-day streak";
            case "STREAK_30" -> "Your 30-day streak";
            case "LOW_FOCUS" -> "Keep going";
            case "INACTIVITY", "INACTIVE_USER" -> "We'd love to see you back";
            default -> "A note from cogneLearn";
        };
    }
}
