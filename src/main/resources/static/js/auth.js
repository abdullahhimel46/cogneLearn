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

        try {
            const response = await Api.post('/api/v1/auth/login', {
                email: normalizedEmail,
                password: password
            });

            localStorage.setItem('cognelearn_user', JSON.stringify(response.user));
            if (response.user && response.user.id && window.LocalDB) {
                LocalDB.setUserScope(response.user.id);
                localStorage.setItem('cognelearn_scoped_user_id', String(response.user.id));
            }

            if (response.user && response.user.role === 'ADMIN') {
                window.location.href = '/pages/admin/dashboard.html';
            } else {
                window.location.href = '/pages/user/dashboard.html';
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

            localStorage.setItem('cognelearn_user', JSON.stringify(response.user));
            if (response.user && response.user.id && window.LocalDB) {
                LocalDB.setUserScope(response.user.id);
                localStorage.setItem('cognelearn_scoped_user_id', String(response.user.id));
            }

            window.location.href = '/pages/user/dashboard.html';
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
            await Api.post('/api/v1/auth/logout', {});
        } catch (e) {
            // Still clear client state even if the network call fails.
        }
        User.logout();
        if (window.LocalDB) {
            LocalDB.setUserScope(null);
        }
        localStorage.removeItem('cognelearn_scoped_user_id');
        const onAdmin = window.location.pathname.includes('/pages/admin/');
        const onAuth = window.location.pathname.includes('/pages/auth/');
        const onPages = window.location.pathname.includes('/pages/');
        let redirectUrl = 'pages/auth/login.html';
        if (onAdmin) {
            redirectUrl = '../auth/login.html';
        } else if (onAuth) {
            redirectUrl = 'login.html';
        } else if (onPages) {
            redirectUrl = 'auth/login.html';
        }
        window.location.replace(redirectUrl);
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
