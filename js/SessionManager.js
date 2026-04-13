/**
 * SessionManager — Single source of truth for active focus sessions.
 * Handles save / load / resume / complete lifecycle.
 */
const SessionManager = {
    KEY: 'cognelearn_active_session',

    /**
     * Get the stored active session object (or null).
     * Handles corrupted JSON gracefully.
     */
    get: function () {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || null;
        } catch {
            this.clear();
            return null;
        }
    },

    /**
     * Returns true only if a session is stored AND its status is "active"
     * AND it has not expired (elapsedTime < duration * 60).
     */
    hasActive: function () {
        const s = this.get();
        if (!s || s.status !== 'active') return false;
        // Auto-expire: if real time elapsed > total duration (all cycles)
        const totalSeconds = (s.duration || 25) * (s.cycles || 1) * 60;
        const elapsed = Math.floor((Date.now() - (s.startedAt || Date.now())) / 1000);
        if (elapsed >= totalSeconds) {
            this.complete();
            return false;
        }
        return true;
    },

    /**
     * Save / start a new active session.
     * @param {string} playlistId
     * @param {number} duration   – minutes per cycle
     * @param {number} cycles
     */
    start: function (playlistId, duration, cycles) {
        const session = {
            playlistId,
            duration,
            cycles,
            currentCycle: 1,
            startedAt: Date.now(),
            status: 'active'
        };
        localStorage.setItem(this.KEY, JSON.stringify(session));
        return session;
    },

    /**
     * Mark the session as completed (Continue button disappears).
     */
    complete: function () {
        const s = this.get();
        if (s) {
            s.status = 'completed';
            localStorage.setItem(this.KEY, JSON.stringify(s));
        }
    },

    /**
     * Remove the session entirely.
     */
    clear: function () {
        localStorage.removeItem(this.KEY);
    },

    /**
     * How many seconds have elapsed since the session started.
     */
    elapsedSeconds: function () {
        const s = this.get();
        if (!s || !s.startedAt) return 0;
        return Math.floor((Date.now() - s.startedAt) / 1000);
    },

    /**
     * Remaining seconds in the CURRENT cycle.
     */
    remainingSeconds: function () {
        const s = this.get();
        if (!s) return 0;
        const cycleSeconds = (s.duration || 25) * 60;
        const totalElapsed = this.elapsedSeconds();
        const cycleElapsed = totalElapsed % cycleSeconds;
        return Math.max(0, cycleSeconds - cycleElapsed);
    },

    /**
     * Which cycle are we on (1-based).
     */
    currentCycle: function () {
        const s = this.get();
        if (!s) return 1;
        const cycleSeconds = (s.duration || 25) * 60;
        const totalElapsed = this.elapsedSeconds();
        return Math.min(s.cycles || 1, Math.floor(totalElapsed / cycleSeconds) + 1);
    }
};
