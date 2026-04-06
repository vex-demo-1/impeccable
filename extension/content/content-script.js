/**
 * Impeccable DevTools Extension - Content Script
 *
 * Bridges between the extension messaging system and the page-context detector.
 * The detector must run in page context (not isolated world) because it needs
 * access to getComputedStyle, document.styleSheets.cssRules, etc.
 */

let injected = false;
let pendingScan = false;
let scanConfig = null;

// Listen for commands from the service worker
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'scan') {
    scanConfig = msg.config || null;
    injectAndScan();
    sendResponse({ ok: true });
  } else if (msg.action === 'toggle-overlays') {
    window.postMessage({ source: 'impeccable-command', action: 'toggle-overlays' }, '*');
    sendResponse({ ok: true });
  } else if (msg.action === 'remove') {
    window.postMessage({ source: 'impeccable-command', action: 'remove' }, '*');
    injected = false;
    sendResponse({ ok: true });
  }
  return true;
});

// Listen for results and state changes from the detector in page context
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data) return;

  if (e.data.source === 'impeccable-results') {
    chrome.runtime.sendMessage({
      action: 'findings',
      findings: e.data.findings,
      count: e.data.count,
    }).catch(() => {});
  }

  if (e.data.source === 'impeccable-overlays-toggled') {
    chrome.runtime.sendMessage({
      action: 'overlays-toggled',
      visible: e.data.visible,
    }).catch(() => {});
  }

  if (e.data.source === 'impeccable-ready') {
    injected = true;
    if (pendingScan) {
      pendingScan = false;
      sendScanCommand();
    }
  }
});

// SPA navigation detection (pushState/replaceState don't fire events, but
// popstate and hashchange cover back/forward and hash navigation)
let lastUrl = location.href;
function onPossibleNavigation() {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  if (injected) {
    // Detector is still loaded in page context, just re-scan after DOM settles
    setTimeout(sendScanCommand, 500);
  }
}
window.addEventListener('popstate', onPossibleNavigation);
window.addEventListener('hashchange', onPossibleNavigation);

function sendScanCommand() {
  const msg = { source: 'impeccable-command', action: 'scan' };
  if (scanConfig) msg.config = scanConfig;
  window.postMessage(msg, '*');
}

function injectAndScan() {
  if (injected) {
    sendScanCommand();
    return;
  }

  // Set the extension flag via a data attribute (CSP-safe: content scripts share the DOM)
  document.documentElement.dataset.impeccableExtension = 'true';

  // Inject the detector script into page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('detector/detect.js');
  pendingScan = true;
  script.onload = () => script.remove();
  script.onerror = () => {
    script.remove();
    // Fallback: use chrome.scripting.executeScript for strict CSP pages
    chrome.runtime.sendMessage({ action: 'inject-fallback' });
  };
  (document.head || document.documentElement).appendChild(script);
}
