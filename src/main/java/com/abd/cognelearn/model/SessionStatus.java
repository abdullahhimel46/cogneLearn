package com.cognelearn.model;

/**
 * SessionStatus — the lifecycle states of a study session.
 *
 * <p>Maps to the string values used in the JavaScript {@code StudySession.js} module:
 * <pre>
 *   JS: session.status = 'active'    → Java: SessionStatus.ACTIVE
 *   JS: session.status = 'paused'    → Java: SessionStatus.PAUSED
 *   JS: session.status = 'completed' → Java: SessionStatus.COMPLETED
 * </pre>
 *
 * <p>The valid transitions are:
 * <pre>
 *   ACTIVE → PAUSED    (user clicks Pause)
 *   PAUSED → ACTIVE    (user clicks Resume)
 *   ACTIVE → COMPLETED (timer runs out or user clicks Stop)
 *   PAUSED → COMPLETED (user clicks Stop while paused)
 * </pre>
 *
 * <p>We use an enum instead of a plain String to prevent typos.
 * For example, if we wrote {@code session.setStatus("actvie")} (typo), the compiler would
 * NOT catch it. With an enum, {@code session.setStatus(SessionStatus.ACTIVE)} is type-safe.
 *
 * <p>In the database this is stored as the string name (e.g., "ACTIVE"), not as a number,
 * thanks to {@code @Enumerated(EnumType.STRING)} in {@link StudySessionEntity}.
 */
public enum SessionStatus {

    /**
     * The session is running — the timer is counting down and the video is playing.
     * Maps to JS: {@code 'active'}
     */
    ACTIVE,

    /**
     * The session is temporarily stopped — the timer and video are paused.
     * Maps to JS: {@code 'paused'}
     */
    PAUSED,

    /**
     * The session is finished — no further updates are allowed.
     * Maps to JS: {@code 'completed'}
     */
    COMPLETED
}
