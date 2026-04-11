package com.cognelearn.dto.session;

import jakarta.validation.constraints.NotNull;

public record SessionCreateRequest(
        String playlistId,
        String videoId,
        @NotNull Integer duration
) {
}
