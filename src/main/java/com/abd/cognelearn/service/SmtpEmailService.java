package com.abd.cognelearn.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * Real SMTP-backed email sender.
 *
 * Enabled only when:
 *  - Spring's JavaMailSender is on the classpath
 *  - cognelearn.email.enabled=true
 *
 * Implementation detail:
 * This class intentionally avoids compile-time references to Spring Mail classes
 * (SimpleMailMessage/JavaMailSender) so the application can be opened/compiled
 * even if the IDE hasn't synced the Gradle mail dependency.
 */
@Service
@Primary
@ConditionalOnClass(name = "org.springframework.mail.javamail.JavaMailSender")
@ConditionalOnProperty(name = "cognelearn.email.enabled", havingValue = "true")
public class SmtpEmailService implements EmailService {

    private static final String JAVA_MAIL_SENDER_CLASS = "org.springframework.mail.javamail.JavaMailSender";
    private static final String SIMPLE_MAIL_MESSAGE_CLASS = "org.springframework.mail.SimpleMailMessage";

    private final Object mailSender;

    private final Constructor<?> simpleMailMessageConstructor;
    private final Method setTo;
    private final Method setSubject;
    private final Method setText;
    private final Method send;

    public SmtpEmailService(ApplicationContext applicationContext) {
        try {
            Class<?> senderClass = Class.forName(JAVA_MAIL_SENDER_CLASS);
            Class<?> messageClass = Class.forName(SIMPLE_MAIL_MESSAGE_CLASS);

            this.mailSender = applicationContext.getBean(senderClass);

            this.simpleMailMessageConstructor = messageClass.getDeclaredConstructor();
            this.setTo = messageClass.getMethod("setTo", String.class);
            this.setSubject = messageClass.getMethod("setSubject", String.class);
            this.setText = messageClass.getMethod("setText", String.class);
            this.send = senderClass.getMethod("send", messageClass);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize SMTP email sender. " +
                    "Ensure spring-boot-starter-mail is on the classpath and mail is configured.", e);
        }
    }

    @Override
    public void sendMilestoneEmail(String to, String userName, int days) {
        String subject = "New Milestone Achieved: " + days + " Days!";
        String body = "Congratulations " + userName + "!\n\n" +
                "You've reached a " + days + "-day focus streak on cogneLearn. " +
                "Your dedication to deep work is inspiring. Keep it up!";
        sendSimpleMessage(to, subject, body);
    }

    @Override
    public void sendFocusTipEmail(String to, String userName) {
        String subject = "Focus Tip: Refresh Your Mind";
        String body = "Hi " + userName + ",\n\n" +
                "We noticed your focus levels were a bit lower in your last session. " +
                "Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. " +
                "Stay sharp!";
        sendSimpleMessage(to, subject, body);
    }

    @Override
    public void sendInactivityReminder(String to, String userName) {
        String subject = "We Miss You on cogneLearn!";
        String body = "Hi " + userName + ",\n\n" +
                "It's been a while since your last deep work session. " +
                "Consistency is key to mastering new skills. Why not start a quick 25-minute Pomodoro today?";
        sendSimpleMessage(to, subject, body);
    }

    private void sendSimpleMessage(String to, String subject, String body) {
        try {
            Object message = simpleMailMessageConstructor.newInstance();
            setTo.invoke(message, to);
            setSubject.invoke(message, subject);
            setText.invoke(message, body);
            send.invoke(mailSender, message);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to send email. Verify spring.mail.* settings.", e);
        }
    }
}

