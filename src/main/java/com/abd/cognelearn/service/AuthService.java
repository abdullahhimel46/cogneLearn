package com.abd.cognelearn.service;

import com.abd.cognelearn.dto.auth.AuthResponse;
import com.abd.cognelearn.dto.auth.LoginRequest;
import com.abd.cognelearn.dto.auth.SignupRequest;
import com.abd.cognelearn.dto.user.UserResponse;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

/**
 * AuthService â€” handles user registration (signup) and login.
 *
 * <p>This class maps to the JavaScript {@code auth.js} module:
 * <pre>
 *   JS: Auth.signup(email, password, name)  â†’ Java: AuthService.signup(SignupRequest)
 *   JS: Auth.login(email, password)          â†’ Java: AuthService.login(LoginRequest, session)
 * </pre>
 *
 * <p>Key difference from the old JS version:
 * <ul>
 *   <li>JS stored the user object directly in localStorage (anyone can read/edit it!)</li>
 *   <li>Java stores only a session ID cookie; the real user data stays in the database</li>
 *   <li>Passwords are NEVER stored in plain text â€” BCrypt creates a one-way hash</li>
 * </ul>
 */
@Service
public class AuthService {

    // Loads users from the database and hashes/checks passwords
    private final UserRepository userRepository;

    // BCryptPasswordEncoder â€” hashes passwords before saving, verifies on login
    private final PasswordEncoder passwordEncoder;

    // AuthenticationManager â€” Spring Security's central authenticator
    private final AuthenticationManager authenticationManager;

    // Persists the authenticated SecurityContext into the HTTP session.
    private final SecurityContextRepository securityContextRepository;

    /**
     * Constructor â€” Spring automatically injects all required beans.
     *
     * @param userRepository       the JPA repository for User records
     * @param passwordEncoder      the BCrypt password encoder
     * @param authenticationManager Spring Security's authentication manager
     */
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    /**
     * Register a new user account.
     *
     * <p>Maps to {@code Auth.signup(email, password, name)} in {@code auth.js}.
     *
     * <p>Steps:
     * <ol>
     *   <li>Check that the email is not already taken</li>
     *   <li>Hash the password with BCrypt (never store plain text!)</li>
     *   <li>Save the new user to the database</li>
     *   <li>Return the user's profile data (no token â€” session is managed by Spring)</li>
     * </ol>
     *
     * @param request the signup form data (name, email, password)
     * @return an AuthResponse with the newly created user's profile
     */
    public AuthResponse signup(SignupRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = normalizeEmail(request.email());
        String normalizedName = request.name().trim();

        // Step 1: Reject duplicate emails (same as JS: email â†’ userId mapping)
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        // Step 2: Hash the password before saving.
        // BCrypt turns "myPassword123" into something like "$2a$10$abc..."
        // You CANNOT reverse this hash â€” it is one-way by design.
        String hashedPassword = passwordEncoder.encode(request.password());

        // Step 3: Build and save the new user record
        UserEntity newUser = new UserEntity(
                UUID.randomUUID(),                       // unique ID for this user
                normalizedName,                          // display name from form
                normalizedEmail,                         // normalized email for stable lookups
                hashedPassword,                          // the BCrypt hash (NOT the plain password)
                Instant.now(),                           // timestamp of account creation
                true                                     // account is active by default
        );
        userRepository.save(newUser); // INSERT into the users table

        // Step 3.5 (important): auto-login after signup.
        // The frontend expects signup to result in an authenticated session.
        // We authenticate using the raw credentials (email + original password) and store it in the SecurityContext.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );
        saveAuthentication(authentication, httpRequest, httpResponse);

        // Step 4: Return the user profile (no JWT token â€” login is session-based)
        return new AuthResponse(toUserResponse(newUser));
    }

    /**
     * Authenticate an existing user (login).
     *
     * <p>Maps to {@code Auth.login(email, password)} in {@code auth.js}.
     *
     * <p>Steps:
     * <ol>
     *   <li>Ask Spring Security's AuthenticationManager to verify email + password</li>
     *   <li>If valid, store the authentication in the SecurityContext
     *       (Spring will persist this in the HTTP session automatically)</li>
     *   <li>Return the user's profile data</li>
     * </ol>
     *
     * @param request the login form data (email, password)
     * @return an AuthResponse with the logged-in user's profile
     */
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = normalizeEmail(request.email());

        // Step 1: Build an "unauthenticated" token from the submitted credentials.
        // This is NOT yet verified â€” it is just a holder for the email and password.
        UsernamePasswordAuthenticationToken credentials =
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,    // the "username" (we use email)
                        request.password()  // plain-text password (Spring will compare with hash)
                );

        // Step 2: Ask Spring Security to verify the credentials.
        // Internally this calls CogneLearnUserDetailsService.loadUserByUsername(email)
        // then uses BCrypt to compare the submitted password with the stored hash.
        // If the credentials are wrong, an AuthenticationException is thrown automatically.
        Authentication authentication = authenticationManager.authenticate(credentials);

        // Step 3: Store the verified authentication in the SecurityContext and save it.
        // For controller-based/manual authentication, we must persist the context explicitly.
        // That creates the HTTP session so the browser receives a JSESSIONID cookie.
        saveAuthentication(authentication, httpRequest, httpResponse);

        // Step 4: Load the full user record to build our response
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException("User disappeared after authentication"));

        // Step 5: Return the user's profile (the session cookie handles "staying logged in")
        return new AuthResponse(toUserResponse(user));
    }

    /**
     * Convert a UserEntity to a UserResponse DTO (safe to send over the network).
     *
     * <p>This deliberately EXCLUDES the password hash â€” we never send passwords in responses.
     *
     * @param user the database entity
     * @return a UserResponse record safe for API responses
     */
    public UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                user.getRole()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void saveAuthentication(
            Authentication authentication,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }
}
