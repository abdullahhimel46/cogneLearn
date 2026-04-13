package com.cognelearn.repository;

import com.cognelearn.model.VideoItemEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoItemRepository extends JpaRepository<VideoItemEntity, UUID> {
}
