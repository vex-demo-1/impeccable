/**
 * Impeccable DevTools Extension - DevTools Page
 *
 * Creates the Impeccable panel and triggers an auto-scan when DevTools opens.
 * This page lives for the entire DevTools session -- its port disconnect
 * is the canonical signal that DevTools has closed.
 */

chrome.devtools.panels.create(
  'Impeccable',
  'icons/icon-32.png',
  'devtools/panel.html'
);

// Connect a lifecycle port so the service worker knows when DevTools closes
const port = chrome.runtime.connect({
  name: `impeccable-devtools-${chrome.devtools.inspectedWindow.tabId}`,
});

// Auto-scan when DevTools opens (regardless of which panel is active).
port.postMessage({ action: 'scan' });
