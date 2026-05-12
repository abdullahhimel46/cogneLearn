package com.abd.cognelearn.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HealthController â€” a simple health check endpoint.
 *
 * <p>Returns {@code { "status": "ok" }} when the server is running.
 *
 * <p>Maps to the initial check in the original {@code server/index.js}:
 * <pre>
 *   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 * </pre>
 *
 * <p>This endpoint is useful for:
 * <ul>
 *   <li>Checking that the server started correctly without logging in</li>
 *   <li>Load balancer or container health checks</li>
 *   <li>Monitoring scripts that need a simple ping endpoint</li>
 * </ul>
 *
 * <p>This endpoint is PUBLIC â€” no login required (configured in {@link com.cognelearn.config.SecurityConfig}).
 */
@RestController
public class HealthController {

    /**
     * Health check endpoint.
     *
     * <p>GET /health
     *
     * <p>Example response:
     * <pre>
     * { "status": "ok", "service": "cognelearn-api" }
     * </pre>
     *
     * @return 200 OK with a simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "cognelearn-api"
        ));
    }
}
