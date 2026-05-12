package com.abd.cognelearn.model;

/**
 * SessionStatus â€” the lifecycle states of a study session.
 *
 * <p>Maps to the string values used in the JavaScript {@code StudySession.js} module:
 * <pre>
 *   JS: session.status = 'active'    â†’ Java: SessionStatus.ACTIVE
 *   JS: session.status = 'paused'    â†’ Java: SessionStatus.PAUSED
 *   JS: session.status = 'completed' â†’ Java: SessionStatus.COMPLETED
 * </pre>
 *
 * <p>The valid transitions are:
 * <pre>
 *   ACTIVE â†’ PAUSED    (user clicks Pause)
 *   PAUSED â†’ ACTIVE    (user clicks Resume)
 *   ACTIVE â†’ COMPLETED (timer runs out or user clicks Stop)
 *   PAUSED â†’ COMPLETED (user clicks Stop while paused)
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
     * The session is running â€” the timer is counting down and the video is playing.
     * Maps to JS: {@code 'active'}
     */
    ACTIVE,

    /**
     * The session is temporarily stopped â€” the timer and video are paused.
     * Maps to JS: {@code 'paused'}
     */
    PAUSED,

    /**
     * The session is finished â€” no further updates are allowed.
     * Maps to JS: {@code 'completed'}
     */
    COMPLETED
}
