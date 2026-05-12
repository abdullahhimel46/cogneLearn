package com.abd.cognelearn.dto.auth;

import com.abd.cognelearn.dto.user.UserResponse;

/**
 * AuthResponse â€” the data sent back to the browser after a successful login or signup.
 *
 * <p>In the old JWT approach this record contained a {@code token} string.
 * With session-based auth we no longer need to return a token â€” the session cookie
 * (JSESSIONID) is set automatically by Spring Security in the response headers.
 *
 * <p>We only return the user's profile so the frontend can display their name/email.
 *
 * <p>Maps to the old JS response:
 * <pre>
 *   localStorage.setItem('cognelearn_session', JSON.stringify({ userId, createdAt }));
 * </pre>
 *
 * @param user the logged-in user's public profile data (never includes password)
 */
public record AuthResponse(
        UserResponse user
) {
}
