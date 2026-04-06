/**
 * Impeccable DevTools Extension - Panel
 *
 * Displays findings, provides controls for scanning and overlay toggling,
 * and allows clicking findings to inspect elements.
 */

// Match the DevTools theme (light or dark)
if (chrome.devtools.panels.themeName === 'dark') {
  document.documentElement.classList.add('theme-dark');
}

const tabId = chrome.devtools.inspectedWindow.tabId;
const port = chrome.runtime.connect({ name: `impeccable-panel-${tabId}` });

const badge = document.getElementById('badge');
const container = document.getElementById('findings-container');
const emptyState = document.getElementById('empty-state');
const btnRescan = document.getElementById('btn-rescan');
const btnToggle = document.getElementById('btn-toggle');
const settingsContainer = document.getElementById('settings-container');
const settingsList = document.getElementById('settings-list');
const btnSettings = document.getElementById('btn-settings');

let overlaysVisible = true;
let allAntipatterns = [];
let disabledRules = [];

// Load antipatterns list and disabled rules
async function initSettings() {
  try {
    const resp = await fetch(chrome.runtime.getURL('detector/antipatterns.json'));
    allAntipatterns = await resp.json();
  } catch { allAntipatterns = []; }

  const stored = await chrome.storage.sync.get({ disabledRules: [] });
  disabledRules = stored.disabledRules;
  renderSettings();
}

function renderSettings() {
  settingsList.innerHTML = '';
  for (const ap of allAntipatterns) {
    const label = document.createElement('label');
    label.className = 'setting-rule';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !disabledRules.includes(ap.id);
    checkbox.addEventListener('change', () => toggleRule(ap.id, checkbox.checked));

    const text = document.createElement('span');
    text.textContent = ap.name;

    label.appendChild(checkbox);
    label.appendChild(text);
    settingsList.appendChild(label);
  }
}

async function toggleRule(ruleId, enabled) {
  if (enabled) {
    disabledRules = disabledRules.filter(id => id !== ruleId);
  } else {
    if (!disabledRules.includes(ruleId)) disabledRules.push(ruleId);
  }
  await chrome.storage.sync.set({ disabledRules });
  chrome.runtime.sendMessage({ action: 'disabled-rules-changed' });
}

// Listen for messages from the service worker
port.onMessage.addListener((msg) => {
  if (msg.action === 'findings' || msg.action === 'state') {
    renderFindings(msg.findings || []);
    if (msg.overlaysVisible !== undefined) {
      overlaysVisible = msg.overlaysVisible;
      updateToggleButton();
    }
  }
  if (msg.action === 'overlays-toggled') {
    overlaysVisible = msg.visible;
    updateToggleButton();
  }
  if (msg.action === 'navigated') {
    showScanning();
  }
});

// Controls
btnRescan.addEventListener('click', () => {
  showScanning();
  port.postMessage({ action: 'scan' });
});

btnToggle.addEventListener('click', () => {
  port.postMessage({ action: 'toggle-overlays' });
});

btnSettings.addEventListener('click', () => {
  const isVisible = settingsContainer.style.display !== 'none';
  settingsContainer.style.display = isVisible ? 'none' : '';
  btnSettings.classList.toggle('active', !isVisible);
});

function updateToggleButton() {
  btnToggle.classList.toggle('active', overlaysVisible);
  btnToggle.title = overlaysVisible ? 'Hide overlays' : 'Show overlays';
}

function showScanning() {
  container.innerHTML = `
    <div class="scanning-indicator">
      <div class="scanning-dot"></div>
      Scanning page...
    </div>`;
}

function renderFindings(findings) {
  if (!findings.length) {
    container.innerHTML = '';
    container.appendChild(emptyState);
    emptyState.style.display = '';
    badge.classList.remove('visible');
    badge.textContent = '0';
    return;
  }

  emptyState.style.display = 'none';

  // Count total element-level findings
  const totalCount = findings.reduce((sum, f) => sum + f.findings.length, 0);
  badge.textContent = String(totalCount);
  badge.classList.add('visible');

  // Group findings by category, then by anti-pattern type
  const categories = { slop: new Map(), quality: new Map() };
  for (const item of findings) {
    for (const f of item.findings) {
      const cat = f.category || 'quality';
      const groups = categories[cat] || categories.quality;
      if (!groups.has(f.type)) {
        groups.set(f.type, { name: f.name, description: f.description, items: [] });
      }
      groups.get(f.type).items.push({
        selector: item.selector,
        tagName: item.tagName,
        isPageLevel: item.isPageLevel,
        detail: f.detail,
      });
    }
  }

  container.innerHTML = '';

  const CATEGORY_LABELS = { slop: 'AI tells', quality: 'Quality issues' };
  for (const [catKey, groups] of Object.entries(categories)) {
    if (groups.size === 0) continue;

    const catCount = [...groups.values()].reduce((sum, g) => sum + g.items.length, 0);
    const section = document.createElement('div');
    section.className = 'category-section category-' + catKey;

    const catHeader = document.createElement('div');
    catHeader.className = 'category-header';
    catHeader.innerHTML = `
      <span class="category-dot category-dot-${catKey}"></span>
      <span class="category-name">${CATEGORY_LABELS[catKey]}</span>
      <span class="category-count">${catCount}</span>`;
    section.appendChild(catHeader);

    for (const [type, group] of groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'finding-group';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-chevron">&#9660;</span>
      <span class="group-name">${escapeHtml(group.name)}</span>
      <span class="group-count">${group.items.length}</span>`;
    header.addEventListener('click', () => header.classList.toggle('collapsed'));
    groupEl.appendChild(header);

    const itemsEl = document.createElement('div');
    itemsEl.className = 'group-items';

    for (const item of group.items) {
      const itemEl = document.createElement('div');
      itemEl.className = 'finding-item';
      itemEl.innerHTML = `
        ${item.isPageLevel ? '<span class="page-level-tag">page</span>' : ''}
        <span class="finding-selector">${escapeHtml(item.selector)}</span>
        <span class="finding-detail">${escapeHtml(item.detail)}</span>
        <span class="finding-description">${escapeHtml(group.description)}</span>`;

      if (!item.isPageLevel) {
        itemEl.addEventListener('click', () => inspectElement(item.selector));
      }

      itemsEl.appendChild(itemEl);
    }

    groupEl.appendChild(itemsEl);
    section.appendChild(groupEl);
  }

    container.appendChild(section);
  }
}

function inspectElement(selector) {
  const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      var el = document.querySelector('${escaped}');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); inspect(el); }
    })()`
  );
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

initSettings();
