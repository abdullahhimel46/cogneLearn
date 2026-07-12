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

// AuthService handles user registration (signup) and login.

@Service
public class AuthService {

    // Loads users from the database and hashes/checks passwords
    private final UserRepository userRepository;

    // BCryptPasswordEncoder hashes passwords before saving, verifies on login
    private final PasswordEncoder passwordEncoder;

    // AuthenticationManager Spring Security's central authenticator
    private final AuthenticationManager authenticationManager;

    // Persists the authenticated SecurityContext into the HTTP session.
    private final SecurityContextRepository securityContextRepository;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    // Register a new user account.

    public AuthResponse signup(SignupRequest request, HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String normalizedEmail = normalizeEmail(request.email());
        String normalizedName = request.name().trim();

        // Step 1: Reject duplicate emails
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        // Step 2: Hash the password before saving.
        String hashedPassword = passwordEncoder.encode(request.password());

        // Step 3: Build and save the new user record
        UserEntity newUser = new UserEntity(
                UUID.randomUUID(), // unique ID for this user
                normalizedName, // display name from form
                normalizedEmail, // normalized email for stable lookups
                hashedPassword, // the BCrypt hash (NOT the plain password)
                Instant.now(), // timestamp of account creation
                true // account is active by default
        );
        userRepository.save(newUser); // INSERT into the users table

        // Step 3.5 (important): auto-login after signup.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        saveAuthentication(authentication, httpRequest, httpResponse);

        // Step 4: Return the user profile
        return new AuthResponse(toUserResponse(newUser));
    }

    // Authenticate an existing user (login).
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = normalizeEmail(request.email());

        // Step 1: Build an "unauthenticated" token from the submitted credentials.
        UsernamePasswordAuthenticationToken credentials = new UsernamePasswordAuthenticationToken(
                normalizedEmail, // the "username" (we use email)
                request.password() // plain-text password
        );

        // Step 2: Ask Spring Security to verify the credentials.
        Authentication authentication = authenticationManager.authenticate(credentials);

        // Step 3: Store the verified authentication in the SecurityContext and save it.
        saveAuthentication(authentication, httpRequest, httpResponse);

        // Step 4: Load the full user record to build our response
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException("User disappeared after authentication"));

        // Step 5: Return the user's profile (the session cookie handles "staying logged
        // in")
        return new AuthResponse(toUserResponse(user));
    }

    // Convert a UserEntity to a UserResponse DTO (safe to send over the network).
    public UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                user.getRole());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void saveAuthentication(
            Authentication authentication,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }
}
