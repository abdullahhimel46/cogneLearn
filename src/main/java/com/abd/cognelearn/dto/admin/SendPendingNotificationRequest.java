package com.abd.cognelearn.dto.admin;

/**
 * Optional overrides when approving send. Empty fields use stored defaults.
 */
public record SendPendingNotificationRequest(String subject, String message) {
}
