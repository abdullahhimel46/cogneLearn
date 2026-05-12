package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.user.UserResponse;
import com.abd.cognelearn.model.UserEntity;
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

    /**
     * Constructor â€” Spring injects CurrentUserService.
     *
     * @param currentUserService helper that reads the logged-in user from the session
     */
    public UserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
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
        UserEntity user = currentUserService.requireUser();

        // Step 2: Convert to a safe response DTO (excludes passwordHash)
        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
        );

        // Step 3: Return 200 OK with the user profile JSON
        return ResponseEntity.ok(response);
    }
}
