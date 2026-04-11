package com.cognelearn.dto.user;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID userId,
        String name,
        String email,
        Instant createdAt
) {
}
