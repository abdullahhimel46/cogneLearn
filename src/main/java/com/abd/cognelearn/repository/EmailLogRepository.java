package com.abd.cognelearn.repository;


import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {
    // নির্দিষ্ট ইউজারের জন্য আজকের দিনে (বা নির্দিষ্ট সময়ের পর) কোনো ইমেইল গেছে কিনা চেক করা
    boolean existsByUserIdAndSentAtAfter(UUID userId, Instant timeLimit);

    // অথবা, যদি নির্দিষ্ট ক্যাটাগরির ইমেইল চেক করতে চান:
     boolean existsByUserIdAndCategoryAndSentAtAfter(UUID userId, EmailCategory category, Instant timeLimit);

    java.util.Optional<EmailLog> findTopByUserIdOrderBySentAtDesc(UUID userId);
}
