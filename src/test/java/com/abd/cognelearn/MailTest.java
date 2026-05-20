package com.abd.cognelearn;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest
public class MailTest {

    @Autowired
    private JavaMailSender mailSender;

    @Test
    public void testSendMail() {
        System.out.println("Starting mail test...");
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("himel22205101622@diu.edu.bd");
            // message.setFrom("abdullahhimel46@gmail.com"); // explicitly omitted to see what happens
            message.setSubject("Test Email from cogneLearn");
            message.setText("This is a test email sent during debugging.");
            
            mailSender.send(message);
            System.out.println("MAIL SENT SUCCESSFULLY (no exception thrown).");
        } catch (Exception e) {
            System.err.println("FAILED TO SEND MAIL:");
            e.printStackTrace();
            throw e;
        }
    }
}
