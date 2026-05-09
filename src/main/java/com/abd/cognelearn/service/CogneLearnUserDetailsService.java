package com.cognelearn.service;

import com.cognelearn.model.UserEntity;
import com.cognelearn.repository.UserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * CogneLearnUserDetailsService — bridges Spring Security and our database.
 *
 * <p>Spring Security does NOT know how to load users from our database by default.
 * It needs us to provide an implementation of {@link UserDetailsService} that tells it
 * "given an email/username, find the matching user and return their details."
 *
 * <p>This service is called automatically by Spring Security during login to:
 * <ol>
 *   <li>Load the user record from the DB by email</li>
 *   <li>Return a {@link UserDetails} object containing the email and hashed password</li>
 *   <li>Spring Security then compares the supplied password with the stored hash</li>
 * </ol>
 *
 * <p>We use this service in {@link com.cognelearn.config.SecurityConfig#authenticationProvider()}
 * to connect the authentication provider to our database.
 */
@Service
public class CogneLearnUserDetailsService implements UserDetailsService {

    // We need the UserRepository so we can look up users in the database
    private final UserRepository userRepository;

    /**
     * Constructor injection — Spring automatically provides the UserRepository bean.
     *
     * @param userRepository the JPA repository for loading user records
     */
    public CogneLearnUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load a user by their email address (we use email as the "username").
     *
     * <p>Spring Security calls this method every time someone tries to log in.
     * We find the user in our DB and wrap their data in a {@link UserDetails} object
     * so Spring Security can verify their password.
     *
     * @param email the email address entered on the login form
     * @return a UserDetails object containing the user's email and hashed password
     * @throws UsernameNotFoundException if no user exists with the given email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

        // Step 1: Try to find the user in the database using their email
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() ->
                    // Step 2: If not found, throw this standard Spring Security exception
                    // NOTE: Spring Security will catch this and show "Bad credentials" — never
                    // reveal whether the email or the password was wrong (security best practice)
                    new UsernameNotFoundException("No account found with email: " + normalizedEmail)
                );

        // Step 3: Wrap the user's login details in Spring Security's UserDetails format.
        // We provide:
        //   - username = email (what the user types to identify themselves)
        //   - password = the HASHED password stored in our DB (never the plain-text one)
        //   - roles/authorities = empty list (we don't use roles in this app yet)
        return User.builder()
                .username(user.getEmail())       // Spring Security uses this as the principal name
                .password(user.getPasswordHash()) // The BCrypt hash — Spring will compare it for us
                .roles("USER")                    // Basic role, required by Spring Security
                .build();
    }
}
