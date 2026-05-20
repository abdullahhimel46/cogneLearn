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

    /**
     * Sends an admin-approved motivational message. Used only after explicit admin action.
     */
    void sendApprovedMotivationalEmail(String to, String userName, String subject, String bodyText);
}
