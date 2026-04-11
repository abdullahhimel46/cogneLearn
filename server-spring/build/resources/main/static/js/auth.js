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
        if (!email || !password) {
            alert('Please fill in all fields');
            return false;
        }

        if (!this.validateEmail(email)) {
            alert('Please enter a valid email');
            return false;
        }

        const response = await Api.post('/api/v1/auth/login', {
            email: email,
            password: password
        });

        localStorage.setItem('cognelearn_token', response.token);
        localStorage.setItem('cognelearn_user', JSON.stringify(response.user));

        window.location.href = 'dashboard.html';
        return true;
    },

    /**
     * Signup user
     * @param {String} email
     * @param {String} password
     * @param {String} name
     */
    signup: async function(email, password, name) {
        if (!email || !password || !name) {
            alert('Please fill in all fields');
            return false;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return false;
        }

        if (!this.validateEmail(email)) {
            alert('Please enter a valid email');
            return false;
        }

        const response = await Api.post('/api/v1/auth/signup', {
            name: name,
            email: email,
            password: password
        });

        localStorage.setItem('cognelearn_token', response.token);
        localStorage.setItem('cognelearn_user', JSON.stringify(response.user));

        window.location.href = 'dashboard.html';
        return true;
    },

    /**
     * Logout user
     */
    logout: function() {
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
