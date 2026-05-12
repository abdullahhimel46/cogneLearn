package com.abd.cognelearn.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * LoginRequest â€” the data the browser sends when a user tries to log in.
 *
 * <p>Maps to the JavaScript {@code Auth.login(email, password)} call in {@code auth.js}.
 *
 * <p>This is a Java "record" â€” a special class that is:
 * <ul>
 *   <li>Immutable (fields cannot be changed after creation)</li>
 *   <li>Compact (no boilerplate getters/setters needed)</li>
 *   <li>Auto-generates {@code equals()}, {@code hashCode()}, and {@code toString()}</li>
 * </ul>
 *
 * <p>Example JSON body from the browser:
 * <pre>
 * {
 *   "email": "student@example.com",
 *   "password": "mypassword123"
 * }
 * </pre>
 *
 * @param email    the user's email address (must be a valid email format)
 * @param password the user's password (must not be blank)
 */
public record LoginRequest(

        /**
         * The user's email address.
         *
         * <p>{@code @NotBlank} â€” rejects null, empty string, or whitespace-only input.
         * {@code @Email} â€” validates the email format (must contain @ and a domain).
         */
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email,

        /**
         * The user's plain-text password (sent over HTTPS, never stored as-is).
         *
         * <p>{@code @NotBlank} â€” rejects empty passwords. Minimum length is checked
         * at signup, not login (wrong password will fail authentication instead).
         */
        @NotBlank(message = "Password is required")
        String password
) {
}
