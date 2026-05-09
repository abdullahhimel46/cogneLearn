/**
 * cogneLearn — Admin Panel Controller
 *
 * Responsibilities:
 *   1. Client-side navigation (hash-based SPA routing)
 *   2. Fetch REAL data from the Spring Boot REST API
 *   3. Render each page view
 *   4. Handle interactive controls (user toggle, maintenance toggle, settings)
 */

'use strict';

/* ── Data Layer ──────────────────────────────────────────────── */

const Data = {
  /** Fetch stats from backend */
  async stats() {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  },

  /** Fetch recent system activity */
  async activity() {
    const res = await fetch('/api/admin/activity');
    if (!res.ok) throw new Error('Failed to fetch system activity');
    return await res.json();
  },

  /** Simulate system health or fetch from /health endpoint */
  async systemInfo() {
    // For now, we simulate this, but in a real app, you'd fetch from a metrics endpoint
    return {
      serverStatus: 'OK',
      apiLatency:   '12 ms',
      errorCount:   0,
    };
  },

  /** Fetch all registered users */
  async users() {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  /** Toggle user active status */
  async toggleUserActive(userId) {
    const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle user status');
  },

  /** Fetch user feedback */
  async feedback() {
    const res = await fetch('/api/admin/feedback');
    if (!res.ok) throw new Error('Failed to fetch feedback');
    return await res.json();
  },
};

/* ── State ───────────────────────────────────────────────────── */
const state = {
  currentPage:      'overview',
  users:            [],    
  maintenanceMode:  false,
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

/* ── Navigation ──────────────────────────────────────────────── */

function navigateTo(page) {
  if (!['overview', 'users', 'feedback', 'settings'].includes(page)) return;

  document.querySelectorAll('.nav-item').forEach(link => {
    const isTarget = link.dataset.page === page;
    link.classList.toggle('is-active', isTarget);
    link.setAttribute('aria-current', isTarget ? 'page' : 'false');
  });

  document.querySelectorAll('.page').forEach(section => {
    section.classList.toggle('hidden', section.id !== `page-${page}`);
  });

  state.currentPage = page;
  history.replaceState(null, '', `#${page}`);
  
  // Re-render the specific page when navigated to ensure data is fresh
  if (page === 'overview') renderOverview();
  if (page === 'users') renderUsers();
  if (page === 'feedback') renderFeedback();
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  const initialPage = location.hash.replace('#', '') || 'overview';
  navigateTo(initialPage);
}

/* ── Timestamp ───────────────────────────────────────────────── */

function renderTimestamp() {
  const target = el('adminTimestamp');
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  target.textContent = formatted;
  target.setAttribute('datetime', now.toISOString());
}

/* ── Overview Page ───────────────────────────────────────────── */

async function renderOverview() {
  try {
    const stats = await Data.stats();

    el('statTotalUsers').textContent     = stats.totalUsers;
    el('statActiveSessions').textContent = stats.activeSessions;
    el('statTotalPlaylists').textContent = stats.totalPlaylists;

    const statusEl = el('statSystemStatus');
    statusEl.textContent = stats.systemStatus;
    statusEl.dataset.status = stats.systemStatus.toLowerCase();

    await renderActivity();
    await renderSystemInfo();
  } catch (err) {
    console.error('Overview render failed:', err);
  }
}

async function renderActivity() {
  const list = el('activityList');
  list.innerHTML = '<li class="activity-item"><span class="activity-item__text">Loading...</span></li>';

  try {
    const activities = await Data.activity();
    list.innerHTML = '';
    
    if (activities.length === 0) {
      list.innerHTML = '<li class="activity-item"><span class="activity-item__text">No recent activity found.</span></li>';
      return;
    }

    activities.forEach(item => {
      const li   = make('li', 'activity-item');
      const text = make('span', 'activity-item__text', item.text);
      const time = make('span', 'activity-item__time', item.time);
      li.append(text, time);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = '<li class="activity-item"><span class="activity-item__text" style="color:var(--danger)">Error loading activity</span></li>';
  }
}

async function renderSystemInfo() {
  try {
    const info = await Data.systemInfo();

    const serverEl = el('sysServerStatus');
    serverEl.textContent     = info.serverStatus;
    serverEl.dataset.status  = info.serverStatus.toLowerCase();

    el('sysApiLatency').textContent = info.apiLatency;
    el('sysErrorCount').textContent = info.errorCount;
  } catch (err) {
    console.error('System info fetch failed:', err);
  }
}

/* ── Users Page ──────────────────────────────────────────────── */

async function renderUsers(filter = '') {
  const tbody = el('usersTableBody');
  if (!filter) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading users...</td></tr>';

  try {
    // If we don't have users in state or we're refreshing, fetch them
    if (state.users.length === 0 || !filter) {
      state.users = await Data.users();
    }

    tbody.innerHTML = '';
    const query = filter.trim().toLowerCase();
    const filtered = state.users.filter(u =>
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      const td = make('td', null, 'No users found.');
      td.colSpan = 5;
      td.style.textAlign = 'center';
      td.style.color = 'var(--text-muted)';
      td.style.padding = '32px 16px';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name}</td>
        <td style="color:var(--text-secondary)">${user.email}</td>
        <td style="color:var(--text-secondary)">${fmtDate(user.joined)}</td>
        <td>
          <span class="badge ${user.active ? 'badge--active' : 'badge--disabled'}">
            ${user.active ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <button
            class="btn-action ${user.active ? 'btn-action--danger' : ''}"
            data-user-id="${user.id}"
            type="button"
            aria-label="${user.active ? 'Disable' : 'Enable'} ${user.name}"
          >${user.active ? 'Disable' : 'Enable'}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger)">Error loading users</td></tr>';
  }
}

function initUsersPage() {
  el('userSearchInput').addEventListener('input', (e) => {
    renderUsers(e.target.value);
  });

  el('usersTableBody').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-user-id]');
    if (!btn) return;
    
    const userId = btn.dataset.userId;
    try {
      btn.disabled = true;
      await Data.toggleUserActive(userId);
      
      // Update local state to reflect change immediately
      const user = state.users.find(u => u.id === userId);
      if (user) user.active = !user.active;
      
      renderUsers(el('userSearchInput').value);
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ── Feedback Page ───────────────────────────────────────────── */

async function renderFeedback() {
  const container = el('feedbackList');
  container.innerHTML = '<p style="text-align:center; padding: 20px;">Loading feedback...</p>';

  try {
    const feedbacks = await Data.feedback();
    container.innerHTML = '';

    if (feedbacks.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px;">No feedback received yet.</p>';
      return;
    }

    feedbacks.forEach(item => {
      const card = make('article', 'feedback-card');
      card.setAttribute('role', 'listitem');

      const msg  = make('p', 'feedback-card__message', item.message);
      const meta = make('div', 'feedback-card__meta');

      const userSpan = make('span', 'feedback-card__user', item.userName ?? 'Anonymous');
      const dateSpan = make('span', null, fmtDate(item.createdAt));

      meta.append(userSpan, dateSpan);
      card.append(msg, meta);
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<p style="text-align:center; color:var(--danger)">Error loading feedback</p>';
  }
}

/* ── Settings Page ───────────────────────────────────────────── */

function initSettings() {
  const toggleBtn = el('maintenanceToggle');

  toggleBtn.addEventListener('click', () => {
    state.maintenanceMode = !state.maintenanceMode;
    toggleBtn.setAttribute('aria-checked', String(state.maintenanceMode));
  });

  el('saveAppNameBtn').addEventListener('click', () => {
    const name = el('appNameInput').value.trim();
    if (!name) return;
    
    const btn = el('saveAppNameBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Saved';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1800);
  });
}

/* ── Theme Management ────────────────────────────────────────── */

function initTheme() {
  const toggleBtn = document.getElementById('adminThemeToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('cognelearn_admin_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('admin-theme-dark');
    toggleBtn.setAttribute('aria-pressed', 'true');
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('admin-theme-dark');
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('cognelearn_admin_theme', isDark ? 'dark' : 'light');
  });

  const savedSidebar = localStorage.getItem('cognelearn_admin_sidebar') || 'expanded';
  if (savedSidebar === 'collapsed') {
    document.body.classList.add('sidebar-collapsed');
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('cognelearn_admin_sidebar', isCollapsed ? 'collapsed' : 'expanded');
    });
  }
}

/* ── Bootstrap ───────────────────────────────────────────────── */

async function init() {
  renderTimestamp();
  
  // Initial data load
  await Promise.all([
    renderOverview(),
    renderUsers(),
    renderFeedback()
  ]);

  initNavigation();
  initUsersPage();
  initSettings();
  initTheme();
}

document.addEventListener('DOMContentLoaded', init);
