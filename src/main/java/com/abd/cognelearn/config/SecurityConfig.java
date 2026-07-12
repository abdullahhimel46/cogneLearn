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


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCryptPasswordEncoder with default strength (10 rounds) is the recommended
        // choice
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf
                        // Allow H2 console (which uses frames and basic auth)
                        .ignoringRequestMatchers("/h2-console/**")
                        // Allow our JSON API endpoints without CSRF token
                        // (browsers enforce Same-Origin for JSON fetches, so this is safe)
                        .ignoringRequestMatchers("/api/**"))

                // Step 2: Define who can access what
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
                                "/fragment/**",
                                "/public/**")
                        .permitAll()

                        // Allow health check and YouTube proxy without login
                        .requestMatchers("/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/proxy/**").permitAll()

                        // Allow Swagger UI and OpenAPI documentation
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui.html")
                        .permitAll()

                        // Allow only the public auth endpoints without an existing session.
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/signup",
                                "/api/v1/auth/login",
                                "/api/v1/auth/logout")
                        .permitAll()

                        // Allow H2 console for development
                        .requestMatchers("/h2-console/**").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Everything else REQUIRES a logged-in session
                        .anyRequest().authenticated())

                // Step 3: Session management
                // IF_REQUIRED = only create a session when needed
                // The session ID is automatically stored in a browser cookie (JSESSIONID)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // Step 4: Allow H2 console to render inside a frame
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

                // Step 5: Configure what happens after logout
                .logout(logout -> logout
                        // Our custom logout URL (POST to this to log out)
                        .logoutUrl("/api/v1/auth/logout")
                        // Spring automatically invalidates the session and clears cookies
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")

                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                        }));

        return http.build();
    }
}
