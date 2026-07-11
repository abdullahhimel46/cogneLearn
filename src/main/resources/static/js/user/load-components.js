async function loadComponents() {
    // 1. Determine level depth prefix
    const pathname = window.location.pathname;
    const cleanPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    const segments = cleanPath.split('/');
    if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
        segments.pop();
    }
    const depth = segments.filter(Boolean).length;
    const prefix = '../'.repeat(depth);

    // 2. Load sidebar if container exists
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        try {
            const sidebarRes = await fetch(prefix + 'fragment/user-sidebar.html');
            const sidebarHtml = await sidebarRes.text();
            sidebarContainer.innerHTML = sidebarHtml;

            // 2a. Inject mobile menu toggle button dynamically
            const mobileHeader = document.querySelector('.mobile-header');
            if (mobileHeader && !mobileHeader.querySelector('.mobile-menu-btn')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'mobile-menu-btn drawer-toggle-btn';
                toggleBtn.id = 'mobileMenuToggle';
                toggleBtn.type = 'button';
                toggleBtn.setAttribute('aria-label', 'Toggle menu');
                toggleBtn.innerHTML = '<span></span><span></span><span></span>';
                mobileHeader.appendChild(toggleBtn);

                const sidebar = document.getElementById('appSidebar');
                const overlay = document.getElementById('appOverlay');

                const openMobileSidebar = () => {
                    if (sidebar) sidebar.classList.add('is-open');
                    if (overlay) overlay.classList.add('is-visible');
                    document.body.classList.add('mobile-sidebar-open');
                };

                const closeMobileSidebar = () => {
                    if (sidebar) sidebar.classList.remove('is-open');
                    if (overlay) overlay.classList.remove('is-visible');
                    document.body.classList.remove('mobile-sidebar-open');
                };

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (sidebar && sidebar.classList.contains('is-open')) {
                        closeMobileSidebar();
                    } else {
                        openMobileSidebar();
                    }
                });

                if (overlay) {
                    overlay.addEventListener('click', closeMobileSidebar);
                }

                // Also bind close button inside the sidebar
                setTimeout(() => {
                    const menuToggleInside = document.getElementById('menuToggle');
                    if (menuToggleInside) {
                        menuToggleInside.addEventListener('click', (e) => {
                            if (window.innerWidth <= 960) {
                                e.stopPropagation();
                                closeMobileSidebar();
                            }
                        });
                    }
                }, 100);
            }


            // Execute scripts inside sidebar
            const scripts = sidebarContainer.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
            });

            // Load theme toggle component
            const themeContainer = sidebarContainer.querySelector('#themeToggleContainer');
            if (themeContainer) {
                try {
                    const themeRes = await fetch(prefix + 'fragment/theme-toggle.html');
                    const themeHtml = await themeRes.text();
                    themeContainer.innerHTML = themeHtml;

                    const initThemeToggle = () => {
                        if (window.ThemeManager) {
                            ThemeManager.bootstrap(themeContainer);
                        }
                    };

                    if (!window.ThemeManager) {
                        const themeScript = document.createElement('script');
                        themeScript.src = prefix + 'js/theme-manager.js';
                        themeScript.onload = initThemeToggle;
                        document.head.appendChild(themeScript);
                    } else {
                        initThemeToggle();
                    }
                } catch (themeErr) {
                    console.error("Failed to load theme toggle:", themeErr);
                }
            }
        } catch (err) {
            console.error("Failed to load user-sidebar:", err);
        }
    }

    // 3. Load footer if container exists
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        try {
            const footerRes = await fetch(prefix + 'fragment/footer.html');
            const footerHtml = await footerRes.text();
            footerContainer.innerHTML = footerHtml;

            // Execute scripts inside footer
            const scripts = footerContainer.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
            });
        } catch (err) {
            console.error("Failed to load footer:", err);
        }
    }

    // Dispatch event indicating components are loaded
    document.dispatchEvent(new Event('componentsLoaded'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
} else {
    loadComponents();
}
