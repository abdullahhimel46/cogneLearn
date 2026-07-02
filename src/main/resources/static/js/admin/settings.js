/**
 * cogneLearn — Admin Settings JS
 */

'use strict';

const SettingsState = {
  maintenanceMode: false
};

function initSettings() {
  const toggleBtn = el('maintenanceToggle');

  toggleBtn.addEventListener('click', () => {
    SettingsState.maintenanceMode = !SettingsState.maintenanceMode;
    toggleBtn.setAttribute('aria-checked', String(SettingsState.maintenanceMode));
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

async function init() {
  const ok = await initCommon();
  if (!ok) return;
  initSettings();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
