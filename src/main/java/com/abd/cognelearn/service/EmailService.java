package com.abd.cognelearn.service;

/**
 * EmailService is an abstraction so the app can start even when SMTP/email is not configured.
 *
 * By default the app provides a no-op implementation.
 * To enable real email sending, set:
 *   cognelearn.email.enabled=true
 * and configure standard Spring mail properties (spring.mail.*).
 */
public interface EmailService {

    void sendMilestoneEmail(String to, String userName, int days);

    void sendFocusTipEmail(String to, String userName);

    void sendInactivityReminder(String to, String userName);
}
