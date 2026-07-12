package com.abd.cognelearn.service;

import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

// CurrentUserService a helper that tells you "who is currently logged in?"

@Service
public class CurrentUserService {

    // We need the repository to fetch the full UserEntity from the database
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Return the currently logged-in user, or throw an exception if nobody is
    // logged in.
    public UserEntity requireUser() {
        // Step 1: Read the current authentication from Spring Security's thread-local
        // holder.
        // This is populated automatically for every request when a valid session cookie
        // exists.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Step 2: Make sure we actually have an authenticated user (not just an
        // anonymous visitor)
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required.");
        }

        // Step 3: The principal is typically a UserDetails object (created by our
        // UserDetailsService).
        // We cast it and extract the username (which we use as the email).
        Object principal = auth.getPrincipal();
        String email;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {

            email = principal.toString();
        }

        // Step 4: Load the full user record from the database.
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Session references a user that no longer exists: " + email));
    }
}
