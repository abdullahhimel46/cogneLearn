package com.cognelearn.dto.playlist;

import jakarta.validation.constraints.NotBlank;

public record VideoItemRequest(
        @NotBlank String id,
        @NotBlank String title,
        String kind,
        String subtitle
) {
}
