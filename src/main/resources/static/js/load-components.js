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
            
            // Execute scripts inside sidebar
            const scripts = sidebarContainer.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
            });
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
