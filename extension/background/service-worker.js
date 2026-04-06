/**
 * Impeccable DevTools Extension - Service Worker
 *
 * Routes messages between popup, DevTools panel, and content scripts.
 * Maintains per-tab state and updates the badge.
 */

// Per-tab state: { tabId: { findings, overlaysVisible, injected } }
const tabState = new Map();

// Active DevTools panel connections: { tabId: Set<port> }
const panelPorts = new Map();

function getState(tabId) {
  if (!tabState.has(tabId)) {
    tabState.set(tabId, { findings: [], overlaysVisible: true, injected: false });
  }
  return tabState.get(tabId);
}

function updateBadge(tabId) {
  const state = tabState.get(tabId);
  const count = state?.findings?.length || 0;
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text, tabId }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color: '#d6336c', tabId }).catch(() => {});
}

function notifyPanels(tabId, message) {
  const ports = panelPorts.get(tabId);
  if (ports) {
    for (const port of ports) {
      try { port.postMessage(message); } catch { /* port disconnected */ }
    }
  }
}

async function getDisabledRules() {
  const result = await chrome.storage.sync.get({ disabledRules: [] });
  return result.disabledRules;
}

async function buildScanConfig() {
  const disabledRules = await getDisabledRules();
  return disabledRules.length ? { disabledRules } : null;
}

async function sendScanToTab(tabId) {
  const config = await buildScanConfig();
  chrome.tabs.sendMessage(tabId, { action: 'scan', config }).catch(() => {});
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = msg.tabId || sender.tab?.id;

  if (msg.action === 'findings' && tabId) {
    const state = getState(tabId);
    state.findings = msg.findings || [];
    state.injected = true;
    updateBadge(tabId);
    notifyPanels(tabId, { action: 'findings', findings: state.findings });
    // Broadcast for popup
    chrome.runtime.sendMessage({ action: 'findings-updated', tabId, findings: state.findings }).catch(() => {});
    sendResponse({ ok: true });
  }

  else if (msg.action === 'scan' && tabId) {
    sendScanToTab(tabId);
    sendResponse({ ok: true });
  }

  else if (msg.action === 'toggle-overlays' && tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'toggle-overlays' }).catch(() => {});
    sendResponse({ ok: true });
  }

  else if (msg.action === 'overlays-toggled' && tabId) {
    const state = getState(tabId);
    state.overlaysVisible = msg.visible;
    notifyPanels(tabId, { action: 'overlays-toggled', visible: msg.visible });
    chrome.runtime.sendMessage({ action: 'overlays-toggled-broadcast', tabId, visible: msg.visible }).catch(() => {});
    sendResponse({ ok: true });
  }

  else if (msg.action === 'get-state' && tabId) {
    sendResponse(getState(tabId));
  }

  else if (msg.action === 'inject-fallback' && tabId) {
    // CSP fallback: inject detector via chrome.scripting (bypasses page CSP)
    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      files: ['detector/detect.js'],
    }).then(() => {
      // Detector will post impeccable-ready, content script handles the rest
    }).catch((err) => {
      console.warn('[impeccable] Fallback injection failed:', err);
    });
    sendResponse({ ok: true });
  }

  else if (msg.action === 'disabled-rules-changed') {
    // Re-scan all tabs that have been injected
    for (const [tid, state] of tabState) {
      if (state.injected) sendScanToTab(tid);
    }
    sendResponse({ ok: true });
  }

  return true;
});

// Track which tabs have DevTools open (via the devtools.js lifecycle port)
const devtoolsTabs = new Set();

// Handle long-lived connections from DevTools pages and panels
chrome.runtime.onConnect.addListener((port) => {
  // Lifecycle port from devtools.js -- tracks DevTools open/close
  if (port.name.startsWith('impeccable-devtools-')) {
    const tabId = parseInt(port.name.replace('impeccable-devtools-', ''), 10);
    devtoolsTabs.add(tabId);

    port.onMessage.addListener((msg) => {
      if (msg.action === 'scan') sendScanToTab(tabId);
    });

    port.onDisconnect.addListener(() => {
      devtoolsTabs.delete(tabId);
      // DevTools closed -- remove overlays and clear state
      chrome.tabs.sendMessage(tabId, { action: 'remove' }).catch(() => {});
      const state = tabState.get(tabId);
      if (state) {
        state.findings = [];
        state.injected = false;
      }
      updateBadge(tabId);
      panelPorts.delete(tabId);
    });
  }

  // Panel port from panel.js -- for forwarding findings/state
  if (port.name.startsWith('impeccable-panel-')) {
    const tabId = parseInt(port.name.replace('impeccable-panel-', ''), 10);
    if (!panelPorts.has(tabId)) panelPorts.set(tabId, new Set());
    panelPorts.get(tabId).add(port);

    // Send current state to newly connected panel
    const state = getState(tabId);
    port.postMessage({ action: 'state', ...state });

    // If no findings yet, the auto-scan from devtools.js may have been lost -- trigger one
    if (!state.findings.length) {
      sendScanToTab(tabId);
    }

    port.onMessage.addListener((msg) => {
      if (msg.action === 'scan') {
        sendScanToTab(tabId);
      } else if (msg.action === 'toggle-overlays') {
        chrome.tabs.sendMessage(tabId, { action: 'toggle-overlays' }).catch(() => {});
      }
    });

    port.onDisconnect.addListener(() => {
      panelPorts.get(tabId)?.delete(port);
      if (panelPorts.get(tabId)?.size === 0) panelPorts.delete(tabId);
    });
  }
});

// Re-scan on navigation (only if DevTools is open for that tab)
chrome.webNavigation?.onCompleted?.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!devtoolsTabs.has(details.tabId)) return;
  const state = tabState.get(details.tabId);
  if (state) {
    state.findings = [];
    state.injected = false;
    updateBadge(details.tabId);
    notifyPanels(details.tabId, { action: 'navigated' });
    // Re-inject and scan after a short delay for the page to settle
    setTimeout(() => sendScanToTab(details.tabId), 300);
  }
});

// Clean up state when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
  panelPorts.delete(tabId);
});
