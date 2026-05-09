package com.cognelearn.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * UserEntity — represents a registered user in the database.
 *
 * <p>Maps to the JavaScript {@code User.js} module. In the old JS version, users
 * were stored directly in {@code localStorage}. Here, they are stored in the
 * {@code users} database table.
 *
 * <p>The {@code @Entity} annotation tells JPA (Java Persistence API) that this class
 * is a database table. JPA will automatically create and manage the table for us.
 *
 * <p>Database table: {@code users}
 *
 * <pre>
 * JS equivalent:
 *   const user = { userId, name, email, password, createdAt };
 *   localStorage.setItem('cognelearn_user', JSON.stringify(user));
 * </pre>
 */
@Entity                        // Marks this class as a JPA-managed database table
@Table(name = "users")         // The actual table name in the database
public class UserEntity {

    /**
     * Primary key — uniquely identifies each user.
     *
     * <p>We use UUID (Universally Unique Identifier) instead of auto-incrementing numbers.
     * UUIDs look like "550e8400-e29b-41d4-a716-446655440000" and are generated randomly,
     * making them harder to guess than sequential IDs (better security).
     *
     * <p>{@code @Id} tells JPA this is the primary key column.
     */
    @Id
    private UUID id;

    /**
     * The user's display name (e.g., "Jane Smith").
     *
     * <p>{@code nullable = false} means this column cannot be left empty in the database.
     * If we try to save a User without a name, JPA will throw an error.
     */
    @Column(nullable = false)
    private String name;

    /**
     * The user's email address — also used as their login username.
     *
     * <p>{@code unique = true} ensures no two users can have the same email.
     * This is enforced at the database level, not just in our Java code.
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * The BCrypt-hashed password. NEVER store plain-text passwords!
     *
     * <p>BCrypt transforms "mypassword" into something like "$2a$10$abc..." — a one-way hash.
     * You can never reverse it. To check a password, you hash it again and compare hashes.
     */
    @Column(nullable = false)
    private String passwordHash;

    /**
     * The UTC timestamp when this account was created.
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Whether the account is active or disabled.
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    /**
     * No-argument constructor required by JPA.
     * JPA uses this to reconstruct objects from database rows.
     * You shouldn't call this directly in your code — use the other constructor.
     */
    public UserEntity() {
    }

    /**
     * Full constructor for creating a new user.
     *
     * @param id           a new random UUID (use {@code UUID.randomUUID()})
     * @param name         the user's display name
     * @param email        the user's email (lowercased before storing)
     * @param passwordHash the BCrypt-hashed password (never the plain-text one)
     * @param createdAt    the current time (use {@code Instant.now()})
     */
    public UserEntity(UUID id, String name, String email, String passwordHash, Instant createdAt, boolean active) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.active = active;
    }

    // ── Getters and Setters ───────────────────────────────────────────────────
    // Getters let other classes READ the fields.
    // Setters let other classes UPDATE the fields.
    // JPA also needs these to load data from the database back into objects.

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
