package com.cognelearn.dto.playlist;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record PlaylistRequest(
        @NotBlank String title,
        String description,
        List<VideoItemRequest> videos
) {
}
