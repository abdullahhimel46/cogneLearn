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
  selectedUser:     null,
  isModalOpen:      false,
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
  if (!['overview', 'users', 'emails', 'settings', 'logs'].includes(page)) return;

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
  if (page === 'logs') renderLogsPage(0);
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

  const viewAllBtn = document.getElementById('viewAllLogsBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => navigateTo('logs'));
  }
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
    const activities = await Data.latestLogs();
    list.innerHTML = '';
    
    if (activities.length === 0) {
      list.innerHTML = '<li class="activity-item"><span class="activity-item__text">No recent activity found.</span></li>';
      return;
    }

    activities.forEach(item => {
      const li = make('li', 'activity-item');
      li.style.flexDirection = 'column';
      li.style.alignItems = 'flex-start';
      li.style.gap = '4px';
      
      const titleWrapper = make('div');
      titleWrapper.style.display = 'flex';
      titleWrapper.style.alignItems = 'center';
      titleWrapper.style.gap = '8px';
      
      const icon = document.createElement('span');
      if (item.type === 'INFO') icon.innerHTML = '&#9432;';
      else if (item.type === 'WARNING') icon.innerHTML = '&#9888;';
      else icon.innerHTML = '&#10006;';
      icon.style.color = item.type === 'INFO' ? 'var(--info)' : (item.type === 'WARNING' ? 'var(--warning)' : 'var(--danger)');
      
      const title = make('strong', 'activity-item__text', item.title);
      titleWrapper.append(icon, title);
      
      const desc = make('span', 'activity-item__text', item.description);
      desc.style.fontSize = '0.9rem';
      
      const d = new Date(item.createdAt);
      const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const meta = make('span', 'activity-item__time', `${timeStr} • ${item.source}`);
      
      li.append(titleWrapper, desc, meta);
      list.appendChild(li);
    });

    renderActivityCharts();
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

/* ── Charts ──────────────────────────────────────────────────── */

let activityTrendChart = null;
let activityTypeChart = null;

async function renderActivityCharts() {
  let stats;
  try {
    stats = await Data.logStats();
  } catch(e) {
    console.error("Failed to fetch log stats", e);
    return;
  }

  // Type counts from backend
  const typeCounts = {
    'Registrations': stats.registrations || 0,
    'Sessions': stats.sessions || 0,
    'Playlists': stats.playlists || 0,
    'Alerts': stats.alerts || 0,
    'Admin': stats.adminActions || 0
  };

  // Timeline from backend
  const timelineCounts = {
    'Today': stats.today || 0,
    'This Week': stats.thisWeek || 0,
    'Older': stats.older || 0
  };

  const themeColors = {
    text: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() || '#f8fafc',
    grid: getComputedStyle(document.body).getPropertyValue('--border').trim() || '#1e293b',
    primary: '#6366f1',
    success: '#10b981',
    info: '#0ea5e9',
    warning: '#f59e0b',
    danger: '#ef4444'
  };
  
  const isDark = document.body.classList.contains('admin-theme-dark');
  Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
  Chart.defaults.font.family = 'Inter, sans-serif';

  // Destroy existing charts if they exist
  if (activityTrendChart) activityTrendChart.destroy();
  if (activityTypeChart) activityTypeChart.destroy();

  // 1. Trend Chart
  const trendCtx = el('activityTrendChart');
  if (trendCtx) {
    // Standard order
    const order = ['Older', 'This Week', 'Today'];
    const sortedTimeline = Object.keys(timelineCounts).sort((a, b) => order.indexOf(a) - order.indexOf(b));

    activityTrendChart = new Chart(trendCtx, {
      type: 'bar',
      data: {
        labels: sortedTimeline,
        datasets: [{
          label: 'Activity Volume',
          data: sortedTimeline.map(k => timelineCounts[k]),
          backgroundColor: themeColors.primary,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: isDark ? '#334155' : '#e2e8f0' },
            ticks: { stepSize: 1 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // 2. Type Doughnut Chart
  const typeCtx = el('activityTypeChart');
  if (typeCtx) {
    activityTypeChart = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts).filter(k => typeCounts[k] > 0),
        datasets: [{
          data: Object.values(typeCounts).filter(v => v > 0),
          backgroundColor: [
            themeColors.info, 
            themeColors.success, 
            themeColors.primary, 
            themeColors.warning, 
            themeColors.danger
          ],
          borderWidth: 2,
          borderColor: isDark ? '#0f172a' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'right',
            labels: { color: Chart.defaults.color }
          }
        },
        cutout: '70%'
      }
    });
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
        <td style="color:var(--text-secondary)">${fmtDate(user.joinedAt || user.joined)}</td>
        <td>
          <span class="badge ${user.active ? 'badge--active' : 'badge--disabled'}">
            ${user.active ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button
              class="btn-action"
              type="button"
              onclick="handleViewUser('${user.id}')"
            >View</button>
            <button
              class="btn-action ${user.active ? 'btn-action--danger' : ''}"
              data-user-id="${user.id}"
              type="button"
              title="${user.active ? 'Deactivate — prevents user from signing in' : 'Activate — allow user to sign in'}"
              aria-label="${user.active ? 'Deactivate' : 'Activate'} ${user.name}"
            >${user.active ? 'Deactivate' : 'Activate'}</button>
          </div>
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


/* ── User Inspection System (Pure & State-driven) ──────────────── */

function handleViewUser(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  state.selectedUser = user;
  state.isModalOpen = true;
  renderUserModal();
}

function closeModal() {
  state.selectedUser = null;
  state.isModalOpen = false;
  renderUserModal();
}

function infoRow(label, value) {
  return `
    <div class="row">
      <span>${label}</span>
      <span>${value}</span>
    </div>
  `;
}

function statCard(emoji, label, value) {
  return `
    <div class="stat">
      <span>${emoji}</span>
      <strong>${value}</strong>
      <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${label}</p>
    </div>
  `;
}

function formatFocusTime(minutes) {
  if (!minutes || minutes < 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function renderUserModal() {
  const modal = el('userModal');
  if (!state.isModalOpen || !state.selectedUser) {
    modal.classList.add('hidden');
    return;
  }

  const user = state.selectedUser;
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  const content = el('modalContent');
  
    content.innerHTML = `
    <div class="header">
      <div class="avatar">${initials}</div>
      <div>
        <h2>${user.name}</h2>
        <p style="color:var(--text-secondary)">${user.email}</p>
      </div>
    </div>
    
    <hr>
    
    <div class="info">
      ${infoRow("Status", user.active ? "🟢 Active" : "🔴 Disabled")}
      ${infoRow("Joined", fmtDate(user.joinedAt || user.joined))}
      ${infoRow("Last Active", user.lastActive ? fmtDate(user.lastActive) : "Never")}
    </div>
    
    <hr>
    
    <div class="stats">
      ${statCard("⏱️", "Focus Time", formatFocusTime(user.focusTime))}
      ${statCard("📅", "Sessions", user.sessions || 0)}
      ${statCard("🔥", "Streak", `${user.streak || 0} days`)}
    </div>
    
    <div class="actions">
      <button type="button" onclick="closeModal()">Close</button>
        <button type="button" class="danger" onclick="deactivateUser('${user.id}')">
         ${user.active ? 'Deactivate' : 'Activate'} User
       </button>
    </div>
  `;

  modal.classList.remove('hidden');
}

async function deactivateUser(userId) {
  try {
    await Data.toggleUserActive(userId);
    // update local state
    const user = state.users.find(u => u.id === userId);
    if (user) {
      user.active = !user.active;
      user.status = user.active ? "active" : "inactive";
    }
    // sync selectedUser
    if (state.selectedUser && state.selectedUser.id === userId) {
      state.selectedUser = { ...user };
    }
    renderUserModal();
    renderUsers(el('userSearchInput').value);
  } catch (err) {
    alert("Failed to toggle user status");
  }
}

// Bind to window for HTML events
window.handleViewUser = handleViewUser;
window.closeModal = closeModal;
window.deactivateUser = deactivateUser;


/* ── Emails Page ─────────────────────────────────────────────── */

const EmailState = {
  selectedCategory: 'INACTIVE_USER',
  users: [],
  selectedUsers: [],
  template: { subject: '', body: '' },
  categories: {
    'INACTIVE_USER': {
      title: '🧠 INACTIVE USER',
      trigger: 'User has not logged in or completed any session in the past 3+ days',
      audience: 'All registered users who have been inactive for more than 3 days — re-engagement reminder to bring them back to learning.',
      tooltip: 'This campaign targets users who have not opened the app or completed a study session in over 3 days. The goal is to re-engage them with a personalized motivational message. These users are at risk of dropping off — a well-timed email can significantly improve retention.'
    },
    'LOW_FOCUS': {
      title: '⚠️ LOW FOCUS',
      trigger: 'User\'s average focus score dropped below 30 in their last 3 sessions',
      audience: 'Users whose recent session focus scores are consistently below 30 — they may need motivation, a break, or study technique tips.',
      tooltip: 'This campaign targets users whose focus scores have dropped significantly in recent study sessions (below 30/100). Low focus may indicate burnout, distraction, or poor session scheduling. This email provides practical tips to improve concentration and reminds the user of their learning goals.'
    },
    'STREAK': {
      title: '🔥 STREAK MILESTONE',
      trigger: 'User has maintained an active learning streak for 7 or more consecutive days',
      audience: 'Users who have been consistently active for 7+ days — celebrate their milestone and encourage them to keep the momentum going.',
      tooltip: 'This campaign celebrates users who have achieved a 7-day or longer daily learning streak. Positive reinforcement at milestone moments dramatically improves long-term engagement. This email acknowledges their dedication, celebrates the achievement, and motivates them to push even further.'
    },
    'CUSTOM_EMAIL': {
      title: '✉️ CUSTOM EMAIL',
      trigger: 'Fully manual — you choose the recipients, subject, and message content',
      audience: 'Manually selected recipients from the full user list below — use this for announcements, one-on-one messages, or any campaign not covered by the above templates.',
      tooltip: 'A fully custom email campaign with no automatic targeting rules. The admin manually picks which users to contact, writes a subject line, and composes the email body from scratch. Use this for system announcements, special offers, direct support messages, or any ad-hoc communication need.'
    }
  }
};

async function renderEmails() {
  // Fetch users if not loaded yet
  if (EmailState.users.length === 0) {
    try {
      const res = await fetch('/api/users', Data.fetchDefaults);
      if (res.ok) {
        EmailState.users = await res.json();
      }
    } catch(e) {
      console.error("Failed to fetch campaign users", e);
    }
  }

  // Reset selection on tab change
  EmailState.selectedUsers = [];

  // Toggle "Select All" button visibility
  const selectAllBtn = el('selectAllCampaignUsers');
  if (EmailState.selectedCategory === 'CUSTOM_EMAIL') {
    selectAllBtn.classList.remove('hidden');
  } else {
    selectAllBtn.classList.add('hidden');
  }

  // Toggle "Save" template button visibility
  const saveBtn = el('saveTemplateBtn');
  if (EmailState.selectedCategory === 'CUSTOM_EMAIL') {
    saveBtn.style.display = 'none';
  } else {
    saveBtn.style.display = 'inline-flex';
  }

  // Clear search filter input
  el('userCampaignSearch').value = '';

  // Get template or clear for custom email
  if (EmailState.selectedCategory === 'CUSTOM_EMAIL') {
    const info = EmailState.categories['CUSTOM_EMAIL'];
    EmailState.template.subject = '';
    EmailState.template.body = '';
    el('emailTemplateSubject').value = '';
    el('emailTemplateBody').value = '';
    el('activeCategoryTitle').textContent = info.title;
    el('activeCategoryTrigger').innerHTML = `<strong>Trigger:</strong> ${info.trigger} <span class="tooltip-icon" title="${info.tooltip}">ℹ️</span>`;
    const audienceEl = document.getElementById('activeCategoryAudience');
    if (audienceEl) {
      audienceEl.innerHTML = `<strong>Recipients:</strong> ${info.audience}`;
    }
    renderCampaignUsersList();
    checkEmailFormValid();
  } else {
    await fetchEmailTemplate(EmailState.selectedCategory);
  }
}

async function fetchEmailTemplate(category) {
  const info = EmailState.categories[category];
  try {
    const res = await fetch(`/api/email-template?category=${category}`, Data.fetchDefaults);
    if (res.ok) {
      const templateRes = await res.json();
      EmailState.template.subject = templateRes.subject || '';
      EmailState.template.body = templateRes.body || '';
      
      el('emailTemplateSubject').value = EmailState.template.subject;
      el('emailTemplateBody').value = EmailState.template.body;
    }
  } catch(e) {
    console.error("Failed to fetch template", e);
  }

  // Always render descriptive audience text from the category metadata
  el('activeCategoryTitle').textContent = info.title;
  el('activeCategoryTrigger').innerHTML = `<strong>Trigger:</strong> ${info.trigger} <span class="tooltip-icon" title="${info.tooltip}">ℹ️</span>`;
  const audienceEl2 = document.getElementById('activeCategoryAudience');
  if (audienceEl2) {
    audienceEl2.innerHTML = `<strong>Recipients:</strong> ${info.audience}`;
  }

  renderCampaignUsersList();
  checkEmailFormValid();
}

function renderCampaignUsersList() {
  const container = el('campaignUsersList');
  container.innerHTML = '';

  const searchTerm = el('userCampaignSearch').value.toLowerCase().trim();
  const filtered = EmailState.users.filter(u => 
    u.name.toLowerCase().includes(searchTerm) || 
    u.email.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; margin:16px 0;">No users found</p>`;
    updateSelectedCount();
    return;
  }

  filtered.forEach(user => {
    const itemDiv = document.createElement('div');
    itemDiv.style.display = 'flex';
    itemDiv.style.alignItems = 'center';
    itemDiv.style.gap = '8px';
    itemDiv.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `campaign-user-${user.id}`;
    checkbox.checked = EmailState.selectedUsers.includes(user.id);
    checkbox.style.cursor = 'pointer';

    checkbox.addEventListener('change', () => {
      toggleUserSelection(user.id);
    });

    const label = document.createElement('label');
    label.htmlFor = `campaign-user-${user.id}`;
    label.style.cursor = 'pointer';
    label.style.fontSize = '0.92rem';
    label.style.flex = '1';
    let lastSentHtml = '';
    if (user.lastEmailSentAt) {
      const timeStr = new Date(user.lastEmailSentAt).toLocaleString();
      lastSentHtml = `<span style="font-size: 0.8rem; margin-left:8px; color:var(--primary);">(Last Sent: ${timeStr})</span>`;
    }

    label.innerHTML = `<strong>${user.name}</strong> <span style="color:var(--text-secondary); margin-left:4px;">(${user.email})</span> ${lastSentHtml}`;

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    container.appendChild(itemDiv);
  });

  updateSelectedCount();
}

function toggleUserSelection(userId) {
  if (EmailState.selectedUsers.includes(userId)) {
    EmailState.selectedUsers = EmailState.selectedUsers.filter(id => id !== userId);
  } else {
    EmailState.selectedUsers.push(userId);
  }
  updateSelectedCount();
  checkEmailFormValid();
}

function updateSelectedCount() {
  el('campaignSelectedCount').textContent = `Selected: ${EmailState.selectedUsers.length} users`;
}

function checkEmailFormValid() {
  const subj = el('emailTemplateSubject').value.trim();
  const body = el('emailTemplateBody').value.trim();
  const hasSelected = EmailState.selectedUsers.length > 0;
  
  el('openSendModalBtn').disabled = (!subj || !body || !hasSelected);
}

function initEmailsPage() {
  // Tabs Switcher
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const category = e.target.dataset.category;
      EmailState.selectedCategory = category;
      
      const info = EmailState.categories[category];
      el('activeCategoryTitle').textContent = info.title;
      el('activeCategoryTrigger').innerHTML = `<strong>Trigger:</strong> ${info.trigger} <span class="tooltip-icon" title="${info.tooltip}">ℹ️</span>`;
      const audienceEl3 = document.getElementById('activeCategoryAudience');
      if (audienceEl3) {
        audienceEl3.innerHTML = `<strong>Recipients:</strong> ${info.audience}`;
      }

      // Clear inputs while fetching
      el('emailTemplateSubject').value = 'Loading...';
      el('emailTemplateBody').value = '';
      el('openSendModalBtn').disabled = true;
      
      renderEmails();
    });
  });

  // Search Filter
  el('userCampaignSearch').addEventListener('input', () => {
    renderCampaignUsersList();
  });

  // Select All Users
  el('selectAllCampaignUsers').addEventListener('click', () => {
    const searchTerm = el('userCampaignSearch').value.toLowerCase().trim();
    const filtered = EmailState.users.filter(u => 
      u.name.toLowerCase().includes(searchTerm) || 
      u.email.toLowerCase().includes(searchTerm)
    );
    // Select all matching users
    filtered.forEach(u => {
      if (!EmailState.selectedUsers.includes(u.id)) {
        EmailState.selectedUsers.push(u.id);
      }
    });
    renderCampaignUsersList();
    updateAudienceCount();
  });
  el('emailTemplateSubject').addEventListener('input', checkEmailFormValid);
  el('emailTemplateBody').addEventListener('input', checkEmailFormValid);

  // Preview Button Modal
  el('previewEmailBtn').addEventListener('click', () => {
    const subject = el('emailTemplateSubject').value.trim();
    const body = el('emailTemplateBody').value.trim();
    if (!subject || !body) {
      alert("Please provide both subject and body message first!");
      return;
    }
    
    // Preview with modal
    el('sendEmailModalTitle').textContent = `Email Preview (${EmailState.selectedCategory})`;
    
    const selectedUserObjects = EmailState.users.filter(u => EmailState.selectedUsers.includes(u.id));
    const recipientNames = selectedUserObjects.map(u => u.name).join(', ') || '(No recipients selected)';
    
    el('modalPreviewTo').textContent = recipientNames;
    el('modalPreviewSubject').textContent = subject;
    el('modalPreviewBody').textContent = body;
    
    el('sendEmailModal').classList.remove('hidden');
  });

  // Save Template
  el('saveTemplateBtn').addEventListener('click', async () => {
    const subject = el('emailTemplateSubject').value.trim();
    const body = el('emailTemplateBody').value.trim();
    
    const btn = el('saveTemplateBtn');
    btn.textContent = 'Saving...';
    try {
      await fetch('/api/emails/template', {
        ...Data.fetchDefaults,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: EmailState.selectedCategory, subject, body })
      });
      btn.textContent = 'Saved!';
      setTimeout(() => btn.textContent = 'Save', 2000);
    } catch(e) {
      alert('Failed to save template');
      btn.textContent = 'Save';
    }
  });

  // Open Send Modal
  el('openSendModalBtn').addEventListener('click', () => {
    const subject = el('emailTemplateSubject').value.trim();
    const body = el('emailTemplateBody').value.trim();
    EmailState.template = { subject, body };
    
    el('sendEmailModalTitle').textContent = `Send Email → ${EmailState.selectedCategory}`;
    
    const selectedUserObjects = EmailState.users.filter(u => EmailState.selectedUsers.includes(u.id));
    const recipientNames = selectedUserObjects.map(u => u.name).join(', ');
    
    el('modalPreviewTo').textContent = recipientNames;
    el('modalPreviewSubject').textContent = EmailState.template.subject;
    el('modalPreviewBody').textContent = EmailState.template.body;
    
    el('sendEmailModal').classList.remove('hidden');
  });

  // Close Modal
  el('cancelSendBtn').addEventListener('click', () => {
    el('sendEmailModal').classList.add('hidden');
  });
  
  // Close Modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el('sendEmailModal').classList.contains('hidden')) {
      el('sendEmailModal').classList.add('hidden');
    }
  });

  // Confirm Send Action
  el('confirmSendBtn').addEventListener('click', async () => {
    const selectedUserObjects = EmailState.users.filter(u => EmailState.selectedUsers.includes(u.id));
    if (selectedUserObjects.length === 0) {
      alert('Please select at least one recipient user!');
      return;
    }
    
    const subject = el('emailTemplateSubject').value.trim();
    const body = el('emailTemplateBody').value.trim();
    
    const btn = el('confirmSendBtn');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      await fetch('/api/send-email', {
        ...Data.fetchDefaults,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipients: selectedUserObjects.map(u => ({ id: u.id, name: u.name, email: u.email })), 
          subject: subject, 
          message: body
        })
      });
      
      btn.textContent = 'Sent!';
      setTimeout(() => {
        el('sendEmailModal').classList.add('hidden');
        btn.textContent = 'Send Email';
      }, 1000);
      
      // Clear selection
      EmailState.selectedUsers = [];
      renderCampaignUsersList();
      checkEmailFormValid();
    } catch(e) {
      alert('Failed to send campaign emails');
    } finally {
      btn.textContent = 'Send Email';
      btn.disabled = false;
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
  initLogsPage();
}

document.addEventListener('DOMContentLoaded', init);

/* ── Logs Page ───────────────────────────────────────────────── */
let currentLogsPage = 0;
const LOGS_PAGE_SIZE = 10;

async function renderLogsPage(page = 0) {
  const tbody = el('logsTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading logs...</td></tr>';
  
  try {
    const pageData = await Data.paginatedLogs(page, LOGS_PAGE_SIZE);
    tbody.innerHTML = '';
    
    if (!pageData.content || pageData.content.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">No activity logs found.</td></tr>';
      el('logsPageInfo').textContent = `Page 1 of 1`;
      el('logsPrevBtn').disabled = true;
      el('logsNextBtn').disabled = true;
      return;
    }
    
    pageData.content.forEach(log => {
      const tr = document.createElement('tr');
      
      const badgeClass = log.type === 'INFO' ? 'badge--info' : (log.type === 'WARNING' ? 'badge--warning' : 'badge--error');
      
      const d = new Date(log.createdAt);
      const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      tr.innerHTML = `
        <td><span class="badge ${badgeClass}">${log.type}</span></td>
        <td>
          <strong style="color:var(--text-primary); display:block;">${log.title}</strong>
          <span style="color:var(--text-secondary); font-size:0.85rem;">${log.description}</span>
        </td>
        <td style="color:var(--text-secondary)">${log.userName || 'System'}</td>
        <td style="color:var(--text-secondary)">${log.source}</td>
        <td style="color:var(--text-secondary); white-space:nowrap;">${timeStr}</td>
      `;
      tbody.appendChild(tr);
    });
    
    currentLogsPage = pageData.number;
    el('logsPageInfo').textContent = `Page ${pageData.number + 1} of ${pageData.totalPages || 1}`;
    
    el('logsPrevBtn').disabled = pageData.first;
    el('logsNextBtn').disabled = pageData.last;
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger)">Error loading logs</td></tr>';
  }
}

function initLogsPage() {
  const prevBtn = el('logsPrevBtn');
  const nextBtn = el('logsNextBtn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentLogsPage > 0) renderLogsPage(currentLogsPage - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      renderLogsPage(currentLogsPage + 1);
    });
  }
}
