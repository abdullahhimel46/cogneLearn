// Utility Functions
const Utils = {
    // Format focus time in hours and minutes
    formatFocusTime: function(minutes) {
        if (minutes < 60) {
            return minutes + 'm';
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours + 'h ' + (mins > 0 ? mins + 'm' : '');
    },

    // Format date
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format time
    formatTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Generate UUID
    generateId: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Validate email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Debounce function
    debounce: function(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Local storage helpers
    localStorage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('localStorage.setItem error:', error);
            }
        },

        get: function(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('localStorage.getItem error:', error);
                return null;
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('localStorage.removeItem error:', error);
            }
        },

        clear: function() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('localStorage.clear error:', error);
            }
        }
    }
};

// REST API helper
const Api = {
    baseUrl: '',

    // Session-based auth (Spring Security): the browser sends the JSESSIONID cookie.
    // No token is used.

    request: async function(path, options = {}) {
        const headers = Object.assign({}, options.headers || {});
        headers['Content-Type'] = 'application/json';

        const response = await fetch(this.baseUrl + path, {
            // Ensure cookies (JSESSIONID) are sent for same-origin requests.
            credentials: 'same-origin',
            ...options,
            headers
        });

        if (response.status === 204) {
            return null;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = data && data.message ? data.message : 'Request failed';
            const error = new Error(message);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    },
    get: function(path) {
        return this.request(path, { method: 'GET' });
    },
    post: function(path, body) {
        return this.request(path, { method: 'POST', body: JSON.stringify(body) });
    },
    patch: function(path, body) {
        return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
    },
    delete: function(path) {
        return this.request(path, { method: 'DELETE' });
    }
};
