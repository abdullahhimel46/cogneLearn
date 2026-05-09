/**
 * Authentication Module - Handles user login/signup (UML-aligned)
 */
const Auth = {
    /**
     * Login user
     * @param {String} email
     * @param {String} password
     */
    login: async function(email, password) {
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            alert('Please fill in all fields');
            return false;
        }

        if (!this.validateEmail(normalizedEmail)) {
            alert('Please enter a valid email');
            return false;
        }

        // Hardcoded admin login logic
        if (normalizedEmail === 'admin@email.com' && password === '123456') {
            const adminUser = {
                id: 0,
                name: 'System Admin',
                email: 'admin@email.com',
                role: 'ADMIN'
            };
            localStorage.setItem('cognelearn_user', JSON.stringify(adminUser));
            window.location.href = 'admin.html';
            return true;
        }

        try {
            const response = await Api.post('/api/v1/auth/login', {
                email: normalizedEmail,
                password: password
            });

            // Session-based auth: Spring sets a JSESSIONID cookie. We only cache the user for UI.
            localStorage.setItem('cognelearn_user', JSON.stringify(response.user));

            if (normalizedEmail === 'admin@email.com') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            return true;
        } catch (error) {
            alert(error && error.message ? error.message : 'Login failed. Please try again.');
            return false;
        }
    },

    /**
     * Signup user
     * @param {String} email
     * @param {String} password
     * @param {String} name
     */
    signup: async function(email, password, name) {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedName = (name || '').trim();

        if (!normalizedEmail || !password || !normalizedName) {
            alert('Please fill in all fields');
            return false;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return false;
        }

        if (!this.validateEmail(normalizedEmail)) {
            alert('Please enter a valid email');
            return false;
        }

        try {
            const response = await Api.post('/api/v1/auth/signup', {
                name: normalizedName,
                email: normalizedEmail,
                password: password
            });

            // Backend auto-logs in after signup (session cookie). Cache user for UI.
            localStorage.setItem('cognelearn_user', JSON.stringify(response.user));

            window.location.href = 'dashboard.html';
            return true;
        } catch (error) {
            alert(error && error.message ? error.message : 'Signup failed. Please try again.');
            return false;
        }
    },

    /**
     * Logout user
     */
    logout: async function() {
        try {
            // Invalidate the server-side session and clear JSESSIONID cookie.
            await Api.post('/api/v1/auth/logout', {});
        } catch (e) {
            // Ignore network/logout errors; still clear client cache.
        }
        User.logout();
        window.location.href = '../index.html';
    },

    /**
     * Check if user is logged in
     * @returns {Boolean}
     */
    isLoggedIn: function() {
        return User.isLoggedIn();
    },

    /**
     * Get current user
     * @returns {Object|null}
     */
    getCurrentUser: function() {
        return User.getCurrentUser();
    },

    /**
     * Validate email format
     * @param {String} email
     * @returns {Boolean}
     */
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};
