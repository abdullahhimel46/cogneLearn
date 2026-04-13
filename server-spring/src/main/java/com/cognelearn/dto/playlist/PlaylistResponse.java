package com.cognelearn.dto.playlist;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlaylistResponse(
        UUID playlistId,
        String title,
        String description,
        Instant createdAt,
        int totalFocusMinutes,
        List<VideoItemResponse> videos
) {
}
