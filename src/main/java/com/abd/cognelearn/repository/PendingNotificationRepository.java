package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.NotificationStatus;
import com.abd.cognelearn.model.PendingNotification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingNotificationRepository extends JpaRepository<PendingNotification, UUID> {

    List<PendingNotification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);
}
