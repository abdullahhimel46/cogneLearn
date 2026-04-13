package com.cognelearn.service;

import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.UserRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity requireUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("Unauthorized");
        }

        UUID userId = (UUID) auth.getPrincipal();
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Unauthorized"));
    }
}
