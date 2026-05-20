package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.user.UserResponse;
import com.abd.cognelearn.service.AuthService;
import com.abd.cognelearn.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UserController â€” REST API endpoints for user profile information.
 *
 * <p>Base path: {@code /api/v1/users}
 *
 * <p>Maps to the JavaScript {@code User.js} module:
 * <pre>
 *   GET /api/v1/users/me â†’ User.getCurrentUser()
 * </pre>
 *
 * <p>All endpoints require the user to be logged in (session cookie required).
 * If the user is not logged in, Spring Security automatically returns 403 Forbidden.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final CurrentUserService currentUserService;
    private final AuthService authService;

    public UserController(CurrentUserService currentUserService, AuthService authService) {
        this.currentUserService = currentUserService;
        this.authService = authService;
    }

    /**
     * Get the profile of the currently logged-in user.
     *
     * <p>GET /api/v1/users/me
     *
     * <p>Maps to JS: {@code User.getCurrentUser()} which reads
     * {@code localStorage.getItem('cognelearn_user')}.
     *
     * <p>Example response:
     * <pre>
     * {
     *   "id": "550e8400-e29b-41d4-a716-446655440000",
     *   "name": "Jane Smith",
     *   "email": "jane@example.com",
     *   "createdAt": "2024-01-15T10:30:00Z"
     * }
     * </pre>
     *
     * @return 200 OK with the current user's profile (never includes passwordHash)
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        // Step 1: Get the logged-in UserEntity from the Spring Security session context
        return ResponseEntity.ok(authService.toUserResponse(currentUserService.requireUser()));
    }
}
