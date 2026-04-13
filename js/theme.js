/**
 * ============================================================
 * ThemeManager — Shared Light / Dark Theme Controller
 * ============================================================
 * Usage: include this script FIRST in every page's <head>.
 * It applies the saved theme instantly (no flash) and exposes
 * ThemeManager.toggle() / ThemeManager.get().
 * ============================================================
 */
(function () {
    const STORAGE_KEY = 'cognelearn_theme';
    const DARK  = 'dark';
    const LIGHT = 'light';

    function get() {
        return localStorage.getItem(STORAGE_KEY) || DARK;
    }

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Update all toggle buttons on the page
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
            const icon = btn.querySelector('.theme-icon');
            if (icon) icon.textContent = theme === DARK ? '☀️' : '🌙';
        });
    }

    function toggle() {
        apply(get() === DARK ? LIGHT : DARK);
    }

    // Apply immediately (before DOM paint) to prevent flash
    apply(get());

    window.ThemeManager = { get, apply, toggle };
})();
