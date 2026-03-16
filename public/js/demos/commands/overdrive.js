// Overdrive command demo - shows a static list becoming a morphing shared-element transition
export default {
  id: 'overdrive',
  caption: 'Static list with page jump → Shared element morph transition',

  before: `
    <div style="width: 100%; max-width: 240px; padding: 16px; font-family: system-ui, sans-serif;">
      <div style="font-size: 11px; color: #999; margin-bottom: 10px;">PROJECTS</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="padding: 10px; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; background: #e0e0e0; border-radius: 4px;"></div>
          <div>
            <div style="font-size: 12px; color: #333; font-weight: 500;">Redesign</div>
            <div style="font-size: 11px; color: #999;">3 tasks</div>
          </div>
        </div>
        <div style="padding: 10px; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; background: #e0e0e0; border-radius: 4px;"></div>
          <div>
            <div style="font-size: 12px; color: #333; font-weight: 500;">Launch</div>
            <div style="font-size: 11px; color: #999;">7 tasks</div>
          </div>
        </div>
      </div>
    </div>
  `,

  after: `
    <div style="width: 100%; max-width: 240px; padding: 16px; font-family: 'Instrument Sans', sans-serif;">
      <div style="font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--color-ash); margin-bottom: 10px;">PROJECTS</div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="padding: 10px; background: color-mix(in oklch, var(--color-accent) 6%, var(--color-paper)); border: 1px solid color-mix(in oklch, var(--color-accent) 15%, var(--color-paper)); border-radius: 6px; display: flex; align-items: center; gap: 10px; view-transition-name: project-card;">
          <div style="width: 28px; height: 28px; background: var(--color-accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 600;">R</div>
          <div style="flex: 1;">
            <div style="font-size: 0.8125rem; color: var(--color-ink); font-weight: 500;">Redesign</div>
            <div style="font-size: 0.6875rem; color: var(--color-ash);">3 tasks</div>
          </div>
          <div style="font-size: 0.5625rem; padding: 2px 6px; background: color-mix(in oklch, var(--color-accent) 12%, transparent); color: var(--color-accent); border-radius: 3px; font-weight: 500;">Active</div>
        </div>
        <div style="padding: 10px; background: var(--color-paper); border: 1px solid var(--color-mist); border-radius: 6px; display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; background: var(--color-mist); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--color-ash); font-size: 10px; font-weight: 600;">L</div>
          <div style="flex: 1;">
            <div style="font-size: 0.8125rem; color: var(--color-ink); font-weight: 500;">Launch</div>
            <div style="font-size: 0.6875rem; color: var(--color-ash);">7 tasks</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.625rem; color: var(--color-ash); font-style: italic;">view-transition-name on cards for shared element morphing</div>
    </div>
  `
};
