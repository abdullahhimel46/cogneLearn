/**
 * cogneLearn — Admin Logs JS
 */

'use strict';

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
  
  renderLogsPage(0);
}

async function init() {
  const ok = await initCommon();
  if (!ok) return;
  initLogsPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
