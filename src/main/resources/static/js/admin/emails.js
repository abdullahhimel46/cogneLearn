/**
 * cogneLearn — Admin Emails JS
 */

'use strict';

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

  EmailState.selectedUsers = [];

  const selectAllBtn = el('selectAllCampaignUsers');
  if (EmailState.selectedCategory === 'CUSTOM_EMAIL') {
    selectAllBtn.classList.remove('hidden');
  } else {
    selectAllBtn.classList.add('hidden');
  }

  const saveBtn = el('saveTemplateBtn');
  if (EmailState.selectedCategory === 'CUSTOM_EMAIL') {
    saveBtn.style.display = 'none';
  } else {
    saveBtn.style.display = 'inline-flex';
  }

  el('userCampaignSearch').value = '';

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
  
  el('openSendModalBtn').disabled = !(hasSelected && subj && body);
}

function initEmailsPage() {
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

      el('emailTemplateSubject').value = 'Loading...';
      el('emailTemplateBody').value = '';
      el('openSendModalBtn').disabled = true;
      
      renderEmails();
    });
  });

  el('userCampaignSearch').addEventListener('input', () => {
    renderCampaignUsersList();
  });

  el('selectAllCampaignUsers').addEventListener('click', () => {
    const searchTerm = el('userCampaignSearch').value.toLowerCase().trim();
    const filtered = EmailState.users.filter(u => 
      u.name.toLowerCase().includes(searchTerm) || 
      u.email.toLowerCase().includes(searchTerm)
    );
    filtered.forEach(u => {
      if (!EmailState.selectedUsers.includes(u.id)) {
        EmailState.selectedUsers.push(u.id);
      }
    });
    renderCampaignUsersList();
  });
  
  el('emailTemplateSubject').addEventListener('input', checkEmailFormValid);
  el('emailTemplateBody').addEventListener('input', checkEmailFormValid);

  el('previewEmailBtn').addEventListener('click', () => {
    const subject = el('emailTemplateSubject').value.trim();
    const body = el('emailTemplateBody').value.trim();
    if (!subject || !body) {
      alert("Please provide both subject and body message first!");
      return;
    }
    
    el('sendEmailModalTitle').textContent = `Email Preview (${EmailState.selectedCategory})`;
    
    const selectedUserObjects = EmailState.users.filter(u => EmailState.selectedUsers.includes(u.id));
    const recipientNames = selectedUserObjects.map(u => u.name).join(', ') || '(No recipients selected)';
    
    el('modalPreviewTo').textContent = recipientNames;
    el('modalPreviewSubject').textContent = subject;
    el('modalPreviewBody').textContent = body;
    
    el('sendEmailModal').classList.remove('hidden');
  });

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

  el('cancelSendBtn').addEventListener('click', () => {
    el('sendEmailModal').classList.add('hidden');
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el('sendEmailModal').classList.contains('hidden')) {
      el('sendEmailModal').classList.add('hidden');
    }
  });

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

  renderEmails();
}

async function init() {
  const ok = await initCommon();
  if (!ok) return;
  initEmailsPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
