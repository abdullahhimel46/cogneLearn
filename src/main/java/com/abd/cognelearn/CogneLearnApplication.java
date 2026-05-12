package com.abd.cognelearn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CogneLearnApplication — the entry point for the entire Spring Boot application.
 *
 * <p>When you run this class, Spring Boot:
 * <ol>
 *   <li>Scans all classes in the {@code com.abd.cognelearn} package for annotations
 *       like {@code @RestController}, {@code @Service}, {@code @Repository}, etc.</li>
 *   <li>Creates and connects ("wires") all those components automatically</li>
 *   <li>Starts an embedded Tomcat web server on the configured port (see {@code application.yml})</li>
 *   <li>Makes the application ready to receive HTTP requests</li>
 * </ol>
 *
 * <p>The {@code @SpringBootApplication} annotation is a shortcut for three annotations:
 * <ul>
 *   <li>{@code @Configuration} — this class can define Spring beans</li>
 *   <li>{@code @EnableAutoConfiguration} — Spring auto-configures database, security, etc.</li>
 *   <li>{@code @ComponentScan} — scan this package for components to register</li>
 * </ul>
 *
 * <p>To run: {@code ./gradlew bootRun} in the {@code server-spring/} directory.
 */
@SpringBootApplication
public class CogneLearnApplication {

    /**
     * Main method â€” standard Java entry point.
     *
     * @param args command-line arguments (passed to Spring; rarely used directly)
     */
    public static void main(String[] args) {
        SpringApplication.run(CogneLearnApplication.class, args);
        // Note: port is configurable via application.yml (server.port). Keep prints generic.
        // Use Unicode escapes to avoid Windows/IDE encoding issues (mojibake).
        System.out.println("\uD83D\uDE80 CogneLearn backend is running.");      // 🚀
        System.out.println("\uD83D\uDDC4\uFE0F  H2 Console: /h2-console");     // 🗄️
        System.out.println("\u2764\uFE0F  Health check: /health");             // ❤️
    }
}
