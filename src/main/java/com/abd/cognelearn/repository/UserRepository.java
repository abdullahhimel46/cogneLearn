package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserRepository â€” handles all database operations for {@link UserEntity}.
 *
 * <p>By extending {@link JpaRepository}, Spring Data JPA automatically provides:
 * <ul>
 *   <li>{@code save(user)} â€” INSERT or UPDATE a user row</li>
 *   <li>{@code findById(id)} â€” SELECT a user by primary key</li>
 *   <li>{@code findAll()} â€” SELECT all users</li>
 *   <li>{@code delete(user)} â€” DELETE a user row</li>
 *   <li>{@code count()} â€” COUNT total users</li>
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

    /**
     * Backfill any rows that still have a NULL role (left over from the DDL migration)
     * to the default value 'USER'.
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserEntity u SET u.role = 'USER' WHERE u.role IS NULL OR u.role = ''")
    int fixNullRoles();

    /**
     * Directly set a role for a specific user by email (case-insensitive).
     * Used by DataInitializer to ensure the admin account always has ROLE_ADMIN.
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserEntity u SET u.role = :role WHERE LOWER(u.email) = LOWER(:email)")
    int setRoleByEmail(@Param("email") String email, @Param("role") String role);
}
