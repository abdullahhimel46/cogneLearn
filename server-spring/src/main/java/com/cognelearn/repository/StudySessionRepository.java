package com.cognelearn.repository;

import com.cognelearn.model.StudySessionEntity;
import com.cognelearn.model.UserEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudySessionRepository extends JpaRepository<StudySessionEntity, UUID> {
    List<StudySessionEntity> findAllByUser(UserEntity user);
    Optional<StudySessionEntity> findByIdAndUser(UUID id, UserEntity user);
    List<StudySessionEntity> findAllByUserAndStartTimeAfter(UserEntity user, Instant startTime);
}
