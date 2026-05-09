package com.cognelearn.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * SignupRequest — the data the browser sends when creating a new account.
 *
 * <p>Maps to the JavaScript {@code Auth.signup(email, password, name)} call in {@code auth.js}.
 *
 * <p>Example JSON body from the browser:
 * <pre>
 * {
 *   "name": "Jane Smith",
 *   "email": "jane@example.com",
 *   "password": "securePassword123"
 * }
 * </pre>
 *
 * <p>Validation annotations are checked automatically by Spring when the controller
 * method uses {@code @Valid}. If any field fails validation, Spring returns a
 * 400 Bad Request response automatically — no manual if-statements needed!
 *
 * @param name     the user's display name
 * @param email    the user's email (must be unique and correctly formatted)
 * @param password the plain-text password (minimum 6 characters, as per the JS original)
 */
public record SignupRequest(

        /**
         * The user's display name (e.g., "Jane Smith").
         *
         * <p>{@code @NotBlank} rejects null, empty string, or whitespace.
         * Maps to JS validation: {@code if (!name) { alert('Please fill in all fields'); }}
         */
        @NotBlank(message = "Name is required")
        String name,

        /**
         * The user's email address.
         *
         * <p>{@code @Email} validates the email format.
         * Maps to JS: {@code Auth.validateEmail(email)}
         */
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email,

        /**
         * The user's chosen password in plain text.
         *
         * <p>{@code @Size(min = 6)} rejects passwords shorter than 6 characters.
         * Maps to JS: {@code if (password.length < 6) { alert('Password must be at least 6 characters'); }}
         *
         * <p>IMPORTANT: This password is NEVER stored. It is hashed with BCrypt in
         * {@code AuthService.signup()} before anything is saved to the database.
         */
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password
) {
}
