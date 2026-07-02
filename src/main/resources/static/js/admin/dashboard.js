/**
 * cogneLearn — Admin Dashboard JS
 */

'use strict';

let activityTrendChart = null;
let activityTypeChart = null;

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

async function renderActivityCharts() {
  let stats;
  try {
    stats = await Data.logStats();
  } catch(e) {
    console.error("Failed to fetch log stats", e);
    return;
  }

  const typeCounts = {
    'Registrations': stats.registrations || 0,
    'Sessions': stats.sessions || 0,
    'Playlists': stats.playlists || 0,
    'Alerts': stats.alerts || 0,
    'Admin': stats.adminActions || 0
  };

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
  if (typeof Chart !== 'undefined') {
      Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
      Chart.defaults.font.family = 'Inter, sans-serif';
  }

  if (activityTrendChart) activityTrendChart.destroy();
  if (activityTypeChart) activityTypeChart.destroy();

  const trendCtx = el('activityTrendChart');
  if (trendCtx && typeof Chart !== 'undefined') {
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

  const typeCtx = el('activityTypeChart');
  if (typeCtx && typeof Chart !== 'undefined') {
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

async function initDashboard() {
  const ok = await initCommon();
  if (!ok) return;
  await renderOverview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
