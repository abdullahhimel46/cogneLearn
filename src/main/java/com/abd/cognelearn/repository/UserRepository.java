package com.cognelearn.repository;

import com.cognelearn.model.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * UserRepository — handles all database operations for {@link UserEntity}.
 *
 * <p>By extending {@link JpaRepository}, Spring Data JPA automatically provides:
 * <ul>
 *   <li>{@code save(user)} — INSERT or UPDATE a user row</li>
 *   <li>{@code findById(id)} — SELECT a user by primary key</li>
 *   <li>{@code findAll()} — SELECT all users</li>
 *   <li>{@code delete(user)} — DELETE a user row</li>
 *   <li>{@code count()} — COUNT total users</li>
 *   <li>...and many more standard operations</li>
 * </ul>
 *
 * <p>We don't write SQL manually. Spring Data generates the database queries
 * automatically from the method names we declare below.
 *
 * <p>Maps to JS: {@code localStorage.getItem('cognelearn_user')} lookups.
 */
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    /**
     * Find a user by their email address, ignoring case differences.
     *
     * <p>Spring Data reads the method name and generates:
     * {@code SELECT * FROM users WHERE LOWER(email) = LOWER(?)}
     *
     * <p>We return {@code Optional<UserEntity>} because the user might not exist.
     * The caller must handle both the "found" and "not found" cases.
     *
     * <p>Maps to JS: {@code User.create()} checks if the email already exists.
     *
     * @param email the email to search for (case-insensitive)
     * @return an Optional containing the user if found, or empty if not found
     */
    Optional<UserEntity> findByEmailIgnoreCase(String email);

    /**
     * Check if a user with the given email already exists.
     *
     * <p>Spring Data generates: {@code SELECT COUNT(*) > 0 FROM users WHERE LOWER(email) = LOWER(?)}
     *
     * <p>Use this before signup to reject duplicate email registrations.
     * More efficient than {@code findByEmailIgnoreCase} when you only need a yes/no answer.
     *
     * @param email the email to check
     * @return {@code true} if an account with this email exists, {@code false} otherwise
     */
    boolean existsByEmailIgnoreCase(String email);
}
