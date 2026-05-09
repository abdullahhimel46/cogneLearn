package com.cognelearn.controller;

import com.cognelearn.dto.auth.AuthResponse;
import com.cognelearn.dto.auth.LoginRequest;
import com.cognelearn.dto.auth.SignupRequest;
import com.cognelearn.dto.user.UserResponse;
import com.cognelearn.service.AuthService;
import com.cognelearn.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AuthController — handles user registration, login, and logout.
 *
 * <p>Base path: {@code /api/v1/auth}
 *
 * <p>Maps to the old JavaScript {@code auth.js} module:
 * <pre>
 *   JS: Auth.signup(email, password, name)  → POST /api/v1/auth/signup
 *   JS: Auth.login(email, password)          → POST /api/v1/auth/login
 *   JS: Auth.logout()                        → POST /api/v1/auth/logout  (handled by Spring Security)
 *   JS: Auth.isLoggedIn() / getCurrentUser() → GET  /api/v1/auth/me
 * </pre>
 *
 * <p>Most endpoints in this class are PUBLIC (no login required) except {@code /me},
 * which requires an active session. This is configured in {@link com.cognelearn.config.SecurityConfig}.
 *
 * <p>After a successful login or signup, Spring Security automatically sets a
 * {@code JSESSIONID} cookie in the response. The browser sends this cookie with
 * every future request, so the user stays "logged in" without any extra work.
 */
@RestController                     // Marks this class as a REST controller (returns JSON by default)
@RequestMapping("/api/v1/auth")     // All methods here are under /api/v1/auth
public class AuthController {

    // AuthService contains all the business logic (signup/login steps)
    private final AuthService authService;

    // CurrentUserService reads the logged-in user from the active session
    private final CurrentUserService currentUserService;

    /**
     * Constructor — Spring automatically injects the required service beans.
     *
     * @param authService        the service that handles signup and login logic
     * @param currentUserService the service that reads the logged-in user from the session
     */
    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    /**
     * Register a new user.
     *
     * <p>POST /api/v1/auth/signup
     *
     * <p>Maps to {@code Auth.signup(email, password, name)} in {@code auth.js}.
     *
     * @param request the JSON body with {name, email, password}
     * @return 201 Created with the new user's profile data
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        // @Valid triggers Jakarta Bean Validation on SignupRequest fields
        // (e.g., @NotBlank on name, @Email on email, @Size(min=6) on password)
        // If validation fails, Spring automatically returns 400 Bad Request

        AuthResponse response = authService.signup(request, httpRequest, httpResponse);

        // Return HTTP 201 Created (not the default 200 OK) because we created a resource
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Log in with an existing account.
     *
     * <p>POST /api/v1/auth/login
     *
     * <p>Maps to {@code Auth.login(email, password)} in {@code auth.js}.
     *
     * <p>On success, Spring Security sets the JSESSIONID cookie automatically.
     * The frontend does NOT need to store a token — the cookie handles everything.
     *
     * @param request the JSON body with {email, password}
     * @return 200 OK with the logged-in user's profile data
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the currently logged-in user's profile.
     *
     * <p>GET /api/v1/auth/me
     *
     * <p>Maps to {@code Auth.getCurrentUser()} and {@code Auth.isLoggedIn()} in {@code auth.js}.
     * Spring Security automatically protects this endpoint — if no valid session exists,
     * the request is rejected before this method is even called.
     *
     * @return 200 OK with the current user's profile data
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        // Spring Security has already verified authentication, so we can safely get the user
        var user = currentUserService.requireUser();
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
        ));
    }

    /**
     * Logout note — this endpoint is handled directly by Spring Security.
     *
     * <p>POST /api/v1/auth/logout
     *
     * <p>This method does NOT exist in this controller — Spring Security intercepts
     * POST requests to {@code /api/v1/auth/logout} before they reach any controller.
     * It automatically:
     * <ol>
     *   <li>Invalidates the server-side HTTP session</li>
     *   <li>Deletes the JSESSIONID cookie from the browser</li>
     *   <li>Returns HTTP 200 OK</li>
     * </ol>
     *
     * <p>This is configured in {@link com.cognelearn.config.SecurityConfig#securityFilterChain}.
     * Maps to {@code Auth.logout()} in {@code auth.js}.
     */
    // logout is wired in SecurityConfig — no method needed here
}
