package com.cognelearn.repository;

import com.cognelearn.model.PlaylistEntity;
import com.cognelearn.model.UserEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<PlaylistEntity, UUID> {
    List<PlaylistEntity> findAllByUser(UserEntity user);
    Optional<PlaylistEntity> findByIdAndUser(UUID id, UserEntity user);
}
