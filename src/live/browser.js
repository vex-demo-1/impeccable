/**
 * Impeccable Live Variant Mode — Browser Script
 *
 * Injected into the user's page via <script src="http://localhost:PORT/live.js">.
 * The server prepends window.__IMPECCABLE_TOKEN__ and window.__IMPECCABLE_PORT__
 * before this code.
 *
 * Features:
 *   - Element picker with hover highlight and keyboard navigation
 *   - Action panel (command dropdown, freeform input, variant count, go button)
 *   - Variant cycler with MutationObserver progressive reveal
 *   - WebSocket connection to the live server
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  const TOKEN = window.__IMPECCABLE_TOKEN__;
  const PORT = window.__IMPECCABLE_PORT__;
  if (!TOKEN || !PORT) {
    console.warn('[impeccable] Live script loaded without token/port. Aborting.');
    return;
  }

  // Prevent double-init
  if (window.__IMPECCABLE_LIVE_INIT__) return;
  window.__IMPECCABLE_LIVE_INIT__ = true;

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const BRAND = 'oklch(55% 0.25 350)';
  const BRAND_HOVER = 'oklch(45% 0.25 350)';
  const BRAND_LIGHT = 'oklch(92% 0.06 350)';
  const INK = 'oklch(15% 0.01 350)';
  const ASH = 'oklch(55% 0 0)';
  const PAPER = 'oklch(98% 0.005 350)';
  const MIST = 'oklch(90% 0.01 350)';
  const FONT = 'system-ui, -apple-system, sans-serif';
  const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  const Z_HIGHLIGHT = 99990;
  const Z_PANEL = 99995;
  const Z_CYCLER = 99995;
  const PREFIX = 'impeccable-live';

  const SKIP_TAGS = new Set([
    'html', 'head', 'body', 'script', 'style', 'link', 'meta',
    'noscript', 'br', 'wbr',
  ]);

  const VISUAL_ACTIONS = [
    { value: 'impeccable', label: 'Auto (freeform)' },
    { value: 'bolder', label: 'Bolder' },
    { value: 'quieter', label: 'Quieter' },
    { value: 'distill', label: 'Distill' },
    { value: 'polish', label: 'Polish' },
    { value: 'typeset', label: 'Typeset' },
    { value: 'colorize', label: 'Colorize' },
    { value: 'layout', label: 'Layout' },
    { value: 'adapt', label: 'Adapt' },
    { value: 'animate', label: 'Animate' },
    { value: 'delight', label: 'Delight' },
    { value: 'overdrive', label: 'Overdrive' },
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let state = 'IDLE'; // IDLE | PICKING | CONFIGURING | GENERATING | CYCLING
  let ws = null;
  let hoveredElement = null;
  let selectedElement = null;
  let currentSessionId = null;
  let expectedVariants = 0;
  let arrivedVariants = 0;
  let visibleVariant = 0;
  let variantObserver = null;
  let hasProjectContext = false;

  // UI elements
  let highlightOverlay = null;
  let infoTooltip = null;
  let panelEl = null;
  let cyclerEl = null;
  let toastEl = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function isOwnElement(el) {
    if (!el || !el.id) return false;
    return el.id.startsWith(PREFIX) || el.closest('[id^="' + PREFIX + '"]');
  }

  function isPickable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return false;
    if (isOwnElement(el)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;
    return true;
  }

  function elDescriptor(el) {
    if (!el) return '';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
    return s;
  }

  function genId() {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  }

  function setState(newState) {
    state = newState;
  }

  // ---------------------------------------------------------------------------
  // Highlight overlay
  // ---------------------------------------------------------------------------

  function createHighlight() {
    const el = document.createElement('div');
    el.id = PREFIX + '-highlight';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '0', height: '0',
      border: '2px solid ' + BRAND,
      borderRadius: '3px',
      pointerEvents: 'none',
      zIndex: Z_HIGHLIGHT,
      transition: 'top 0.08s ease, left 0.08s ease, width 0.08s ease, height 0.08s ease',
      display: 'none',
      boxSizing: 'border-box',
    });
    document.body.appendChild(el);
    return el;
  }

  function createInfoTooltip() {
    const el = document.createElement('div');
    el.id = PREFIX + '-info';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0',
      background: INK, color: PAPER,
      fontFamily: MONO, fontSize: '11px',
      padding: '2px 6px', borderRadius: '3px',
      zIndex: Z_HIGHLIGHT + 1,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      display: 'none',
    });
    document.body.appendChild(el);
    return el;
  }

  function positionHighlight(el) {
    if (!el || !highlightOverlay) return;
    const rect = el.getBoundingClientRect();
    Object.assign(highlightOverlay.style, {
      top: (rect.top - 2) + 'px',
      left: (rect.left - 2) + 'px',
      width: (rect.width + 4) + 'px',
      height: (rect.height + 4) + 'px',
      display: 'block',
    });
    if (infoTooltip) {
      infoTooltip.textContent = elDescriptor(el);
      const tipTop = rect.top - 22;
      Object.assign(infoTooltip.style, {
        top: (tipTop < 4 ? rect.bottom + 4 : tipTop) + 'px',
        left: Math.max(4, rect.left) + 'px',
        display: 'block',
      });
    }
  }

  function hideHighlight() {
    if (highlightOverlay) highlightOverlay.style.display = 'none';
    if (infoTooltip) infoTooltip.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Element context extraction (sent to agent)
  // ---------------------------------------------------------------------------

  function extractElementContext(el) {
    const computed = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // Collect CSS custom properties from stylesheets
    const customProps = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith('--') && !customProps[prop]) {
                const val = computed.getPropertyValue(prop).trim();
                if (val) customProps[prop] = val;
              }
            }
          }
        }
      } catch { /* cross-origin sheet */ }
    }

    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: [...el.classList],
      textContent: (el.textContent || '').slice(0, 500),
      outerHTML: el.outerHTML.slice(0, 10000),
      computedStyles: {
        'font-family': computed.fontFamily,
        'font-size': computed.fontSize,
        'font-weight': computed.fontWeight,
        'line-height': computed.lineHeight,
        'color': computed.color,
        'background': computed.background,
        'background-color': computed.backgroundColor,
        'padding': computed.padding,
        'margin': computed.margin,
        'display': computed.display,
        'position': computed.position,
        'gap': computed.gap,
        'border-radius': computed.borderRadius,
        'box-shadow': computed.boxShadow,
      },
      cssCustomProperties: customProps,
      parentContext: el.parentElement ?
        '<' + el.parentElement.tagName.toLowerCase() +
        (el.parentElement.id ? ' id="' + el.parentElement.id + '"' : '') +
        (el.parentElement.className ? ' class="' + el.parentElement.className + '"' : '') +
        '>' : null,
      boundingRect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Action panel
  // ---------------------------------------------------------------------------

  function createActionPanel() {
    const panel = document.createElement('div');
    panel.id = PREFIX + '-panel';
    Object.assign(panel.style, {
      position: 'fixed', zIndex: Z_PANEL,
      background: PAPER,
      border: '1px solid ' + MIST,
      borderRadius: '10px',
      padding: '14px 16px',
      boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
      fontFamily: FONT,
      fontSize: '13px',
      color: INK,
      minWidth: '260px',
      maxWidth: '320px',
      display: 'none',
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', gap: '6px',
      marginBottom: '10px', fontSize: '12px', color: ASH,
    });
    const brand = document.createElement('span');
    brand.textContent = 'impeccable';
    Object.assign(brand.style, { fontWeight: '600', color: BRAND, fontFamily: MONO, fontSize: '11px' });
    header.appendChild(brand);
    const elLabel = document.createElement('span');
    elLabel.id = PREFIX + '-panel-label';
    Object.assign(elLabel.style, { fontFamily: MONO, fontSize: '11px' });
    header.appendChild(elLabel);
    panel.appendChild(header);

    // Action select
    const actionRow = document.createElement('div');
    Object.assign(actionRow.style, { marginBottom: '8px' });
    const actionLabel = document.createElement('label');
    actionLabel.textContent = 'Action';
    Object.assign(actionLabel.style, {
      display: 'block', fontSize: '11px', fontWeight: '500',
      color: ASH, marginBottom: '3px', textTransform: 'uppercase',
      letterSpacing: '0.06em',
    });
    actionRow.appendChild(actionLabel);
    const actionSelect = document.createElement('select');
    actionSelect.id = PREFIX + '-action';
    Object.assign(actionSelect.style, {
      width: '100%', padding: '6px 8px', borderRadius: '5px',
      border: '1px solid ' + MIST, fontFamily: FONT, fontSize: '13px',
      background: '#fff', color: INK, cursor: 'pointer',
    });
    VISUAL_ACTIONS.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.value;
      opt.textContent = a.label;
      actionSelect.appendChild(opt);
    });
    actionRow.appendChild(actionSelect);
    panel.appendChild(actionRow);

    // Freeform input
    const freeformRow = document.createElement('div');
    Object.assign(freeformRow.style, { marginBottom: '8px' });
    const freeformLabel = document.createElement('label');
    freeformLabel.textContent = 'Instructions (optional)';
    Object.assign(freeformLabel.style, {
      display: 'block', fontSize: '11px', fontWeight: '500',
      color: ASH, marginBottom: '3px', textTransform: 'uppercase',
      letterSpacing: '0.06em',
    });
    freeformRow.appendChild(freeformLabel);
    const freeformInput = document.createElement('input');
    freeformInput.id = PREFIX + '-freeform';
    freeformInput.type = 'text';
    freeformInput.placeholder = 'e.g. make it feel more premium';
    Object.assign(freeformInput.style, {
      width: '100%', padding: '6px 8px', borderRadius: '5px',
      border: '1px solid ' + MIST, fontFamily: FONT, fontSize: '13px',
      boxSizing: 'border-box',
    });
    freeformRow.appendChild(freeformInput);
    panel.appendChild(freeformRow);

    // Variant count
    const countRow = document.createElement('div');
    Object.assign(countRow.style, {
      display: 'flex', alignItems: 'center', gap: '6px',
      marginBottom: '12px',
    });
    const countLabel = document.createElement('span');
    countLabel.textContent = 'Variants';
    Object.assign(countLabel.style, {
      fontSize: '11px', fontWeight: '500', color: ASH,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    });
    countRow.appendChild(countLabel);
    [2, 3, 4].forEach(n => {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.dataset.count = n;
      btn.className = PREFIX + '-count-btn';
      Object.assign(btn.style, {
        width: '32px', height: '28px', borderRadius: '5px',
        border: '1px solid ' + MIST, background: n === 3 ? BRAND : '#fff',
        color: n === 3 ? '#fff' : INK, fontFamily: FONT, fontSize: '13px',
        fontWeight: '500', cursor: 'pointer', transition: 'all 0.1s ease',
      });
      btn.addEventListener('click', () => {
        document.querySelectorAll('.' + PREFIX + '-count-btn').forEach(b => {
          Object.assign(b.style, { background: '#fff', color: INK });
        });
        Object.assign(btn.style, { background: BRAND, color: '#fff' });
      });
      countRow.appendChild(btn);
    });
    panel.appendChild(countRow);

    // Go + Cancel row
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', alignItems: 'center', gap: '8px' });
    const goBtn = document.createElement('button');
    goBtn.id = PREFIX + '-go';
    goBtn.textContent = 'Generate';
    Object.assign(goBtn.style, {
      flex: '1', padding: '8px 16px', borderRadius: '5px',
      border: 'none', background: INK, color: '#fff',
      fontFamily: FONT, fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', transition: 'background 0.15s ease',
    });
    goBtn.addEventListener('mouseenter', () => { goBtn.style.background = BRAND; });
    goBtn.addEventListener('mouseleave', () => { goBtn.style.background = INK; });
    goBtn.addEventListener('click', handleGo);
    btnRow.appendChild(goBtn);
    const cancelLink = document.createElement('button');
    cancelLink.textContent = 'Cancel';
    Object.assign(cancelLink.style, {
      background: 'none', border: 'none', color: ASH,
      fontFamily: FONT, fontSize: '12px', cursor: 'pointer',
      padding: '4px',
    });
    cancelLink.addEventListener('click', () => {
      hidePanel();
      setState('PICKING');
    });
    btnRow.appendChild(cancelLink);
    panel.appendChild(btnRow);

    document.body.appendChild(panel);
    return panel;
  }

  function showPanel(el) {
    if (!panelEl) panelEl = createActionPanel();
    const label = panelEl.querySelector('#' + PREFIX + '-panel-label');
    if (label) label.textContent = elDescriptor(el);

    // Position near element
    const rect = el.getBoundingClientRect();
    const panelWidth = 300;
    const panelHeight = 280;
    let top = rect.bottom + 8;
    let left = rect.right - panelWidth;
    if (left < 8) left = 8;
    if (top + panelHeight > window.innerHeight) top = rect.top - panelHeight - 8;
    if (top < 8) top = 8;
    if (left + panelWidth > window.innerWidth) left = window.innerWidth - panelWidth - 8;

    Object.assign(panelEl.style, {
      top: top + 'px', left: left + 'px', display: 'block',
    });

    // Focus the freeform input
    const input = panelEl.querySelector('#' + PREFIX + '-freeform');
    if (input) setTimeout(() => input.focus(), 50);
  }

  function hidePanel() {
    if (panelEl) panelEl.style.display = 'none';
  }

  function getSelectedAction() {
    const select = document.querySelector('#' + PREFIX + '-action');
    return select ? select.value : 'impeccable';
  }

  function getSelectedCount() {
    const active = document.querySelector('.' + PREFIX + '-count-btn[style*="' + BRAND + '"]');
    return active ? parseInt(active.dataset.count) : 3;
  }

  function getFreeformPrompt() {
    const input = document.querySelector('#' + PREFIX + '-freeform');
    return input ? input.value.trim() : '';
  }

  // ---------------------------------------------------------------------------
  // Variant cycler
  // ---------------------------------------------------------------------------

  function createCycler() {
    const el = document.createElement('div');
    el.id = PREFIX + '-cycler';
    Object.assign(el.style, {
      position: 'fixed', zIndex: Z_CYCLER,
      background: PAPER,
      border: '1px solid ' + MIST,
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
      fontFamily: FONT, fontSize: '13px', color: INK,
      display: 'none',
      minWidth: '280px',
    });

    // Status line
    const statusRow = document.createElement('div');
    statusRow.id = PREFIX + '-cycler-status';
    Object.assign(statusRow.style, {
      textAlign: 'center', marginBottom: '8px',
      fontSize: '12px', color: ASH,
    });
    el.appendChild(statusRow);

    // Slot indicators
    const slotsRow = document.createElement('div');
    slotsRow.id = PREFIX + '-cycler-slots';
    Object.assign(slotsRow.style, {
      display: 'flex', justifyContent: 'center', gap: '4px',
      marginBottom: '10px',
    });
    el.appendChild(slotsRow);

    // Navigation
    const navRow = document.createElement('div');
    Object.assign(navRow.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    });

    const prevBtn = document.createElement('button');
    prevBtn.id = PREFIX + '-cycler-prev';
    prevBtn.textContent = '\u2190';
    const nextBtn = document.createElement('button');
    nextBtn.id = PREFIX + '-cycler-next';
    nextBtn.textContent = '\u2192';
    [prevBtn, nextBtn].forEach(b => {
      Object.assign(b.style, {
        width: '32px', height: '28px', borderRadius: '5px',
        border: '1px solid ' + MIST, background: '#fff', color: INK,
        fontFamily: FONT, fontSize: '14px', cursor: 'pointer',
      });
    });

    const acceptBtn = document.createElement('button');
    acceptBtn.id = PREFIX + '-cycler-accept';
    acceptBtn.textContent = 'Accept';
    Object.assign(acceptBtn.style, {
      padding: '6px 16px', borderRadius: '5px',
      border: 'none', background: INK, color: '#fff',
      fontFamily: FONT, fontSize: '12px', fontWeight: '600',
      cursor: 'pointer',
    });

    const discardBtn = document.createElement('button');
    discardBtn.id = PREFIX + '-cycler-discard';
    discardBtn.textContent = 'Discard';
    Object.assign(discardBtn.style, {
      padding: '6px 12px', borderRadius: '5px',
      border: '1px solid ' + MIST, background: '#fff', color: ASH,
      fontFamily: FONT, fontSize: '12px', cursor: 'pointer',
    });

    prevBtn.addEventListener('click', () => cycleVariant(-1));
    nextBtn.addEventListener('click', () => cycleVariant(1));
    acceptBtn.addEventListener('click', handleAccept);
    discardBtn.addEventListener('click', handleDiscard);

    navRow.appendChild(prevBtn);
    navRow.appendChild(acceptBtn);
    navRow.appendChild(discardBtn);
    navRow.appendChild(nextBtn);
    el.appendChild(navRow);

    document.body.appendChild(el);
    return el;
  }

  function showCycler() {
    if (!cyclerEl) cyclerEl = createCycler();

    // Position near the selected element (or its variant wrapper)
    const wrapper = document.querySelector('[data-impeccable-variants="' + currentSessionId + '"]');
    const target = wrapper || selectedElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      let top = rect.bottom + 8;
      if (top + 80 > window.innerHeight) top = rect.top - 88;
      if (top < 8) top = 8;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 300));
      Object.assign(cyclerEl.style, { top: top + 'px', left: left + 'px' });
    }

    cyclerEl.style.display = 'block';
    updateCyclerUI();
  }

  function hideCycler() {
    if (cyclerEl) cyclerEl.style.display = 'none';
    if (variantObserver) {
      variantObserver.disconnect();
      variantObserver = null;
    }
  }

  function updateCyclerUI() {
    if (!cyclerEl) return;

    const statusEl = cyclerEl.querySelector('#' + PREFIX + '-cycler-status');
    const slotsEl = cyclerEl.querySelector('#' + PREFIX + '-cycler-slots');

    // Update slots
    slotsEl.innerHTML = '';
    for (let i = 1; i <= expectedVariants; i++) {
      const dot = document.createElement('div');
      const arrived = i <= arrivedVariants;
      const active = i === visibleVariant;
      Object.assign(dot.style, {
        width: '8px', height: '8px', borderRadius: '50%',
        background: active ? BRAND : (arrived ? MIST : 'transparent'),
        border: '1.5px solid ' + (arrived ? BRAND : MIST),
        cursor: arrived ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      });
      if (arrived) {
        dot.addEventListener('click', () => {
          visibleVariant = i;
          showVariantInDOM(currentSessionId, i);
          updateCyclerUI();
        });
      }
      slotsEl.appendChild(dot);
    }

    // Update status text
    if (arrivedVariants < expectedVariants) {
      statusEl.textContent = 'Generating variant ' + (arrivedVariants + 1) + ' of ' + expectedVariants + '...';
    } else {
      statusEl.textContent = 'Variant ' + visibleVariant + ' of ' + expectedVariants;
    }

    // Enable/disable nav buttons
    const prev = cyclerEl.querySelector('#' + PREFIX + '-cycler-prev');
    const next = cyclerEl.querySelector('#' + PREFIX + '-cycler-next');
    const accept = cyclerEl.querySelector('#' + PREFIX + '-cycler-accept');
    if (prev) prev.disabled = visibleVariant <= 1;
    if (next) next.disabled = visibleVariant >= arrivedVariants;
    if (accept) accept.disabled = arrivedVariants === 0;
  }

  function cycleVariant(dir) {
    const newV = visibleVariant + dir;
    if (newV < 1 || newV > arrivedVariants) return;
    visibleVariant = newV;
    showVariantInDOM(currentSessionId, newV);
    updateCyclerUI();
  }

  function showVariantInDOM(sessionId, num) {
    const wrapper = document.querySelector('[data-impeccable-variants="' + sessionId + '"]');
    if (!wrapper) return;
    for (const child of wrapper.children) {
      const v = child.dataset ? child.dataset.impeccableVariant : null;
      if (!v) continue;
      child.style.display = (v === String(num)) ? '' : 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // MutationObserver for progressive variant reveal
  // ---------------------------------------------------------------------------

  function startVariantObserver(sessionId) {
    // Watch the entire body for [data-impeccable-variants] appearing (after HMR)
    const bodyObserver = new MutationObserver(() => {
      const wrapper = document.querySelector('[data-impeccable-variants="' + sessionId + '"]');
      if (!wrapper) return;

      // Count arrived variants
      const variants = wrapper.querySelectorAll('[data-impeccable-variant]:not([data-impeccable-variant="original"])');
      const newCount = variants.length;

      if (newCount > arrivedVariants) {
        arrivedVariants = newCount;
        // Auto-show the first variant
        if (visibleVariant === 0 && arrivedVariants > 0) {
          visibleVariant = 1;
          showVariantInDOM(sessionId, 1);
        }
        updateCyclerUI();
      }

      // Read expected count from the wrapper attribute
      const expected = parseInt(wrapper.dataset.impeccableVariantCount || '0');
      if (expected > 0 && expected !== expectedVariants) {
        expectedVariants = expected;
        updateCyclerUI();
      }

      // If all variants have arrived, transition to CYCLING
      if (arrivedVariants >= expectedVariants && expectedVariants > 0) {
        setState('CYCLING');
      }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });
    return bodyObserver;
  }

  // ---------------------------------------------------------------------------
  // WebSocket
  // ---------------------------------------------------------------------------

  function connectWS() {
    ws = new WebSocket('ws://localhost:' + PORT + '/ws');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: TOKEN }));
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'auth_ok':
          hasProjectContext = !!msg.hasProjectContext;
          if (!hasProjectContext) showContextWarning();
          console.log('[impeccable] Live mode connected.');
          setState('PICKING');
          break;
        case 'auth_fail':
          console.error('[impeccable] Auth failed:', msg.reason);
          break;
        case 'generating':
          // Agent acknowledged the generate request
          break;
        case 'done':
          // Agent finished writing all variants
          setState('CYCLING');
          updateCyclerUI();
          break;
        case 'error':
          console.error('[impeccable] Error:', msg.message);
          showError(msg.message);
          hideCycler();
          setState('PICKING');
          break;
      }
    };

    ws.onclose = () => {
      console.log('[impeccable] WebSocket closed. Reconnecting in 3s...');
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }

  function sendWS(msg) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  function handleMouseMove(e) {
    if (state !== 'PICKING') return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !isPickable(el) || el === hoveredElement) return;
    hoveredElement = el;
    positionHighlight(el);
  }

  function handleClick(e) {
    if (state !== 'PICKING') return;
    if (isOwnElement(e.target)) return;
    const el = hoveredElement;
    if (!el || !isPickable(el)) return;
    e.preventDefault();
    e.stopPropagation();
    selectedElement = el;
    setState('CONFIGURING');
    positionHighlight(el);
    showPanel(el);
  }

  function handleKeyDown(e) {
    // ESC: cancel current state
    if (e.key === 'Escape') {
      e.preventDefault();
      if (state === 'CONFIGURING') {
        hidePanel();
        setState('PICKING');
      } else if (state === 'CYCLING') {
        handleDiscard();
      } else if (state === 'PICKING') {
        hideHighlight();
        hidePanel();
        hideCycler();
        setState('IDLE');
      }
      return;
    }

    // Arrow keys: navigate elements
    if (state === 'PICKING' && hoveredElement) {
      let next = null;
      if (e.key === 'ArrowDown' && !e.shiftKey) {
        next = hoveredElement.nextElementSibling;
        while (next && !isPickable(next)) next = next.nextElementSibling;
      } else if (e.key === 'ArrowUp' && !e.shiftKey) {
        next = hoveredElement.previousElementSibling;
        while (next && !isPickable(next)) next = next.previousElementSibling;
      } else if (e.key === 'ArrowUp' && e.shiftKey) {
        next = hoveredElement.parentElement;
        if (next && !isPickable(next)) next = null;
      } else if (e.key === 'ArrowDown' && e.shiftKey) {
        next = hoveredElement.firstElementChild;
        while (next && !isPickable(next)) next = next.nextElementSibling;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectedElement = hoveredElement;
        setState('CONFIGURING');
        positionHighlight(hoveredElement);
        showPanel(hoveredElement);
        return;
      }
      if (next) {
        e.preventDefault();
        hoveredElement = next;
        positionHighlight(next);
        next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }

    // Variant cycling keys
    if (state === 'CYCLING') {
      if (e.key === 'ArrowLeft') { e.preventDefault(); cycleVariant(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); cycleVariant(1); }
      if (e.key === 'Enter') { e.preventDefault(); handleAccept(); }
    }
  }

  function handleGo() {
    if (!selectedElement || state !== 'CONFIGURING') return;

    const action = getSelectedAction();
    const count = getSelectedCount();
    const freeformPrompt = getFreeformPrompt();

    currentSessionId = genId();
    expectedVariants = count;
    arrivedVariants = 0;
    visibleVariant = 0;

    // Send generate event to server
    sendWS({
      type: 'generate',
      id: currentSessionId,
      action: action,
      freeformPrompt: freeformPrompt || undefined,
      count: count,
      element: extractElementContext(selectedElement),
    });

    hidePanel();
    setState('GENERATING');

    // Start observing for variants in the DOM
    if (variantObserver) variantObserver.disconnect();
    variantObserver = startVariantObserver(currentSessionId);

    // Show cycler in "generating" state
    showCycler();
  }

  function handleAccept() {
    if (!currentSessionId || arrivedVariants === 0) return;
    sendWS({
      type: 'accept',
      id: currentSessionId,
      variantId: String(visibleVariant),
    });
    hideCycler();
    hideHighlight();
    selectedElement = null;
    currentSessionId = null;
    setState('PICKING');
  }

  function handleDiscard() {
    if (!currentSessionId) return;
    sendWS({
      type: 'discard',
      id: currentSessionId,
    });
    hideCycler();
    hideHighlight();
    selectedElement = null;
    currentSessionId = null;
    setState('PICKING');
  }

  // ---------------------------------------------------------------------------
  // Toast / warnings / errors
  // ---------------------------------------------------------------------------

  function showContextWarning() {
    showToast('Running without project context. Run /impeccable teach for better variants.', 8000);
  }

  function showError(message) {
    showToast('Error: ' + message, 6000);
  }

  function showToast(message, duration) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement('div');
    toastEl.id = PREFIX + '-toast';
    toastEl.textContent = message;
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '16px', left: '50%',
      transform: 'translateX(-50%)',
      background: INK, color: PAPER,
      fontFamily: FONT, fontSize: '12px',
      padding: '8px 16px', borderRadius: '6px',
      zIndex: Z_PANEL + 10,
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      maxWidth: '500px', textAlign: 'center',
    });
    document.body.appendChild(toastEl);
    requestAnimationFrame(() => { toastEl.style.opacity = '1'; });
    setTimeout(() => {
      if (toastEl) {
        toastEl.style.opacity = '0';
        setTimeout(() => { if (toastEl) toastEl.remove(); toastEl = null; }, 300);
      }
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    highlightOverlay = createHighlight();
    infoTooltip = createInfoTooltip();

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    connectWS();
    console.log('[impeccable] Live variant mode ready. Hover over elements to pick one.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
