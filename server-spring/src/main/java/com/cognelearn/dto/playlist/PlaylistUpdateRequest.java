package com.cognelearn.dto.playlist;

import java.util.List;

public record PlaylistUpdateRequest(
        String title,
        String description,
        List<VideoItemRequest> videos
) {
}
