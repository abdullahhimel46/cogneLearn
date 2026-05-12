package com.abd.cognelearn.web;

import java.time.Instant;

/**
 * ApiError â€” the standard error response format sent to the browser when something goes wrong.
 *
 * <p>Whenever an exception is thrown in any controller or service, our
 * {@link RestExceptionHandler} catches it and wraps it in this record before
 * sending it as a JSON response.
 *
 * <p>Example JSON error response:
 * <pre>
 * {
 *   "message": "Playlist not found with id: 550e8400-...",
 *   "timestamp": "2024-01-15T10:32:00Z"
 * }
 * </pre>
 *
 * <p>Using a consistent error format means the frontend (JS) can always expect the
 * same structure and display errors in a user-friendly way.
 *
 * <p>Maps to the old JS error handling:
 * <pre>
 *   catch (error) { alert(error.message); }
 *   // Java replaces this with a proper JSON error response
 * </pre>
 *
 * @param message   a human-readable description of what went wrong
 * @param timestamp the exact moment (UTC) when the error occurred
 */
public record ApiError(
        String message,
        Instant timestamp
) {
}
