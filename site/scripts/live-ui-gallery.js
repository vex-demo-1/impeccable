/*
 * Dev-only Impeccable Live state gallery.
 *
 * This is a static state harness, not a second implementation of Live. It
 * mirrors the exact chrome vocabulary and state wording from:
 *   skill/scripts/live-browser.js
 *   skill/scripts/live/ui-core.mjs
 * Command labels/icons are injected by LiveUiGallery.astro from the canonical
 * skill/scripts/live/vocabulary.mjs export.
 */

const ICONS = Object.freeze({
  pick: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>',
  insert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  detect: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  chat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  voice: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  submit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  tune: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="8" x2="20" y2="8"/><circle cx="14" cy="8" r="2.4" fill="currentColor" stroke="none"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="10" cy="16" r="2.4" fill="currentColor" stroke="none"/></svg>',
  edit: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h8"/><path d="M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/><path d="M4 4l.5 7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L10 4"/></svg>',
  exit: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>',
});

function parseJson(root, selector, fallback = []) {
  try {
    return JSON.parse(root.querySelector(selector)?.textContent || '[]');
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function brandMark() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 2.5 L13.5 2.5 L5.5 21.5 L5 21.5 Q2.5 21.5 2.5 19 L2.5 5 Q2.5 2.5 5 2.5 Z"/><path d="M16.5 2.5 L19 2.5 Q21.5 2.5 21.5 5 L21.5 19 Q21.5 21.5 19 21.5 L8.5 21.5 Z"/></svg>';
}

function designMark() {
  return '<span class="lvg-design-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
}

function hostPage({ edited = false, insert = false } = {}) {
  return `
    <div class="lvg-host-page${insert ? ' has-insert' : ''}">
      <p class="lvg-host-kicker">Northstar field journal · Edition 08</p>
      <article class="lvg-host-target"${edited ? ' data-edited="true"' : ''}>
        <h4>${edited ? 'Useful observations, refined.' : 'Useful observations from the long way around.'}</h4>
        <p>Four routes, annotated maps, and practical details for unhurried weekends.</p>
      </article>
    </div>`;
}

function selectionOutline() {
  return '<div class="lvg-selection-outline" aria-hidden="true"></div>';
}

function dots({ arrived = 0, visible = 0, expected = 3, clickable = false } = {}) {
  let html = '<span class="lvg-dots" aria-label="Variant progress">';
  for (let index = 1; index <= expected; index += 1) {
    const active = index === visible;
    const pending = index > arrived;
    const className = `lvg-dot${active ? ' is-active' : ''}${pending ? ' is-pending' : ''}`;
    if (clickable && !pending) {
      const target = index === 1 ? 'cycling-progressive' : 'cycling-second';
      html += `<button type="button" class="${className}" data-gallery-go="${target}" aria-label="Show variant ${index}"${active ? ' aria-current="true"' : ''}></button>`;
    } else {
      html += `<i class="${className}" aria-hidden="true"></i>`;
    }
  }
  return html + '</span>';
}

function configureBar({ actionLabel, count, listening = false, locked = false, insert = false, picker = '' } = {}) {
  const inputValue = insert
    ? 'Add a compact proof strip'
    : listening
      ? 'Tighten the hierarchy'
      : locked
        ? ''
        : 'Make this feel more confident';
  const actionControl = insert ? '' : `
    <button type="button" class="lvg-configure-modifier" data-gallery-go="action-picker" aria-haspopup="listbox" aria-expanded="${picker ? 'true' : 'false'}">
      ${escapeHtml(actionLabel)} <span aria-hidden="true">▾</span>
    </button>`;
  return `
    <div class="lvg-live-context is-configure${picker ? ' has-picker' : ''}"${locked ? ' data-locked="true"' : ''}>
      <div class="lvg-configure-row">
        <div class="lvg-configure-input-shell">
          <button type="button" class="lvg-selection-pill" data-gallery-go="global-ready" aria-label="Clear selection">${insert ? 'slot' : 'article'}</button>
          <input class="lvg-configure-input" aria-label="${insert ? 'Describe the new element' : 'Describe the change'}" value="${escapeHtml(inputValue)}"${locked ? ' placeholder="apply is running..." disabled' : ''} />
        </div>
        <div class="lvg-configure-trailing">
          <div class="lvg-configure-modifiers">
            ${actionControl}
            <button type="button" class="lvg-configure-modifier is-count" data-gallery-count aria-label="Change variant count">×${count}</button>
          </div>
          <button type="button" class="lvg-configure-voice" data-gallery-go="${listening ? 'configure-replace' : 'configure-listening'}" aria-label="${listening ? 'Stop voice input' : 'Voice input'}" aria-pressed="${listening}">${ICONS.voice}</button>
          <button type="button" class="lvg-configure-submit" data-gallery-go="generating" aria-label="${insert ? 'Create variants' : 'Generate variants'}">${ICONS.submit}</button>
        </div>
      </div>
      ${picker}
    </div>`;
}

function actionPicker(commands, selectedAction) {
  return `
    <div class="lvg-action-picker" role="listbox" aria-label="Design action">
      <div class="lvg-action-grid">
        ${commands.map((command) => `
          <button type="button" class="lvg-action-chip" role="option" data-gallery-action="${escapeHtml(command.value)}" aria-pressed="${command.value === selectedAction}">
            <span>${command.icon}</span><span>${escapeHtml(command.label)}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function generatingBar(recovery = false, actionLabel = 'Freeform') {
  return `
    <div class="lvg-live-context">
      <div class="lvg-generation-row">
        <span class="lvg-generation-label">${escapeHtml(actionLabel)}</span>
        ${dots({ expected: 3 })}
        <span class="lvg-generation-status">${recovery ? 'Variants ready. Reveal the selected element to resume.' : 'Source ready. Generating...'}</span>
      </div>
    </div>`;
}

function tuneButton(open) {
  return `
    <button type="button" class="lvg-tune-button" data-gallery-go="${open ? 'cycling-second' : 'tune-open'}" aria-expanded="${open}">
      ${ICONS.tune}<span>Tune</span><span class="lvg-tune-badge">3</span>
    </button>`;
}

function cyclingBar({ arrived = 1, visible = 1, tune = false } = {}) {
  const remaining = 3 - arrived;
  return `
    <div class="lvg-live-context${tune ? ' has-tune' : ''}">
      <div class="lvg-cycling-row">
        <button type="button" class="lvg-nav-button" data-gallery-go="cycling-progressive" aria-label="Previous variant"${visible <= 1 ? ' disabled' : ''}>←</button>
        ${dots({ arrived, visible, expected: 3, clickable: true })}
        <span class="lvg-variant-counter">${visible}/3</span>
        <button type="button" class="lvg-nav-button" data-gallery-go="cycling-second" aria-label="Next variant"${visible >= arrived ? ' disabled' : ''}>→</button>
        ${tuneButton(tune)}
        <span class="lvg-cycling-spacer"></span>
        ${remaining > 0 ? `<span class="lvg-arrival-progress">${remaining} more arriving...</span>` : ''}
        <button type="button" class="lvg-accept" data-gallery-go="applying">✓ Accept</button>
        <button type="button" class="lvg-discard" data-gallery-go="global-ready" aria-label="Discard all variants" title="Discard all variants">✕</button>
      </div>
      ${tune ? tunePanel() : ''}
    </div>`;
}

function tunePanel() {
  return `
    <div class="lvg-tune-panel">
      <div class="lvg-tune-grid">
        <div class="lvg-param">
          <div class="lvg-param-header"><strong>Color amount</strong><output data-gallery-range-output>0.60</output></div>
          <input type="range" min="0" max="1" step="0.05" value="0.6" data-gallery-range aria-label="Color amount" />
        </div>
        <div class="lvg-param">
          <div class="lvg-param-header"><strong>Density</strong><output data-gallery-density-output>Snug</output></div>
          <div class="lvg-param-steps" role="group" aria-label="Density">
            <button type="button" data-gallery-density="Airy" aria-pressed="false">Airy</button>
            <button type="button" data-gallery-density="Snug" aria-pressed="true">Snug</button>
            <button type="button" data-gallery-density="Packed" aria-pressed="false">Packed</button>
          </div>
        </div>
        <div class="lvg-param">
          <div class="lvg-param-header"><strong>Motion</strong><output data-gallery-toggle-output>Off</output></div>
          <button type="button" class="lvg-param-toggle" data-gallery-param-toggle aria-label="Motion" aria-pressed="false"></button>
        </div>
      </div>
    </div>`;
}

function statusBar(kind) {
  if (kind === 'confirmed') {
    return '<div class="lvg-live-context is-confirmed"><div class="lvg-status-row"><span aria-hidden="true">✓</span><span>Variant applied</span></div></div>';
  }
  return '<div class="lvg-live-context"><div class="lvg-status-row"><i class="lvg-spinner" aria-hidden="true"></i><span>Applying variant...</span></div></div>';
}

function editBadge(editing = false) {
  if (!editing) {
    return `<div class="lvg-edit-badge"><button type="button" class="is-icon" data-gallery-go="edit-copy" aria-label="Edit copy" title="Edit copy">${ICONS.edit}</button></div>`;
  }
  return '<div class="lvg-edit-badge"><button type="button" data-gallery-go="configure-replace">Cancel</button><button type="button" class="is-primary" data-gallery-go="copy-pending">Save</button></div>';
}

function annotationLayer() {
  return `
    <div class="lvg-annotation-layer">
      <svg viewBox="0 0 404 150" aria-hidden="true"><path d="M44 106 C82 74, 136 83, 175 105 S267 135, 322 90"/></svg>
      <button type="button" class="lvg-annotation-clear" data-gallery-go="configure-replace">Clear</button>
      <div class="lvg-annotation-pin"><span>Keep this line on one row</span></div>
    </div>`;
}

function pendingDock(kind) {
  if (kind === 'attention') {
    return `
      <div class="lvg-pending-dock">
        <button type="button" class="lvg-pending-pill" disabled>Apply needs attention</button>
        <button type="button" class="lvg-pending-decision is-primary" data-gallery-go="copy-applying">Keep fixing</button>
        <button type="button" class="lvg-pending-decision" data-gallery-go="copy-pending">Rollback</button>
      </div>`;
  }
  const applying = kind === 'applying';
  return `
    <div class="lvg-pending-dock">
      <button type="button" class="lvg-pending-pill" data-gallery-go="${applying ? 'copy-attention' : 'copy-applying'}" aria-busy="${applying}"${applying ? ' disabled' : ''}>
        ${applying ? '<i class="lvg-pending-spinner" aria-hidden="true"></i><span>Applying 3 copy edits</span>' : '<span>Apply copy edits</span><span class="lvg-pending-count">3</span>'}
      </button>
      <button type="button" class="lvg-pending-trash" data-gallery-go="global-ready" aria-label="Discard copy edits on this page">${ICONS.trash}</button>
    </div>`;
}

function designPanel(tab = 'visual') {
  const raw = tab === 'raw';
  return `
    <aside class="lvg-design-panel" aria-label="DESIGN.md panel">
      <header class="lvg-design-header">
        <span class="lvg-design-title">DESIGN.md</span>
        <div class="lvg-design-tabs" role="tablist" aria-label="Design system view">
          <button type="button" role="tab" data-gallery-design-tab="visual" aria-selected="${!raw}">Visual</button>
          <button type="button" role="tab" data-gallery-design-tab="raw" aria-selected="${raw}">Raw</button>
        </div>
        <button type="button" class="lvg-design-close" data-gallery-go="global-tools" aria-label="Close panel">✕</button>
      </header>
      <div class="lvg-design-body">
        ${raw ? `
          <div class="lvg-design-tile">
            <div class="lvg-design-meta"><strong>Neo Kinpaku</strong><span>Raw</span></div>
            <p class="lvg-design-copy"># Design System: Impeccable<br><br>Dark lacquer, kinpaku gold, and precise technical geometry.</p>
          </div>` : `
          <div class="lvg-design-tile">
            <div class="lvg-design-meta"><strong>Kinpaku Gold</strong><span>Primary</span></div>
            <div class="lvg-design-swatch"></div>
            <p class="lvg-design-copy">Primary accent for commitment, active controls, and the Impeccable mark.</p>
          </div>
          <div class="lvg-design-tile">
            <div class="lvg-design-meta"><strong>Display</strong><span>Typography</span></div>
            <p class="lvg-design-type">Useful observations</p>
            <p class="lvg-design-copy">Alumni Sans · precise, light, and deliberately geometric.</p>
          </div>`}
      </div>
    </aside>`;
}

function globalBar({ connected = true, workerFallback = false, active = 'pick', steer = 'collapsed', detectCount = 0, designActive = false } = {}) {
  const modeButton = (key, icon, label, target, extra = '') => {
    const isActive = active === key || (key === 'design' && designActive);
    return `<button type="button" class="lvg-global-mode" data-active="${isActive}" data-gallery-go="${target}" aria-label="${escapeHtml(label)}">${icon}${isActive ? `<span>${escapeHtml(label)}</span>` : ''}${extra}</button>`;
  };
  const steerHtml = steer === 'processing'
    ? `<div class="lvg-steer" data-expanded="true" data-processing="true" aria-busy="true" aria-label="Processing steer request"><span class="lvg-steer-icon">${ICONS.chat}</span><span class="lvg-steer-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>`
    : steer === 'expanded'
      ? `<div class="lvg-steer" data-expanded="true"><span class="lvg-steer-icon">${ICONS.chat}</span><input type="text" value="Make the page hierarchy more decisive" data-gallery-steer-input aria-label="Steer the page"/><button type="button" class="lvg-steer-voice" aria-label="Voice input">${ICONS.voice}</button></div>`
      : `<button type="button" class="lvg-steer" data-gallery-go="steer-expanded" aria-label="Steer the page"><span class="lvg-steer-icon">${ICONS.chat}</span><span class="lvg-steer-hint">Steer</span><span class="lvg-steer-voice">${ICONS.voice}</span></button>`;

  return `
    <div class="lvg-live-global">
      <span class="lvg-live-brand" data-connected="${connected}" data-worker-fallback="${workerFallback}" role="img" aria-label="Impeccable live mode${!connected ? ' - agent not polling' : workerFallback ? ' - using foreground generation' : ''}">
        ${brandMark()}${connected && !workerFallback ? '' : '<i class="lvg-agent-dot" aria-hidden="true"></i>'}
      </span>
      <div class="lvg-global-inner">
        ${modeButton('pick', ICONS.pick, 'Pick', 'configure-replace')}
        ${modeButton('insert', ICONS.insert, 'Insert', 'insert-placeholder')}
        ${modeButton('detect', ICONS.detect, 'Detect', 'global-tools', detectCount ? `<span class="lvg-detect-badge">${detectCount}</span>` : '')}
        ${modeButton('design', designMark(), 'DESIGN.md', 'design-panel')}
        ${steerHtml}
        <span class="lvg-global-divider" aria-hidden="true"></span>
        <button type="button" class="lvg-global-exit" data-gallery-go="global-ready" aria-label="Exit live mode" title="Exit live mode">${ICONS.exit}</button>
      </div>
    </div>`;
}

function sceneFor(state, context) {
  const actionLabel = context.commands.find((command) => command.value === context.selectedAction)?.label || 'Freeform';
  const commonGlobal = (opts = {}) => globalBar({ active: 'pick', ...opts });
  switch (state) {
    case 'global-disconnected':
      return hostPage() + '<div class="lvg-agent-tooltip" role="tooltip">Agent disconnected - run live-poll.mjs to connect</div>' + commonGlobal({ connected: false });
    case 'global-foreground':
      return hostPage()
        + '<div class="lvg-live-toast" role="status">Codex CLI is unavailable. Live is using the main agent, so generation may take longer. Install the CLI, run codex login, then restart Live.</div>'
        + commonGlobal({ workerFallback: true });
    case 'global-tools':
      return hostPage() + commonGlobal({ active: 'detect', detectCount: 7, designActive: true });
    case 'steer-expanded':
      return hostPage() + commonGlobal({ steer: 'expanded' });
    case 'steer-processing':
      return hostPage() + commonGlobal({ steer: 'processing' });
    case 'configure-replace':
      return hostPage() + selectionOutline() + editBadge(false) + configureBar({ actionLabel, count: context.count }) + commonGlobal();
    case 'action-picker':
      return hostPage() + selectionOutline() + editBadge(false) + configureBar({ actionLabel, count: context.count, picker: actionPicker(context.commands, context.selectedAction) }) + commonGlobal();
    case 'configure-listening':
      return hostPage() + selectionOutline() + editBadge(false) + configureBar({ actionLabel, count: context.count, listening: true }) + commonGlobal();
    case 'configure-locked':
      return hostPage({ edited: true }) + selectionOutline() + editBadge(false) + configureBar({ actionLabel, count: context.count, locked: true }) + pendingDock('applying') + commonGlobal();
    case 'annotation':
      return hostPage() + selectionOutline() + annotationLayer() + configureBar({ actionLabel, count: context.count }) + commonGlobal();
    case 'insert-placeholder':
      return hostPage({ insert: true }) + '<div class="lvg-insert-placeholder" aria-label="Insert placeholder"></div>' + configureBar({ count: context.count, insert: true }) + globalBar({ active: 'insert' });
    case 'generating':
      return hostPage() + selectionOutline() + generatingBar(false, actionLabel) + commonGlobal();
    case 'generation-recovery':
      return hostPage() + generatingBar(true, actionLabel) + commonGlobal();
    case 'cycling-progressive':
      return hostPage() + selectionOutline() + cyclingBar({ arrived: 1, visible: 1 }) + commonGlobal();
    case 'cycling-second':
      return hostPage() + selectionOutline() + cyclingBar({ arrived: 2, visible: 2 }) + commonGlobal();
    case 'tune-open':
      return hostPage() + selectionOutline() + cyclingBar({ arrived: 3, visible: 2, tune: true }) + commonGlobal();
    case 'applying':
      return hostPage() + selectionOutline() + statusBar('applying') + commonGlobal();
    case 'confirmed':
      return hostPage({ edited: true }) + statusBar('confirmed') + commonGlobal();
    case 'edit-copy':
      return hostPage({ edited: true }) + selectionOutline() + editBadge(true) + configureBar({ actionLabel, count: context.count }) + commonGlobal();
    case 'copy-pending':
      return hostPage({ edited: true }) + pendingDock('pending') + commonGlobal();
    case 'copy-applying':
      return hostPage({ edited: true }) + pendingDock('applying') + commonGlobal();
    case 'copy-attention':
      return hostPage({ edited: true }) + pendingDock('attention') + commonGlobal();
    case 'design-panel':
      return hostPage() + designPanel(context.designTab) + globalBar({ active: 'design', designActive: true });
    case 'toast-error':
      return hostPage() + '<div class="lvg-live-toast" role="alert">No variants were mounted. Please try again.</div>' + commonGlobal();
    case 'global-ready':
    default:
      return hostPage() + commonGlobal();
  }
}

function syncPreviewTargetGeometry(scope) {
  scope.querySelectorAll('.live-ui-stage').forEach((stage) => {
    const target = stage.querySelector('.lvg-host-target');
    if (!target) return;

    const stageRect = stage.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetBox = {
      top: targetRect.top - stageRect.top + stage.scrollTop,
      left: targetRect.left - stageRect.left + stage.scrollLeft,
      width: targetRect.width,
      height: targetRect.height,
    };

    const outline = stage.querySelector('.lvg-selection-outline');
    if (outline) {
      Object.assign(outline.style, {
        top: `${targetBox.top - 2}px`,
        left: `${targetBox.left - 2}px`,
        width: `${targetBox.width + 4}px`,
        height: `${targetBox.height + 4}px`,
      });
    }

    const annotationLayer = stage.querySelector('.lvg-annotation-layer');
    if (annotationLayer) {
      Object.assign(annotationLayer.style, {
        top: `${targetBox.top}px`,
        left: `${targetBox.left}px`,
        width: `${targetBox.width}px`,
        height: `${targetBox.height}px`,
      });
    }

    const editBadge = stage.querySelector('.lvg-edit-badge');
    if (editBadge) {
      const badgeWidth = editBadge.getBoundingClientRect().width;
      const outlineRight = targetBox.left + targetBox.width + 2;
      Object.assign(editBadge.style, {
        top: `${Math.max(4, targetBox.top - 28)}px`,
        left: `${Math.min(stage.clientWidth - badgeWidth - 4, outlineRight - badgeWidth)}px`,
      });
    }
  });
}

function initLiveUiGallery(root) {
  if (!root || root.dataset.galleryReady === 'true') return;
  root.dataset.galleryReady = 'true';

  const groups = parseJson(root, '[data-live-gallery-groups]');
  const commands = parseJson(root, '[data-live-gallery-vocabulary]');
  if (groups.length === 0 || commands.length === 0) return;

  const states = groups.flatMap((group) => group.states);
  const cluster = root.querySelector('[data-gallery-cluster]');
  const groupIndexReadout = root.querySelector('[data-gallery-group-index]');
  const groupLabelReadout = root.querySelector('[data-gallery-group-label]');
  const groupSummaryReadout = root.querySelector('[data-gallery-group-summary]');
  let selectedAction = 'impeccable';
  let count = 3;
  let designTab = 'visual';
  let host = 'light';
  let geometryFrame = 0;

  const scheduleGeometrySync = () => {
    cancelAnimationFrame(geometryFrame);
    geometryFrame = requestAnimationFrame(() => {
      geometryFrame = 0;
      syncPreviewTargetGeometry(root);
    });
  };
  const geometryObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(scheduleGeometrySync)
    : null;
  geometryObserver?.observe(root);
  document.fonts?.ready?.then(scheduleGeometrySync);

  const groupByKey = (key) => groups.find((group) => group.key === key);
  const stateByKey = (key) => states.find((state) => state.key === key);
  const groupForState = (key) => groups.find((group) => group.states.some((state) => state.key === key));
  const currentGroup = () => groupByKey(root.dataset.galleryActiveGroup) || groups[0];
  const currentTarget = () => root.dataset.galleryTarget || currentGroup().key;
  const targetFromHash = () => {
    let key = '';
    try {
      key = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return null;
    }
    return groupByKey(key) || stateByKey(key) ? key : null;
  };

  function renderGroup(groupKey, { targetState = null, updateHash = true, focusGroup = false } = {}) {
    const group = groupByKey(groupKey) || groups[0];
    const groupIndex = groups.indexOf(group);
    const validTargetState = group.states.some((state) => state.key === targetState) ? targetState : null;
    const target = validTargetState || group.key;

    root.dataset.galleryActiveGroup = group.key;
    root.dataset.galleryTarget = target;
    root.dataset.galleryActiveHost = host;

    root.querySelectorAll('[data-gallery-group]').forEach((button) => {
      button.setAttribute('aria-current', button.dataset.galleryGroup === group.key ? 'true' : 'false');
    });
    root.querySelectorAll('[data-gallery-host]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.galleryHost === host ? 'true' : 'false');
    });

    if (groupIndexReadout) groupIndexReadout.textContent = `Group ${String(groupIndex + 1).padStart(2, '0')}`;
    if (groupLabelReadout) groupLabelReadout.textContent = group.label;
    if (groupSummaryReadout) groupSummaryReadout.textContent = group.summary;

    if (cluster) {
      cluster.setAttribute('aria-label', `${group.label} states on ${host} host`);
      cluster.innerHTML = group.states.map((state, index) => {
        const targeted = state.key === validTargetState;
        return `
          <article class="live-ui-gallery__state-card${targeted ? ' is-targeted' : ''}" role="listitem" id="state-${escapeHtml(state.key)}" data-gallery-state-card="${escapeHtml(state.key)}">
            <header>
              <div>
                <span>${String(index + 1).padStart(2, '0')}</span>
                <h3>${escapeHtml(state.label)}</h3>
              </div>
              <code>${escapeHtml(state.surface)}</code>
            </header>
            <div class="live-ui-stage is-${host}" data-live-gallery-preview="${host}" data-gallery-state="${escapeHtml(state.key)}" aria-label="${escapeHtml(`${host} host — ${state.label}`)}">
              ${sceneFor(state.key, { commands, selectedAction, count, designTab })}
            </div>
          </article>`;
      }).join('');
      syncPreviewTargetGeometry(cluster);
    }

    if (updateHash && window.location.hash !== `#${target}`) {
      window.history.replaceState(null, '', `#${target}`);
    }
    if (focusGroup) root.querySelector(`[data-gallery-group="${group.key}"]`)?.focus();
    if (validTargetState) {
      requestAnimationFrame(() => {
        root.querySelector(`[data-gallery-state-card="${validTargetState}"]`)?.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  function renderTarget(target, options = {}) {
    const group = groupByKey(target);
    if (group) {
      renderGroup(group.key, options);
      return;
    }

    const state = stateByKey(target);
    const stateGroup = state ? groupForState(state.key) : null;
    if (state && stateGroup) {
      renderGroup(stateGroup.key, { ...options, targetState: state.key });
      return;
    }

    renderGroup(groups[0].key, options);
  }

  root.addEventListener('click', (event) => {
    const groupButton = event.target.closest('button[data-gallery-group]');
    if (groupButton) {
      renderGroup(groupButton.dataset.galleryGroup);
      return;
    }

    const hostButton = event.target.closest('button[data-gallery-host]');
    if (hostButton) {
      host = hostButton.dataset.galleryHost === 'dark' ? 'dark' : 'light';
      const target = currentTarget();
      renderTarget(target, { updateHash: false });
      return;
    }

    const actionButton = event.target.closest('[data-gallery-action]');
    if (actionButton) {
      selectedAction = actionButton.dataset.galleryAction || 'impeccable';
      renderTarget('configure-replace');
      return;
    }

    const countButton = event.target.closest('[data-gallery-count]');
    if (countButton) {
      count = count >= 4 ? 1 : count + 1;
      renderTarget(currentTarget(), { updateHash: false });
      return;
    }

    const densityButton = event.target.closest('[data-gallery-density]');
    if (densityButton) {
      const value = densityButton.dataset.galleryDensity;
      root.querySelectorAll('[data-gallery-density]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.galleryDensity === value ? 'true' : 'false');
      });
      root.querySelectorAll('[data-gallery-density-output]').forEach((output) => { output.textContent = value; });
      return;
    }

    const toggleButton = event.target.closest('[data-gallery-param-toggle]');
    if (toggleButton) {
      const next = toggleButton.getAttribute('aria-pressed') !== 'true';
      root.querySelectorAll('[data-gallery-param-toggle]').forEach((button) => button.setAttribute('aria-pressed', String(next)));
      root.querySelectorAll('[data-gallery-toggle-output]').forEach((output) => { output.textContent = next ? 'On' : 'Off'; });
      return;
    }

    const designTabButton = event.target.closest('[data-gallery-design-tab]');
    if (designTabButton) {
      designTab = designTabButton.dataset.galleryDesignTab === 'raw' ? 'raw' : 'visual';
      renderTarget('design-panel');
      return;
    }

    const trigger = event.target.closest('[data-gallery-go]');
    if (trigger && !trigger.disabled) renderTarget(trigger.dataset.galleryGo);
  });

  root.addEventListener('input', (event) => {
    const range = event.target.closest('[data-gallery-range]');
    if (!range) return;
    const value = Number(range.value).toFixed(2);
    root.querySelectorAll('[data-gallery-range]').forEach((input) => { if (input !== range) input.value = range.value; });
    root.querySelectorAll('[data-gallery-range-output]').forEach((output) => { output.textContent = value; });
  });

  root.addEventListener('keydown', (event) => {
    if (event.target.matches('[data-gallery-steer-input]') && event.key === 'Enter') {
      event.preventDefault();
      renderTarget('steer-processing');
      return;
    }

    const groupButton = event.target.closest('button[data-gallery-group]');
    if (groupButton && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const current = Math.max(0, groups.findIndex((group) => group.key === groupButton.dataset.galleryGroup));
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? groups.length - 1
          : (current + (event.key === 'ArrowUp' ? -1 : 1) + groups.length) % groups.length;
      renderGroup(groups[next].key, { focusGroup: true });
    }
  });

  window.addEventListener('hashchange', () => {
    const target = targetFromHash();
    if (target) renderTarget(target, { updateHash: false });
  });

  renderTarget(targetFromHash() || groups[0].key);
}

function initLiveUiGalleries() {
  document.querySelectorAll('[data-live-ui-gallery]').forEach(initLiveUiGallery);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveUiGalleries, { once: true });
} else {
  initLiveUiGalleries();
}

document.addEventListener('astro:page-load', initLiveUiGalleries);
