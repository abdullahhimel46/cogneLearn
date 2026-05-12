package com.abd.cognelearn.dto.session;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * SessionResponse â€” the complete study session data sent back to the browser.
 *
 * <p>Maps to the JavaScript session object in {@code StudySession.js}:
 * <pre>
 * JS: { sessionId, userId, playlistId, videoId, startTime, endTime,
 *        duration, completedDuration, status, attentionScores, createdAt }
 * </pre>
 *
 * <p>Example JSON response:
 * <pre>
 * {
 *   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
 *   "playlistId": "660e8400-e29b-41d4-a716-446655440001",
 *   "videoId": "dQw4w9WgXcQ",
 *   "startTime": "2024-01-15T09:00:00Z",
 *   "endTime": "2024-01-15T09:25:00Z",
 *   "duration": 25,
 *   "completedDuration": 25,
 *   "status": "completed",
 *   "createdAt": "2024-01-15T09:00:00Z",
 *   "attentionScores": [85, 72, 90, 65, 88]
 * }
 * </pre>
 *
 * @param sessionId         unique UUID of the session
 * @param playlistId        the playlist UUID as a string (null if no playlist)
 * @param videoId           the YouTube video ID (null if none)
 * @param startTime         when the session started
 * @param endTime           when the session ended (null if still active/paused)
 * @param duration          planned duration in minutes
 * @param completedDuration actual minutes studied
 * @param status            current lifecycle state: "active", "paused", or "completed"
 * @param createdAt         when the session record was created
 * @param attentionScores   all recorded attention scores (0â€“100) for this session
 */
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
