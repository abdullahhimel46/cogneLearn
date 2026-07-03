/**
 * cogneLearn — Admin Panel Common JS
 *
 * Contains shared utilities, data access layer, theme initialization,
 * and session validation for the Admin Panel.
 */

'use strict';

/* ── Data Layer ──────────────────────────────────────────────── */

const Data = {
  fetchDefaults: { credentials: 'include' },

  async stats() {
    const res = await fetch('/api/admin/stats', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  },

  async latestLogs() {
    const res = await fetch('/api/logs/latest', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch system activity');
    return await res.json();
  },

  async paginatedLogs(page = 0, size = 10) {
    const res = await fetch(`/api/logs?page=${page}&size=${size}`, Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch paginated logs');
    return await res.json();
  },

  async logStats() {
    const res = await fetch('/api/logs/stats', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch log stats');
    return await res.json();
  },

  async systemInfo() {
    return {
      serverStatus: 'OK',
      apiLatency:   '12 ms',
      errorCount:   0,
    };
  },

  async users() {
    const res = await fetch('/api/admin/users', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  async toggleUserActive(userId) {
    const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
      method: 'POST',
      ...Data.fetchDefaults,
    });
    if (!res.ok) throw new Error('Failed to toggle user status');
  },

  async emailStatus() {
    const res = await fetch('/api/admin/notifications/status', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch email status');
    return await res.json();
  },

  async pendingNotifications() {
    const res = await fetch('/api/admin/notifications/pending', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch pending notifications');
    return await res.json();
  },

  async sendPendingNotification(notificationId, subject, message) {
    const body = {};
    if (subject && subject.trim()) body.subject = subject.trim();
    if (message && message.trim()) body.message = message.trim();
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...Data.fetchDefaults,
    };
    if (Object.keys(body).length > 0) opts.body = JSON.stringify(body);
    const res = await fetch(`/api/admin/notifications/${notificationId}/send`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to send notification');
    }
  },

  async sendCustomEmail(userId, subject, message) {
    const res = await fetch('/api/admin/notifications/send-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subject, message }),
      ...Data.fetchDefaults,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email');
    }
    return data;
  },
};

/* ── Helpers ─────────────────────────────────────────────────── */

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Element #${id} not found`);
  return node;
}

function fmtDate(iso) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ── Common Initialization ───────────────────────────────────── */

async function ensureAdminSession() {
  const res = await fetch('/api/v1/auth/me', Data.fetchDefaults);
  if (!res.ok) {
    window.location.href = '../auth/login.html?redirect=admin';
    return false;
  }
  const user = await res.json();
  if (user.role !== 'ADMIN') {
    window.location.href = '../dashboard.html';
    return false;
  }
  return true;
}

function initSidebarActiveLink() {
  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    }
  });
}

function initTheme() {
  const sidebarToggle = document.getElementById('adminThemeToggle');
  const inPageToggles = document.querySelectorAll('.theme-toggle-btn');
  const themeClass = 'admin-theme-dark';
  
  const updateIcons = (isDark) => {
    inPageToggles.forEach(btn => {
      const moonIcon = btn.querySelector('.theme-icon-moon');
      const sunIcon = btn.querySelector('.theme-icon-sun');
      if (moonIcon && sunIcon) {
        moonIcon.style.display = isDark ? 'none' : 'block';
        sunIcon.style.display = isDark ? 'block' : 'none';
      }
    });
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-pressed', String(isDark));
    }
  };

  const isDark = document.body.classList.contains(themeClass);
  updateIcons(isDark);

  const handleToggle = () => {
    const nowDark = document.body.classList.toggle(themeClass);
    localStorage.setItem('cognelearn_admin_theme', nowDark ? 'dark' : 'light');
    updateIcons(nowDark);
  };

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', handleToggle);
  }
  
  inPageToggles.forEach(btn => btn.addEventListener('click', handleToggle));

  const sidebarMenuToggle = document.getElementById('sidebarToggle');
  if (sidebarMenuToggle) {
    sidebarMenuToggle.addEventListener('click', () => {
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('cognelearn_admin_sidebar', isCollapsed ? 'collapsed' : 'expanded');
    });

    const pref = localStorage.getItem('cognelearn_admin_sidebar');
    if (pref === 'collapsed') {
      document.body.classList.add('sidebar-collapsed');
    } else if (window.innerWidth <= 1024 && pref !== 'expanded') {
      document.body.classList.add('sidebar-collapsed');
    }
  }
}

function renderTimestamp() {
  const target = document.getElementById('adminTimestamp');
  if (!target) return;
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  target.textContent = formatted;
  target.setAttribute('datetime', now.toISOString());
}

async function initCommon() {
  const ok = await ensureAdminSession();
  if (!ok) return false;
  
  initSidebarActiveLink();
  initTheme();
  renderTimestamp();

  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.Auth && typeof window.Auth.logout === 'function') {
        window.Auth.logout();
      } else {
        localStorage.removeItem('cognelearn_user');
        window.location.replace('../auth/login.html');
      }
    });
  }

  return true;
}
