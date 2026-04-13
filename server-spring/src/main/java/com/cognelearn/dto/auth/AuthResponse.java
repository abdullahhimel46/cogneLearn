package com.cognelearn.dto.auth;

import com.cognelearn.dto.user.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
