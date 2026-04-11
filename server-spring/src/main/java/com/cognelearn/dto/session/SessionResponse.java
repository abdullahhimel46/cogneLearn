package com.cognelearn.dto.session;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionResponse(
        UUID sessionId,
        String playlistId,
        String videoId,
        Instant startTime,
        Instant endTime,
        int duration,
        int completedDuration,
        String status,
        Instant createdAt,
        List<Integer> attentionScores
) {
}
