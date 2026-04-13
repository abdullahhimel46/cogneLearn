package com.cognelearn.repository;

import com.cognelearn.model.AttentionScoreEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttentionScoreRepository extends JpaRepository<AttentionScoreEntity, UUID> {
}
