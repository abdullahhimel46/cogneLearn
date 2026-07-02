/**
 * cogneLearn — Admin Users JS
 */

'use strict';

const userState = {
  users: [],
  selectedUser: null,
  isModalOpen: false,
};

async function renderUsers(filter = '') {
  const tbody = el('usersTableBody');
  if (!filter) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading users...</td></tr>';

  try {
    if (userState.users.length === 0 || !filter) {
      userState.users = await Data.users();
    }

    tbody.innerHTML = '';
    const query = filter.trim().toLowerCase();
    const filtered = userState.users.filter(u =>
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
      
      const user = userState.users.find(u => u.id === userId);
      if (user) user.active = !user.active;
      
      renderUsers(el('userSearchInput').value);
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      btn.disabled = false;
    }
  });
  
  renderUsers();
}

function handleViewUser(userId) {
  const user = userState.users.find(u => u.id === userId);
  if (!user) return;
  userState.selectedUser = user;
  userState.isModalOpen = true;
  renderUserModal();
}

function closeModal() {
  userState.selectedUser = null;
  userState.isModalOpen = false;
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
  if (!userState.isModalOpen || !userState.selectedUser) {
    modal.classList.add('hidden');
    return;
  }

  const user = userState.selectedUser;
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
    const user = userState.users.find(u => u.id === userId);
    if (user) {
      user.active = !user.active;
      user.status = user.active ? "active" : "inactive";
    }
    if (userState.selectedUser && userState.selectedUser.id === userId) {
      userState.selectedUser = { ...user };
    }
    renderUserModal();
    renderUsers(el('userSearchInput').value);
  } catch (err) {
    alert("Failed to toggle user status");
  }
}

window.handleViewUser = handleViewUser;
window.closeModal = closeModal;
window.deactivateUser = deactivateUser;

async function init() {
  const ok = await initCommon();
  if (!ok) return;
  initUsersPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
