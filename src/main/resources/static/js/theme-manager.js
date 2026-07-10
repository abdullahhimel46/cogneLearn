window.ThemeManager = {
    initTheme: function() {
        const themeKey = "cognelearn_dashboard_theme";
        const themeClass = "dashboard-theme-dark";
        const currentTheme = localStorage.getItem(themeKey);
        if (currentTheme === "dark") {
            document.body.classList.add(themeClass);
        } else {
            document.body.classList.remove(themeClass);
        }
    },
    
    bootstrap: function(container) {
        const themeToggle = container ? container.querySelector('#themeToggle') : document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const themeKey = "cognelearn_dashboard_theme";
        const themeClass = "dashboard-theme-dark";
        const currentTheme = localStorage.getItem(themeKey);
        const isDark = currentTheme === "dark";
        
        themeToggle.setAttribute('aria-pressed', String(isDark));
        
        // Clone and replace to clean up any pre-existing listeners
        const newToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newToggle, themeToggle);
        
        newToggle.addEventListener('click', function(e) {
            if (e) e.preventDefault();
            const nowDark = document.body.classList.toggle(themeClass);
            localStorage.setItem(themeKey, nowDark ? "dark" : "light");
            newToggle.setAttribute('aria-pressed', String(nowDark));
            
            window.dispatchEvent(new CustomEvent('cognelearn:theme-changed', { detail: { isDark: nowDark } }));
        });
    }
};

// Run instantly to prevent flash of unstyled content
window.ThemeManager.initTheme();
