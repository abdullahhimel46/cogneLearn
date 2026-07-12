package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.auth.AuthResponse;
import com.abd.cognelearn.dto.auth.LoginRequest;
import com.abd.cognelearn.dto.auth.SignupRequest;
import com.abd.cognelearn.dto.user.UserResponse;
import com.abd.cognelearn.service.AuthService;
import com.abd.cognelearn.service.CurrentUserService;
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

/*AuthController â€” handles user registration, login, and logout. */
@RestController                     // Marks this class as a REST controller (returns JSON by default)
@RequestMapping("/api/v1/auth")     // All methods here are under /api/v1/auth
public class AuthController {

    // AuthService contains all the business logic (signup/login steps)
    private final AuthService authService;

    // CurrentUserService reads the logged-in user from the active session
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        // @Valid triggers Jakarta Bean Validation on SignupRequest fields
        // (e.g., @NotBlank on name, @Email on email, @Size(min=6) on password)

        AuthResponse response = authService.signup(request, httpRequest, httpResponse);

        // Return HTTP 201 Created, because we created a resource
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(response);
    }

    // Get the currently logged-in user's profile.
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        var user = currentUserService.requireUser();
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    // logout is wired in SecurityConfig 
}
