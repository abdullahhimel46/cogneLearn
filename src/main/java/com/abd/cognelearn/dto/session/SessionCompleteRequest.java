package com.cognelearn.dto.session;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * SessionCompleteRequest — the data sent when marking a study session as complete.
 *
 * <p>Maps to the JavaScript {@code StudySession.end(sessionId, completedMinutes)} call.
 * The frontend sends how many minutes the user actually studied (may be less than
 * the planned duration if they stopped early).
 *
 * <p>Example JSON body:
 * <pre>
 * { "completedDuration": 22 }
 * </pre>
 *
 * @param completedDuration how many minutes the user actually studied (0 or more)
 */
public record SessionCompleteRequest(

        /**
         * Actual minutes completed. Can be 0 if the user stopped immediately.
         * Must be provided — null is not allowed.
         *
         * <p>Maps to JS: {@code completedMins} parameter in {@code StudySession.end()}
         */
        @NotNull(message = "Completed duration is required")
        @Min(value = 0, message = "Completed duration cannot be negative")
        Integer completedDuration
) {
}
