// Pomodoro Timer Module
const Pomodoro = {
    // Timer states
    WORK_TIME: 25 * 60, // 25 minutes
    BREAK_TIME: 5 * 60, // 5 minutes
    LONG_BREAK_TIME: 15 * 60, // 15 minutes

    // Current state
    state: {
        timeLeft: 25 * 60,
        isRunning: false,
        isWorkTime: true,
        sessionsCompleted: 0,
        timerInterval: null
    },

    // Initialize timer
    init: function() {
        this.state.timeLeft = this.WORK_TIME;
    },

    // Start timer
    start: function(onTick, onComplete) {
        if (this.state.isRunning) return;

        this.state.isRunning = true;

        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;

            // Call tick callback
            if (onTick) {
                onTick(this.state.timeLeft, this.state.isWorkTime);
            }

            // Check if time is up
            if (this.state.timeLeft <= 0) {
                this.complete(onComplete);
            }
        }, 1000);
    },

    // Pause timer
    pause: function() {
        if (!this.state.isRunning) return;

        this.state.isRunning = false;
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    // Reset timer
    reset: function() {
        this.pause();
        this.state.timeLeft = this.state.isWorkTime ? this.WORK_TIME : this.BREAK_TIME;
    },

    // Complete current session
    complete: function(onComplete) {
        this.pause();

        if (this.state.isWorkTime) {
            this.state.sessionsCompleted++;
            
            // Determine break type
            if (this.state.sessionsCompleted % 4 === 0) {
                // Long break after 4 sessions
                this.state.timeLeft = this.LONG_BREAK_TIME;
            } else {
                // Short break
                this.state.timeLeft = this.BREAK_TIME;
            }
        } else {
            // Back to work time
            this.state.timeLeft = this.WORK_TIME;
        }

        this.state.isWorkTime = !this.state.isWorkTime;

        if (onComplete) {
            onComplete(this.state.isWorkTime, this.state.sessionsCompleted);
        }
    },

    // Get formatted time string
    getFormattedTime: function() {
        const mins = Math.floor(this.state.timeLeft / 60);
        const secs = this.state.timeLeft % 60;
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    },

    // Get status
    getStatus: function() {
        if (this.state.isWorkTime) {
            return 'Focus Time - Keep going!';
        } else {
            return 'Break Time - Relax and recharge!';
        }
    },

    // Get sessions completed
    getSessionsCompleted: function() {
        return this.state.sessionsCompleted;
    }
};

// Initialize on load
Pomodoro.init();
