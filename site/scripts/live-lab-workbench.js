const VIEW_COPY = {
  overview: {
    title: 'Performance',
    summary: 'Where Live spends time before the first usable variant.',
  },
  providers: {
    title: 'Providers',
    summary: 'Compare generation speed, reliability, and delivery strategy.',
  },
  harness: {
    title: 'Harnesses',
    summary: 'Review worker architecture and the optimizations that survived testing.',
  },
  ui: {
    title: 'UI states',
    summary: 'Inspect every Live state on light and dark hosts.',
  },
};

export function initLiveLabWorkbench(root = document) {
  const workbench = root.querySelector('[data-live-lab-workbench]');
  if (!workbench || workbench.dataset.initialized === 'true') return;
  workbench.dataset.initialized = 'true';

  const buttons = [...workbench.querySelectorAll('[data-lab-view]')];
  const panels = [...workbench.querySelectorAll('[data-lab-panel]')];
  const contexts = [...workbench.querySelectorAll('[data-lab-context]')];
  const actions = [...workbench.querySelectorAll('[data-lab-view-action]')];
  const title = workbench.querySelector('[data-lab-view-title]');
  const summary = workbench.querySelector('[data-lab-view-summary]');
  const scroller = workbench.querySelector('.live-lab-workspace-scroll');

  const setView = (requested, { updateHash = true } = {}) => {
    const view = VIEW_COPY[requested] ? requested : 'overview';
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.labView === view));
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.labPanel !== view;
    }
    for (const context of contexts) {
      context.hidden = context.dataset.labContext !== view;
    }
    for (const action of actions) {
      action.hidden = action.dataset.labViewAction !== view;
    }
    workbench.dataset.activeView = view;
    if (title) title.textContent = VIEW_COPY[view].title;
    if (summary) summary.textContent = VIEW_COPY[view].summary;
    if (scroller) scroller.scrollTop = 0;
    if (updateHash && window.location.hash !== `#${view}`) {
      window.history.replaceState(null, '', `#${view}`);
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => setView(button.dataset.labView));
  }

  workbench.querySelector('[data-lab-reset]')?.addEventListener('click', () => {
    const slider = workbench.querySelector('[data-model-latency]');
    if (!(slider instanceof HTMLInputElement)) return;
    slider.value = '15000';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    setView('overview');
  });

  window.addEventListener('hashchange', () => setView(window.location.hash.slice(1), { updateHash: false }));
  setView(window.location.hash.slice(1) || 'overview', { updateHash: false });
}
