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
  fetchDefaults: { credentials: 'include' },

  /** Fetch stats from backend */
  async stats() {
    const res = await fetch('/api/admin/stats', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  },

  /** Fetch recent system activity */
  async activity() {
    const res = await fetch('/api/admin/activity', Data.fetchDefaults);
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
    const res = await fetch('/api/admin/users', Data.fetchDefaults);
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  /** Toggle user active status */
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

  /** Privacy-first queue: milestone notifications awaiting admin send */
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
  if (!['overview', 'users', 'emails', 'settings'].includes(page)) return;

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
  if (page === 'emails') renderEmails();
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  let initialPage = location.hash.replace('#', '') || 'overview';
  if (initialPage === 'feedback') initialPage = 'emails';
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

async function renderPendingNotifications() {
  const container = el('pendingNotificationsList');
  container.innerHTML = '<p class="panel__hint" style="margin:0">Loading queue…</p>';

  try {
    const items = await Data.pendingNotifications();
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = '<p class="panel__hint" style="margin:0">No pending motivational emails.</p>';
      return;
    }

    items.forEach((item) => {
      const card = make('article', 'pending-notification-card');
      card.setAttribute('role', 'listitem');

      const head = make('div', 'pending-notification-card__head');
      const userEl = make('span', 'pending-notification-card__user', item.userName);
      const eventEl = make('span', 'pending-notification-card__event', item.eventType);
      const timeEl = make('span', 'pending-notification-card__time', fmtDateTime(item.createdAt));
      head.append(userEl, eventEl, timeEl);

      const recipient = make('p', 'pending-notification-card__recipient',
        `To: ${item.userEmail || 'unknown'}`);
      const msg = make('p', 'pending-notification-card__message', item.suggestedMessage);

      const subjectLabel = make('span', 'pending-notification-card__label', 'Subject');
      const subjectInput = document.createElement('input');
      subjectInput.className = 'field';
      subjectInput.type = 'text';
      subjectInput.value = item.emailSubject || '';
      subjectInput.setAttribute('aria-label', 'Email subject');

      const editLabel = make('span', 'pending-notification-card__label', 'Message');
      const ta = document.createElement('textarea');
      ta.className = 'pending-notification-edit';
      ta.setAttribute('aria-label', 'Email message');
      ta.value = item.suggestedMessage;

      const actions = make('div', 'pending-notification-card__actions');
      const sendBtn = make('button', 'btn-send-email', 'Send Email');
      sendBtn.type = 'button';

      sendBtn.addEventListener('click', async () => {
        if (!confirm(`Send motivational email to ${item.userEmail}?`)) return;
        try {
          sendBtn.disabled = true;
          await Data.sendPendingNotification(
            item.id,
            subjectInput.value.trim(),
            ta.value.trim()
          );
          await renderPendingNotifications();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not send email. Check SMTP settings in application.yml.');
        } finally {
          sendBtn.disabled = false;
        }
      });

      actions.appendChild(sendBtn);
      card.append(head, recipient, msg, subjectLabel, subjectInput, editLabel, ta, actions);
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="panel__hint" style="margin:0;color:var(--danger)">Could not load the queue. Open this page after signing in as an admin (admin@cognelearn.app in demo).</p>';
  }
}

function fmtDateTime(iso) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Emails Page ─────────────────────────────────────────────── */

async function renderEmailStatus() {
  const statusEl = document.getElementById('emailProviderStatus');
  if (!statusEl) return;
  try {
    const status = await Data.emailStatus();
    statusEl.textContent = status.enabled
      ? `Email service: ${status.provider} (ready to send)`
      : 'Email service disabled — set cognelearn.email.enabled=true and spring.mail.*';
    statusEl.style.color = status.enabled ? 'var(--success, #10b981)' : 'var(--danger)';
  } catch {
    statusEl.textContent = 'Could not check email service status.';
    statusEl.style.color = 'var(--danger)';
  }
}

function populateCustomEmailRecipients() {
  const select = document.getElementById('customEmailTo');
  if (!select) return;
  select.innerHTML = '';
  const learners = state.users.filter(u => u.email !== 'admin@cognelearn.app');
  learners.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.dataset.email = u.email;
    opt.textContent = `${u.name} (${u.email})`;
    select.appendChild(opt);
  });
}

async function renderEmails() {
  if (state.users.length === 0) {
    try {
      state.users = await Data.users();
    } catch (err) {
      console.error(err);
    }
  }
  populateCustomEmailRecipients();
  await renderEmailStatus();
  await renderPendingNotifications();
}

function initEmailsPage() {
  const sendBtn = document.getElementById('sendCustomEmailBtn');
  if (!sendBtn) return;

  sendBtn.addEventListener('click', async () => {
    const select = el('customEmailTo');
    const userId = select.value;
    const recipientEmail = select.selectedOptions[0]?.dataset.email || '';
    const subject = el('customEmailSubject').value.trim();
    const message = el('customEmailBody').value.trim();
    if (!userId || !subject || !message) {
      alert('Please fill in recipient, subject, and message.');
      return;
    }
    if (!confirm(`Send email to ${recipientEmail || 'this user'}?`)) return;
    try {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      const result = await Data.sendCustomEmail(userId, subject, message);
      el('customEmailSubject').value = '';
      el('customEmailBody').value = '';
      alert(result.message || `Email sent to ${result.recipientEmail || recipientEmail}.`);
    } catch (err) {
      alert(err.message || 'Failed to send email. Check SMTP settings.');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Email';
    }
  });
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

/* ── Session guard ───────────────────────────────────────────── */

async function ensureAdminSession() {
  const res = await fetch('/api/v1/auth/me', Data.fetchDefaults);
  if (!res.ok) {
    window.location.href = 'login.html?redirect=admin';
    return false;
  }
  const user = await res.json();
  if (user.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return false;
  }
  localStorage.setItem('cognelearn_user', JSON.stringify(user));
  return true;
}

/* ── Bootstrap ───────────────────────────────────────────────── */

async function init() {
  renderTimestamp();

  const ok = await ensureAdminSession();
  if (!ok) return;

  await Promise.all([
    renderOverview(),
    renderUsers(),
    renderEmails()
  ]);

  initNavigation();
  initUsersPage();
  initEmailsPage();
  initSettings();
  initTheme();
}

document.addEventListener('DOMContentLoaded', init);
