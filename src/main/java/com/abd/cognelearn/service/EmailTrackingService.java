package com.abd.cognelearn.service;


import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailLog;
import com.abd.cognelearn.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailTrackingService {

    private final EmailLogRepository emailLogRepository;
//    private final EmailLog emailLog;

    public boolean canSendEmailToday(UUID userId){
        // check if an email has sent in last 24 hours
        Instant twentyFourHoursAgo = Instant.now().minus(24, ChronoUnit.HOURS);

        boolean emailSentRecently = emailLogRepository.existsByUserIdAndSentAtAfter(userId, twentyFourHoursAgo);

        return !emailSentRecently; // if email not sent, retrun true(meaning email can be sent)
    }

    // save log after sending an email successfully
    public void recordEmailSent(UUID userId, EmailCategory category){
        EmailLog log = new EmailLog(null, userId, category, Instant.now());
        emailLogRepository.save(log);
    }

}
