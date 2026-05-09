package com.cognelearn.dto.session;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * SessionCreateRequest — the data the browser sends when starting a new study session.
 *
 * <p>Maps to the JavaScript {@code StudySession.create(sessionData)} and
 * {@code SessionManager.start(playlistId, duration, cycles)} calls.
 *
 * <p>Example JSON body:
 * <pre>
 * {
 *   "playlistId": "550e8400-e29b-41d4-a716-446655440000",
 *   "videoId": "dQw4w9WgXcQ",
 *   "duration": 25,
 *   "cycles": 1
 * }
 * </pre>
 *
 * @param playlistId the UUID string of the playlist being studied (optional — can be null)
 * @param videoId    the YouTube video ID currently playing (optional — can be null)
 * @param duration   the planned session length in minutes (required, must be positive)
 * @param cycles     the number of Pomodoro cycles planned (defaults to 1 if null)
 */
public record SessionCreateRequest(

        /** The playlist UUID as a string. Null if no specific playlist was selected. */
        String playlistId,

        /** The YouTube video ID being watched. Null if no specific video was selected. */
        String videoId,

        /**
         * Session duration in minutes. Required. Must be a positive number (1 or more).
         * Default Pomodoro duration is 25 minutes.
         *
         * <p>Maps to JS: {@code session.duration = sessionData.focusTime || 25}
         */
        @NotNull(message = "Duration is required")
        @Positive(message = "Duration must be a positive number of minutes")
        Integer duration,

        /**
         * Number of Pomodoro cycles to run back-to-back.
         * Optional — if null, treated as 1 cycle in the service.
         *
         * <p>Maps to JS: {@code SessionManager.start(playlistId, duration, cycles)}
         */
        Integer cycles
) {
}
