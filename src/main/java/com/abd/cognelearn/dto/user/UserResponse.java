package com.abd.cognelearn.dto.user;

import java.time.Instant;
import java.util.UUID;

/**
 * UserResponse â€” the user data sent back to the browser in API responses.
 *
 * <p>This is a "safe" view of a user â€” it deliberately EXCLUDES the password hash.
 * We should NEVER include {@code passwordHash} in any API response.
 *
 * <p>Maps to the JavaScript user object displayed in the UI:
 * <pre>
 * JS: const user = JSON.parse(localStorage.getItem('cognelearn_user'));
 * // user = { userId, name, email, createdAt }
 * </pre>
 *
 * <p>Example JSON response:
 * <pre>
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "Jane Smith",
 *   "email": "jane@example.com",
 *   "createdAt": "2024-01-15T10:30:00Z"
 * }
 * </pre>
 *
 * @param id        the user's unique UUID
 * @param name      the user's display name
 * @param email     the user's email address
 * @param createdAt when the account was created (UTC timestamp)
 */
public record UserResponse(
        UUID id,
        String name,
        String email,
        Instant createdAt
) {
}
