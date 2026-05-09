package com.cognelearn.service;

import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * CurrentUserService — a helper that tells you "who is currently logged in?"
 *
 * <p>Maps to the old JavaScript {@code User.getCurrentUser()} method:
 * <pre>
 *   JS:   const user = JSON.parse(localStorage.getItem('cognelearn_user'));
 *   Java: UserEntity user = currentUserService.requireUser();
 * </pre>
 *
 * <p>With session-based auth, Spring Security automatically keeps track of the
 * logged-in user in the {@link SecurityContextHolder}. This service reads from
 * there and loads the full user record from the database.
 *
 * <p>Every controller that needs to know "whose data is this request about?"
 * should inject this service and call {@link #requireUser()}.
 */
@Service
public class CurrentUserService {

    // We need the repository to fetch the full UserEntity from the database
    private final UserRepository userRepository;

    /**
     * Constructor — Spring injects the UserRepository automatically.
     *
     * @param userRepository the JPA repository for fetching user records
     */
    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Return the currently logged-in user, or throw an exception if nobody is logged in.
     *
     * <p>How this works with session auth:
     * <ol>
     *   <li>The browser sends the JSESSIONID cookie with every request</li>
     *   <li>Spring Security middleware reads the cookie, finds the session, and puts the
     *       {@link Authentication} object into {@link SecurityContextHolder}</li>
     *   <li>We read the Authentication here — the principal is the user's EMAIL
     *       (the same value returned by {@code UserDetails.getUsername()})</li>
     *   <li>We look up the full {@link UserEntity} from our database using that email</li>
     * </ol>
     *
     * @return the logged-in {@link UserEntity}
     * @throws IllegalStateException if no valid session / authentication is present
     */
    public UserEntity requireUser() {
        // Step 1: Read the current authentication from Spring Security's thread-local holder.
        // This is populated automatically for every request when a valid session cookie exists.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Step 2: Make sure we actually have an authenticated user (not just an anonymous visitor)
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required.");
        }

        // Step 3: The principal is typically a UserDetails object (created by our UserDetailsService).
        // We cast it and extract the username (which we use as the email).
        Object principal = auth.getPrincipal();
        String email;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            // In some auth flows (like JWT or manual auth), it might just be the string username
            email = principal.toString();
        }

        // Step 4: Load the full user record from the database.
        // orElseThrow handles the (extremely rare) case where a session is valid but the
        // user was deleted from the database after they logged in.
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Session references a user that no longer exists: " + email
                ));
    }
}
