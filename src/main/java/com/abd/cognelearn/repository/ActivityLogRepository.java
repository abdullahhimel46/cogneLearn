package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import com.abd.cognelearn.model.LogType;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop5ByOrderByCreatedAtDesc();
    Page<ActivityLog> findAll(Pageable pageable);
    
    long countByTitleContainingIgnoreCase(String titleFragment);
    long countByTypeIn(Collection<LogType> types);
    long countByCreatedAtAfter(Instant date);
}
