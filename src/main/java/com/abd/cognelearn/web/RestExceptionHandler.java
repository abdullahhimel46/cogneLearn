package com.abd.cognelearn.web;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * RestExceptionHandler â€” a global error handler for ALL REST controllers.
 *
 * <p>{@code @RestControllerAdvice} means Spring intercepts every exception thrown in any
 * {@code @RestController} and lets us decide what HTTP response to send.
 * Without this, Spring would send back HTML error pages (not useful for an API).
 *
 * <p>This class replaces the old JavaScript try/catch blocks:
 * <pre>
 *   JS: catch (error) { alert(error.message); }
 *   Java: â†’ RestExceptionHandler sends a JSON error response instead
 * </pre>
 *
 * <p>Common HTTP status codes:
 * <ul>
 *   <li>200 OK â€” success</li>
 *   <li>201 Created â€” resource successfully created</li>
 *   <li>204 No Content â€” success, nothing to return (e.g., after DELETE)</li>
 *   <li>400 Bad Request â€” the client sent invalid data</li>
 *   <li>401 Unauthorized â€” the client is NOT logged in</li>
 *   <li>403 Forbidden â€” the client IS logged in but doesn't have permission</li>
 *   <li>404 Not Found â€” the requested resource doesn't exist</li>
 *   <li>500 Internal Server Error â€” something unexpected went wrong on the server</li>
 * </ul>
 */
@RestControllerAdvice
public class RestExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    /**
     * Handle illegal argument errors (e.g., "Playlist not found", "Email already exists").
     *
     * <p>These are thrown explicitly in our service classes when the data is correct in format
     * but wrong in values (e.g., a valid UUID that doesn't exist in the database).
     *
     * @param ex the exception thrown in the service or controller
     * @return 400 Bad Request with the error message
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        // 400 Bad Request â€” the client sent something logically wrong
        return ResponseEntity
                .badRequest()
                .body(new ApiError(ex.getMessage(), Instant.now()));
    }

    /**
     * Handle unexpected server-side errors (e.g., "User disappeared after authentication").
     *
     * <p>These are thrown when something unexpected happens on the server side
     * that is NOT the client's fault.
     *
     * @param ex the exception thrown in the service
     * @return 400 Bad Request or 401 Unauthorized, depending on the message
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(IllegalStateException ex) {
        // Check if this is an "Unauthorized" type of error (session expired, etc.)
        boolean isUnauthorized = ex.getMessage() != null &&
                ex.getMessage().toLowerCase().contains("unauthorized");

        HttpStatus status = isUnauthorized ? HttpStatus.UNAUTHORIZED : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity
                .status(status)
                .body(new ApiError(ex.getMessage(), Instant.now()));
    }

    /**
     * Handle Spring Security authentication failures (wrong password, account not found).
     *
     * <p>Maps to JS: {@code if (!Auth.login(email, password)) { alert("Invalid credentials"); }}
     * Spring Security throws this automatically when login fails.
     *
     * @param ex the authentication exception from Spring Security
     * @return 401 Unauthorized with a generic "Invalid credentials" message
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ApiError("You do not have permission to perform this action.", Instant.now()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException ex) {
        // Keep login failures generic, but return a clearer message for missing sessions.
        String message = ex instanceof BadCredentialsException
                ? "Invalid email or password."
                : "Authentication required.";

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError(message, Instant.now()));
    }

    /**
     * Handle validation errors from {@code @Valid} on request bodies.
     *
     * <p>When a field fails validation (e.g., email is blank, password too short),
     * Spring throws this exception. We collect all field errors into one message.
     *
     * <p>Maps to JS: form validation like:
     * {@code if (!email) alert("Email is required")}
     *
     * @param ex the validation exception with field-level errors
     * @return 400 Bad Request with all validation error messages joined together
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        // Collect all field error messages into one readable string
        // e.g. "Email is required; Password must be at least 6 characters"
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));

        return ResponseEntity
                .badRequest()
                .body(new ApiError(message.isBlank() ? "Validation failed" : message, Instant.now()));
    }

    /**
     * Handle constraint violations from {@code @Validated} or path variable validation.
     *
     * @param ex the constraint violation exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations()
                .stream()
                .map(v -> v.getMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity
                .badRequest()
                .body(new ApiError(message.isBlank() ? "Validation failed" : message, Instant.now()));
    }

    /**
     * Handle missing required query parameters in URLs.
     *
     * <p>Example: calling {@code /api/v1/proxy/playlist} without {@code ?playlistId=} returns
     * a helpful error instead of a generic 400.
     *
     * @param ex the missing parameter exception
     * @return 400 Bad Request with a descriptive message
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException ex) {
        String message = "Required query parameter '" + ex.getParameterName() + "' is missing.";
        return ResponseEntity
                .badRequest()
                .body(new ApiError(message, Instant.now()));
    }

    /**
     * Handle missing static resources (e.g., favicon.ico, wrong page path) as 404.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFound(NoResourceFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiError("Resource not found.", Instant.now()));
    }

    /**
     * Catch-all handler for any other unexpected exceptions.
     *
     * <p>This prevents stack traces from leaking to the API client.
     * Instead, we log the error internally (future work) and return a generic 500 message.
     *
     * @param ex any unhandled exception
     * @return 500 Internal Server Error with a generic message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        if (ex.getClass().getName().contains("ClientAbortException")) {
            log.warn("Client aborted connection: {}", ex.getMessage());
            return null;
        }

        log.error("Unhandled exception. authPrincipal={}",
                SecurityContextHolder.getContext().getAuthentication() == null
                        ? "none"
                        : SecurityContextHolder.getContext().getAuthentication().getPrincipal(),
                ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("An unexpected error occurred. Please try again.", Instant.now()));
    }
}
