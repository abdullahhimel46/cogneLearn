package com.abd.cognelearn.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;

/**
 * SecurityConfig â€” tells Spring Security HOW to protect the application.
 *
 * <p>We use the simplest possible approach for beginners:
 * <ul>
 *   <li>BCrypt to hash passwords (industry-standard, one-way hash)</li>
 *   <li>HTTP Session to remember who is logged in (like a cookie-based login)</li>
 *   <li>No JWT â€” the server stores the login state, not the client</li>
 * </ul>
 *
 * <p>How session auth works (compared to the old JS approach):
 * <pre>
 *   JS (old):  localStorage stores user object â†’ anyone who reads localStorage = logged in
 *   Java (new): user logs in â†’ server creates a session ID â†’ browser stores it as a cookie
 *               â†’ every future request sends the cookie â†’ server looks up who that is
 * </pre>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * PasswordEncoder Bean â€” defines HOW passwords are hashed before storing.
     *
     * <p>BCrypt automatically:
     * <ul>
     *   <li>Adds a random "salt" so two identical passwords produce different hashes</li>
     *   <li>Uses a slow hashing algorithm (makes brute-force attacks very expensive)</li>
     * </ul>
     *
     * @return a BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCryptPasswordEncoder with default strength (10 rounds) is the recommended choice
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager Bean â€” the central authenticator.
     *
     * <p>We expose this as a Bean so that our AuthService can call
     * {@code authenticationManager.authenticate(...)} directly during login.
     *
     * @param config the auto-configured AuthenticationConfiguration from Spring
     * @return the AuthenticationManager
     * @throws Exception if configuration fails
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * SecurityFilterChain Bean â€” the main security rulebook.
     *
     * <p>This method answers three questions:
     * <ol>
     *   <li>Which URLs are public (no login needed)?</li>
     *   <li>Which URLs are protected (login required)?</li>
     *   <li>How does login and logout work?</li>
     * </ol>
     *
     * @param http the HttpSecurity builder provided by Spring
     * @return the built SecurityFilterChain
     * @throws Exception if security configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // â”€â”€ Step 1: CSRF protection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            // CSRF = Cross-Site Request Forgery. For a REST API consumed by our
            // own frontend we keep it enabled for form POSTs (Spring's default).
            // We only disable it for pure JSON API endpoints via the matcher below.
            .csrf(csrf -> csrf
                // Allow H2 console (which uses frames and basic auth)
                .ignoringRequestMatchers("/h2-console/**")
                // Allow our JSON API endpoints without CSRF token
                // (browsers enforce Same-Origin for JSON fetches, so this is safe)
                .ignoringRequestMatchers("/api/**")
            )

            // â”€â”€ Step 2: Define who can access what â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            .authorizeHttpRequests(auth -> auth
                // Allow all standard static resources (CSS, JS, images, etc.)
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

                // Allow our custom static file paths served by Spring Boot
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/pages/**",
                    "/css/**",
                    "/js/**",
                    "/public/**"
                ).permitAll()

                // Allow health check and YouTube proxy without login
                .requestMatchers("/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/proxy/**").permitAll()

                // Allow only the public auth endpoints without an existing session.
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup", "/api/v1/auth/login", "/api/v1/auth/logout")
                .permitAll()

                // Allow H2 console for development
                .requestMatchers("/h2-console/**").permitAll()

                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Everything else REQUIRES a logged-in session
                .anyRequest().authenticated()
            )

            // â”€â”€ Step 3: Session management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            // IF_REQUIRED = only create a session when needed (default, best for us)
            // The session ID is automatically stored in a browser cookie (JSESSIONID)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // â”€â”€ Step 4: Allow H2 console to render inside a frame â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

            // â”€â”€ Step 5: Configure what happens after logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            .logout(logout -> logout
                // Our custom logout URL (POST to this to log out)
                .logoutUrl("/api/v1/auth/logout")
                // Spring automatically invalidates the session and clears cookies
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                // Return 200 OK (not a redirect) since we're a REST API
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(200);
                })
            );

        return http.build();
    }
}
