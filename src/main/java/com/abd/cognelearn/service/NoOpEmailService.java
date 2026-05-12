package com.abd.cognelearn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Default email implementation.
 *
 * Keeps the application runnable in environments where SMTP isn't configured.
 */
@Service
public class NoOpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(NoOpEmailService.class);

    @Override
    public void sendMilestoneEmail(String to, String userName, int days) {
        log.debug("Email disabled (milestone). to={}, userName={}, days={}", to, userName, days);
    }

    @Override
    public void sendFocusTipEmail(String to, String userName) {
        log.debug("Email disabled (focus tip). to={}, userName={}", to, userName);
    }

    @Override
    public void sendInactivityReminder(String to, String userName) {
        log.debug("Email disabled (inactivity). to={}, userName={}", to, userName);
    }
}

